'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
    .controller('MainCtrl', function ($rootScope, $scope, latooApi, $uibModal, $q, $state) {
        var self = this;
        $scope.isLoggedIn = latooApi.$checkSession();
        $scope.random = Date.now();
        $scope.homebg = latooApi.$getUri() + '/admin/homeCover?last=' + $scope.random;

        $scope.name = '';
        $scope.email = '';
        $scope.description = '';

        self.getMe = function () {
            latooApi.getMe()
                .then(function (data) {
                    latooApi.$setProfile(data.data);
                    $scope.currentUser = data.data;
                    $scope.isAdmin = $scope.currentUser.role === 'admin';
                }).catch(function (err) {
                    latooApi.$logout();
                    $scope.isLoggedIn = false;
                    $state.go('app.home');
                });
        };
        if ($scope.isLoggedIn) {
            self.getMe();
        }
        self.openLoginModal = function (su) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/partial/login-modale.html',
                controller: 'LoginCtrl',
                controllerAs: 'logctrl',
                size: 'md',
                resolve: {
                    signup: function () {
                        return su;
                    }
                }
            });
            modalInstance.result.then(function (success) {
                if (success) {
                    $scope.isLoggedIn = latooApi.$isConnected();
                    self.getMe();
                }
            });
        };


        self.contactUs = function (su) {

            self.contactUsModal = $uibModal.open({
                animation: true,
                templateUrl: 'views/partial/contact-modale.html',
                controllerAs: 'ctrl',
                size: 'md',
                controller: ['$uibModalInstance', 'latooApi', function($uibModalInstance, latooApi) {
                    this.closeDialog = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                    var me = this;
                    this.sendContactUs = function () {

                        function validateEmail(email) {
                            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            return re.test(String(email).toLowerCase());
                        }
                        var data = {
                            name: this.name,
                            email: this.email,
                            description: this.description
                        };
                        console.log(data);

                        if (this.name.length > 2 && validateEmail(this.email) && this.description.length > 2) {

                            latooApi.contactUs(data).then(function (res, err) {

                                me.closeDialog();

                                if (res.status === 200)
                                    alert(res.data.message);

                            });
                        }

                    }
                }]
            });
            self.contactUsModal.result.then(function () {
            });

        };




        $rootScope.setLogin = function (status) {
            $scope.isLoggedIn = status;
        }
        self.logout = function () {
            latooApi.$logout();
            $scope.isLoggedIn = latooApi.$isConnected();
            $scope.isAdmin = false;
            $state.go('app.home');
        };

    });
