=========================
ButFriendly's Formbouncer
=========================

ButFriendly's Formbouncer is an asynchronous and rule based form validator.

----------
Quickstart
----------

Use it naked::

	var bouncer = FormBouncer.create('#whoo', {
		stopOnError: false,
		callback: function(errors) { 
			$.each(errors, function(k,v) { console.log(v.msg); });
		}
	});

	bouncer.addRule('firstname', /^[\w]{3,}$/)
	       .addRule('lastname', [/^[\w]{5,}$/, 'noop'])
	       .addRule('email', ['noop', 'isEmail'], { instant: true, instantOnly: true })
	       .addRule('gender', isGender)
	       .addRule('letter', /[AB]/)
	       .addRule('*[name^="date-"]', isValidDate, { instant: true })
	       .addRule($('*[name^="birthdate-"]'), isValidDate);
	       
Use it through jQuery::

	var rules = [
		['firstname', /^[\w]{3,}$/],
		['lastname', [/^[\w]{5,}$/, 'noop']]
	]

	$('#whoo').validate(rules, options);

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


-------------------
Register validators
-------------------

It is useful to register often used validators at the Validator::

	FormBouncer.registerValidator('noop', function(errors, proceed) { 
		proceed(); 
	});

Afterwards you are able to make use of it as simple as that::

	bouncer.addRule('firstname', 'noop');

