'use strict';

/**
 * @ngdoc function
 * @name latooApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the latooApp
 */
angular.module('latooApp')
  .controller('SubsCtrl', function ($scope, latooApi, $uibModal, toastr, $stateParams, $state, moment) {
  	var self = this;

    latooApi.getMe().then(function(res) {
      if (res) {
        latooApi.getMySubs().then(function(res) {
          if (res) {
            console.log(res);
            $scope.subs = res.data;
            $scope.currentSubs = [];
            angular.forEach(res.data, function(sub) {
              if (sub.status === 'OK') {
                if (sub.frequency === '1 W') {
                  sub.frequency = 'Hebdomadaire';
                  sub.nextPayment = moment(sub.lastPaid).add(1, 'week');
                } else if (sub.frequency === '1 M') {
                  sub.frequency = 'Mensuel';
                  sub.nextPayment = moment(sub.lastPaid).add(1, 'month');
                } else if (sub.frequency === '1 Y') {
                  sub.frequency = 'Annuel';
                  sub.nextPayment = moment(sub.lastPaid).add(1, 'year');
                } 
                $scope.currentSubs.push(sub);
              }
              if ((sub.package.indexOf('PRO') != -1 || sub.package === 'gold') && sub.status === 'OK') {
                $scope.gold = sub;
              }
            });
            latooApi.getPricing().then(function (pricings) {
              console.log(pricings)
              $scope.offers = pricings.data
              $scope.selectedOffer = $scope.offers[0]
            })
          }
        });
      }
    });

    var handler = StripeCheckout.configure({
      key: 'pk_test_AXh7Car8VQhhWFi6XRzGYXeh',
      image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
      locale: 'auto',
      token: function(token) {
        return latooApi.stripeCheckout(token, $scope.selectedOffer)
          .then(function (res) {
            console.log('API response:', res);
            toastr.success('Paiement confirmé')
          })
          .catch(function(err) {
            console.error('API response:', err);
            toastr.error('Le paiement a échoué')
          })
      }
    });

    $scope.stripeCheckout = function () {
      // Open Checkout with further options:
      console.log(latooApi.$getProfile())
      handler.open({
        name: 'Latoo',
        image: '/images/logo.png',
        email: latooApi.$getProfile().email,
        panelLabel: 'Payer',
        description: $scope.selectedOffer.name,
        zipCode: true,
        currency: 'eur',
        amount: ($scope.selectedOffer.price - ($scope.selectedOffer.reduc ? $scope.selectedOffer.reduc.amount_off : 0)) * 100
      });
    }

    // Close Checkout on page navigation:
    window.addEventListener('popstate', function() {
      handler.close();
    });

    $scope.paymentProvider = 'stripe'

    $scope.payWith = function (choice) {
      $scope.paymentProvider = choice;
      console.log(choice)
    }

    $scope.updateChoice = function (choice) {
      $scope.selectedOffer = choice
      console.log(choice)
    }

    $scope.checkCoupon = function () {
      if (self.couponCode.length > 0) {
        latooApi.getCouponInfo(self.couponCode).then(function (res) {
          angular.forEach($scope.offers, function (offer) {
            if (offer.type == res.data.type) {
              offer.reduc = res.data
              $scope.selectedOffer = offer
            }
          })
        }).catch(function(err) {
          toastr.warning(err.data)
        })
      }
    }

  });
