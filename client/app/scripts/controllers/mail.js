'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
  .controller('AdminMailCtrl', function ($scope, latooApi, $stateParams, $state, $uibModal, toastr) {
  	var self = this;

    $scope.target = {
      type: 'professionnel',
      delay: '-1',
      users: [],
      specific: false,
    }
    $scope.selectUser = function(user, index) {
      $scope.target.users.push(user);
    };
    $scope.removeUser = function(index) {
      $scope.target.users.splice(index, 1);
    };
    $scope.searchUsers = function() {
      if ($scope.searchTerms.length >= 1 && !self.loading) {
        self.loading = true;
        self.users = [];
        latooApi.admin.searchUsers($scope.searchTerms).then(function(res) {
          self.users = res.data;
          self.loading = false;
        });
      } else {
        self.users = [];
      }
    };

    $scope.getTpl = function(){
        latooApi.admin.getTpl()
        .then(function(success) {
            $scope.tpls = success.data;
            $scope.tpls.forEach(function(t){
                if(t.active){
                    $scope.selectedTpl = t;
                    $scope.tplChange();
                }
            });
      }, function(err) {
        $scope.error = 'Error getting templates';
      });
    }

    // dodati opciju za edit;
    $scope.tplChange = function(){
        $scope.target.title = $scope.selectedTpl.subject;
        $scope.target.content = $scope.selectedTpl.html;
    }

    $scope.saveTpl = function() {
        
        latooApi.admin.saveTpl($scope.target)
        .then(function(success) {
          toastr.success('Template Saved');
          
          $scope.target.title = '';
          
          $scope.target.content = '';

          $scope.getTpl();

        }, function(err) {
            console.log(err)
          toastr.error('Impossible d\'envoyer le mail', err.data);
        });
      };

      $scope.setActiveTpl = function(type){
        
        
        if(!$scope.selectedTpl._id){
            toastr.error('Can\'t update blank template', {});
            return;
        }

        latooApi.admin.setActiveTpl($scope.selectedTpl, type)
        .then(function(success) {
          toastr.success('Template Active');
          
        }, function(err) {
            console.log(err)
          toastr.error('Can\'t update', err.data);
        });
      }
      
    $scope.calcTarget = function() {
      $scope.error = '';
      latooApi.admin.getMailTarget($scope.target)
      .then(function(success) {
        $scope.targetNumber = success.data.total;
      }, function(err) {
        $scope.targetNumber = 0;
        $scope.error = 'Une erreur est survenue. Impossible de récupérer la liste des cibles';
      });
    };
    $scope.save = function() {
      latooApi.admin.sendMail($scope.target)
      .then(function(success) {
        toastr.success('Mail envoyé avec succès');
        $state.go('admin.users');
      }, function(err) {
        toastr.error('Impossible d\'envoyer le mail', err.data);
      });
    };
    $scope.calcTarget();
    $scope.getTpl();
  });
