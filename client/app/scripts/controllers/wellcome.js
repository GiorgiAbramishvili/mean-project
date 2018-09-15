'use strict';

angular.module('latooApp')
	.controller('WellcomeCtrl', function ($scope, $http, $location, latooApi, toastr) {
		var self = this;
        self.apiUri = latooApi.conf.uri;
        var token = atob($location.url().replace('/app/wellcome/', ''));
        var tokenDetails = [];
        $scope.su = {};

        if(token && token.indexOf('~')){
            tokenDetails = token.split('~');
            
            var validateEmail = function (email) {
                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(String(email).toLowerCase());
            }


            $scope.su.by = tokenDetails[0];

            if(validateEmail(tokenDetails[1])){
                $scope.su.email = tokenDetails[1];

            }
        }
		self.signup = function (isPro, isPart) {
			if ($scope.su && $scope.su.firstName && $scope.su.lastName && $scope.su.email &&
				$scope.su.password && $scope.su.password2 === $scope.su.password) {
                $scope.su.role = { pro: isPro, part: isPart };
                $scope.su.byToken = $location.url().replace('/app/wellcome/', '');

				latooApi.signup($scope.su)
					.then(function (res, err) {
                        
                        if (res.status === 200) {
                            
                            latooApi.$setSession(res.data.token);
                        
                            setTimeout(function(){
                                latooApi.$isConnected();
                                
                                window.location.hash = 'app/profile/me';
                                window.location.reload();
                            },  30);

                        } else {

						}
					}, function (err) {
						self.errors = [];
                        self.errors.push(err.data.message);
                        console.log(self.errors)
					});
			}
		};
	});
