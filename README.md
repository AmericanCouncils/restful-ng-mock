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

## Post-processing

The `route` method returns an object that you can use to further customize the mock's behavior. Use the `addPostProc` method to add a function which accepts the data returned by the route implementation and can return a modified version of that data:

```js
var route = itemsMock.route('GET', '', function() {
  return items;
});
route.addPostProc(data, function(data, request) {
  data.reverse();
  return data;
}
```

This is convenient when you are doing the same or similar transformations in many different places in your mock.

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

The automatic routes themselves are available as attributes under the names `indexRoute`, `showRoute`, etc., which means you can apply post processors. There are some convenience
methods on resourceMock for common post-processing situations:

* `addIndexFilter(fieldName[, filterFunc])`: Allows you to specify a GET argument to filter results by a particular field value. You can optionally specify a filter function, which is given the GET argument value and a data object, and should return true if the object matches the filter specified by the value.
* `addIndexArrayFilter(fieldName[, sep[, filterFunc]])`: A filter that checks against a list of acceptable values. The default separator is a comma.
* `addIndexPagination([skipName, limitName])`: Specify GET arguments used to retrieve a subset of the results. The `skipName` argument slices off results from the beginning of the array, and the `limitName` argument sets a maximum number of results to return; if you don't specify these, they are simply "skip" and "limit" by default.
* `addLabeller(singleLabel, pluralLabel)`: Puts the data returned under a key in a containing object. The `pluralLabel` is used for index results, and the `singleLabel` is used for the results from all other actions. Note that this must be applied after the other index-related filters above.
* `addSingletonPostProcs(func)`: Apply the same post processing function to the show, update, create, and destroy actions.


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
