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
  var itemsMock = basicMock('/items');
  
  // This handles requests to '/items'
  itemsMock.route('GET', '', function() {
    return items;
  });
  
  // A question mark allows an arbitrary argument
  // So, this handles requests to '/items/<n>' for any single value <n>
  itemsMock.route('GET', '/?', function(request) {
    var id =  request.pathArgs[0];
    // Null and undefined values will automatically be transformed to 404 responses
    return items[id]; 
  });
  
  // This handles POST requests to '/items/<n>/form_voltron'
  itemsMock.route('POST', '/?/form_voltron', function(request) {
    // request.url is a purl url object, see https://github.com/allmarkedup/purl
    // Here we require that the URL was like /items/123/form_voltron?password=abc123
    if (request.url.param('password') == 'abc123') {
      // If the request had a JSON body, then it is automatically parsed and
      // made available in request.body
      if (request.body.pilot) {
        return { result: "I'll form the head!", pilot: request.body.pilot };
      } else {
        return { result: "I guess John will form the head.", pilot: "John" };
      }
    } else {
      // Return HttpError for non-200 responses
      return new this.HttpError(400, "You're not a member of the Voltron team!");
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
  var peopleMock = resourceMock('/people', people);
}]);
```

This automatically provides all the usual CRUD methods:

* Get a list of people at `GET /people`. Indexes are returned as arrays rather than objects, even though the internal data store is an object.
* Create new people with `POST /people`. They are automatically assigned a new random numeric id.
* Retrieve an individual person with id 2 at `GET /people/2`.
* Update them with a new object at `PUT /people/2`.
* Delete them with `DELETE /people/2`.

You can override the default implementations of these by setting new methods (respectively, `indexAction`, `createAction`, `showAction`, `updateAction`, and `deleteAction`) on the mock object. The default method is available to these through the `parent` object:

```js
// Let's anonymize the first person returned by every index request
peopleMock.indexAction = function(request) {
  var people = this.parent.indexAction.call(this, request);
  if (people.length > 0) {
    people[0].name = "John Doe";
  }
  return people;
}
```

The resource mock also supports all the same methods as `basicMock`, which is convenient for adding RPC-ish stuff and other not-strictly-RESTful methods:

```js
peopleMock.route('POST', '/?/jump', function(request) {
  return { result: "I jumped! Now what?" };
});
```

## Options

There are various options you can enable on both types of mock. These can be set with an additional argument to the constructor, or by calling the `setOptions` method:

```js
var oneMock = basicMock('/foo', { debug: true });
var twoMock = resourceMock('/bar', stuff);
twoMock.setOptions({ httpResponseInfoLabel: 'response' });
```

These options are available for both `basicMock` and `resourceMock`:

* `debug`: If set to `true`, then all HTTP responses will be logged with console.log. Alternately, you can provide a function here, and it will be called with the request object, the response info object, and the response data.
* `httpResponseInfoLabel`: If set to a string, then HTTP response info will be embedded in all JSON responses under this key. The response info object includes the HTTP code and a status message.

These options are only for `resourceMock`:

* `collectionLabel`: A string key, under which responses from `indexAction` will be wrapped. For example, if you set this to `items`, then the response from index requests will be a JSON object like `{ items: [....] }`.
* `singletonLabel`: Similar to `collectionLabel`, but for the create, update, show, and delete actions.
* `skipArgumentName`: The name of a GET query parameter that is used to skip ahead in the results returned by `indexAction`. Usually used with:
* `limitArgumentName`: The name of a GET query parameter that sets a maximum number of results to be returned by `indexAction`. Together with `skipArgumentName`, this allows you to support a common style of paginated results. Note that both of these are implemented by the default `indexAction`; if you provide a custom `indexAction` and do not implement it in terms of the default one, then these options have no impact.
