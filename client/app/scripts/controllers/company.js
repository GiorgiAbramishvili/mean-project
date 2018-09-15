'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
  .controller('CompanyCtrl', function ($rootScope, $scope, latooApi, $stateParams, $state, NgMap, $uibModal, toastr) {
  	var self = this;
  	
  	self.idCompany = $stateParams.id;
  	if (!self.idCompany) {
  		$state.go('app.home');
  	}
    $scope.images = {
      cover: '',
      profile: ''
    };
  	self.loadCompany = function(id) {
  		latooApi.loadCompany(id).then(function(company) {
  			$scope.company = company.data;
        if (latooApi.$getProfile() && $scope.company.company.RECLAIMED === latooApi.$getProfile()._id) {
          $scope.isMyCompany = true;
        }
        $scope.images = {
          cover: latooApi.$getUri() + '/companys/' + $scope.company.company._id + '/images?type=cover', 
          profile: latooApi.$getUri() + '/companys/' + $scope.company.company._id + '/images?type=profile'
        };
        if (company.infos && company.infos.HOUR) {
          $scope.days = [ {name: 'Lundi', model: $scope.company.infos.HOUR.mon}, 
                          {name: 'Mardi', model: $scope.company.infos.HOUR.tue},
                          {name: 'Mercredi', model: $scope.company.infos.HOUR.wed},
                          {name: 'Jeudi', model: $scope.company.infos.HOUR.thu},
                          {name: 'Vendredi', model: $scope.company.infos.HOUR.fri},
                          {name: 'Samedi', model: $scope.company.infos.HOUR.sat},
                          {name: 'Dimanche', model: $scope.company.infos.HOUR.sun}];
          $scope.isOpen();
        }
        if ($scope.company.company.COOR && $scope.company.company.COOR.length) {
          NgMap.getMap().then(function(map) {
            self.map = map;
            var center = {lat: parseFloat($scope.company.company.COOR[0].LAT), lng: parseFloat($scope.company.company.COOR[1].LNG) };
            console.log(center);
            self.map.setCenter(center);
            $scope.position = center;
          });
        }
        angular.forEach($scope.company.offers, function(offer) {
          if (offer.PICS.length)
            offer.pic = latooApi.$getUri() + '/offers/' + offer._id + '/image/' + offer.PICS[0]
          else
            offer.pic = 'https://placehold.it/320x320'
        })
  			console.log(company);
  		});
  	};

    $scope.openStatus = 'unknown';
    $scope.openingText = '';
    $scope.isOpen = function () {
      var date = new Date();
      var currentDay = $scope.days[date.getDay() - 1 < 0 ? 6 : date.getDay() - 1].model;
      var currentTime = date.getHours() + date.getMinutes() / 60;
      $scope.days[date.getDay() - 1 < 0 ? 6 : date.getDay() - 1].today = true;
      if (currentDay &&
        ((currentDay.am && !currentDay.am.closed && currentDay.am.o < currentTime && currentDay.am.c > currentTime) ||
        (currentDay.pm && !currentDay.pm.closed && currentDay.pm.o < currentTime && currentDay.pm.c > currentTime) ||
        (currentDay.am && !currentDay.pm.closed && !currentDay.am.closed && currentDay.pm && !currentDay.am.c && !currentDay.pm.o && currentDay.am.o < currentTime && currentDay.pm.c > currentTime))) {
        $scope.openStatus = 'open';
        $scope.openingText = 'Ouvert';
        $scope.untilText = 'Ouvert jusqu\'à ' + (currentDay.am && currentDay.am.c > currentTime ? currentDay.am.c : currentDay.pm.c) + 'h';
      } else if (currentDay && currentDay.am && !currentDay.am.closed  && currentDay.am.o > currentTime) {
        $scope.openStatus = 'soon';
        $scope.openingText = $scope.untilText = 'Ouvre à ' + currentDay.am.o + 'h';
      } else if (currentDay && currentDay.pm && !currentDay.pm.closed && currentDay.pm.o > currentTime) {
        $scope.openStatus = 'soon';
        $scope.openingText = $scope.untilText = 'Ouvre à ' + currentDay.pm.o + 'h';
      } else {
        $scope.openStatus = 'closed';
        $scope.openingText = $scope.untilText = 'Fermé aujourd\'hui';
      }
    };
    
    $scope.isShowable = function(k) {
        var toShow = [{name: 'SIRET', display: 'SIRET'}, 
                      {name: 'SIREN', display: 'SIREN'}, 
                      {name: 'NOM', display: 'Nom'}, 
                      {name: 'DATE_CREA', display: 'Date de création'}, 
                      {name: 'ENSEIGNE', display: 'Enseigne'}, 
                      {name: 'ADRESSE', display: 'Adresse'}, 
                      {name: 'VILLE', display: 'Ville'}, 
                      {name: 'APE', display: 'Code APE'}, 
                      {name: 'NAF', display: 'NAF'}];
        for (var i = 0, len = toShow.length; i < len; i++) {
            if (toShow[i].name === k) {
              return toShow[i].display;
            }
        }
        return false;
      };

    self.verifyReclaim = function() {
      if (latooApi.$getProfile()) {
        if ($scope.company.company.RECLAIMED) {
          if ($scope.company.company.RECLAIMED === latooApi.$getProfile()._id) {
            $scope.isMyCompany = true;
          } else {
            var modalInstance = $uibModal.open({
              animation: true,
              templateUrl: 'views/partial/my-company-taken.html',
              controller: function($scope, user, latooApi, $uibModalInstance) {
                latooApi.getUser(user).then(function(res) {
                  $scope.user = res;
                });
                $scope.closeDialog = function() {
                  $uibModalInstance.dismiss();
                };
              },
              size: 'md',
              resolve: {
                  user: function() {return $scope.company.company.RECLAIMED}
              }
            });
          }
        } else {
          latooApi.attributeCompany($scope.company.company._id).then(function(res) {
            if (res.status === 200) {
              $scope.isMyCompany = true;
            }
          }, function(err) {
            if (err.status === 401) {
              toastr.error('Pour référencer plusieurs sociétés, vous devez être abonnés', 'Vous possésez déjà une société');
              $scope.isMyCompany = false;
            } else {
              toastr.error('Nos développeurs sont en train de corriger le problème', 'Une erreur est survenue');
              $scope.isMyCompany = false;
            }
          });
        }
      } else {
        toastr.error('Connectez vous pour récupérer cette société', 'Vous n\'êtes pas connectés');
      }
    };
    $scope.reclaim = function() {
      if (latooApi.$checkSession()) {
        self.verifyReclaim();
      } else {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'views/partial/login-modale.html',
          controller: 'LoginCtrl',
          controllerAs: 'logctrl',
          size: 'md'
        });
        modalInstance.result.then(function(success) {
          if (success) {
            latooApi.getMe()
              .then(function(data) {
                latooApi.$setProfile(data.data);
                $scope.currentUser = data.data;
                $rootScope.setLogin(true);
                $scope.isAdmin = $scope.currentUser.role === 'admin';
                self.verifyReclaim();
              }).catch(function(err) {
                latooApi.$logout();
                $rootScope.setLogin(false);
              });
            }
          }
        );
      }
    };
    if ($scope.isLoggedIn) {
      latooApi.getMe()
        .then(function(data) {
          latooApi.$setProfile(data.data);
          $scope.currentUser = data.data;
          $scope.isAdmin = $scope.currentUser.role === 'admin';
          self.loadCompany(self.idCompany);
        }).catch(function(err) {
          latooApi.$logout();
          $scope.isLoggedIn = false;
          self.loadCompany(self.idCompany);
        });
    } else {
      self.loadCompany(self.idCompany);
    }
  });
