# restful-ng-mock

[![Build Status](https://travis-ci.org/AmericanCouncils/restful-ng-mock.png?branch=master)](https://travis-ci.org/AmericanCouncils/restful-ng-mock)

When you're writing an Angular app for those APIs, you will often want to create a client-side mock that simulates the server. This is typically done with [`$httpBackend`](http://docs.angularjs.org/api/ngMock.$httpBackend), but manually adding all your web methods with that module's low-level interface can be tedious and error-prone. `restful-ng-mock` is a frontend to `$httpBackend` that handles a lot of the most common stuff for you, such as converting responses to JSON and providing sensible default implementations of the standard CRUD methods.

## Installation

After you've downloaded the restful-ng-mock component with bower, add the
usual lines in app.js (to `restfulNgMock`) and index.html (to
`components/restful-ng-mock/build/restful-ng-mock.js`).

## Basic mocks

Create a mock object for each major resource on your server under a given
URL prefix. For example, suppose you have some URLs available under `/items`:

```js
angular.module('myApp').factory('mockItems', [
'basicMock', // This service is from restful-ng-mock
function(basicMock) {
  var items = {
    1: { id: 1, name: 'Foo'},
    2: { id: 2, name: 'Bar'}
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

## Resource mocks

Often, a server may be implementing a database-like service with the usual CRUD actions. There is a convenience service `resourceMock` that makes this easier:

```js
angular.module('myApp').factory('mockPeople', [
'resourceMock', // This service is from restful-ng-mock
function(resourceMock) {
  var people = {
    1: { id: 1, name: 'Alice'},
    2: { id: 2, name: 'Bob'}
  };
  var mock = resourceMock('/people', people);
}]);
```

This automatically provides all the usual CRUD methods:

* Get a list of people at `GET /people`. Indexes are returned as arrays rather than objects, even though the internal data store is an object.
* Create new people with `POST /people`. They are automatically assigned a new random numeric id.
* Retrieve an individual person with id 2 at `GET /people/2`.
* Update them with a new object at `PUT /people/2`.
* Delete them with `DELETE /people/2`.

The resource mock also supports all the same `basicMock` methods, which is convenient for RPC-ish stuff:

```js
mock.route('POST', '/?/jump', function(request) {
  return { result: "I jumped! Now what?" };
});
```
