'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
  .controller('PricingCtrl', function ($rootScope, $stateParams, $scope, latooApi, toastr, $state) {
    var self = this;

    latooApi.admin.getPricing().then(function (pricing) {
        console.log(pricing)
        $scope.offers = pricing.data
        $scope.selectedOffer = $scope.offers[0]
    })

    latooApi.admin.getCoupons().then(function (coupons) {
        console.log(coupons)
        $scope.coupons = coupons.data
        //$scope.offerTypes = $scope.offers.map(o => o.type)
        $scope.selectedCoupon = $scope.coupons[0]
    })

    $scope.createOffer = function () {
        $scope.selectedOffer = { }
    }

    $scope.saveOffer = function () {
        if ($scope.pricingOfferForm.$valid) {
            console.log($scope.selectedOffer)
            latooApi.admin.savePricingOffer($scope.selectedOffer).then(function (res) {
                console.log(res.data)
                toastr.success('Offre enregistrée.')
            }).catch(function (err) {
                toastr.error('Une erreur est survenue.')
                console.error(err.data)
            })
        } else {
            console.log($scope.pricingOfferForm.$error)
        }
    }

    $scope.deleteOffer = function () {
        latooApi.admin.delPricingOffer($scope.selectedOffer.type).then(function (res) {
            console.log(res.data)
            toastr.success('Offre supprimée.')
        }).catch(function (err) {
            toastr.error('Une erreur est survenue.')
            console.error(err.data)
        })
    }

    $scope.createCoupon = function () {
        $scope.selectedCoupon = { }
    }

    $scope.saveCoupon = function () {
        if ($scope.couponForm.$valid) {
            console.log($scope.selectedCoupon)
            latooApi.admin.saveCoupon($scope.selectedCoupon).then(function (res) {
                console.log(res.data)
                toastr.success('Coupon enregistré.')
            }).catch(function (err) {
                toastr.error('Une erreur est survenue.')
                console.error(err.data)
            })
        } else {
            console.log($scope.couponForm.$error)
            toastr.warning('Merci de replir tous les champs.')
        }
    }

    $scope.deleteCoupon = function () {
        latooApi.admin.delCoupon($scope.selectedCoupon.code).then(function (res) {
            console.log(res.data)
            toastr.success('Coupon supprimée.')
        }).catch(function (err) {
            toastr.error('Une erreur est survenue.')
            console.error(err.data)
        })
    }
});
