'use strict';

/**
 * @ngdoc overview
 * @name latooApp
 * @description
 * # latooApp
 *
 * Main module of the application.
 */
angular
  .module('latooApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ngMessages',
    'ui.router',
    'ngMap',
    'ui.bootstrap',
    'toastr',
    'angularMoment',
    'ngPrint',
    'angular-progress-arc',
    'ngImgCrop',
    'ngFileUpload',
    'ngTagsInput',
    'textAngular',
    'ui.carousel',
    'ngMaterial',
    'lfNgMdFileInput',
    'angular-owl-carousel-2',
    'ngHandsontable'
  ])
  .config(function ($stateProvider, $urlRouterProvider) {
      $stateProvider        
        .state('app', {
            url: '/app',
            abstract:true,
            controller: 'MainCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'views/app.html'
        })
        .state('app.reset', {
            url: '/reset/:token',
            controller: 'ResetCtrl',
            templateUrl: 'views/reset.html'
        })
        .state('app.wellcome', {
            url: '/wellcome/:token',
            controller: 'WellcomeCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'views/wellcome.html'
        })
        .state('app.home', {
            url: '/home',
            templateUrl: 'views/main.html'
        })
        .state('app.privacy', {
            url: '/privacy',
            templateUrl: 'views/privacy.html'
        })
        .state('app.terms', {
            url: '/terms',
            templateUrl: 'views/terms.html'
        })
        .state('app.editCompany', {
            url: '/mycompany',
            controller: 'editCompanyCtrl',
            templateUrl: 'views/company-profile.html'
        })
        .state('app.search', {
            url: '/results?location&keyword&lat&lng',
            controller: 'ResultsCtrl',
            templateUrl: 'views/search-results.html'
        })
        .state('app.company', {
            url: '/company?id',
            controller: 'CompanyCtrl',
            templateUrl: 'views/company.html'
        })
        .state('app.editOffer', {
            url: '/editOffer?id',
            controller: 'OfferEditorCtrl',
            templateUrl: 'views/edit-offer.html'
        })
        .state('app.createOffer', {
            url: '/createOffer?for',
            controller: 'OfferCreatorCtrl',
            templateUrl: 'views/edit-offer.html'
        })
        .state('app.offer', {
            url: '/offer?id',
            controller: 'OfferCtrl',
            templateUrl: 'views/offer.html'
        })
        .state('app.edit', {
            url: '/edit?id',
            controller: 'EditorCtrl',
            templateUrl: 'views/edit-company.html'
        })
        .state('app.creator', {
            url: '/creator',
            controller: 'CreatorCtrl',
            templateUrl: 'views/edit-company.html'
        })
        .state('admin', {
            url: '/admin',
            abstract:true,
            controller: 'AdminCtrl',
            templateUrl: 'views/admin-canvas.html'
        })
        .state('admin.dashboard', {            
            url: '/dashboard',
            templateUrl: 'views/admin-dashboard.html'
        })
        .state('admin.clients', {            
            url: '/clients',
            controller: 'ManageCompaniesCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'views/admin-clients.html'
        })
        .state('admin.clients2', {            
            url: '/clients2',
            controller: 'ManageCompaniesCtrl2',
            controllerAs: 'ctrl',
            templateUrl: 'views/admin-clients2.html'
        })
        .state('admin.users', {            
            url: '/users',
            controller: 'UsersCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'views/admin-users.html'
        })
        .state('admin.pricing', {            
            url: '/pricing',
            controller: 'PricingCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'views/admin-pricing.html'
        })
        .state('admin.user', {            
            url: '/user?id',
            controller: 'AdminUserModifCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'views/partial/add-client.html'
        })
        .state('admin.newUsers', {            
            url: '/register',
            controller: 'AddClientCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'views/partial/add-client.html'
        })
        .state('admin.mail', {            
            url: '/mail',
            templateUrl: 'views/admin-mail.html',
            controller: 'AdminMailCtrl',
            controllerAs: 'ctrl',
        })
        .state('app.profile', {            
            url: '/profile',
            abstract: true,
            templateUrl: 'views/profile-canvas.html'
        })        
        .state('app.profile.me', {            
            url: '/me',
            controller: 'ProfileCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'views/profile-me.html'
        })
        .state('app.profile.companies', {            
            url: '/companies',
            controller: 'CompaniesCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'views/profile-companies.html'
        })
        .state('app.profile.users', {            
            url: '/users',
            controller: 'MyUsersCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'views/my-users.html'
        })
        .state('app.profile.subs', {            
            url: '/abonnements',
            controller: 'SubsCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'views/profile-subs.html'
        });
        $urlRouterProvider.otherwise('/app/home');
        
    }).config(function($mdDateLocaleProvider) {
        $mdDateLocaleProvider.formatDate = function(date) {
            return moment(date).format('DD/MM/YYYY');
        };
    }).config(function($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('deep-orange')
            .accentPalette('pink');
    }).filter('highlight', function() {
        return function(text, phrase) {
        if (phrase && text && angular.isString(text)) {
            console.log(text);
            text = text.replace(new RegExp('('+phrase+')', 'gi'), '<span class="highlighted">$1</span>');
        } 
        return text;
        };
    }).filter("trustUrl", function ($sce) {
        return function (recordingUrl) {
            return $sce.trustAsResourceUrl(recordingUrl);
        };
    }).filter('inArray', function($filter){
        return function(list, arrayFilter, element){
            if(arrayFilter){
                return $filter("filter")(list, function(listItem){
                    for(var i = 0, len = arrayFilter.length; i < len; i++) {
                        if (arrayFilter[i][element] === listItem[element]) return false;
                    }
                    return true;
                });
            }
        };
    });
