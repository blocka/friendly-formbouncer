(function($) {
	var process = function(queue, options) {
		var $form = this;
		console.log('--');
		options = options || {};
		var errors = [];
		var i = 0;
		(function next() {
			if (errors.length > 0) {
				$.isFunction(options.errorCallback)
					? options.errorCallback(errors)
					: options.callback(errors);
				return;
			}
			
			console.log('QL: %d', i);

//			if (queue[0]) {
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
//				_.extend(itemQueue, rule['validators']);

//				isEmail && itemQueue.unshift(isValidEmail);
//				isRequired && itemQueue.unshift(isNotEmpty);
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

					$target.blur(function(e) {
						console.log('Instant validate');
						// Validate on blurring
						process.call($$, instantQueue, { callback: o.callback, errorCallback: o.errorCallback });
					});
				}
			});
			
			$$.submit(function(e) {
				e.preventDefault();

				// @todo We need a single submit stack, otherwise the queue doesn't work as expected and callbacks
				// get triggered after each form-field

				process.call($$, formQueue, { callback: o.callback, errorCallback: o.errorCallback });
//				$.each(formQueue, function(selector, itemQueue) {
//					$(selector, $$).each(function(i, el) {
//						process(el, itemQueue, { callback: o.callback, errorCallback: o.errorCallback });
//					});
//				});
			});
			console.log(formQueue);
		});
	};
})(jQuery);

var isValidFirstname = function(errors, next) {
	console.log($(this).attr('id')+' isValidFirstname');
	var value = $(this).val();
	if (value.length < 3) {
		errors.push({ name: $(this).attr('name'), msg: 'The firstname needs to be at least 3 chars long.' });
	}
	next();
}

var isValidEmail = function(errors, next) {
	console.log($(this).attr('id')+' isValidEmail');
	var $el = $(this);
	var email = $el.val();
	var pattern = /^([\w\.\-\+\=]+)@((?:[a-z0-9\-_]+\.)+[a-z]{2,6})$/i;
	setTimeout(function() { 
		if (!pattern.test(email)) {
			errors.push({ name: $el.attr('name'), msg: 'invalid email.' });
		}
		next();
	}, 2000);
}

var isNoSpamEmail = function(errors, next) {
	console.log($(this).attr('id')+' isNoSpamEmail');
	setTimeout(function() { 
		next();
	}, 2000);
}

var isValidLetter = function(errors, next) {
	console.log($(this).attr('id')+' isValidLetter');
	var $el = $(this);
	var v = $el.val();

	setTimeout(function() { 
		if (_.indexOf(['B', 'C'], v) == -1) {
			errors.push({ name: $el.attr('name'), msg: ' invalid letter' });
		}
		next();
	}, 2000);
}

var isValidDate = function(errors, next) {
//	var value = $(this).val();
	
	setTimeout(function() { 
		next();
	}, 2000);
}

var isNotEmpty = function(errors, next) {
	console.log($(this).attr('id')+' isNotEmpty');
	if ($(this).val().length === 0) {
		errors.push({ name: $(this).attr('name'), msg: 'is empty' });
	}
	next();
}

// isRequired: not empty, not null
var rules = {
	'firstname': { isRequired: true,                  instant: false, validators: [ isValidFirstname ] },
	'lastname' : { isRequired: true,                  instant: false, validators: [ isValidFirstname ] },
	'email'    : { isRequired: true, isEmail: true,   instant: true,  validators: [ isNoSpamEmail ] },	
	'letter'   : { isRequired: true,                  instant: false,  validators: [ isValidLetter ] },
	'date-'    : { isGroup: true, isRequired: true,   instant: false,  validators: [ isValidDate ] },
	'birthdate-' : { isGroup: true, isRequired: true, instant: false,  validators: [ isValidDate ] },
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
