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

    this.route('GET', '', function(request) {
      var response = this.indexAction(request);
      return this._labelEncap(true, response);
    });

    this.route('GET', '/?', function(request) {
      var response = this.showAction(request);
      return this._labelEncap(false, response);
    });

    this.route('POST', '', function(request) {
      var response = this.createAction(request);
      return this._labelEncap(false, response);
    });

    this.route('PUT', '/?', function(request) {
      var response = this.updateAction(request);
      return this._labelEncap(false, response);
    });

    this.route('DELETE', '/?', function(request) {
      var response = this.deleteAction(request);
      return this._labelEncap(false, response);
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

  ResourceMock.prototype.DEFAULT_OPTIONS = angular.extend(
    {},
    ResourceMock._super.DEFAULT_OPTIONS,
    {
      collectionLabel: false,
      singletonLabel: false,
      skipArgumentName: false,
      limitArgumentName: false
    }
  );

  ResourceMock.prototype._labelEncap = function(plural, data) {
    if (data && !(data instanceof this.HttpError)) {
      var label = null;
      if (plural && this.options.collectionLabel) {
        label = this.options.collectionLabel;
      } else if (!plural && this.options.singletonLabel) {
        label = this.options.singletonLabel;
      }
      if (label) {
        var encapData = data;
        data = {};
        data[label] = encapData;
      }
    }

    return data;
  };

  ResourceMock.prototype.subResourceMock = function(subUrl, subDataSource, options) {
    return new ResourceMock(this._baseUrl + '/?' + subUrl, subDataSource, options);
  };

  // Returns the object used for storing mock resource items
  ResourceMock.prototype.getStorage = function(ids, autoCreate) {
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

    if (storage) {
      var keys = [];
      angular.forEach(storage, function(v, k) {
        if (/^\d+$/.test(k)) {
          k = parseInt(k, 10);
        }
        keys.push(k);
      });
      keys.sort();

      if (this.options['skipArgumentName']) {
        var skip = parseInt(request.url.param(this.options['skipArgumentName']), 10);
        if (skip) {
          keys = keys.slice(skip);
        }
      }

      if (this.options['limitArgumentName']) {
        var lim = parseInt(request.url.param(this.options['limitArgumentName']), 10);
        if (lim) {
          keys = keys.slice(0, lim);
        }
      }

      var a = [];
      angular.forEach(keys, function(k) { a.push(storage[k]); });
      return a;
    }
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
