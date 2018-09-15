'use strict';

angular.module('latooApp')
  .controller('ResearchCtrl', function ($scope, $http, $location, researchFactory, toastr) {
      var self = this;
      $scope.autoCompCompany = [];
      $scope.autoCompLocation = [];

      $scope.loadingLocation = false;
      $scope.isCheck = false;
      
      self.loadingAutocomplete = false;
      $scope.highlight = function(text, search) {
          if (!search) {
              return text;
          }
          return text.replace(new RegExp(search, 'gi'), '<span class="highlightedText">$&</span>');
      };
      /***** FUNCTIONS FOR AUTOCOMPLETE RESEARCH INPUTS *****/
      $scope.autoCompleteLocation = function (location) {
          if (location.length >=2 && self.loadingAutocomplete === false) {
              self.loadingAutocomplete = true;
              researchFactory.autoCompleteLocation(location).then(function (list) {
                  $scope.autoCompLocation = list;
                self.loadingAutocomplete = false;
              });
          }
          if (!location.length) {
              $scope.autoCompLocation = [];
          }
      };

      $scope.autoCompleteKeyword = function (keyword) {
          if (keyword.length >=2 && self.loadingAutocomplete === false) {
              self.loadingAutocomplete = true;
              researchFactory.autoCompleteResearch(keyword).then(function (list) {
                  $scope.autoCompCompany = list;
                self.loadingAutocomplete = false;
              });
          }
          if (!keyword.length) {
              $scope.autoCompCompany = [];
          }
      };

      $scope.changeInputLocation = function(value) {
          $scope.researchLocation = value;
          $scope.autoCompLocation = [];
      };

      $scope.changeInputKeyword = function(value) {
          $scope.researchKeyword = value;
          $scope.autoCompCompany = [];
      };
      
    $scope.askLocation = function() {
      if ($scope.loadingLocation)
        return;
      $scope.loadingLocation = true;
      researchFactory.changeProximity().then(function(value) {
         $scope.researchLocation = value;
         $scope.researchPosition = researchFactory.getPrecisePosition();
         console.log("pos :", $scope.researchPosition)
         $scope.loadingLocation = false;
         $scope.proxMode = true;
         $scope.geolocNotAuthorized = false;
      }, function(err) {
        console.log(err);
        $scope.geolocNotAuthorized = true;
        $scope.loadingLocation = false;
        toastr.error('Veuillez autoriser la localisation dans votre navigateur puis réessayez', 'Impossible de vous localiser');
      });
      $scope.isCheck = !$scope.isCheck;
    };
    $scope.placeChanged = function() {
      if (this.getPlace()) {
        $scope.researchPosition = {
          lat: this.getPlace().geometry.location.lat(), 
          lng: this.getPlace().geometry.location.lng()
        }; 
      }
    };
    $scope.deleteProx = function() {
      $scope.researchLocation = undefined;
      $scope.loadingLocation = false;
      $scope.proxMode = false;
      researchFactory.deleteProximity();
    }
    /***** FONCTION DE RÉINITIALISATION DES INPUT DE RECHERCHE *****/
    $scope.resetResearch = function() {
      $scope.researchKeyword = null;
      $scope.researchLocation = null;
    };

    /***** FONCTION PRINCIPALE DE RECHERCHE DES ENTREPRISES *****/
    $scope.submit = function() {
      if ($scope.researchKeyword && $scope.researchLocation && $scope.researchPosition){
            researchFactory.addKeywordData($scope.researchKeyword);
            researchFactory.addLocationData($scope.researchLocation);
            $location.path('/app/results').search('keyword', $scope.researchKeyword).search('location', $scope.researchLocation).search('lat', $scope.researchPosition.lat).search('lng', $scope.researchPosition.lng);
      }
      if ($scope.researchKeyword && $scope.researchPosition && $scope.proxMode) {
          researchFactory.addKeywordData($scope.researchKeyword);
          researchFactory.addLocationData(researchFactory.getUserPosition());
          $location.path('/app/results').search('keyword', $scope.researchKeyword).search('location', $scope.researchLocation).search('lat', $scope.researchPosition.lat).search('lng', $scope.researchPosition.lng);
      }
    };
      
      $scope.goToResearch = function(keyWord) {
          $scope.researchKeyword = keyWord;
          if ($scope.researchLocation) {
            return $scope.submit();
          }
          else {
            researchFactory.changeProximity().then(function(value) {
              $scope.proxMode = true;
              $scope.researchLocation = value;
              $scope.researchPosition = researchFactory.getPrecisePosition();
              return $scope.submit();
            });
          }
      };
  });
