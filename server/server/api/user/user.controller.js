'use strict';

var User = require('./user.model');
var Tpl = require('./../admin/pricing.tpl');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var nodemailer = require('nodemailer');
var crypto = require('crypto');

var validationError = function (res, err) {
    return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
    var out = {};
    User.count({}, function (err, count) {
        out.pagination = {
            maxPages: count / (req.query.limit || 10),
            currentPage: ((req.query.offset || 0) / (req.query.limit || 10)) + 1
        }
        User.find({}, '-salt -hashedPassword', { skip: req.query.offset || 0, limit: req.query.limit || 10 }, function (err, users) {
            if (err) { return handleError(res, err); }
            if (!users) { return res.status(404).send('Not Found'); }
            out.results = users;
            return res.status(200).json(out);
        });
    });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
    var newUser = new User(req.body);

    newUser.provider = 'local';
    if (req.body.role.part === true) { newUser.role = 'particulier'; }
    if (req.body.role.pro === true) { newUser.role = 'professionnel'; }

    User.find({ email: req.body.email }).then(u => {

        if (u && u.length) {
            throw ({ status: 409, message: 'Cet email est déjà utilisé' });
        }
        return newUser.save();

    }).then(user => {

        if (user.by) {
            User.update(
                { "_id": user.by, invites: { $elemMatch: { email: user.email } } },
                {
                    $set: {
                        "invites.$.status": "active"
                    },
                    $inc: {
                        'acceptedInvites': 1
                    }
                },
                function (err, ok) {
                    console.log(err);
                    console.log(ok);
                });
        };

        Tpl.findOne({ active: true }).then(function (tpl) {

            var token = jwt.sign({ _id: user._id }, config.secrets.session, { expiresIn: 3600 });

            if (!tpl)
                return res.json({ token: token });


            try {
                var transporter = nodemailer.createTransport('smtps://no-reply%40latoo.fr:latoo4ever@ssl0.ovh.net');
                var mailData = {
                    from: 'no-reply@latoo.fr',
                    to: req.body.email,
                    subject: tpl.subject.replace('{name}', user.firstName),
                    html: tpl.html.replace('{name}', user.firstName) //fs.readFileSync('./views/welcome.html', 'utf8')
                };

                transporter.sendMail(mailData, err => { if (err) console.log(err) });

            } catch (err) {
                console.log(err);

            }
            return res.json({ token: token });

        });
    }).catch(err => {
        console.log(err)
        return res.status(err.status || 500).send(err);
    });
};

/**
 * reset password
 */
exports.sendForgotPasswordEmail = function (req, res, next) {

    var email = req.body.restoreEmail;

    User.find({ email: email }).then(u => {

        if (u.length < 1)
            throw ({ status: 409, message: 'This e-mail is not registered.' });

        return u;

    }).then(user => {

        var resetToken = (crypto.randomBytes(32)).toString('base64').replace(/[^\w?]/g, '-').toLowerCase();
        var emailTpl = __dirname.trim() + '/../../views/forgot-password.html';
        var resetLink = "https://latoo.fr/#!/app/reset/" + resetToken;

        var emailTplReady = fs.readFileSync(emailTpl, 'utf8')
            .replace('{name}', user[0].firstName)
            .replace('{link}', resetLink);

        User.update({ email: email }, { resetToken: resetToken }, function (err, usr) {
            if (err) return next(err);


            try {
                var transporter = nodemailer.createTransport('smtps://no-reply%40latoo.fr:latoo4ever@ssl0.ovh.net');
                var mailData = {
                    from: 'no-reply@latoo.fr',
                    to: email,
                    subject: 'Forgot Password',
                    html: emailTplReady
                };
                transporter.sendMail(mailData, err => { if (err) console.log(err) });

            } catch (err) {
                console.log(err);
            }


        });



        return res.json({ message: 'Restore link sent. Please check you email.' });

    }).catch(err => {
        return res.status(err.status || 500).send(err);
    });

};



/**
 * contact us form
 */
exports.contactUs = function (req, res, next) {

    var email = req.body.email,
        name = req.body.name,
        description = req.body.description;


    var emailTpl = __dirname.trim() + '/../../views/contact-us.html';

    var emailTplReady = fs.readFileSync(emailTpl, 'utf8')
        .replace('{name}', name)
        .replace('{description}', description);

    try {
        var transporter = nodemailer.createTransport('smtps://no-reply%40latoo.fr:latoo4ever@ssl0.ovh.net');
        var mailData = {
            from: email,
            to: "buysness@gmail.com",
            //to: "sgoran87@gmail.com",
            subject: 'Contact from: ' + name,
            html: emailTplReady
        };
        transporter.sendMail(mailData, err => { if (err) console.log(err) });

    } catch (err) {
        console.log(err);
    }

    return res.json({ message: 'Message sent. We will answer shortly, thank you.' });

};


/**
 * sets news password (from forgot password)
 */
