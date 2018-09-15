'use strict';

angular.module('latooApp')
.controller('OfferEditorCtrl', function ($scope, $http, $window, toastr, $state, latooApi, $location, $stateParams, NgMap, Upload) {
	var self = this;
	$scope.uri = latooApi.conf.uri;
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
	$scope.picToDel = []
	$scope.picToAdd = []

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
		latooApi.loadOffer($stateParams.id).then(function (offer) {
			$scope.offer = offer.data
			latooApi.loadCompany($scope.offer.COMPANY).then(function(company) {
				if (!self.isMyCompany(user, company.data.company._id)) {
					toastr.error('Cette société ne vous appartient pas');
					return $state.go('app.home');
				}
				$scope.company = company.data
				self.loadImages()
			}, function(err) {
				console.log(err)
				toastr.error('La société n\'existe plus', 'Impossible d\'éditer la société');
				$state.go('app.home');
			})
		}, function (err) {
			toastr.error('L\'offre n\'existe plus', 'Impossible d\'éditer cette offre');
			$state.go('app.home');
		})
	};

	self.loadImages = function () {
		//$scope.offer.PICS = ['narz', 'narz?0', 'narz?1']
		$scope.offer.PICS.map(function(pic){
			var url = latooApi.$getUri() + '/offers/' + $scope.offer._id + '/image/' + pic
			$scope.fileInput.addRemoteFile(url ,pic,'image')
			return url
		})
		$scope.files.map(function (f) {
			f.lfFile = {}
			return f
		})

		$scope.$watch('files',function(newVal,oldVal){
			for (var i=0; i < newVal.length; ++i) {
				var toAdd = true
				for(var j=0; j < oldVal.length; ++j) {
					if (newVal[i].lfFileName === oldVal[j].lfFileName)
						toAdd = false
				}
				if (toAdd) $scope.picToAdd.push(newVal[i].lfFileName)
			}
        }, true);
	}

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

	self.uploadImages = function () {
		if ($scope.files.filter(function(p) {return !p.isRemote}).length == 0) {
			toastr.success('Votre offre a été mise à jour avec succès !')
			$('.uoloading-modal').modal('hide');			
			return $state.go('app.editOffer', {id: $scope.offer._id});
		}
		console.log('uploading...', $scope.files)
		var upload = Upload.upload({
			url: $scope.uri + '/offers/' + $scope.offer._id + '/images',
			data: {files: $scope.files.filter(function(p) {return !p.isRemote})},
			headers: {'Authorization': 'Bearer ' + latooApi.$getToken()},
		}).then(function(resp) {
			// file is uploaded successfully
			console.log('file is uploaded successfully. Response: ' + resp);
			toastr.success('Votre offre a été mise à jour avec succès !')
			$('.uoloading-modal').modal('hide')
			$state.go('app.editOffer', {id: $scope.offer._id});
		}, function(resp) {
			console.error(resp)
			toastr.error('Une erreur est survenue.')
			$('.uoloading-modal').modal('hide')
			$state.go('app.editOffer', {id: $scope.offer._id});
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

		$scope.picToDel.forEach(function (p) {
			latooApi.deleteOfferPic($scope.offer._id, p)
			console.log(p, $scope.offer.PICS.indexOf(p))
			$scope.offer.PICS.splice($scope.offer.PICS.indexOf(p), 1)
		})
		console.log($scope.offer)
		latooApi.updateOffer($scope.offer._id, $scope.offer).then(function(res) {
			console.log(res)
			self.uploadImages()
		}, function(err) {
			console.error(err)
			if (err) {return toastr.error('Une erreur est survenue.');}
		});
	};

	$scope.onFileClick = function(obj,idx) {
		console.log(obj);
	}

	$scope.onFileRemove = function(obj,idx) {
		console.log(obj);
		if (obj.isRemote) {
			$scope.picToDel.push(obj.lfFileName)
		} else {
			$scope.picToAdd.splice($scope.picToAdd.indexOf(obj), 1)
		}
	}
});