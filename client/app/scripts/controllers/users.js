'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
  .controller('UsersCtrl', function ($scope, latooApi, $stateParams, $state, $uibModal, toastr) {
  	var self = this;
  	self.page = 1;
    self.limit = 20;

  	self.loadUsers = function(page, limit) {
      latooApi.admin.loadUsers(page, limit).then(function(res) {
        console.log(res);
        self.users = res.data.results;
        self.maxPages = res.data.pagination.maxPages;
      }, function(err) {
          toastr.error('Une erreur est survenue.', 'Erreur');
      });
    };
    $scope.changePage = function(page) {
      if (page > 0 && page < self.maxPages) {
        self.page = page;
        self.loadUsers(self.page, self.limit);
      }
    };
    $scope.deleteClient = function(c) {    
      latooApi.admin.deleteUser(c._id).then(function(res) {         
          toastr.success('Client supprimé');
          self.loadUsers(self.page, self.limit);     
      }, function(err) {
          toastr.error('Impossible de supprimer le client', 'Erreur');
      });  
      /*var modalInstance = $uibModal.open({
        templateUrl: 'views/partial/confirm-modal-client.html',
        size: 'md',
        controller: function($uibModalInstance, latooApi, company) {
          this.deleteClient = function() {
            latooApi.admin.deleteUser(company._id).then(function(res, err) {              
              $uibModalInstance.close(true);
            }, function(err) {
              $uibModalInstance.close(false);
            });
          };
          this.closeDialog = function() {
            $uibModalInstance.dismiss('cancel');
          };
        },
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
          self.loadUsers(self.page, self.limit);
        } else {
          toastr.error('Impossible de supprimer le client', 'Erreur');
        }
      });*/
    };
    self.loadUsers(self.page, self.limit);
  });
