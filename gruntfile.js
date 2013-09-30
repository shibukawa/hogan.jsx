module.exports = function(grunt) {
  'use strict';
  var pkg = grunt.file.readJSON('package.json');

  grunt.initConfig({
    sampleDir: "samples",
    libDir: "lib",
    testDir: "test",
    docDir: "doc",

    watch: {
      sample: {
        files: ['<%= sampleDir %>/*.jsx', '<%= libDir %>/*.jsx'],
        tasks: ['jsx:build']
      },
      test: {
        files: ['<%= testDir %>/*.jsx', '<%= libDir %>'],
        tasks: ['jsx:test']
      }
    },

    jsx: {
      build: {
        src: ['<%= sampleDir %>/*.jsx'],
        add_search_path: ['<%= libDir %>'],
        dest: '<%= sampleDir %>/',
      },

      test: {
        src: ['<%= testDir %>/*.jsx'],
        add_search_path: ['<%= libDir %>'],
        args: '--test'
      },

      doc: {
        src: ['<%= libDir %>/*.jsx'],
        add_search_path: ['<%= libDir %>'],
        dest: '<%= docDir %>',
        mode: 'doc'
      }
    }
  });

  for (var key in pkg.devDependencies) {
    if (/grunt-/.test(key)) {
      grunt.loadNpmTasks(key);
    }
  }

  grunt.registerTask('default', ['jsx:test']);
  grunt.registerTask('build', ['jsx:build']);
  grunt.registerTask('test', ['jsx:test']);
  grunt.registerTask('doc', ['jsx:doc']);
};
// vim: set expandtab tabstop=2 shiftwidth=2:
