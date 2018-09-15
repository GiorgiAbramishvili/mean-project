
'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
  .controller('CompaniesCtrl', function ($rootScope, $scope, latooApi, $uibModal, toastr, $state) {
  	var self = this;
  	self.page = 1;
    self.searching = false;

  	self.loadCompanies = function() {
  		self.companies = [];
  		latooApi.getMe()
  			.then(function(data) {
  				latooApi.$setProfile(data.data);
  				if (data.data.linkedCompany) {  				
			  		latooApi.getMyCompany().then(function(c) {
			  			self.companies = [c.data.company];
			  		});
			  	}
  			}).catch(function(err) {
  				latooApi.$logout();
  				$scope.isLoggedIn = false;
  			});
  	}

  	$scope.createSociety = function($event) {
  		$event.preventDefault();
      console.log('can we create ?')
  		if (!self.companies || self.companies.length == 0) {
        console.log('sure it\'s your first one!')
        $state.go('app.creator')
      } else {
        // if more than 1 company we test for gold membership
        console.log('maybe, let me check your memebership first !')
        latooApi.getMySubs().then(function(res) {
          if (res) {
            angular.forEach(res.data, function(sub) {
              if ((sub.package.indexOf('PRO') != -1 || sub.package === 'gold') && sub.status === 'OK')
                $scope.gold = sub;
            })
            if ($scope.gold) {
              $state.go('app.creator')
            } else {
              $uibModal.open({
                size: 'md',
                templateUrl: 'views/partial/need-sub.html',
                controller: function($scope, $uibModalInstance) {
                  $scope.closeModal = function() {
                    $uibModalInstance.dismiss();
                  }
                },
                controllerAs: 'ctrl'
              }).result.then(function(success) {
                if (success) {
                  self.loadCompanies();
                }
              })
            }
          }
        })
      }
  	};
  	$scope.editCompany = function(c) {
      var modalInstance = $uibModal.open({
        templateUrl: 'views/partial/editCompany.html',
        size: 'lg',
        controller: 'editCompanyCtrl',
        resolve: {
          lCompany: function () {
            return c;
          }
        }
      });
    };
    $scope.unlinkCompany = function(c) {      
      var modalInstance = $uibModal.open({
        templateUrl: 'views/partial/confirm-modal-unlink.html',
        size: 'md',
        controller: function($uibModalInstance, latooApi, company) {
          this.deleteCompany = function() {
            latooApi.unlinkCompany(company._id).then(function(res) {              
              $uibModalInstance.close(true);
            }, function(err) {
              $uibModalInstance.close(false);
            });
          };
          this.closeDialog = function() {
            $uibModalInstance.dismiss('cancel');
          };
        },
        controllerAs: 'ctrl',
        resolve: {
          company: function () {
            return c;
          }
        }
      });
      modalInstance.result.then(function(success) {
        if (success) {
          toastr.success('Société modifiée');
          self.loadCompanies(self.page, self.limit);
        } else {
          toastr.error('Impossible de changer le statut de la société', 'Erreur');
        }
      });
    };
    
    $scope.searchCompany = function() {
      self.searching = true;
      if ($scope.searchTerms.length >= 1 && !self.loading) {
        self.loading = true;
        self.companies = [];
        latooApi.admin.searchCompany($scope.searchTerms).then(function(res) {
          console.log(res.data);
          self.companies = res.data;
          self.loading = false;
        });
      } else {
        self.loadCompanies(self.page, self.limit);
      }
    };

  	$scope.deleteCompany = function(c) {      
      var modalInstance = $uibModal.open({
        templateUrl: 'views/partial/confirm-modal.html',
        size: 'md',
        controller: function($uibModalInstance, latooApi, company) {
          this.deleteCompany = function() {
            latooApi.deleteCompany(company._id).then(function(res) {              
              $uibModalInstance.close(true);
            }, function(err) {
              $uibModalInstance.close(false);
            });
          };
          this.closeDialog = function() {
            $uibModalInstance.dismiss('cancel');
          };
        },
        controllerAs: 'ctrl',
        resolve: {
          company: function () {
            return c;
          }
        }
      });
      modalInstance.result.then(function(success) {
        if (success) {
          toastr.success('Client supprimé');
          self.loadCompanies(self.page, self.limit);
        } else {
          toastr.error('Impossible de supprimer le client', 'Erreur');
        }
      });
    };
  	self.loadCompanies();
});
