function Queue() {
	var callbacks_ = [];
	
	this.add = function(fn) {
		callbacks_.push(fn);
	};
	
	this.next = function(errors) {
		if (callbacks_[0]) {
			callbacks_.shift().apply(this, errors);
		}
	};
	
	this.process = function() {
		var e = [];
		this.next(e);
	};
}

var queue = new Queue();
queue.add(function() {
	var queue = this;
	var errors = ['A error'];
	console.log('A');
	setTimeout(function() {
		console.log('AA');
		queue.next(errors);
	}, 2000);
});
queue.add(function() {
	var queue = this;
	var errors = ['B error'];
	console.log('B');
	setTimeout(function() {
		console.log('BB');
		queue.next(errors);
	}, 2000);
});
queue.add(function() {
	var queue = this;
	var errors = ['C error'];
	console.log('C');
	setTimeout(function() {
		console.log('CC');
		queue.next(errors);
	}, 2000);
});
queue.process();