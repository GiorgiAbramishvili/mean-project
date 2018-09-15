'use strict';

angular.module('latooApp')
	.controller('ResetCtrl', function ($scope, $http, $location, latooApi, toastr) {
		var self = this;

		$scope.save = function () {
			if ($scope.pass && $scope.pass.newPassword2 && $scope.pass.newPassword) {
				if ($scope.pass.newPassword2 !== $scope.pass.newPassword) {
					$scope.saving = false;
					return toastr.warning('Les mots de passe ne correspondent pas');
				}
				
				$scope.pass.token = $location.url().replace('/app/reset/', '');

				latooApi.setNewPassword($scope.pass).then(function (res) {
					toastr.success(res.data);
				}, function (err) {
					toastr.warning(err.data);
				});
			}
		}
	});
