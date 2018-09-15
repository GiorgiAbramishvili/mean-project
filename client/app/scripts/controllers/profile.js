'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
  .controller('ProfileCtrl', function ($scope, latooApi, $stateParams, $state, moment, toastr) {
  	var self = this;
  	
    latooApi.getMe().then(function(res) {
      if (res) {
        $scope.user = res.data;
      }
    }); 

    $scope.save = function() {
      $scope.saving = true;
      latooApi.updateMe($scope.user).then(function(success) {
        if ($scope.pass && $scope.pass.oldPassword && $scope.pass.newPassword2 && $scope.pass.newPassword) {
          if ($scope.pass.newPassword2 !== $scope.pass.newPassword) {
            $scope.saving = false;
            return toastr.warning('Profil mit à jour partiellement', 'Les mots de passe ne correspondent pas');
          }
          latooApi.changeMyPassword($scope.pass).then(function(res) {
            delete $scope.pass;
            $scope.saving = false;
            toastr.success('Profil mit à jour');
          }, function(err) {
            $scope.saving = false;
            toastr.warning('Profil mit à jour partiellement', 'Ancien mot de passe erroné');
          });
        } else {
          $scope.saving = false;
          toastr.success('Profil mit à jour');
        }
      }).catch(function(err){
        console.log(err);
        if (err.status !== 500) {
          toastr.error(err.data.message, 'Impossible de mettre à jour.');
        } else {
          toastr.error('Une erreur inconnue est survenue', 'Impossible de mettre à jour.');
        }
        $scope.saving = false;
      });
    };
  });
