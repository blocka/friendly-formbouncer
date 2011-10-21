var FormValidator = (function() {
	var ValidationError = function(target, message) {
		this.target = target;
		this.message = message;
		
		this.toString = function() {
			return message;
		}
	}
	
	var Rule = function($target, validator, options) {
		this.target = $target;
		this.validator = validator;
	}
	
	// Default options
	var defaults = { 
		stopOnError: true 
	};

	var Validator = function(form, options) {
		var o = $.extend({}, defaults, options || {});
		
		var $form_ = null;
		var queue_ = [];

		/**
		 * Processes the queue.
		 * 
		 * The functions at the queue get called within the context of the rules target.
		 * Each function gets an error-stack and a callback function as parameters.
		 * Options:
		 * - stopOnError
		 * - callback
		 */
		var processQueue = function(queue, options) {
			options = options || {};

			var $form = this;
			var errors = [];
			var i = 0;
			(function next() {
				if (options.stopOnError && errors.length > 0) {
					options.callback(errors);
					return;
				}
				
				if (i < queue.length) {
					var rule = queue[i++];
					
					// Call validator
					rule.validator.call(rule.target, errors, next);
				} else {
					options.callback(errors);
				}
			})();
		};
		
		/**
		 * Resolves target.
		 */
		var resolveTarget = function(target) {
			var type = $.type(target), selector = '';

			if (type === 'string') { // selector or name
				if (/^[\w\d]+$/.test(target)) { // It's a name (only letters and numerics)
					target = selector = '*[name="'+target+'"]';
				}
				else { // It's a selector (fancy other stuff than letters)
					selector = target;
				}
			}
			
			target = $(target);

			if(target instanceof jQuery) {
				if (target.length === 0) {
					throw 'EmptyJqueryTarget '+selector;
				}
				else if (target.length === 1) {
					// single item
				}
				else if (target.length > 1) {
					// is group
				}
			}
			else {
				throw 'InvalidTarget';
			}
			
			return target;
		}
		
		/**
		 * Resolves form.
		 */
		var resolveForm = function(form) {
			var type = $.type(form);
			if ('string' === type) { // selector
				form = $(form);
				if (0 === form.length) {
					throw 'FormNotFound';
				}
			}
			else if('object' === type) {
			}
			else {
				throw 'InvalidForm';
			}
			return form;
		}
		

		/**
		 * Resolves validator definitions.
		 */
		var resolveValidator = function(validator) {
			var validators = [];
			
			var type = $.type(validator);

			if ('regexp' === type) {
				validators.push(function(errors, proceed) {
					if (!validator.test(this.val())) {
						errors.push({ id: this.attr('id'), name: this.attr('name'), msg: 'The pattern '+validator.toString()+' does not match.' });
					}
					proceed();
				});
			}
			else if ('string' === type) { // Use of predefined validator
				if (!(validator in Validator.validators)) {
					throw 'InvalidPredefinedValidator';
				}
				validators.push(Validator.validators[validator]);
			}
			else if ('function' === type) { // A validator function
				validators.push(validator);
			}
			else if ('array' === type) { // Bunch of validators, which may be strings or functions
				$.each(validator, function(k, validator) {
					$.each(resolveValidator(validator), function(a, validator) {
						validators.push(validator);
					});
				});
			}
			else {
				throw 'InvalidValidator';
			}
			
			return validators;
		}

		this.addRule = function(target, validator, options) {
			options = options || {};
			
			var $targets   = resolveTarget(target);
			var validators = resolveValidator(validator);

			var isInstant     = 'instant' in options && true === options['instant'];
			var isInstantOnly = 'instantOnly' in options && true === options['instantOnly'];

			var instantQueue = [];

			$(validators).each(function(i, validator) {
				var rule = new Rule($targets, validator, options);
				
				if (isInstant) {
					instantQueue.push(rule);
				}

				if (!isInstantOnly) {
					queue_.push(rule);
				}
			});
			
			if (instantQueue.length > 0) {
				// For groups we bind to the last item
				($targets.length > 1 ? $targets.last() : $targets).bind('blur', function(e) {
					processQueue.call($form_, instantQueue, o);
				});
			}

			return this;
		}
		
		this.validate = function(options) {
			processQueue.call($form_, queue_, o);
		}
		
		$form_ = resolveForm(form);

		$form_.bind('submit', $.proxy(function(e) {
			e.preventDefault();
			this.validate();
		}, this));
	}
	
	Validator.validators = {};
	
	Validator.create = function(form, options) {
		options = options || {};
		var validator = new Validator(form, options);
		return validator;
	}
	
	Validator.registerValidator = function(id, fn) {
		Validator.validators[id] = fn;
	}
	
	Validator.registerValidator('isEmail', function(errors, proceed) {
		var pattern = /^([\w\.\-\+\=]+)@((?:[a-z0-9\-_]+\.)+[a-z]{2,6})$/i;
		if (!pattern.test(this.val())) {
			errors.push({ id: this.attr('id'), name: this.attr('name'), msg: 'invalid email.' });
		}
		proceed();
	});
	
	Validator.registerValidator('noop', function(errors, proceed) { 
		proceed(); 
	});	

	return Validator;
})();

(function() {
	$.fn.validate = function(rules, options) {
		options = options || {};

		return $(this).each(function() {
			var $$ = $(this);

			var validator = FormValidator.create($$, options);
			$(rules).each(function() {
				validator.addRule.apply($$, this);
			});
		})
	}
})(jQuery);

var isGender = function(errors, next) {
	var $el = this.filter(':checked');
	if (0 === $el.length) {
		errors.push({ id: $el.attr('id'), msg: 'No gender chosen' });
	}
	else if (_.indexOf(['m', 'w'], $el.val()) === -1) {
		errors.push({ id: $el.attr('id'), msg: 'Invalid gender' });
	}
	next();
}

var isValidDate = function(errors, next) {
	var d = this.filter('*[name$="-day"]').val();
	var m = this.filter('*[name$="-month"]').val();
	var y = this.filter('*[name$="-year"]').val();

	console.log(d, m, y);
	
	next();
}

var options = {
	stopOnError: false,
	callback: function(errors) { $.each(errors, function(k,v) { console.log(v.msg); }); }
};
/*
var validator = FormValidator.create('#whoo', options);
validator.addRule('firstname', /^[\w]{3,}$/)
         .addRule('lastname', [/^[\w]{5,}$/, 'noop'])
         .addRule('email', ['noop', 'isEmail'], { instant: true, instantOnly: true })
         .addRule('gender', isGender)
         .addRule('letter', /[AB]/)
         .addRule('*[name^="date-"]', isValidDate, { instant: true })
         .addRule($('*[name^="birthdate-"]'), isValidDate);
*/
var rules = [
	['firstname', /^[\w]{3,}$/],
	['lastname', [/^[\w]{5,}$/, 'noop']]
]
$('#whoo').validate(rules, options);
