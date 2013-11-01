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
