'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
    .controller('AdminCtrl', function ($rootScope, $scope, $state, latooApi, $uibModal, $q, $location, $interval, Upload, toastr) {
        var self = this;
        $scope.global = $rootScope;
        $scope.uri = latooApi.$getUri();
        $scope.isLoggedIn = latooApi.$checkSession();
        if ($scope.isLoggedIn) {
            latooApi.getMe()
                .then(function (data) {
                    latooApi.$setProfile(data.data);
                }, function (err) {
                    latooApi.$logout();
                    $scope.isLoggedIn = false;
                    $state.go('app.home');
                });
        } else {
            $state.go('app.home');
        }
        $scope.changebg = function (file) {
            $scope.uploading = true;
            Upload.upload({
                url: $scope.uri + '/admin/params/homeCover',
                data: {
                    file: file
                },
                headers: { 'Authorization': 'Bearer ' + latooApi.$getToken() },
            }).then(function () {
                $scope.uploading = false;
                toastr.success('Image modifiée avec succès');
            }, function () {
            $scope.uploading = false;
                toastr.error('Impossible de changer l\'image');
            }, function (time) {
                $scope.progress = Math.min(100, parseInt(100.0 * time.loaded / time.total));
            });
        };
        
        self.isValid = function (company) {
            
            var keys = ['SIRET', 'SIREN', 'RAISON_SOC', 'NOM', 'DATE_CREA', 
            /*'ENSEIGNE', 'IMP' */
            'ADRESSE', 'CP', 'VILLE', 'APE', 'NAF'];
            var valid = 0;
            keys.forEach(function(key){
                

                if(!company.hasOwnProperty(key) || 
                   (typeof company[key] === 'undefined') ||
                   company[key] == '' || company[key] === null){
                    valid++;    
                }

            });
            var isValid = (valid === 0);
            if(!isValid){
                $rootScope.companyImportStats['error']++;
                company.importStatus = 'error';
                $rootScope.companyImportStats.errored.push(company);
            }
            
            return isValid;
        };
        $rootScope.reviewCompany = function(company, res){
            
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/partial/review-company.html',
                controller: 'AdminCtrl',
                controllerAs: 'adminCtrl',
                size: 'lg'
            });
            modalInstance.result.then(function () {
            });
        }
        self.companyUploadInfo = function(company, res){
            var comp = company;
            comp.importStatus = res.data; 
            $rootScope.companyImportStats[res.data]++;
            $rootScope.companyImports.push(comp);
        }
        $rootScope.uploadNextInQueue = function () {
            
            var nextCompany = $rootScope.toUpload[$rootScope.processed];
            
            if (($rootScope.processed > $rootScope.toBeUploaded) || typeof nextCompany === "undefined")  {
                
                $rootScope.uploading = false;
                
                document.querySelector('.reviewCompany') && 
                document.querySelector('.reviewCompany').classList.remove('div-disabled')

                $rootScope.filterTable('localized');
                return;
            }

            $rootScope.uploaded++;
            $rootScope.processed++; 

            if(nextCompany && nextCompany.CP && self.isValid(nextCompany)){
               
                if(nextCompany.importStatus)
                    delete nextCompany.importStatus;

                latooApi.importCompany(nextCompany).then(function (res) {
                    self.companyUploadInfo(nextCompany, res);
                    $rootScope.uploadNextInQueue();
                }, function (res) {
                    self.companyUploadInfo(nextCompany, res);
                    $rootScope.uploadNextInQueue();
                });
            }else{
                $rootScope.uploadNextInQueue();
            }

            
        };

        $rootScope.uploadCompanies = function (companies) {
            self.resetValidation();
            $rootScope.uploading = true;
            $rootScope.toBeUploaded = companies.length;
            $rootScope.uploaded = 0;
            $rootScope.processed = 0;
            $rootScope.toUpload = companies;
            
            setTimeout(function(){
                $rootScope.uploadNextInQueue();
            }, 50);
        };

        $rootScope.filterTable = function(filter){
            
            var btns = document.querySelectorAll('.grid_filters .btn');
            if(btns && btns.length>0){
                btns.forEach(function(btn){
                    btn.classList.remove("btn-primary");
                });
                document.querySelector('.stats_'+filter).classList.add("btn-primary");
            }
            
            if(filter=='error'){
                $rootScope.companyImportsGrid = $rootScope.companyImportStats.errored;
                return;
            }
        
            $rootScope.companyImportsGrid = $rootScope.companyImports.filter(function(company){
                if(filter=='all'){
                    return company;
                }
                else{
                    return company.importStatus == filter;
                }
            });  
            

        }

        self.resetValidation = function(){

            $rootScope.companyImports= [];
            $rootScope.companyImportsGrid= [];
            $rootScope.companyImportStats = {
                "exists_localized": 0,
                "exists_not_localized": 0,
                
                "not_localized": 0,
                "localized": 0,
                "error": 0,
                "errored": []
            };

        }
        $scope.saveTable = function(){
            document.querySelector('.reviewCompany').classList.add('div-disabled');
            $rootScope.uploadCompanies($rootScope.companyImportsGrid);
        }
        self.loadMetadata = function () {
            latooApi.admin.getMetadata().then(function (res) {
                $scope.datas = res.data;
            });
        };

        $scope.addCompany = function () {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/partial/add-player.html',
                controller: 'AddPlayerCtrl',
                controllerAs: 'addpctrl',
                size: 'lg'
            });
            modalInstance.result.then(function () {
            });
        };

        self.loadMetadata();

    });
