
module.exports = function(grunt){
	grunt.initConfig({
		uglify: {
			my_target: {
				files: {
					'dist/wcomponent.min.js': [
						'libs/document-register-element.js',
						'Object.observe.poly.js',
						'src/wcomponent.js'
					]
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
}