exports.setNewPassword = function (req, res, next) {

    // var userId = req.user._id;
    var newPass = String(req.body.newPassword);
    var newPass2 = String(req.body.newPassword2);
    var resetToken = req.body.token;

    if ((newPass && newPass2) && (newPass !== newPass2))
        return res.status(404).send('Les mots de passe ne correspondent pas');

    User.findOne({ resetToken: resetToken }, function (err, user) {

        if (user && user.email) {

            user.password = newPass;
            user.resetToken = '';

            user.save(function (err) {
                if (err) return validationError(res, err);
                res.status(200).send('Password reset successfull.');
            });

        } else {
            return res.status(404).send('Invalid reset token.');
        }
    });
};
/**
 * Get a single user
 */
exports.show = function (req, res, next) {
    var userId = req.params.id;

    User.findById(userId, '-salt -hashedPassword', function (err, user) {
        if (err) return next(err);
        if (!user) return res.status(401).send('Unauthorized');
        return res.status(200).json(user);
    });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function (req, res) {
    User.findByIdAndRemove(req.params.id, function (err, user) {
        if (err) return res.status(500).send(err);
        return res.status(204).send('No Content');
    });
};

/**
 * Update User informations
 */

exports.updateUser = function (req, res) {
    var userId = req.user._id;
    User.findById(userId, function (err, user) {
        if (err) {
            return res.status(404).send('The specified user does not exist');
        }
        User.update({ _id: req.params.id }, req.body, function (err, u) {
            if (err) {
                return res.status(500).send('This user cannot be updated');
            }
            return res.status(200).json(u);
        });
    });

};

/**
 * Change a users password
 */
exports.changePassword = function (req, res, next) {
    var userId = req.user._id;
    var oldPass = String(req.body.oldPassword);
    var newPass = String(req.body.newPassword);

    User.findById(userId, function (err, user) {
        if (user.authenticate(oldPass)) {
            user.password = newPass;
            user.save(function (err) {
                if (err) return validationError(res, err);
                res.status(200).send('OK');
            });
        } else {
            res.status(403).send('Forbidden');
        }
    });
};

/**
 * Get my info
 */
exports.me = function (req, res, next) {
    var userId = req.user._id;
    User.findOne({
        _id: userId
    }, '-salt -hashedPassword', function (err, user) { // don't ever give out the password or salt
        if (err) return next(err);
        if (!user) return res.status(401).send('Unauthorized');
        res.json(user);
    });
};


exports.updateMe = function (req, res) {
    var userId = req.user._id;
    delete req.body.role;
    delete req.body.password;
    User.findById(userId, function (err, user) {
        if (err) {
            return res.status(404).send({ message: 'L\'utilisateur n\'existe pas ou plus' });
        }
        User.update({ _id: req.user._id }, { $set: req.body }, function (err, u) {
            if (err) {
                return res.status(500).send('This user cannot be updated');
            }
            return res.status(200).json(u);
        }, err => { console.log(err); res.status(500).send(); });
    });

};
/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
    res.redirect('/');
};


exports.sendInvites = function (req, res) {

    try {
        var emails = req.body.emails;
        var user = req.user;
        var transporter = nodemailer.createTransport('smtps://no-reply%40latoo.fr:latoo4ever@ssl0.ovh.net');

        var existingInvites = user.invites;
        var emailsMap = [];
        existingInvites.forEach(function (obj) {
            emailsMap.push(obj.email);
        });


        Tpl.findOne({ activeInvite: true }).then(function (tpl) {

            var token = jwt.sign({ _id: user._id }, config.secrets.session, { expiresIn: 3600 });

            if (!tpl)
                return res.json({ token: token });

            try {


                emails.forEach(function (email) {

                    if (emailsMap.indexOf(email) < 0) {
                        existingInvites.push({
                            email: email,
                            status: 'pending'
                        })
                    }

                    var inviteToken = Buffer.from(user._id + "~" + email).toString('base64')
                    var url = config.hosts.host + "/#!/app/wellcome/" + inviteToken;
                    var html = "<a href=" + url + ">Latoo</a>"

                    var mailData = {
                        from: 'no-reply@latoo.fr',
                        to: email,
                        subject: tpl.subject.replace('{name}', user.firstName),
                        html: tpl.html.replace('{link}', html)
                    };

                    transporter.sendMail(mailData, (err, info) => {
                        if (err) console.log(err)
                    });

                });

                User.update({ email: user.email }, { invites: existingInvites }, function (err, usr) {
                    console.log('UPDATE ERR', err)
                });

            } catch (err) {
                console.log(err);

            }
            return res.json({ status: 'sent' });
            //return res.json({ token: token });

        });



    } catch (err) {
        console.log('from catch', err);
    }

}

exports.deleteInvite = function (req, res) {
    var email = req.body.email;
    var userid = req.body.userid;

    User.update(
        { "_id": userid },
        {
            $pull: {
                invites: {
                    email: email
                }
            }
        },
        function (err, ok) {
            if (err)
                return validationError(res, err);
            res.status(200).send(email + ' invite deleted successfully.');
        }
    );

}