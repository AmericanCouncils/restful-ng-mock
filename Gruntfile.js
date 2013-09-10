'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        srcFiles: [
            'src/namespace.js',
            'src/services/*.js',
        ],
        karma: {
            unit: {
              options: {
                configFile: 'test/karma.conf.js'
              }
            }
        },
        jshint: {
          options: {
            jshintrc: '.jshintrc'
          },
          all: [
            'Gruntfile.js',
            '<%= srcFiles %>'
          ]
        },
        concat: {
            options: {
                banner: '/***********************************************\n' +
                    '* restful-ng-mock JavaScript Library\n' +
                    '* https://github.com/AmericanCouncils/restful-ng-mock/ \n' +
                    '* License: MIT (http://www.opensource.org/licenses/mit-license.php)\n' +
                    '* Compiled At: <%= grunt.template.today("mm/dd/yyyy HH:MM") %>\n' +
                    '***********************************************/\n' +
                    '(function(window) {\n' +
                    '\'use strict\';\n',
                footer: '\n}(window));'
            },
            prod: {
                options: {
                    stripBanners: {
                        block: true,
                        line: true
                    }
                },
                src: ['<%= srcFiles %>'],
                dest: 'build/<%= pkg.name %>.js'
            },
            debug: {
                src: ['<%= srcFiles %>'],
                dest: 'build/<%= pkg.name %>.debug.js'
            }
        },
        uglify: {
            build: {
                src: 'build/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('test', ['jshint', 'concat:debug', 'karma']);
    grunt.registerTask('debug', ['concat:debug']);
    grunt.registerTask('prod', ['concat:prod', 'uglify']);
    grunt.registerTask('default', ['test', 'prod']);
};
