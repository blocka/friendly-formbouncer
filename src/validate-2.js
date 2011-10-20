var process = function(target, queue, options) {
	options = options || {};
	var errors = [];
	(function next() {
		if (errors.length > 0) {
			options.callback(false, errors);
			return;
		}
		
		if (queue[0]) {
			queue.shift().call(target, errors, next);
		} else {
			options.callback(true, errors);
		}
	})();
};

var formQueue = [];

_.each(_.keys(rules), function(name) {
	console.log('Processing rule for "'+name+'"');

	// Pick up form element
	var $target = $('input[name="'+name+'"]');
	
	if ($target.length === 0) {
		throw 'Form-field "'+ name +'" was not found!';
	}

	var rule = rules[name];

	var isInstant  = 'instant' in rule && rule['instant'] === true;
	var isRequired = 'isRequired' in rule  && rule['isRequired'] === true;
	var isEmail    = 'isEmail' in rule  && rule['isEmail'] === true;

	if (isInstant) {
		console.log(name + ' is instanct');

		var errors = [];
		var itemQueue = _.clone(rule['validators']);

		isRequired && itemQueue.unshift(isNotEmpty);
		isEmail && itemQueue.unshift(isValidEmail);

		$target.blur(function(e) {
			console.log('blur');
			process(e.currentTarget, itemQueue, function(success, errors) { 
				console.log([success, errors]); 
			});
			console.log('end');
		});
	}
	else {
		isRequired && formQueue.unshift(isNotEmpty);
		isEmail && formQueue.unshift(isValidEmail);
		
		_.extend(formQueue, rule['validators']);
	}
});