(function($) {
	var process = function(queue, options) {
		options = options || {};
		var $form = this;
		var errors = [];
		var i = 0;
		(function next() {
			if (errors.length > 0) {
				$.isFunction(options.errorCallback)
					? options.errorCallback(errors)
					: options.callback(errors);
				return;
			}
			
			if (i < queue.length) {
				var item    = queue[i++];
				var $target = $(item.selector, $form);
				
				// Call validator
				item.validator.call($target, errors, next);
			} else {
				options.callback();
			}
		})();
	};

	$.fn.validate = function(rules, options) {
		var o = $.extend({
			callback: function(success, errors) { console.log([success, errors]); },
			errorCallback: function(errors) { console.log(errors); }
		}, options || {});

		return $(this).each(function() {
			var $$ = $(this);

			console.log('Attaching to "'+$$.attr('id')+'"');

			var formQueue = [];
			
			_.each(_.keys(rules), function(name) {
				console.log('Processing "'+name+'"');

				var rule = rules[name];

				var isGroup = 'isGroup' in rule && rule['isGroup'] === true;

				// Pick up form element by name or - in case of a group - by prefix
				var selector = '*[name'+ (isGroup ? '^' : '') +'="'+name+'"]';
				var $target = $(selector, $$);
				
				if ($target.length === 0) {
					throw 'Look-up of "'+ name +'" returns no matches';
				}

				var isInstant  = 'instant' in rule && rule['instant'] === true;
				var isRequired = 'isRequired' in rule  && rule['isRequired'] === true;
				var isEmail    = 'isEmail' in rule  && rule['isEmail'] === true;
			
				console.log('isGroup: %s, isInstance: %s, isRequired: %s, isEmail: %s,', isGroup, isInstant, isRequired, isEmail);

				var itemQueue = formQueue;

				// Prepare validators
				_.each(rule['validators'], function(validator) {
					itemQueue.push({ name: name, selector: selector, validator: validator});
				});

				isEmail    && itemQueue.push({ name: name, selector: selector, validator: isValidEmail });
				isRequired && itemQueue.push({ name: name, selector: selector, validator: isNotEmpty });

				if (isInstant) {
					var instantQueue = [];
					
					_.each(rule['validators'], function(validator) {
						instantQueue.push({ name: name, selector: selector, validator: validator});
					});

					isEmail    && instantQueue.push({ name: name, selector: selector, validator: isValidEmail });
					isRequired && instantQueue.push({ name: name, selector: selector, validator: isNotEmpty });

					// Instant validation of groups takes place 
					// when leaving (blur) the last item of it
					if (isGroup) {
						$target = $target.last();
					}

					$target.bind('blur', function(e) {
						// Validate on blurring
						process.call($$, instantQueue, { callback: o.callback, errorCallback: o.errorCallback });
					});
				}
			});
			
			$$.submit(function(e) {
				e.preventDefault();

				process.call($$, formQueue, { callback: o.callback, errorCallback: o.errorCallback });
			});
		});
	};
})(jQuery);

var isValidFirstname = function(errors, next) {
	var $el = $(this);

	if ($el.val().length < 3) {
		errors.push({ name: $(this).attr('name'), msg: 'The firstname needs to be at least 3 chars long.' });
	}

	next();
}

var isValidEmail = function(errors, next) {
	var $el = $(this);
	var pattern = /^([\w\.\-\+\=]+)@((?:[a-z0-9\-_]+\.)+[a-z]{2,6})$/i;

	console.log('- Start checking email');
	setTimeout(function() { 
		if (!pattern.test($el.val())) {
			errors.push({ name: $el.attr('name'), msg: 'invalid email.' });
		}
		console.log('-- finished');
		next();
	}, 2000);
}

var isNoSpamEmail = function(errors, next) {
	setTimeout(function() { 
		next();
	}, 2000);
}

var isValidLetter = function(errors, next) {
	var $el = $(this);

	if (_.indexOf(['B', 'C'], $el.val()) == -1) {
		errors.push({ name: $el.attr('name'), msg: ' invalid letter' });
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

var isNotEmpty = function(errors, next) {
	if ($(this).val().length === 0) {
		errors.push({ name: $(this).attr('name'), msg: 'is empty' });
	}
	next();
}

var isValidGender = function(errors, next) {
	var $el = $(this);
	console.log($el.val());
	if (_.indexOf(['m', 'w'], $el.val()) == -1) {
		errors.push({ name: $el.attr('name'), msg: ' invalid gender' });
	}
	next();
}

// isRequired: not empty, not null
var rules = {
	'gender'   : { isRequired: true,                  instant: false, validators: [ isValidGender ] },
	'firstname': { isRequired: true,                  instant: false, validators: [ isValidFirstname ] },
	'lastname' : { isRequired: true,                  instant: false, validators: [ isValidFirstname ] },
	'email'    : { isRequired: true, isEmail: true,   instant: true,  validators: [ isNoSpamEmail ] },	
	'letter'   : { isRequired: true,                  instant: false,  validators: [ isValidLetter ] },
	'date-'    : { isGroup: true, isRequired: true,   instant: true,  validators: [ isValidDate ] },
	'birthdate-' : { isGroup: true, isRequired: false, instant: false,  validators: [ isValidDate ] },
}

$('#whoo').validate(rules, {
	callback: function() { console.log('FINE'); },
	errorCallback: function(errors) { 
		_.each(errors, function(err) {
			console.log(err.name, err.msg);
		});
//		console.log([success, errors]); 
	}
});
