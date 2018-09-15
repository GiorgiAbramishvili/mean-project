'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
  .controller('ManageCompaniesCtrl', function ($scope, latooApi, $stateParams, $state, toastr, $uibModal) {
  	var self = this;
  	self.page = 1;
    self.limit = 20;

  	self.loadCompanies = function(page, limit) {
  		latooApi.admin.loadCompanies(page, limit).then(function(res) {
  			self.companies = res.data.results;
            self.maxPages = res.data.pagination.maxPages;
  		});
  	};

    $scope.changePage = function(page) {
      if (page > 0 && page < self.maxPages) {
        self.page = page;
        self.loadCompanies(self.page, self.limit);
      }
    };

    $scope.editCompany = function(c) {
      var modalInstance = $uibModal.open({
        templateUrl: 'views/partial/editCompany.html',
        size: 'lg',
        controller: 'adminEditCompanyCtrl',
        resolve: {
          lCompany: function () {
            return c;
          }
        }
      });
    };

    $scope.searchCompany = function() {
      if ($scope.searchTerms.length >= 1 && !self.loading) {
        self.loading = true;
        self.companies = [];
        latooApi.admin.searchCompany($scope.searchTerms).then(function(res) {
          console.log(res);
          self.companies = res.data;
          self.loading = false;
        });
      } else {
        self.loadCompanies(self.page, self.limit);
      }
    };
    $scope.deleteCompany = function(c) { console.log(c)      
      var modalInstance = $uibModal.open({
        templateUrl: 'views/partial/confirm-modal.html',
        size: 'md',
        controller: ['$uibModalInstance', 'latooApi', 'company', function($uibModalInstance, latooApi, company) {
          this.deleteCompany = function() {
            latooApi.admin.deleteCompany(company._id).then(function(res) {              
              $uibModalInstance.close(true);
            }, function(err) {
              $uibModalInstance.close(false);
            });
          };
          this.closeDialog = function() {
            $uibModalInstance.dismiss('cancel');
          };
        }],
        controllerAs: 'ctrl',
        resolve: {
          company: function () {
            return c;
          }
        }
      });
      modalInstance.result.then(function(success) {
        if (success) {
          toastr.success('Client supprimé');
          self.loadCompanies(self.page, self.limit);
        } else {
          toastr.error('Impossible de supprimer le client', 'Erreur');
        }
      });
    };
    
    self.loadCompanies(self.page, self.limit);
  });