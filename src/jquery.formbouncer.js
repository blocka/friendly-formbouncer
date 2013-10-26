(function() {
	/* global FormBouncer */
	$.fn.validate = function(rules, options) {
		options = options || {};

		return $(this).each(function() {
			var $$ = $(this);

			/*jshint unused:false */
			var validator = FormBouncer.create($$, options);
			$(rules).each(function() {
				validator.addRule.apply($$, this);
			});
		});
	};
})(jQuery);
