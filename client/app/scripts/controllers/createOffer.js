'use strict';

angular.module('latooApp')
.controller('OfferCreatorCtrl', function ($scope, $http, $window, toastr, $state, latooApi, $location, $stateParams, NgMap, Upload) {
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

	$scope.uploadStatus = 100;

	self.isMyCompany = function(user, companyId) {
		return (user.linkedCompany === companyId || user.role === 'admin');
	};

	self.loadDatas = function() {
		var user = latooApi.$getProfile();
		if (!user) {
			toastr.error('Vous devez être connecté pour editer une offre');
			return $state.go('app.home');
		}
		latooApi.loadCompany($stateParams.for).then(function(company) {
			if (!self.isMyCompany(user, company.data.company._id)) {
				toastr.error('Cette société ne vous appartient pas');
				return $state.go('app.home');
			}
			$scope.company = company.data
		}, function(err) {
			toastr.error('La société n\'existe plus', 'Impossible d\'éditer la société');
			$state.go('app.home');
		})
	};

	$scope.isLoggedIn = latooApi.$checkSession();
	if ($scope.isLoggedIn && $stateParams.for) {
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

	self.uploadImages = function () {
		if ($scope.files.filter(function(p) {return !p.isRemote}).length == 0) {
			toastr.success('Votre offre a été crée avec succès !')
			$('.uoloading-modal').modal('hide');						
			return $state.go('app.editOffer', {id: $scope.offerID});
		}
		console.log('uploading...', $scope.files)
		var upload = Upload.upload({
			url: $scope.uri + '/offers/' + $scope.offerID + '/images',
			data: {files: $scope.files.filter(function(p) {return !p.isRemote})},
			headers: {'Authorization': 'Bearer ' + latooApi.$getToken()},
		}).then(function(resp) {
			// file is uploaded successfully
			console.log('file is uploaded successfully. Response: ' + resp);
			toastr.success('Votre offre a été crée avec succès !')
			$('.uoloading-modal').modal('hide')
			$state.go('app.editOffer', {id: $scope.offerID});		
		}, function(resp) {
			console.error(resp)
			toastr.error('Une erreur est survenue.')
			$('.uoloading-modal').modal('hide')
			// handle error
		}, function(evt) {
			// progress notify
			console.log(evt)
			$scope.uploadStatus = parseInt(100.0 * evt.loaded / evt.total)
			console.log('progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '%');
		})
	}

	$scope.saveOffer = function () {
		$('.uoloading-modal').modal('show')
		console.log($scope.offer);
		$scope.errors = false;
		if (!$scope.offer.TITLE) {
			return $scope.errors = 'Veuillez donner un titre à votre offre';
		}
		if (!$scope.offer.DESCRIPTION) {
			return $scope.errors = 'Veuillez indquer une description de l\'offre';
		}
		if (!$scope.offer.PRICE) {
			return $scope.errors = 'Veuillez indiquer le prix de l\'offre';
		}
		latooApi.createOffer($scope.offer).then(function(res) {
			console.log(res)
			$scope.offerID = res.data._id
			self.uploadImages()
		}, function(err) {
			console.error(err)
			if (err) {return toastr.error('Une erreur est survenue.');}
		});
	};
});