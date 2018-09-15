'use strict';

angular.module('latooApp')
.controller('CreatorCtrl', function ($scope, $http, $window, toastr, $state, latooApi, $location, $stateParams, NgMap, Upload) {
  var self = this;
  $scope.creator = true;
  $scope.days = [   {day: 'Lundi', nm: 'mon'},
                    {day: 'Mardi', nm: 'tue'},
                    {day: 'Mercredi', nm: 'wed'},
                    {day: 'Jeudi', nm: 'thu'},
                    {day: 'Vendredi', nm: 'fri'},
                    {day: 'Samedi', nm: 'sat'},
                    {day: 'Dimanche', nm: 'sun'}];

  $scope.uploading = {cover: false, profile: false};                 
  $scope.uri = latooApi.conf.uri;
  $scope.isLoggedIn = latooApi.$checkSession();
  if ($scope.isLoggedIn) {
    latooApi.getMe()
      .then(function(data) {
        latooApi.$setProfile(data);
      }).catch(function(err) {
        latooApi.$logout();
        $scope.isLoggedIn = false;
        $state.go('app.home');
      });
  } else {
      toastr.error('Vous devez être connecté');
      $state.go('app.home');
  }
   NgMap.getMap().then(function(map) {
    self.map = map;
  });

  $scope.placeChanged = function() {
    $scope.place = this.getPlace();
    console.log($scope.place);
    $scope.position = $scope.place.geometry.location; 
    self.map.setCenter($scope.place.geometry.location);
    self.map.setZoom(15);
    var st, route, city, country, cp;
    angular.forEach($scope.place.address_components, function(cpt) {
      console.log(cpt);
      if (cpt.types.includes('street_number')) {
        st = cpt.short_name;
      } else if (cpt.types.includes('route')) {
        route = cpt.long_name;
      } else if (cpt.types.includes('locality')) {
        city = cpt.long_name;
      } else if (cpt.types.includes('country')) {
        country = cpt.long_name;
      } else if (cpt.types.includes('postal_code')) {
        cp = cpt.long_name;
      }
    });
    if (!$scope.company) {
      $scope.company = {company: {}};
    } else if (!$scope.company.company) {
      $scope.company.company = {};
    }
    $scope.company.company.ADRESSE = (st ? st + ' ' : "") + route;
    $scope.company.company.VILLE = city;
    $scope.company.company.PAYS = country;
    $scope.company.company.CP = cp;
    $scope.company.company.COOR = [{LAT: $scope.place.geometry.location.lat()}, {LNG: $scope.place.geometry.location.lng()}];
    $scope.company.company.LOC = [$scope.place.geometry.location.lng(), $scope.place.geometry.location.lat()];
    console.log($scope.company.company);
  }
  

  $scope.sendPicture = function (dataUrl, name, type) {
    $scope.picFile = undefined;
    $scope.coverFile = undefined;
    if (type === 'cover') {$scope.uploading.cover = true;}
    if (type === 'profile') {$scope.uploading.profile = true;}
    Upload.upload({
        url: $scope.uri + '/companys/' + $scope.company.company._id + '/images',
        data: {
            file: Upload.dataUrltoBlob(dataUrl, name),
            type: type
        },
        headers: {'Authorization': 'Bearer ' + latooApi.$getToken()},
    }).then(function (response) {
        if (type === 'cover') {$scope.uploading.cover = false;}
        if (type === 'profile') {$scope.uploading.profile = false;}
        $scope.result = response.data;
        $scope.images.profile = latooApi.$getUri() + '/companys/' + $scope.company.company._id + '/images?type=profile&last_update=' + new Date().getTime();
        $scope.images.cover = latooApi.$getUri() + '/companys/' + $scope.company.company._id + '/images?type=cover&last_update=' + new Date().getTime();
    
    }, function (response) {
        if (type === 'cover') {$scope.uploading.cover = false;}
        if (type === 'profile') {$scope.uploading.profile = false;}
        if (response.status > 0) $scope.errorMsg = response.status  + ': ' + response.data;
    }, function (evt) {
        $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
        if ($scope.progress === 100) {
          if (type === 'cover') {$scope.uploading.cover = false;}
          if (type === 'profile') {$scope.uploading.profile = false;}
        }
    });
  }
  $scope.saveCompanyData = function () {
    $scope.errors = false;
    if (!$scope.company) {
      return $scope.errors = 'Aucun champ n\'est renseigné';
    }
    if (!$scope.company.company || !$scope.company.company.RAISON_SOC || !$scope.company.company.RAISON_SOC.length) {
      return $scope.errors = 'Veuillez préciser la raison sociale de votre entreprise';
    }
    if (!$scope.company.company.COOR) {
      return $scope.errors = 'Veuillez préciser la localisation de votre entreprise';
    }
    if (!$scope.company.company.NOM || !$scope.company.company.NOM.length) {
      return $scope.errors = 'Veuillez indiquer le nom du propriétaire de l\'entreprise';
    }
    if (!$scope.company.company.SIREN || !$scope.company.company.SIREN.length) {
      return $scope.errors = 'Veuillez préciser le SIREN de l\'entreprise';
    }
    if ($scope.company.infos && !$scope.company.infos.ID) {
      $scope.company.infos.ID = $scope.company.company.SIREN;
    }
    if ($scope.tmp.TAGS) {
      $scope.company.company.TAGS = [];
      angular.forEach($scope.tmp.TAGS, function(t, i) {
        $scope.company.company.TAGS.push(t.text);
      });
    }
    latooApi.createCompany($scope.company.company).then(function(res, err) {
        if (err) {return toastr.error('Une erreur est survenue.');}
        console.log($scope.company.infos);
        if (!$scope.company.infos) {
          toastr.success('Votre société a été créée avec succès !');
          return $state.go('app.profile.companies');
        }
        latooApi.createCompanyInfos($scope.company.infos).then(function(res, err) {
          if (err) {return toastr.error('Une erreur est survenue.');}
          toastr.success('Votre société a été créée avec succès !');
          return $state.go('app.profile.companies');
        }, function(err) {
          if (err) {return toastr.warning('La création de votre entreprise est partielle', 'Une erreur est survenue');}
        });
    }, function(err) {        
      if (err) {return toastr.error('Impossible de créer la société', 'Une erreur est survenue.');}
    });
  };
});