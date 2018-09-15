'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
  .controller('AdminUserModifCtrl', function ($rootScope, $stateParams, $scope, latooApi, toastr, $state) {
  	var self = this;
    
    latooApi.admin.loadUser($stateParams.id).then(function(res) {
        console.log(res);
        $scope.user = res.data;
        if (res.data.linkedCompany) {
            latooApi.loadCompany(res.data.linkedCompany).then(function(company) {
                $scope.linkedSociety = company.data.company;
            }, function(err) {
                console.log(err);
            });
        }
    }, function(err) {
        console.log(err);
        $state.go('admin.users');
    });

    $scope.global = $rootScope;
    $scope.searchCompany = function() {
      if ($scope.searchTerms.length >= 1 && !self.loading) {
        self.loading = true;
        self.companies = [];
        latooApi.admin.searchCompany($scope.searchTerms).then(function(res) {
          self.companies = res.data;
          self.loading = false;
        });
      } else {
      	delete self.companies;
      }
    };

    $scope.link = function(company) {
    	if (!$scope.user) {
    		$scope.user = {};
    	}
    	$scope.user.linkedCompany = company._id;
    	$scope.linkedSociety = company;
      	delete self.companies;
      	delete $scope.searchTerms;
    };	

    $scope.unlink = function() {
    	delete $scope.user.linkedCompany;
    	delete $scope.linkedSociety;
    };

    $scope.save = function() {
    	$scope.saving = true;
        $scope.user.deleteLink = !$scope.linkedSociety;
        console.log($scope.user);
    	latooApi.admin.updateUser($scope.user._id, $scope.user).then(function(success) {
    		console.log(success);
    		$scope.saving = false;
    		toastr.success('Client mit à jour.');
    		$state.go('admin.users');
    	}).catch(function(err){
    		console.log(err);
    		if (err.status !== 500) {
    			toastr.error(err.data.message, 'Impossible de mettre à jour le client.');
    		} else {
    			toastr.error('Une erreur est survenue', 'Impossible de mettre à jour le client.');
    		}
    		$scope.saving = false;
    	});
    };
});
