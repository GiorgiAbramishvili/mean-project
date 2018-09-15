'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
  .controller('AddPlayerCtrl', function ($rootScope, $scope, latooApi, $uibModalInstance, toastr) {
    $scope.global = $rootScope;
    $scope.closeModal = function() {
      $uibModalInstance.dismiss('cancel');
    };
    $scope.uploadFile = function() {

      if ($scope.uploading) {
        return;
      }
      var fileUpload = document.getElementById('companyFile');
      var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.csv|.txt)$/;

      if (regex.test(fileUpload.value.toLowerCase())) {
        if (typeof (FileReader) !== 'undefined') {
          var nwFile = new FileReader();
          nwFile.onload = function (e) {
            var rows = e.target.result.split(/\r\n|\n/);
            var headers = ['ID_CLIENT', 'SIRET', 'SIREN','RAISON_SOC','NOM','DATE_CREA','ENSEIGNE','ADRESSE','CP','VILLE','APE','NAF'];
            var jsonObj = [];

            for (var i = 1; i < rows.length; i++) {
              var obj = {};
              var currentline = rows[i].split(';');
              for (var j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j];
              }
              obj.DATE_UPLOAD = new Date();
              jsonObj.push(obj);
            }
            $rootScope.uploadCompanies(jsonObj);
          };
          nwFile.readAsText(fileUpload.files[0]);
        } else {
          toastr.error('This browser does not support HTML5.');
        }
      } else {
        toastr.error('Le fichier CSV n\'est pas valide');
      }
    };
});
