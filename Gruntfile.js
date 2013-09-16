module.exports = function(grunt) {

	// Load Grunt tasks declared in the package.json file
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	grunt.initConfig({
		// Metadata
		pkg: grunt.file.readJSON('package.json'),

		// Install dependencies
		bower: {
			install: {
				options: {
					targetDir: './examples/lib',
					cleanTargetDir: true,
					cleanBowerDir: true
				}
			}
		},

		// Remove build and dist directory
		clean: ['build', 'dist'],

		watch: {
			scripts: {
				files: [ 'src/**/*.js', 'examples/*.html' ],
				tasks: ['uglify']
			},
			options: {
				spawn: false
			}
		},

		jshint: {
			all: [
				'Gruntfile.js',
				'src/*.js',
			],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		uglify: {
			dist: {
				files: {
					'dist/formbouncer.min.js': ['src/formbouncer.js'],
					'dist/jquery.formbouncer.min.js': ['src/jquery.formbouncer.js']
				}
			}
		},

		connect: {
			options: {
				port: 9011,
				hostname: "0.0.0.0",
				base: './'
			},
			dev: {
				options: {
					middleware: function (connect, options) {
						return [
							require('connect-livereload')(),

							// Redirect all non-root requests to index.html
							rewriteMiddleware(options.base, '/examples/index.html'), 

							// Serve statics
							connect.static(options.base),

							// Directory listing
							connect.directory(options.base)
						];
					}
				}
			}
		}

	});

	var rewriteMiddleware = (function() {
		var fs = require('fs'),
			url = require('url');

		return function (rootDir, indexFile) {
			indexFile = indexFile || "index.html";

			return function(req, res, next){
				var path = url.parse(req.url).pathname;
				/*jshint unused:true */
				fs.readFile(rootDir + path, function(err, buf) {
					if (!err) {
						// Continue when the path exists
						return next();
					}

					// Deliver indexFile
					fs.readFile(rootDir + '/' + indexFile, function (error, buffer) {
						if (error) {
							return next(error);
						}

						var resp = {
							headers: {
								'Content-Type': 'text/html',
								'Content-Length': buffer.length
							},
							body: buffer
						};
						res.writeHead(200, resp.headers);
						res.end(resp.body);
					});
				});
				/*jshint unused:false */
			};
		};
	})();

	grunt.registerTask('test', 'nodeunit');

	grunt.registerTask('dist', ['jshint', 'clean', 'uglify']);

	grunt.registerTask('default', ['dist', 'connect', 'watch']);

};
