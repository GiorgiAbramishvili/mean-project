'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
	.controller('LoginCtrl', function ($scope, latooApi, $uibModalInstance, signup) {
		var self = this;
		self.mode = signup === true ? 0 : 1;
		
		self.apiUri = latooApi.conf.uri;

		self.errors = [];
		self.login = function () {
			if ($scope.login && $scope.login.email && $scope.login.passwd) {
				self.errors = [];
				latooApi.login($scope.login.email, $scope.login.passwd)
					.then(function (res, err) {
						if (res.status === 200) {
							latooApi.$setSession(res.data.token);
							$uibModalInstance.close(true);
						} else {
							//err
						}
					}, function (err) {
						self.errors = [];
						self.errors.push(err.data.message);
					});
			}
		};

		self.socialSignup = function (platform) {
			console.log('signup', platform);

		};

		self.socialLogin = function (platform) {
			console.log('login', platform);

		};

		self.restorePassword = function () { 
			if ($scope.restore && $scope.restore.restoreEmail) { 
				
				latooApi.restorePassword($scope.restore)
					.then(function (res, err) {
						if (res.status === 200) {
							self.errors = [];
							self.success = [];
							self.success.push(res.data.message);
						}
					}, function (err) {
						self.success = [];
						self.errors = [];
						self.errors.push(err.data.message);
					});
			}
		}

		self.signup = function (isPro, isPart) {
			if ($scope.su && $scope.su.firstName && $scope.su.lastName && $scope.su.email &&
				$scope.su.password && $scope.su.password2 === $scope.su.password) {
				$scope.su.role = { pro: isPro, part: isPart };
				latooApi.signup($scope.su)
					.then(function (res, err) {
						if (res.status === 200) {
							latooApi.$setSession(res.data.token);
							$uibModalInstance.close(true);
						} else {

						}
					}, function (err) {
						self.errors = [];
						self.errors.push(err.data.message);
					});
			}
		};
	});
