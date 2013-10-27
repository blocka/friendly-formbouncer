(function(name, context, definition) {
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = definition();
	}
	else if (typeof define === 'function' && define.amd) {
		define(definition);
	}
	else {
		context[name] = definition();
	}
}('FormBouncer', this, function() {
	'use strict';

	var ValidationError = function(target, message) {
		this.target = target;
		this.message = message;

		this.toString = function() {
			return message;
		};
	};

	var Rule = function($target, validator, options) {
		this.target = $target;
		this.validator = validator;
		this.options = options;
	};

	// Default options
	var defaults = {
		stopOnError: true,
		instantAll: true
	};

	var Validator = function(form, options) {
		var o = $.extend({}, defaults, options || {});

		var $form_;
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
		var processQueue = function(queue) {
			// var $form = this;
			var errors = [];
			var i = 0;
			var l =  queue.length;
			(function next() {
				if (o.stopOnError && errors.length > 0) {
					if ($.isFunction(o.errorCallback)) {
						o.errorCallback(errors);
					}
					else {
						o.callback(errors);
					}
					return;
				}

				if (i < l) {
					var rule = queue[i++];
					rule.validator.call(rule.target, errors, next); // Call validator
				} else {
					o.callback(errors);
				}
			})();
		};

		/**
		 * Resolves the target of a rule.
		 */
		var resolveTarget = function(target) {
			var type = $.type(target)
			  , selector = '';

			if (type === 'string') { // selector or name
				if (/^[\w\d\-_]+$/.test(target)) { // It's a name (only letters and numerics)
					selector = '[name="'+target+'"]';
				}
				else { // It's a selector (fancy other stuff than letters)
					selector = target;
				}
				target = $(selector, $form_);
			}
			else {
				target = $(target);
			}


			if(target instanceof jQuery) {
				if (target.length === 0) {
					throw new Error('TargetNotFound: '+selector);
				}
				else if (target.length === 1) {
					// single item
				}
				else if (target.length > 1) {
					// is group
				}
			}
			else {
				throw new Error('InvalidTarget');
			}

			return target;
		};

		/**
		 * Resolves form.
		 */
		var resolveForm = function(form) {
			if ('string' === $.type(form)) {
				form = $(form);
			}

			if(form instanceof jQuery) {
				form = form.filter('form').get(0);
			}

			if ((form instanceof Element) && 'form' === form.tagName.toLowerCase()) {
				return $(form);
			}

			throw new Error('InvalidForm');
		};


		/**
		 * Resolves validator definitions.
		 */
		var resolveValidator = function(validator) {
			var validators = [];

			var type = $.type(validator);

			if ('regexp' === type) {
				validators.push(function(errors, proceed) {
					if (!validator.test(this.val())) {
						errors.push(Validator.error(this, 'The pattern '+validator.toString()+' does not match.'));
					}
					proceed();
				});
			}
			else if ('string' === type) { // Use of predefined validator
				if (!(validator in Validator.validators)) {
					throw new Error('ValidatorNotFound');
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
				throw new Error('InvalidValidator');
			}

			return validators;
		};

		/* Adds a fresh rule to the validator 
		 * target - 
		 * validator - 
		 * options - 
		 *      - instant - Validates the target instantly
		 *      - instantOnly - Validates the target inly instant
		 **/
		this.addRule = function(target, validator, options) {
			options = options || {};

			var $targets   = resolveTarget(target);
			var validators = resolveValidator(validator);

			var isInstant     = o.instantAll || ('instant' in options && true === options['instant']);
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
				($targets.length > 1 ? $targets.last() : $targets).bind('blur', function() {
					processQueue.call($form_, instantQueue, o);
				});
			}

			return this;
		};

		this.validate = function() {
			// Should we clean up?
			if ($.isFunction(o.cleanup)) {
				o.cleanup.call($form_);
			}
			processQueue.call($form_, queue_);
		};

		$form_ = resolveForm(form);

		$form_.bind('submit', $.proxy(function(e) {
			e.preventDefault();
			this.validate();
		}, this));
	};

	/* Predefined and re-usable validators */
	Validator.validators = {};

	Validator.create = function(form, options) {
		options = options || {};
		var validator = new Validator(form, options);
		return validator;
	};

	Validator.registerValidator = function(id, fn) {
		Validator.validators[id] = fn;
	};

	Validator.error = function(target, message) {
		return new ValidationError(target, message);
	};

	Validator.patternValidator = function(pattern, message) {
		if (!(pattern instanceof RegExp)) {
			throw new Error('InvalidPattern');
		}
		return function(errors, proceed) {
			if (!pattern.test(this.val())) {
				errors.push(Validator.error(this, message));
			}
			proceed();
		};
	};

	// Register pre-defined isEmail-validator
	(function() {
		var pattern = /^([\w\.\-\+\=]+)@((?:[a-z0-9\-_]+\.)+[a-z]{2,6})$/i;
		var isEmailValidator = Validator.patternValidator(pattern, 'Invalid email.');
		Validator.registerValidator('isEmail', isEmailValidator);
	})();

	// Register pre-defined isNotEmpty-validator
	Validator.registerValidator('isNotEmpty', function(errors, proceed) {
		this.each(function() {
			var $$ = $(this);
			if (_.isEmpty($$.val())) {
				errors.push(Validator.error($$, 'is empty.'));
			}
		});
		proceed();
	});

	// Register pre-defined noop-validator
	Validator.registerValidator('noop', function(errors, proceed) {
		proceed();
	});

	return Validator;
}));