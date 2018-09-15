$(document).ready(function() {
	'use strict';

	/**
	 * Customizer
	 */	 
	$('.customizer-title').on('click', function() {		
		$('.customizer').toggleClass('open');
	});

	$('.customizer a').on('click', function(e) {
		e.preventDefault();

		var cssFile = $(this).attr('href');
		$('#css-primary').attr('href', cssFile);
	});
	
	

	// Checkbox
	$('input[type=checkbox]').wrap('<div class="checkbox-wrapper"></div>'); 
	$('input[type=checkbox]').each(function() {
		if (this.checked) {
			$(this).closest('.checkbox-wrapper').addClass('checked');
		}
	});

	$('input[type=checkbox]').change(function() {
		if (this.checked) {
			$(this).closest('.checkbox-wrapper').addClass('checked');
		} else {
			$(this).closest('.checkbox-wrapper').removeClass('checked');
		}
	});

	// Radio
	$('input[type=radio]').not('.payRad').wrap('<div class="radio-wrapper"></div>'); 
	$('input[type=radio]').each(function() {
		if ($(this).is(':checked')) {
			$(this).closest('.radio-wrapper').addClass('checked');
		}
	});

	$('input[type=radio]').change(function() {		
		$('input[type=radio]').each(function() {
			if ($(this).is(':checked')) {
				$(this).closest('.radio-wrapper').addClass('checked');
			} else {
				console.log('b');
				$(this).closest('.radio-wrapper').removeClass('checked');
			}
		});
	});	
});