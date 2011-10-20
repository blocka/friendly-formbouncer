var queue = [];
queue.push(function(errors, next) {
	console.log('A');
	var t = this;
	setTimeout(function() { console.log('AA'); next(); }, 2000);
});
queue.push(function(errors, next) {
	console.log('B');
	var t = this;
	errors.push('FUCK');
	setTimeout(function() { console.log('BB'); next(); }, 2000);
});
queue.push(function(errors, next) {
	console.log('C');
	var t = this;
	setTimeout(function() { console.log('CC'); next(); }, 2000);
});

var process = function(target, queue, callback) {
	var errors = [];
	(function next() {
		if (errors.length > 0) {
			callback(false, errors);
			return;
		}
		
		if (queue[0]) {
			queue.shift().call(target, errors, next);
		} else {
			callback(true, errors);
		}
	})();
};

var target = $('input[name="email"]').get(0);
process(target, queue, function(success, errors) { console.log(errors); });
