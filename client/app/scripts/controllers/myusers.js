'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MyUsersCtrl
 * @description
 * # MyUsersCtrl
 * Controller of the User
 */
angular.module('latooApp')
    .controller('MyUsersCtrl', function ($rootScope, $scope, latooApi, $stateParams, $state, toastr, $uibModal) {
        var self = this;

        $scope.fields = {
            singleEmails: [{ value: "" }],
            groupEmails: ""
        }

        $scope.invitesData = {
            pendingInvites: "...",
            acceptedInvites: "...",
            allInvites: []
        }


        self.getMe = function () {
            latooApi.getMe().then(function (res) {
                var userData = res.data;
                self.userData = userData;
                $scope.invitesData.pendingInvites = (function () {

                    if (!userData.invites) {
                        return 0;
                    }
                    else {
                        if (userData.acceptedInvites)
                            return userData.invites.length - userData.acceptedInvites;
                        else
                            return userData.invites.length;
                    }

                }());

                $scope.invitesData.acceptedInvites = userData.acceptedInvites || 0;

                $scope.invitesData.allInvites = userData.invites || [];
            })
        }


        $scope.filterInvites = function () {
            if (self.userData.invites.length > 0)
                $scope.invitesData.allInvites = self.userData.invites.filter(function (row) {
                    if ($scope.searchTerms.length >= 1)
                        return row.email.indexOf($scope.searchTerms) > -1 || row.status.indexOf($scope.searchTerms) > -1;
                    else
                        return row;
                });

        };

        $scope.submitInvites = function (isBulk) {

            var emails = isBulk ? $scope.fields.groupEmails.split(/\r\n|\n/) : $scope.fields.singleEmails;

            var valid = [];
            var me = this;
            emails.forEach(function (mail) {
                mail = (isBulk ? mail : mail.value);
                if (self.validateEmail(mail))
                    valid.push(mail);
            });
            $scope.submit(valid);



        };
        $scope.submit = function (emails) {
            
            if (emails.length < 1) {
                alert("No valid e-mails")

            } else {
                
                var msg = "You have " + emails.length + " valid e-mail(s). Send invites?";

                if (emails.length == 1)
                    msg = "Send invite to: " + emails[0] + "?";

                if (confirm(msg)) {

                    latooApi.sendinvites(emails).then(function (res) {

                        if (self.$uibModalInstance)
                            self.$uibModalInstance.close(true);

                        toastr.success('Invite'+(emails.length>1 ? 's' : '')+' sent');
                        self.getMe();
                        
                        $scope.fields = {
                            singleEmails: [{ value: "" }],
                            groupEmails: ""
                        }
                        
                        socialinviter.close();

                    }, function (err) {

                        if (self.$uibModalInstance)
                            self.$uibModalInstance.close(false);

                        toastr.error('Please try again', 'Error');

                        socialinviter.close();

                    });

                }
            }


        };
        $scope.resendInvite = function (email) {

            $scope.fields.singleEmails = [{ value: email }];
            $scope.submitInvites();

        }
        self.validateEmail = function (email) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        }
        $scope.openInvite = function (c) {
            var modalInstance = $uibModal.open({
                templateUrl: 'views/partial/invite-users.html',
                size: 'md',
                $scope: $scope,
                controller: ['$uibModalInstance', 'latooApi', '$scope', function ($uibModalInstance, latooApi, scope) {
                    self.$uibModalInstance = $uibModalInstance;
                    this.fields = $scope.fields;


                    //this.submit = $scope.submit;
                    this.submitInvites = $scope.submitInvites;

                    this.addBox = function () {

                        var boxes = this.fields.singleEmails;
                        boxes.push({ value: "" });

                        $scope.fields.singleEmails = boxes;

                    }


                }],
                controllerAs: 'ctrl'
            });

        };

        self.loadSocial = function () {
            window.sendinvites = $scope.submit;
        }

        $scope.deleteInvite = function(email){
            
            latooApi.deleteInvite(email, latooApi.$getProfile()._id).then(function (res) {
                toastr.success(res.data);
                self.getMe();
            }, 
            function (err) {
                toastr.error('Please try again', 'Error');
            });
        }
    
        self.getMe();

        self.loadSocial();


        


    });