'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
  .controller('ManageCompaniesCtrl2', function ($rootScope, $scope, latooApi, $stateParams, $state, toastr, $uibModal) {
  	var self = this;
  	self.page = 1;
    self.limit = 1500;
    self.filterParam = 'not_localized';
    
  	self.loadCompanies = function(page, limit, queryKey, queryValue) { 
        document.querySelector('#top').classList.add('div-disabled');
        latooApi.admin.loadCompanies2(page, limit, self.filterParam, queryKey, queryValue).then(function(res) {
            self.companies = res.data.results;
            self.maxPages = res.data.pagination.maxPages;
            
            self.localized = res.data.pagination.localized;
            self['not_localized'] = res.data.pagination['not_localized'];
            var top = document.querySelector('#top');
            if(top)
                top.classList.remove('div-disabled');
  		});
    };
    self.showToast = function(msg, lvl) {  
        if (lvl === 'success') {
          toastr.success(msg);
        } else if (lvl === 'info') {
          toastr.info(msg);
        } else {
          toastr.error(msg, 'Erreur');
        }
      };
    $scope.refresh = function(){
        self.loadCompanies(self.page, self.limit);
    }
    
    $scope.saveTable2 = function(){
        var rows = self.getSelectedRows(false, false);
        
        if(rows.length < 1)
            return;

        if(!confirm("Are you sure you want to localize "+rows.length+" companies?"))
            return;

        $rootScope.uploadCompanies(rows);
    }
    
    $scope.deleteRows = function(){
        
        //var ids = 
        self.getSelectedRows(true, true);
        // ids  = ids.slice(0);

        // if(ids.length>0){

        //     if(!confirm("Are you sure you want to delete "+ids.length+" companies?"))
        //         return;
            
        //     console.log(ids); 
        //     ids.forEach(function(id){
        //         console.log(id, new Date());

        //         // if(id)
        //             latooApi.admin.deleteCompany(id).then(function(res) {              
        //                 self.showToast('Companies succesfully deleted!', 'success');
        //             }, function(err) {
        //                 self.showToast('Error occured!', 'error');
        //             });
        //     });
        // }

    }

    self.getSelectedRows = function(deleteRows, removeFromGrid){
        
        var range = self.tableRef.getSelectedRange();
        var selected = [];

        if(range){
            var from = self.tableRef.getSelectedRange()[0]['from']['row'];
            var to = self.tableRef.getSelectedRange()[0]['to']['row'];
            var fn = self.tableRef.getDataAtRowProp;
            
            var toDelete = [];
            if(deleteRows){
                document.querySelector('#top').classList.add('div-disabled');
                setTimeout(function(){
                    document.querySelector('#top').classList.remove('div-disabled');
                    self.loadCompanies(self.page, self.limit);
                }, 1300);
            }
            for(var i = from; i<=to; i++){
                
                if (deleteRows){
                    var row = self.tableRef.getDataAtRow(i)[0];
                    selected.push(row);
                    toDelete.push(i);
                    latooApi.admin.deleteCompany(row).then(function(res) {              
                        self.showToast('Companies succesfully deleted!', 'success');
                        //self.tableRef.alter('remove_row', i);
                    }, function(err) {
                        self.showToast('Error occured!', 'error');
                    });

                }else{
                    selected.push({
                        SIRET: fn(i, "SIRET"),
                        SIREN: fn(i, "SIREN"),
                        RAISON_SOC: fn(i, "RAISON_SOC"),
                        NOM: fn(i, "NOM"),
                        ENSEIGNE: fn(i, "ENSEIGNE"),
                        ADRESSE: fn(i, "ADRESSE"),
                        CP: fn(i, "CP"),
                        VILLE: fn(i, "VILLE"),
                        APE: fn(i, "APE"),
                        NAF: fn(i, "NAF"),
                        DATE_CREA: fn(i, "DATE_CREA")
                    });
                }
                
            }

            
        }
        return selected;

    }

    $scope.filterTable = function(filter){
        self.filterParam = filter;
        self.loadCompanies(self.page, self.limit);
        var btns = document.querySelectorAll('.grid_filters2 .btn');
            if(btns && btns.length>0){
                btns.forEach(function(btn){
                    btn.classList.remove("btn-primary");
                });
                document.querySelector('.stats_'+filter).classList.add("btn-primary");
            }
    }
    $scope.changePage = function(page) {
      if (page > 0 && page < self.maxPages) {
        self.page = page;
        self.loadCompanies(self.page, self.limit);
      }
    };

    $scope.editCompany = function(c) {
      var modalInstance = $uibModal.open({
        templateUrl: 'views/partial/editCompany.html',
        size: 'lg',
        controller: 'adminEditCompanyCtrl',
        resolve: {
          lCompany: function () {
            return c;
          }
        }
      });
    };

    $scope.searchCompany = function() {
      if ($scope.searchTerms.length >= 1 && !self.loading) {
        self.loading = true;
        self.companies = [];
        latooApi.admin.searchCompany($scope.searchTerms).then(function(res) {
          self.companies = res.data;
          self.loading = false;
        });
      } else {
        self.loadCompanies(self.page, self.limit);
      }
    };

    $scope.searchComp = function(){

        if($scope.searchProp)
            self.loadCompanies(self.page, self.limit, $scope.searchProp.data, $scope.searchTerms);

        return false;
    }
    $scope.clearSearch = function(){
        $scope.searchProp = null;
        $scope.searchTerms = '';
        self.loadCompanies(self.page, self.limit);
        return false;
    }

    $scope.deleteCompany = function(c) {      
      var modalInstance = $uibModal.open({
        templateUrl: 'views/partial/confirm-modal.html',
        size: 'md',
        controller: function($uibModalInstance, latooApi, company) {
          this.deleteCompany = function() {
            latooApi.admin.deleteCompany(company._id).then(function(res) {              
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
    
    self.loadCompanies(self.page, self.limit);

    self.settings = {
        height: 800,
        //width: 900,
        colHeaders: true, 
        rowHeaders: true, 
        contextMenu: true, 
        manualColumnResize: true, 
        //manualRowResize: true, 
        manualColumnMove: true,
        dropdownMenu: true,
        filters: true,
        outsideClickDeselects: false,
        dropdownMenu: ['filter_by_condition', 'filter_action_bar'],
        afterChange: function(changes, dva){
            
            if(!self.tableRef)
                self.tableRef = this;
            if(changes && changes[0]){
                var change = changes[0];
                var rowId = change[0];
                var key = change[1];
                var oldValue = change[2];
                var newValue = change[3];
                var rowData = self.tableRef.getDataAtRow(rowId);
                var _id = rowData[0];

                var newData = {};
                newData[key] = newValue;
                
                if(oldValue!=newValue)
                    latooApi.updateCompany(_id, newData).then(function(res) {
                        self.showToast('Votre société a été mise à jour avec succès !', 'success');
                    }, function(err) {
                        return self.showToast('Une erreur est survenue.', 'alert')
                    });
            }
        },
        hiddenColumns: {
            columns: [0],
            indicators: true
        }
    };
    
    self.columns = [
        //{type: 'checkbox'},
        {data: '_id', title: ''},
        {data: 'SIRET', title: 'SIRET'},
        {data: 'SIREN', title: 'SIREN'},
        {data: 'RAISON_SOC', title: 'RAISON_SOC'},
        {data: 'NOM', title: 'NOM'},
        {data: 'ENSEIGNE', title: 'ENSEIGNE'},
        {data: 'ADRESSE', title: 'ADRESSE'},
        {data: 'CP', title: 'CP'},
        {data: 'VILLE', title: 'VILLE'},
        {data: 'APE', title: 'APE'},
        {data: 'NAF', title: 'NAF'},
        {data: 'DATE_CREA', readOnly: true, title: 'DATE_CREA'}
    ];

    $scope.colss = [
        {data: '_id', title: 'DB_ID'},
        {data: 'SIRET', title: 'SIRET'},
        {data: 'SIREN', title: 'SIREN'},
        {data: 'RAISON_SOC', title: 'RAISON_SOC'},
        {data: 'NOM', title: 'NOM'},
        {data: 'ENSEIGNE', title: 'ENSEIGNE'},
        {data: 'ADRESSE', title: 'ADRESSE'},
        {data: 'CP', title: 'CP'},
        {data: 'VILLE', title: 'VILLE'},
        {data: 'APE', title: 'APE'},
        {data: 'NAF', title: 'NAF'}
    ];

  });