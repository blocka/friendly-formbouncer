
var expect = chai.expect;

describe("FormBouncer", function() {
	var formElm = document.createElement('form');
	var validator = FormBouncer.create(formElm, {});

	describe("construct", function() {
		it("factory method is accessible through static method", function() {
			expect(FormBouncer).itself.to.respondTo('create');
		});
		it("from form-element", function() {
			var validator = FormBouncer.create(document.createElement('form'), {});
		});
		it("from element-id", function() {
			var formElm = $('<form id="fb_from_id"><input type="text"><button>OK</button></form>');
			$(document.body).append(formElm);
			var validator = FormBouncer.create('fb_from_id', {});
		});
		it("from element-id at input-field throws error", function() {
			var formElm = $('<form><input type="text" id="input_selector"><button>OK</button></form>');
			$(document.body).append(formElm);
			var fn = function() {
				var validator = FormBouncer.create('input_selector', {});
			}
			expect(fn).to.throw(Error, /InvalidForm/);
		});
		it("from jQuery", function() {
			var fn = function() {
				FormBouncer.create($('<form></form>'), {});
			}
			expect(fn).not.to.throw(new Error('InvalidForm'));
		});
		it("from jQuery with multiple form-elements", function() {
			var fn = function() {
				FormBouncer.create($('<form></form><form></form>'), {});
			}
			expect(fn).not.to.throw(new Error('InvalidForm'));
		});
		it("from regex throws error", function() {
			var fn = function() {
				FormBouncer.create(/^$/, {})
			}
			expect(fn).to.throw(Error, /InvalidForm/);
		});
	});

	describe("Default validators", function() {
		describe("isNotEmpty validator", function() {
			it("should be pre-registered", function() {
				expect(FormBouncer.validators).to.have.property('isNotEmpty');
			});
			it("should catch empty input fields", function(done) {
				var inputElement = $('<input type="text" value="">');
				var isNotEmpty = FormBouncer.validators.isNotEmpty;
				var errors = []
				expect(isNotEmpty.call(inputElement, errors, function() {
					expect(errors).to.have.length(1);
					expect(errors[0]).to.be.an.instanceof(FormBouncer.error().constructor);
					done();
				}));
			});
			it("should pass on valid data", function(done) {
				var inputElement = $('<input type="text" value="123">');
				var isNotEmpty = FormBouncer.validators.isNotEmpty;
				var errors = []
				expect(isNotEmpty.call(inputElement, errors, function() {
					expect(errors).to.have.length(0);
					done();
				}));
			});
		});
		describe("isEmail validator", function() {
			it("should be pre-registered", function() {
				expect(FormBouncer.validators).to.have.property('isEmail');
			});
			it("should catch empty email", function(done) {
				var inputElement = $('<input type="text" name="email">');
				var isEmail = FormBouncer.validators.isEmail;
				expect(isEmail).to.a('function');
				var errors = []
				expect(isEmail.call(inputElement, errors, function() {
					expect(errors).to.have.length(1);
					expect(errors[0]).to.be.an.instanceof(FormBouncer.error().constructor);
					expect(errors[0].message).to.be.equal('Invalid email.');
					done();
				}));
			});
		});
	});

	describe("Custom validators", function() {
		it("is accessible through static method", function() {
			expect(FormBouncer).itself.to.respondTo('registerValidator');
		});
		it("should be registratable", function() {
			var validator = function(errors, proceed) {
				proceed();
			}
			FormBouncer.registerValidator('customValidator', validator)
			expect(FormBouncer.validators).to.have.property('customValidator');
			expect(FormBouncer.validators.customValidator).to.be.a('function').and.be.equal(validator);
		});
	});

	describe("validation in accordance to stopOnError", function() {
		var formElm = $('<form><input type="text" name="firstname"><input type="text" name="lastname"><button>OK</button></form>').get(0);

		it("should run all validators", function(done) {
			var fb = FormBouncer.create(formElm, {
				stopOnError: false,
				callback: function(errors) {
					expect(errors).to.have.length(2);
					done();
				}
			});
			fb.addRule('firstname', 'isNotEmpty');
			fb.addRule('lastname', 'isNotEmpty');
			fb.validate();
		});

		it("should run until first validator fails (default)", function(done) {
			var fb = FormBouncer.create(formElm, {
				callback: function(errors) {
					expect(errors).to.have.length(1);
					done();
				}
			});
			fb.addRule('firstname', 'isNotEmpty');
			fb.addRule('lastname', 'isNotEmpty');
			fb.validate();
		});
	});

	describe("validation flow", function() {
		it("cleanup should be called before validation run", function(done) {
			var calledCleanup = false;
			var fb = FormBouncer.create(document.createElement('form'), {
				cleanup: function() {
					calledCleanup = true
				},
				callback: function(errors) {
					expect(calledCleanup).to.be.true;
					done();
				}
			});
			fb.validate();
		});

		it("should work", function(done) {
			var formElm = $('<form><input type="text" name="firstname"><input type="text" name="lastname" value="123"><button>OK</button></form>').get(0);
			var inputElement = $(formElm).find('input[name=firstname]').get(0);

			var firstnameValidator = function(errors, proceed) {
				expect(this.get(0)).to.be.an.instanceof(inputElement.constructor);
				expect(errors).to.have.length(0).and.to.be.an.instanceof(Array);
				expect(proceed).to.be.a('function');

				errors.push(FormBouncer.error(this, 'Invalid firstname'));

				proceed();
			}
			FormBouncer.registerValidator('firstnameValidator', firstnameValidator);

			var fb = FormBouncer.create(formElm, {
				stopOnError: false,
				callback: function(errors) {
					expect(errors).to.have.length(1);
					expect(errors[0]).to.have.property('message', 'Invalid firstname');
					done();
				}
			});
			fb.addRule('firstname', 'firstnameValidator');
			fb.addRule('lastname', 'isNotEmpty');
			fb.validate();
		});
	});

	describe("ValidationError", function() {
		it("factory is accessible through static method", function() {
			expect(FormBouncer).itself.to.respondTo('error');
		});

		it("should have a message and target props", function() {
			var errMsg = 'Error message';
			var errElm = document.createElement('input');
			var err = FormBouncer.error(errElm, errMsg);
			expect(err).to.have.property('message', errMsg);
			expect(err).to.have.property('target', errElm);
		});
	});

	describe("Pattern-validator factory", function() {
		it("is accessible through static method", function() {
			expect(FormBouncer).itself.to.respondTo('patternValidator');
		});

		it("should generate validator functions", function() {
			var validator = FormBouncer.patternValidator(/^\w{2,5}$/, 'pattern does not match');
			expect(validator).to.be.an('function');
		});

		it("should throw an error for invalid patterns", function() {
			var fn = function() {
				FormBouncer.patternValidator('', 'pattern does not match');
			}
			expect(fn).to.throw(Error, /InvalidPattern/);
		});
	});
});
