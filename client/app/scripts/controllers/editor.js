'use strict';

angular.module('latooApp')
.controller('EditorCtrl', function ($scope, $http, $window, toastr, $state, latooApi, $location, $stateParams, NgMap, Upload) {
  var self = this;
  $scope.days = [   {day: 'Lundi', nm: 'mon'},
                    {day: 'Mardi', nm: 'tue'},
                    {day: 'Mercredi', nm: 'wed'},
                    {day: 'Jeudi', nm: 'thu'},
                    {day: 'Vendredi', nm: 'fri'},
                    {day: 'Samedi', nm: 'sat'},
                    {day: 'Dimanche', nm: 'sun'}];
  $scope.uri = latooApi.conf.uri;
  $scope.company = {
    company: {
      SIRET: undefined,
      SIREN: undefined,
      RAISON_SOC: undefined,
      NOM: undefined,
      DATE_CREA: undefined,
      ENSEIGNE: undefined,
      ADRESSE: undefined,
      CP: undefined,
      VILLE: undefined,
      APE: undefined,
      NAF: undefined,
      COOR: [{
        LAT: undefined,
        LNG: undefined
      }],
      DATE_UPLOAD: undefined,
      RECLAIMED: undefined,
      TAGS: [],
    },
    infos: {
      ID: undefined,
      DESCRIPTION: undefined,
      OFFERS: [],
      PHONE: undefined,
      EMAIL: undefined,
      WEBSITE: undefined,
      SOCIAL: {
          FACEBOOK: undefined,
          TWITTER: undefined,
          GPLUS: undefined,
          SNAPCHAT: undefined,
          INSTA: undefined,
      },
      HOUR: {
          mon: {am: undefined, pm: undefined, closed: undefined},
          tue: {am: undefined, pm: undefined, closed: undefined},
          wen: {am: undefined, pm: undefined, closed: undefined},
          thu: {am: undefined, pm: undefined, closed: undefined},
          fri: {am: undefined, pm: undefined, closed: undefined},
          sat: {am: undefined, pm: undefined, closed: undefined},
          sun: {am: undefined, pm: undefined, closed: undefined},
      },
    },
    offers: []
  };
  self.storeCompany = function(success) {
    $scope.company = success.data; 
    $scope.images = {
      cover: latooApi.$getUri() + '/companys/' + $scope.company.company._id + '/images?type=cover', 
      profile: latooApi.$getUri() + '/companys/' + $scope.company.company._id + '/images?type=profile'
    };
    $scope.address = $scope.company.company.ADRESSE + ', ' + $scope.company.company.VILLE + ' ' + $scope.company.company.CP;
    NgMap.getMap().then(function(map) {
      self.map = map;
      if ($scope.company.company.COOR && $scope.company.company.COOR.length >= 2) {
        $scope.position = {lat: $scope.company.company.COOR[0].LAT, lng: $scope.company.company.COOR[1].LNG};
      }
      self.map.setCenter($scope.position);
      self.map.setZoom(15);
    });
    if ($scope.company.company.TAGS) {
      $scope.tmp = {TAGS: []};
      angular.forEach($scope.company.company.TAGS, function(t) {
        $scope.tmp.TAGS.push({text: t});
      }); 
      $scope.company.company.TAGS = [];
    }
    if ($scope.company.infos && $scope.company.infos.HOUR) {
      angular.forEach($scope.company.infos.HOUR, function(h) {
        if (h.am)
          h.am = new Date(h.am);
        if (h.pm)
          h.pm = new Date(h.pm);
      });
    }
  };

  self.isMyCompany = function(user, companyId) {
    return (user.linkedCompany === companyId || user.role === 'admin');
  };

  self.loadDatas = function() {
    var user = latooApi.$getProfile();
    if (!user) {
      toastr.error('Cette société ne vous appartient pas');
      return $state.go('app.home');
    }
    latooApi.loadCompany($stateParams.id).then(function(success) {
      if (!self.isMyCompany(user, success.data.company._id)) {        
        toastr.error('Cette société ne vous appartient pas');
        return $state.go('app.home');
      }
      console.log(success.data)
      self.storeCompany(success);
    }, function(err) {
      toastr.error('La société n\'existe plus', 'Impossible d\'éditer la société');
      $state.go('app.home');
    })
  };

  $scope.isLoggedIn = latooApi.$checkSession();
  if ($scope.isLoggedIn) {
    latooApi.getMe()
      .then(function(data) {
        latooApi.$setProfile(data.data);
        self.loadDatas();
      }).catch(function(err) {
        latooApi.$logout();
        $scope.isLoggedIn = false;
        $state.go('app.home');
      });
  } else {
      toastr.error('Vous devez être connecté');
      $state.go('app.home');
  }
  $scope.placeChanged = function() {
    $scope.place = this.getPlace();
    $scope.position = $scope.place.geometry.location; 
    self.map.setCenter($scope.place.geometry.location);
    self.map.setZoom(15);
    var st, route, city, country, cp;
    angular.forEach($scope.place.address_components, function(cpt) {
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
    $scope.company.company.ADRESSE = (st ? st + ' ' : "") + route;
    $scope.company.company.VILLE = city;
    $scope.company.company.PAYS = country;
    $scope.company.company.CP = cp;
    $scope.company.company.COOR = [{LAT: $scope.place.geometry.location.lat()}, {LNG: $scope.place.geometry.location.lng()}];
    $scope.company.company.LOC = [$scope.place.geometry.location.lng(), $scope.place.geometry.location.lat()];
  }
  $scope.uploading = {cover: false, profile: false};
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
        console.log($scope.progress);
    });
  }
  $scope.saveCompanyData = function () {
    console.log($scope.company);
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
      angular.forEach($scope.tmp.TAGS, function(t, i) {
        $scope.company.company.TAGS.push(t.text);
      });
    }
    latooApi.updateCompany($scope.company.company._id, $scope.company.company).then(function(res) {
        if (!$scope.company.infos) {
          toastr.success('Votre société a été mise à jour avec succès !');
          return;
        }
        if (!$scope.company.infos._id) {
          latooApi.createCompanyInfos($scope.company.infos).then(function(res) {
            toastr.success('Votre société a été mise à jour avec succès !');
          }, function(err) {
            if (err) {return toastr.warning('La mise à jour de votre entreprise est partielle', 'Une erreur est survenue');}
          });
        } else {
          latooApi.updateCompanyInfos($scope.company.infos._id, $scope.company.infos).then(function(res) {
              toastr.success('Votre société a été mise à jour avec succès !');
            }, function(err) {
              if (err) {return toastr.warning('La mise à jour de votre entreprise est partielle', 'Une erreur est survenue');}
          })
        } 
    }, function(err) {        
      if (err) {return toastr.error('Une erreur est survenue.');}
    });
  };
  
  $scope.deleteOfferDialog = function(offer) {
    $scope.deletingOffer = offer
    $('.confirm-delet-modal').modal('show')
  }

  $scope.deleteOffer = function () {
    $('.confirm-delet-modal').modal('hide')
    latooApi.deleteOffer($scope.deletingOffer._id).then(function (res) {
      toastr.success('l\'offre ' + $scope.deletingOffer.TITLE + ' a été supprimée.')
    }, function (err) {
      if (err) {return toastr.error('Une erreur est survenue.');}
    })
  }
});