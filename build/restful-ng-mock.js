/***********************************************
* restful-ng-mock JavaScript Library
* https://github.com/AmericanCouncils/restful-ng-mock/ 
* License: MIT (http://www.opensource.org/licenses/mit-license.php)
* Compiled At: 11/01/2013 14:49
***********************************************/
(function(window) {
'use strict';
angular.module('restfulNgMock', []);

'use strict';

angular.module('restfulNgMock')
.factory('basicMock', [
'$httpBackend',
function($httpBackend) {
  var urlRe = /^(\/[\w\-]+|)(\/[\w\-]+|\/\?)*$/;
  function BasicMock(baseUrl, options) {
    this._baseUrl = baseUrl || '';
    if (!(urlRe.test(this._baseUrl))) {
      throw 'Invalid baseUrl for resourceMock: "' + baseUrl + '".';
    }

    this.options = angular.extend({}, this.DEFAULT_OPTIONS);
    this.setOptions(options || {});
  }

  BasicMock.prototype.constructor = BasicMock;

  // Nested class HttpError
  BasicMock.prototype.HttpError = (function() {
    function HttpError(code, message) {
      this.code = code;
      this.message = message;
    }
    return HttpError;
  })();

  // Nested class HttpRequest
  BasicMock.prototype.HttpRequest = (function() {
    function HttpRequest(pathArgs, method, rawUrl, url, body, headers) {
      this.pathArgs = pathArgs;
      this.method = method;
      this.rawUrl = rawUrl;
      this.url = url;
      this.rawBody = body;
      if (/^application\/json($|;)/.test(headers['Content-Type'])) {
        this.body = JSON.parse(body);
      } else {
        this.body = body;
      }
      this.headers = headers;
    }
    return HttpRequest;
  })();

  // Nested class RouteOptions
  BasicMock.prototype.RouteOptions = (function() {
    function RouteOptions() {
      this.postProcs = [];
    }

    RouteOptions.prototype.addPostProc = function(fn) {
      this.postProcs.push(fn);
      return this;
    };

    return RouteOptions;
  })();

  BasicMock.prototype.DEFAULT_OPTIONS = {
    debug: false,
    httpResponseInfoLabel: false
  };

  BasicMock.prototype._buildResponse = function(data, request) {
    if (angular.isUndefined(data) || data === null) {
      data = new this.HttpError(404, 'Not Found');
    }

    var responseInfo = { code: 200, message: 'OK' };
    if (data instanceof this.HttpError) {
      responseInfo.code = data.code;
      responseInfo.message = data.message;
      if (this.options.httpResponseInfoLabel) {
        data = {};
      } else {
        data = responseInfo;
      }
    }

    // TODO: What if response data is not JSON?

    if (this.options.httpResponseInfoLabel) {
      // TODO: What if the response data is not an object? (e.g. an array)
      data[this.options.httpResponseInfoLabel] = responseInfo;
    }

    var jsonString = JSON.stringify(data);

    if (this.options.debug) {
      var debug = this.options.debug;
      if (typeof debug !== 'function') {
        debug = this._defaultDebug;
      }
      debug(request, responseInfo, JSON.parse(jsonString));
    }

    return [
      responseInfo.code,
      jsonString,
      { 'Content-Type': 'application/json' }
    ];
  };

  BasicMock.prototype._defaultDebug = function(request, responseInfo, responseData) {
    // From http://stackoverflow.com/a/10075654/351149
    var pad = function(n, d) {
      return new Array(Math.max(d - String(n).length + 1, 0)).join(0) + n;
    };

    var d = new Date();
    var dParts = [
      pad(d.getHours(), 2),
      pad(d.getMinutes(), 2),
      pad(d.getSeconds(), 2),
      pad(d.getMilliseconds(), 3)
    ];
    console.log([
      dParts.join(':'),
      '>>> ' + request.method + ' ' + request.rawUrl,
      '<<< ' + responseInfo.code,
      responseData
    ]);
  };

  BasicMock.prototype.route = function(method, url, func) {
    if (!(urlRe.test(url))) {
      throw 'Invalid url for route: "' + url + '".';
    }
    var fullUrl = this._baseUrl + url;
    var urlPattern = fullUrl
      .replace(/\//g, '\\/')
      .replace(/\?/g, '([\\w\\-]+)');
    var re = new RegExp( '^' + urlPattern  + '(?:\\?.*)?$');

    var routeOptions = new this.RouteOptions();

    var me = this;
    $httpBackend.when(method, re).respond(
      function(method, rawUrl, body, headers) {
        var purlUrl = purl(rawUrl, true);
        var params = re.exec(purlUrl.attr('path')).slice(1);
        var request = new me.HttpRequest(
          params, method, rawUrl, purlUrl, body, headers
        );
        var data = func.call(me, request);
        angular.forEach(routeOptions.postProcs, function(f) {
          if (data && !(data instanceof BasicMock.prototype.HttpError)) {
            data = f.call(me, data, request);
          }
        });
        return me._buildResponse(data, request);
      }
    );

    return routeOptions;
  };

  BasicMock.prototype.setOptions = function(opts) {
    var me = this;
    angular.forEach(opts, function(v, k) {
      if (typeof me.DEFAULT_OPTIONS[k] === 'undefined') {
        throw 'Invalid option key ' + k;
      }
      me.options[k] = v;
    });
    return me;
  };

  var BasicMockFactory = function(baseUrl, options) {
    return new BasicMock(baseUrl, options);
  };
  BasicMockFactory.classFn = BasicMock;
  return BasicMockFactory;
}]);

'use strict';

angular.module('restfulNgMock')
.factory('resourceMock', [
'basicMock',
function(basicMock) {
  function ResourceMock(baseUrl, dataSource, options) {
    ResourceMock._super.constructor.call(this, baseUrl, options);

    this.dataSource = dataSource || {};

    this.requiredParams = 0;
    for (var cidx = 0; cidx < baseUrl.length; ++cidx) {
      if (baseUrl.charAt(cidx) === '?') { ++this.requiredParams; }
    }

    this.indexRoute = this.route('GET', '', function(request) {
      return this.indexAction(request);
    });

    this.showRoute = this.route('GET', '/?', function(request) {
      return this.showAction(request);
    });

    this.createRoute = this.route('POST', '', function(request) {
      return this.createAction(request);
    });

    this.updateRoute = this.route('PUT', '/?', function(request) {
      return this.updateAction(request);
    });

    this.deleteRoute = this.route('DELETE', '/?', function(request) {
      return this.deleteAction(request);
    });
  }

  // ResourceMock extends BasicMock
  (function() {
    var BasicMock = basicMock.classFn;
    function SuperCtor() { this.constructor = ResourceMock; }
    SuperCtor.prototype = BasicMock.prototype;
    ResourceMock.prototype = new SuperCtor();
    ResourceMock._super = BasicMock.prototype;
  })();

  // Allow instances of ResourceMock to easily have instance-specific methods
  // which reference their ResourceMock "super".
  ResourceMock.prototype.parent  = ResourceMock.prototype;

  ResourceMock.prototype.subResourceMock = function(subUrl, subDataSource, options) {
    return new ResourceMock(this._baseUrl + '/?' + subUrl, subDataSource, options);
  };

  ResourceMock.prototype.addIndexFilter = function(field, filterFunc) {
    filterFunc = filterFunc || function(arg, obj) {
      return obj[field].toString() === arg.toString();
    };

    this.indexRoute.addPostProc(function(data, request) {
      if (!request.url.param(field)) { return; }

      var newData = [];
      var key;
      for (key in data) {
        if (filterFunc(request.url.param(field), data[key])) {
          newData.push(data[key]);
        }
      }
      return newData;
    });

    return this;
  };

  ResourceMock.prototype.addIndexArrayFilter = function(field, sep, filterFunc) {
    sep = sep || ',';

    filterFunc = filterFunc || function(arg, obj) {
      return obj[field].toString() === arg.toString();
    };

    this.indexRoute.addPostProc(function(data, request) {
      if (!request.url.param(field)) { return; }

      var newData = [];
      var key, v;
      var values = request.url.param(field).split(sep);
      for (key in data) {
        for (v in values) {
          if (filterFunc(values[v], data[key])) {
            newData.push(data[key]);
            break;
          }
        }
      }
      return newData;
    });

    return this;
  };

  ResourceMock.prototype.addIndexPagination = function(skipName, limitName) {
    skipName = skipName || 'skip';
    limitName = limitName || 'limit';

    this.indexRoute.addPostProc(function(data, request) {
      var skip = parseInt(request.url.param(skipName), 10);
      if (skip) {
        data = data.slice(skip);
      }

      var lim = parseInt(request.url.param(limitName), 10);
      if (lim) {
        data = data.slice(0, lim);
      }

      return data;
    });
  };

  ResourceMock.prototype.addSingletonPostProcs = function(p) {
    var singletonRoutes = [
      this.showRoute,
      this.createRoute,
      this.updateRoute,
      this.deleteRoute
    ];
    angular.forEach(singletonRoutes, function(route) {
      route.addPostProc(p);
    });
  };

  ResourceMock.prototype.addLabeller = function(singleLabel, pluralLabel) {
    if (singleLabel) {
      this.addSingletonPostProcs(function(data) {
        var r = {};
        r[singleLabel] = data;
        return r;
      });
    }

    if (pluralLabel) {
    this.indexRoute.addPostProc(function(data) {
        var r = {};
        r[pluralLabel] = data;
        return r;
      });
    }

    return this;
  };

  // Returns the object used for storing mock resource items
  ResourceMock.prototype.getStorage = function(ids, autoCreate) {
    ids = ids || [];
    autoCreate = autoCreate || false;
    var d = this.dataSource;
    for (var i = 0; i < ids.length; ++i) {
      if (d[ids[i]]) {
        d = d[ids[i]];
      } else {
        if (autoCreate) {
          d[ids[i]] = {};
          d = d[ids[i]];
        } else {
          return null;
        }
      }
    }
    return d || null;
  };

  ResourceMock.prototype.indexAction = function(request) {
    var storage = this.getStorage(request.pathArgs);
    if (!storage) { return; }

    var keys = [];
    angular.forEach(storage, function(v, k) {
      if (/^\d+$/.test(k)) {
        k = parseInt(k, 10);
      }
      keys.push(k);
    });
    keys.sort();

    var a = [];
    angular.forEach(keys, function(k) { a.push(storage[k]); });
    return a;
  };

  ResourceMock.prototype.showAction = function(request) {
    return this.getStorage(request.pathArgs);
  };

  ResourceMock.prototype.createAction = function(request) {
    var newItem = request.body;
    newItem.id = Math.round(Math.random()*Math.pow(2, 32));
    this.getStorage(request.pathArgs, true)[newItem.id] = newItem;
    return newItem;
  };

  ResourceMock.prototype.updateAction = function(request) {
    var newItem = request.body;
    var storage = this.getStorage(request.pathArgs.slice(0, -1));
    var itemId = request.pathArgs[request.pathArgs.length-1];
    if (storage && storage[itemId]) {
      newItem.id = storage[itemId].id;
      storage[itemId] = newItem;
      return newItem;
    }
  };

  ResourceMock.prototype.deleteAction = function(request) {
    var storage = this.getStorage(request.pathArgs.slice(0, -1));
    var itemId = request.pathArgs[request.pathArgs.length-1];
    if (storage && storage[itemId]) {
      var item = storage[itemId];
      delete storage[itemId];
      return item;
    }
  };

  var ResourceMockFactory = function(baseUrl, dataSource) {
    return new ResourceMock(baseUrl, dataSource);
  };
  ResourceMockFactory.classFn = ResourceMock;
  return ResourceMockFactory;
}]);

}(window));