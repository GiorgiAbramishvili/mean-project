'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
  .controller('AddClientCtrl', function ($rootScope, $scope, latooApi, toastr, $state, $templateRequest, $sce) {
  	var self = this;
    var templateUrl = $sce.getTrustedResourceUrl('views/partial/mail-content.html');
    $templateRequest(templateUrl).then(function(template) {
        $scope.mail = {content: template, send: false};
    }, function() {
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
    	latooApi.admin.createUser({user: $scope.user, mail: $scope.mail}).then(function(success) {
    		console.log(success);
    		$scope.saving = false;
    		toastr.success(success.data.firstName + ' ' + success.data.lastName + ' a été ajouté avec succès', 'Client créé.');
    		$state.go('admin.users');
    	}).catch(function(err){
    		console.log(err);
    		if (err.status !== 500) {
    			toastr.error(err.data.message, 'Impossible de créer le client.');
    		} else {
    			toastr.error('Une erreur est survenue', 'Impossible de créer le client.');
    		}
    		$scope.saving = false;
    	});
    };
});