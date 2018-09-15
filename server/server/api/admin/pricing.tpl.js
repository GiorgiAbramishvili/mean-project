'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MailSchema = new Schema({
    subject: String,
    html: String,
    active: Boolean,
    activeInvite: Boolean
})

module.exports = mongoose.model('Tpl', MailSchema);
