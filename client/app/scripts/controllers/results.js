'use strict';

angular.module('latooApp')
  .controller('ResultsCtrl', function ($scope, $stateParams, researchFactory, $compile, $location, $route, latooApi, $cookies, NgMap) {
      var self = this;

      $scope.uri = latooApi.$getUri();
      $scope.positions =[];
      $scope.researchInput = {};
      $scope.activeRange = 3;
      $scope.activeCompany = 0;
      $scope.listView = true;
      $scope.zoom = $cookies.getObject('zoom');
      $scope.markerList = [];
      $scope.latooMap = {
        center: {lat:48.864716, lng: 2.349014}
      };

      $scope.loadingLocation = false;
      $scope.isCheck = false;

      $scope.autoCompKeyWord = [];
      $scope.autoCompLocation = [];
      if (!researchFactory.getKeyword() && $stateParams.keyword) {
        researchFactory.setKeyword($stateParams.keyword);
      }
      if (!researchFactory.getLocation() && $stateParams.location) {
        researchFactory.setLocation($stateParams.location);
      }
      if ($scope.showingCompany) {
        delete $scope.showingCompany;
      }
      $scope.researchKeyword = researchFactory.getKeyword();
      $scope.researchInput.company = $scope.researchKeyword;
      $scope.researchLocation = researchFactory.getLocation();
      $scope.researchInput.location = $scope.researchLocation;
      $scope.position = {lat: parseFloat($stateParams.lat), lng: parseFloat($stateParams.lng)};
      $scope.markerList = [];
      $scope.zoom = 13;
      var boundsCoordinates = {
          NE: [],
          SW: [],
          NW: [],
          SE: []
      };
      function createMarkers() {
            researchFactory.getGeocoder().geocode({'address': $scope.researchLocation}, function (results, status) {
                if (status === 'OK') {
                  if (!$scope.position) {
                    $scope.position = results[0].geometry.location
                  }
                  $scope.researchPosition = $scope.position                  
                  $scope.map.setCenter($scope.position);           
                }
            });
      }

      function uniq(a) {
          var seen = {};
          return a.filter(function(item) {
              return seen.hasOwnProperty(item) ? false : (seen[item] = true);
          });
      }
      $scope.distance = function(pos1, pos2, unit) {
        var radlat1 = Math.PI * pos1.lat/180
        var radlat2 = Math.PI * pos2.lat/180
        var theta = pos1.lng-pos2.lng
        var radtheta = Math.PI * theta/180
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist)
        dist = dist * 180/Math.PI
        dist = dist * 60 * 1.1515 * 1609.344;
        return Math.round(dist / 10) * 10;
      };
      $scope.changeRange =function(step) {
        $scope.editRange = false;
        $scope.activeRange = parseFloat($scope.activeRange) + step;
        if ($scope.activeRange < 0) {
          $scope.activeRange = 0;
        } else if ($scope.activeRange > 30) {
          $scope.activeRange = 30;
        }
        self.loadResults();
      };
      self.loadResults = function() {
        $scope.myCompanies = [];
        latooApi.primarySearch($scope.researchInput.company, $scope.position, $scope.activeRange * 1000)
        .then(function(bestResult) {
          $scope.myCompanies = bestResult.data;
          return latooApi.searchAPE($scope.researchInput.company);
        })
        .then(function(listApe) {
            var finalApe = [];
            angular.forEach(listApe.data, function(ape) {
              if ((ape.LABEL_ROME.search(($scope.researchInput.company).toLowerCase())) &&
                  (ape.LABEL_NAF.search(($scope.researchInput.company.toLowerCase())))) {
                finalApe.push(ape.NAF);
              }
            });
            return latooApi.secondarySearch(uniq(finalApe), $scope.position, $scope.activeRange * 1000);
        })
        .then(function (companies) {
            $scope.myCompanies = $scope.myCompanies.concat(companies.data);
              var keyWord = $scope.researchInput.company.toLowerCase();
              var i = $scope.myCompanies.length
              while(i--) {
                  if ($scope.myCompanies[i].NAF
                  && $scope.myCompanies[i].NAF.toLowerCase().search(keyWord) === -1
                  && $scope.myCompanies[i].RAISON_SOC.toLowerCase().search(keyWord) === -1
                  && $scope.myCompanies[i].TAGS.map(function (t) {return t.toLowerCase()}).indexOf(keyWord) === -1) {                    
                      $scope.myCompanies.splice(i, 1);
                  }
              }
              if ($scope.myCompanies) {
                  for (var i = 0; i < $scope.myCompanies.length; i++) {
                      if ($scope.myCompanies[i].COOR && $scope.myCompanies[i].COOR.length) {
                          var coor = $scope.myCompanies[i].LOC;
                          //$scope.myCompanies[i].opened = parseInt(Math.random() * 3) + 1;
                          $scope.myCompanies[i].distance = $scope.distance({lat: coor[1], lng: coor[0]}, $scope.position);
                          $scope.positions.push({position: [coor[1], coor[0]], id: i, uid: $scope.myCompanies[i]._id});
                      }
                  }
              }
              if (!self.map) {
                NgMap.getMap().then(function(map) {
                  self.map = map;
                  createMarkers();
                });
              } else {
                createMarkers();
              }
          });
      };

      if (($scope.researchKeyword && $scope.researchLocation)) {
          $scope.zoom = 13;
          self.loadResults();
      }

      self.loadingAutocomplete = false;
      $scope.autoCompleteLocation = function (location) {
          if (location.length >=2 && self.loadingAutocomplete ===  false) {
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
                  $scope.autoCompKeyWord = list;
                  self.loadingAutocomplete = false;
              });
          }
          if (!keyword.length) {
              $scope.autoCompKeyWord = [];
          }
      };
      $scope.changeInputLocation = function(value) {
          $scope.researchLocation = value;
          $scope.researchInput.location = value;
          $scope.autoCompLocation = [];
      };
      $scope.changeInputKeyword = function(value) {
          $scope.researchKeyword = value;
          $scope.researchInput.company = value;
          $scope.autoCompKeyWord = [];
      };
      
    $scope.placeChanged = function() {
      if (this.getPlace()) {
        console.log("Place changed: updating location...")
        $scope.researchPosition = {
          lat: this.getPlace().geometry.location.lat(), 
          lng: this.getPlace().geometry.location.lng()
        };
        console.log("pos :", $scope.researchPosition)
        researchFactory.setPrecisePosition($scope.researchPosition)
      }
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
    $scope.newResearch = function () {

        if ($scope.researchInput.company && $scope.researchInput.location) {
            researchFactory.addKeywordData($scope.researchInput.company);
            researchFactory.addLocationData($scope.researchInput.location);
            self.loadResults();
        }
    };

      var setCoordinates = function (bounds) {
          boundsCoordinates.NE = [];
          boundsCoordinates.SW = [];
          boundsCoordinates.NW = [];
          boundsCoordinates.SE = [];
          boundsCoordinates.NE.push(bounds.getNorthEast().lat().toFixed(7));
          boundsCoordinates.NE.push(bounds.getNorthEast().lng().toFixed(7));
          boundsCoordinates.SW.push(bounds.getSouthWest().lat().toFixed(7));
          boundsCoordinates.SW.push(bounds.getSouthWest().lng().toFixed(7));
          boundsCoordinates.NW.push(boundsCoordinates.NE[0]);
          boundsCoordinates.NW.push(boundsCoordinates.SW[1]);
          boundsCoordinates.SE.push(boundsCoordinates.SW[0]);
          boundsCoordinates.SE.push(boundsCoordinates.NE[1]);
      };

      /***** MAKE REQUEST WITH COMPANY ID AND REDIRECT TO PROFILE PAGE *****/
      $scope.goToCompanyProfile = function (nbOfTheCompany) {
          var theCompany;
          for (var i = 0; i <= nbOfTheCompany; i++) {
              theCompany = $scope.myCompanies[i];
          }
          if (theCompany) {
            researchFactory.researchCompanyWithId(theCompany._id);
          }
      };

    $scope.reductions = [
      {name: 'Promotion'},
      {name: 'Vente flash'},
      {name: 'Destockage'},
      {name: 'Soldes'}
    ];

    /***** ZOOM IN ON THE MAPS AND SCALE RESEARCH CIRCLE *****/
    $scope.increaseZoom = function () {
        $scope.zoom += 1;
        $cookies.putObject('zoom', $scope.zoom, '/resResearch');
        $cookies.put('extendResearch', true);
        setCoordinates($scope.researchMap.getBounds());
        researchFactory.setMapBounds(boundsCoordinates);
        $route.reload();
    };

    /***** ZOOM OUT ON THE MAPS AND SCALE RESEARCH CIRCLE *****/
    $scope.reduceZoom = function () {
        $scope.zoom -= 1;
        $cookies.putObject('zoom', $scope.zoom, '/resResearch');
        $cookies.put('extendResearch', true);
        setCoordinates($scope.researchMap.getBounds());
        researchFactory.setMapBounds(boundsCoordinates);
        $route.reload();
    };

    /***** OPEN INFORMATION WINDOW ON RESULTMAP ON CLICK ON COMPANIES LIST *****/
    var infoWindow;
    $scope.displayInfo = function (event, company) {
      $scope.showingCompany = $scope.myCompanies[company.id];
      if (!$scope.showingCompany)
        return;
      self.map.showInfoWindow('info-company', '' + company.id);
      var page = '#' + company.uid; // Page cible
      var speed = 750; // Durée de l'animation (en ms)
      var container = $('.results-list');
      var scroll = container.scrollTop();
      var dest = $(page).offset().top;
      var delta = dest - container.offset().top;
      var toMove = delta + scroll;
      $('.results-list').animate( { scrollTop:  toMove}, speed ); // Go
      self.activeCompany = company.id;
    };
    $scope.displayInfoAndCenter = function (company, index) {
      $scope.showingCompany = company;
      var coor = $scope.showingCompany.COOR;
      self.map.setCenter({lat: coor[0].LAT, lng: coor[1].LNG});
      self.map.setZoom(15);
      self.map.showInfoWindow('info-company', '' + index);
    };
    $scope.hideInfos = function() {
      self.map.hideInfoWindow('info-company');
    }
    $scope.isCompanyActive = function(index) {
      return self.activeCompany === index;
    };
    $scope.activeCompany = function(index) {
      self.activeCompany = index;
    };

    $scope.selectCat = function(cat) {
      $scope.changeInputKeyword(cat);
      if (!$scope.researchLocation) {
        $scope.changeInputLocation('Rennes');
      }
      $scope.newResearch();
    };
    $scope.search = function() {
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
  });
