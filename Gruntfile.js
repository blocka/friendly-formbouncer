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
					cleanTargetDir: true,
					cleanBowerDir: true
				}
			}
		},

		karma: {
			options: {
				configFile: 'karma.conf.js'
			},
			continuous: {
				singleRun: true
			},
			dev: {
				background: true
			}
		},

		// Remove build and dist directory
		clean: ['build', 'dist'],

		watch: {
			scripts: {
				files: [ 'src/**/*.js', 'examples/*.html' ],
				tasks: ['uglify']
			},
			tests: {
				files: [ 'tests/**/*.js', 'tests/*.html' ],
				tasks: ['karma']
			},
			options: {
				spawn: false
			}
		},

		jshint: {
			all: [
				'Gruntfile.js',
				'karma.conf.js',
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
					'dist/jquery.formbouncer.min.js': ['src/formbouncer.js', 'src/jquery.formbouncer.js']
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

	grunt.registerTask('test', ['karma']);

	grunt.registerTask('dist', ['jshint', 'clean', 'uglify']);

	grunt.registerTask('dev', ['test', 'dist', 'connect:dev', 'watch']);

	grunt.registerTask('default', ['dev']);

};
