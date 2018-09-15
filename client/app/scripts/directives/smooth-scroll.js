'use strict';

angular.module('latooApp').directive('smoothScroll', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			$(element).on('click', function() { 
				var page = attrs.smoothScroll; // Page cible
				var speed = attrs.scroolSpeed || 750; // Durée de l'animation (en ms)
				$('html, body').animate( { scrollTop: $(page).offset().top - (parseInt(attrs.delta) || 0) }, speed ); // Go
			});
		}
	};
});