# restful-ng-mock

[![Build Status](https://travis-ci.org/AmericanCouncils/restful-ng-mock.png?branch=master)](https://travis-ci.org/AmericanCouncils/restful-ng-mock)

When you're writing an Angular app for those APIs, you will often want to create a client-side mock that simulates the server. This is typically done with [`$httpBackend`](http://docs.angularjs.org/api/ngMock.$httpBackend), but manually adding all your web methods with that module's low-level interface can be tedious and error-prone. `restful-ng-mock` is a frontend to `$httpBackend` that handles a lot of the most common stuff for you, such as converting responses to JSON and providing sensible default implementations of the standard CRUD methods.0

## Installation

After you've downloaded the restful-ng-mock component with bower, add the
usual lines in app.js (to `restfulNgMock`) and index.html (to
`components/restful-ng-mock/build/restful-ng-mock.js`).

## Basic mocks

```js
angular.module('myApp').factory('mockItems', [
'basicMock', // This service is from restful-ng-mock
function(basicMock) {
  var items = {
    1: { name: 'Foo'},
    2: { name: 'Bar'}
  };
  var mock = basicMock('/items');
  
  // This handles requests to '/items'
  mock.route('GET', '', function() {
    return items;
  });
  
  // A question mark allows an arbitrary argument
  // So, this handles requests to '/items/<n>' for any single value <n>
  mock.route('GET', '/?', function(request) {
    var id =  request.pathArgs[0];
    return items[id]; // Null and undefined values will automatically be transformed to 404 responses
  });
  
  // This handles POST requests to '/items/<n>/form_voltron'
  mock.route('POST', '/?/form_voltron', function(request) {
    // request.url is a purl url object, see https://github.com/allmarkedup/purl
    if (request.url.param('password') == 'abc123') {
      // Require that the URL was something like /items/123/form_voltron?password=abc123
      return { result: "I'll form the head!", content: JSON.parse(request.body) };
    } else {
      // Return HttpError for non-200 responses
      return new this.HttpError(400, "You're not Voltron!");
    }
  });
}]);
```
