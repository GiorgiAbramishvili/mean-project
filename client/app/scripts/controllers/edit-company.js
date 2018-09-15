'use strict';

angular.module('latooApp')
.controller('editCompanyCtrl', function ($scope, $http, $window, toastr, latooApi, $location, $uibModalInstance) {
  var self = this;
  $scope.days = [   {day: 'Lundi', nm: 'mon'},
                    {day: 'Mardi', nm: 'tue'},
                    {day: 'Mercredi', nm: 'wed'},
                    {day: 'Jeudi', nm: 'thu'},
                    {day: 'Vendredi', nm: 'fri'},
                    {day: 'Samedi', nm: 'sat'},
                    {day: 'Dimanche', nm: 'sun'}];

  self.loadDatas = function() {
    $scope.progressNb = 0;
    $scope.companyProfile = {};
    $scope.associateCompany = {};    
    $scope.companyUser = latooApi.$getProfile();
    console.log($scope.companyUser);
    latooApi.getMyCompany()
      .then(function (company) {
        console.log(company);
        company = company.data;
        if (company && company.company) {
          $scope.associateCompany = company.company || {};
          $scope.companyProfile = company.infos || {};
          $scope.companyProfile.EMAIL = $scope.companyUser.email;
          $scope.hasACompany = true;
          $scope.hadACompany = true;
          if ($scope.companyProfile.HOUR) {
            /* jshint ignore:start */
            $scope.companyProfile.HOUR.mon ? $scope.days[0].model = $scope.companyProfile.HOUR.mon : 0;
            $scope.companyProfile.HOUR.tue ? $scope.days[1].model = $scope.companyProfile.HOUR.tue : 0;
            $scope.companyProfile.HOUR.wed ? $scope.days[2].model = $scope.companyProfile.HOUR.wed : 0;
            $scope.companyProfile.HOUR.thu ? $scope.days[3].model = $scope.companyProfile.HOUR.thu : 0;
            $scope.companyProfile.HOUR.fri ? $scope.days[4].model = $scope.companyProfile.HOUR.fri : 0;
            $scope.companyProfile.HOUR.sat ? $scope.days[5].model = $scope.companyProfile.HOUR.sat : 0;
            $scope.companyProfile.HOUR.sun ? $scope.days[6].model = $scope.companyProfile.HOUR.sun : 0;
            /* jshint ignore:end */
          }
        }
        self.updateProgress();
    });
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
        $location.path('/app/home');
      });
  }

  $scope.menuContent = [
  {title: 'Dashboard', icon: 'dashboard'},
  {title: 'Ma société', icon: 'account_circle'},
  {title: 'Sécurité', icon: 'account_circle'},
  {title: 'Réductions', icon:'receipt'},
  {title: 'Publications', icon: 'collections_bookmark'},
  {title: 'Statistiques', icon:'timeline'}
  ];
  this.updateProgress = function() {
    for (var property in $scope.companyProfile) {
      if ($scope.companyProfile[property] && property !== '__v') {
        $scope.progressNb += 4.34;
      }
    }
    for (property in $scope.associateCompany) {
      if ($scope.associateCompany[property] && property !== '__v') {
        $scope.progressNb += 4.34;
      }
    }
    $scope.progressNb = Math.round($scope.progressNb);
  };
  this.showToast = function(msg, lvl) {  
    if (lvl === 'success') {
      toastr.success(msg);
    } else if (lvl === 'info') {
      toastr.info(msg);
    } else {
      toastr.error(msg, 'Erreur');
    }
  };
  $scope.selectedMenu = 0;

  $scope.selectMenu = function (index) {
    $scope.selectedMenu = index;
  };

  $scope.saveCompanyData = function () {
    var config = {headers: {'Content-Type' : 'application/json'}};
    $scope.companyProfile.ID = $scope.associateCompany.SIREN;
    angular.forEach($scope.days, function(d) {
      if (!$scope.companyProfile.HOUR) {$scope.companyProfile.HOUR = {};}
      if (d.model) {
        $scope.companyProfile.HOUR[d.nm] = d.model;
      }
    });
    var data = {infos: $scope.companyProfile, company: $scope.associateCompany};
    if ($scope.hadACompany) {
      latooApi.updateCompany(data.company._id, data.company).then(function(res) {
        latooApi.updateCompanyInfos(data.infos._id, data.infos).then(function(res) {
          $uibModalInstance.close(true);
          self.showToast('Votre société a été mise à jour avec succès !', 'success');
          self.updateProgress();
        }, function(err) {
          return self.showToast('Une erreur est survenue.', 'alert')
        });
      }, function(err) {
        return self.showToast('Une erreur est survenue.', 'alert')
      });
    } else { 
      latooApi.createCompany(data.company).then(function(res) {
        latooApi.createCompanyInfos(data.infos).then(function(res) {
          self.showToast('Votre société a été enregistrée avec succès !', 'success');
          self.updateProgress();
          $uibModalInstance.close(true);
        }, function(err) {
          return self.showToast('Une erreur est survenue.', 'alert')
        });
      }, function(err) {
        return self.showToast('Une erreur est survenue. Veuillez remplir tout les champs obligatoires', 'alert')
      });
    }
  };

  $scope.newReduc = {
    type: null,
    product: null,
    value: null,
    startDate: null,
    endDate: null
  };

  $scope.addReducs = function () {
        //Récupérer le current USER PRO et add les reducs
      };

      $scope.printError = function () {
        console.log($scope.company);
      };
      $scope.createSociety = function() {
        $scope.hasACompany = true;
      };

      $scope.onSuccess = function(blob, type){
        console.log(type);
        switch (type) {
          case 1: //profile Picture
          $scope.companyProfile.PROFIL_PICTURE = blob.url;
          break;
          case 2: //cover Picture
          $scope.companyProfile.COVER_PICTURE = blob.url;
          break;
          case 3: //supp Picture
          $scope.companyProfile.SUPP_PICTURE = [blob.url];
          break;
        }
      };
      $scope.displayHours = function(d) {
        var out = '';
        if (!d.model) {
          return '- | -';
        }
        if (d.model.am && d.model.am.closed) {out = 'Fermé';}
        else if (d.model.am) {
          if (d.model.am.o && d.model.am.c) {
            out = d.model.am.o + ' - ' + d.model.am.c;
          } else if (d.model.pm && d.model.am.o && d.model.pm.c && !d.model.pm.p) {
            return d.model.am.o + ' - ' + d.model.pm.c;
          } else {
            out = d.model.am.o;
          }
        }
        if (d.model.pm && d.model.pm.closed) {out += out.length ? ' | Fermé' : 'Fermé';}
        else if (d.model.pm) {
          out += ' | ';
          if (d.model.pm.o && d.model.pm.c) {
            out += d.model.pm.o + ' - ' + d.model.pm.c;
          } else if (d.model.pm.o) {
            out += d.model.pm.o;
          }
        }
        return out.length ? out : '- | -';
      };
    });