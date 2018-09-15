'use strict';

angular.module('latooApp')
.controller('OfferCtrl', function ($scope, $http, $window, toastr, $state, latooApi, $location, $stateParams, NgMap, Upload) {
	var self = this;
	$scope.uri = latooApi.conf.uri;
	$scope.creator = true
	$scope.offer = {
		COMPANY: $stateParams.for,
		TITLE: undefined,
		DESCRIPTION: undefined,
		PRICE: undefined,
		REDUCTION: undefined,
		PICS: [],
		START_DATE: new Date(),
		END_DATE: new Date()
	}

	self.loadDatas = function() {
		latooApi.loadOffer($stateParams.id).then(function (offer) {
			$scope.offer = offer.data
			latooApi.loadCompany($scope.offer.COMPANY).then(function(company) {
				$scope.company = company.data
                $scope.images = {
                    cover: latooApi.$getUri() + '/companys/' + $scope.company.company._id + '/images?type=cover', 
                    profile: latooApi.$getUri() + '/companys/' + $scope.company.company._id + '/images?type=profile'
                }
				self.loadImages()
			}, function(err) {
				console.log(err)
				toastr.error('La société n\'existe plus');
				$state.go('app.home');
			})
		}, function (err) {
			toastr.error('L\'offre n\'existe plus');
			$state.go('app.home');
		})
	};

	self.loadImages = function () {
		$scope.offer.PICS = $scope.offer.PICS.map(function(pic){
			return latooApi.$getUri() + '/offers/' + $scope.offer._id + '/image/' + pic
		})
	}
    $scope.properties = {
        autoplay: true,
	 	items: 1,
		loop: true,
	 	nav: true,
	 	navText: ['<i class="fa fa-chevron-left"></i>', '<i class="fa fa-chevron-right"></i>'],
        dots: false
    };
    if ($scope.isLoggedIn) {
      latooApi.getMe()
        .then(function(data) {
          latooApi.$setProfile(data.data);
          $scope.currentUser = data.data;
          $scope.isAdmin = $scope.currentUser.role === 'admin';
          self.loadDatas();
        }).catch(function(err) {
          latooApi.$logout();
          $scope.isLoggedIn = false;
          self.loadDatas();
        });
    } else {
      self.loadDatas();
    }
});