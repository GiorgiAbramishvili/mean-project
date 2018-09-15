'use strict';

angular.module('latooApp')
.directive('scrollAndApply', function ($window) {
    return {
        restrict: 'A',
        scope: {
            scrollMultiple: '='
        },
        link: function(scope, element, attrs) {
            angular.element($window).bind('scroll', function() {
                var w = this;
                if (attrs.scrollMultiple && attrs.scrollAndApply === 'multiple') {
                    angular.forEach(scope.scrollMultiple, function(val) {
                        if (w.pageYOffset >= (val.lvl || 1) && w.pageYOffset <= (val.lvlMax || w.pageYOffset + 1)) {
                            element.addClass(val.cls);
                        } else {
                            element.removeClass(val.cls);
                        }  
                    });
                } else {
                    if (w.pageYOffset >= (attrs.scrollLvl || 1)) {
                        if (attrs.scrollMax) {
                            if (w.pageYOffset <= attrs.scrollMax) {
                                element.addClass(attrs.scrollAndApply);
                            } else {
                                element.removeClass(attrs.scrollAndApply);
                            }
                        } else {
                            element.addClass(attrs.scrollAndApply);
                        }
                    } else {
                        element.removeClass(attrs.scrollAndApply);
                    }
                }
                scope.$apply();
            });
        }
    };
});