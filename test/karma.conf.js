files = [
    JASMINE,
    JASMINE_ADAPTER,
    '../bower_components/lodash/dist/lodash.js',
    '../bower_components/angular/angular.js',
    '../bower_components/angular-mocks/angular-mocks.js',
    '../bower_components/purl/purl.js',
    '../build/restful-ng-mock.debug.js',
    'shared.js',
    'unit/*Spec.js'
];

// // level of logging
// // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;

// // enable / disable colors in the output (reporters and logs)
colors = true;

// // Start these browsers, currently available:
// // - Chrome
// // - ChromeCanary
// // - Firefox
// // - Opera
// // - Safari
// // - PhantomJS
browsers = ['PhantomJS'];

// // Continuous Integration mode
// // if true, it capture browsers, run tests and exit
singleRun = true;
