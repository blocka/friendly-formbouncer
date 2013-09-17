=========================
ButFriendly's Formbouncer
=========================

ButFriendly's Formbouncer is a nifty, lightweight, rule based form validator, which also 
supports asynchronous and remote validation of form-fields. The validator is less than 
2.5k minified which is nearly less than fresh air. It's simplicity makes it integratable
within minutes.

----------
Quickstart
----------

Attach the formbouncer to the form `#my-form`. All fields are identified
by their `name`-attributes within the given form.

::

	var bouncer = FormBouncer.create('#my-form', {
		// Validate the complete from, even when a validation failed
		stopOnError: false,

		// The callback gets called after the validation completes
		callback: function(errors) { 
			$.each(errors, function(k,error) { console.log(error.msg); });
		}
	});

	// Attach s imple regex valiadator to firstname's field
	bouncer.addRule('firstname', /^[\w]{3,}$/);

You may also want to use it through jQuery::

	var rules = [
		['firstname', /^[\w]{3,}$/],
		['lastname', [/^[\w]{5,}$/, 'noop']]
	]

	$('#whoo').validate(rules, options);

--------
Examples
--------

You can apply a single or multiple validators calling `addRule` for the appropriate form-field.

Add a simple regex validator to firstname's field::

	bouncer.addRule('firstname', /^[\w]{3,}$/);

Add two validator to lastname's field. One regex validator and the 'noop' validator::

	bouncer.addRule('lastname', [/^[\w]{5,}$/, 'noop'])

We add the `noop` and `isEmail` validator to the email's field. The field should instantly - on blur - be validated, but only instantly::

	bouncer.addRule('email', ['noop', 'isEmail'], { 
		instant: true, 
		instantOnly: true
	});

We add a customer `isGender` validator to gender's field::

	bouncer.addRule('gender', isGender);

A simple regex validator::

	bouncer.addRule('letter', /[AB]/);

We validate a group of fields, which represents day, month and year of a date::

	bouncer.addRule($('*[name^="birthdate-"]'), isValidDate);

Again a group of fields, but this time it should be instantly validated::

	bouncer.addRule('*[name^="date-"]', isValidDate, { 
		instant: true
	});


-----------------
Behind the scenes
-----------------

Rules
=====

A rule consists of

- a target
- a validator or a set of validators
- and options
 
Target
------

A target defines the field(s) of the form to validate. It can be 
the name of a form-field, a valid jQuery selector expression or an 
jQuery object.

Validator
---------

A validator validates a single aspect of a form field. It can be 
a name of a registered validator, a function or an array of names 
and/or functions.

Options
-------

You know that options thing, don't you?

Validators
==========

Custom validators
-----------------

A validator is function which gets two params::

	function(/* array */ errors, /* function */ proceed) {
		proceed(); 
	}

A simple implementation of a validator would look like that::

	function(errors, proceed) {
		if (this.val().length > 10) {
			errors.push(FormBouncer.error(this, 'Too long'));
		}
		proceed(); 
	}

Asynchronous/remote validation
------------------------------

::

	var asyncValidator = function(errors, proceed) {
		var self = this;
		$.getJSON('remote.json', function(data) {
			// Do sth. useful with your data
			if (this.val().length > 3) {
				errors.push(FormBouncer.error(self, 'Too long'));
			}
			proceed();
		});
	}

Re-use of validators
--------------------

It is useful to register often used validators at the Validator::

	FormBouncer.registerValidator('noop', function(errors, proceed) { 
		proceed(); 
	});

Afterwards you are able to make use of it as simple as that::

	bouncer.addRule('firstname', 'noop');
