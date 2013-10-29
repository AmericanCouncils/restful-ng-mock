'use strict';

angular.module('restfulNgMock')
.factory('resourceMock', [
'$httpBackend',
function($httpBackend) {
  var HttpError = function(code, message) {
    this.code = code;
    this.message = message;
  };

  var DEFAULT_OPTIONS = {
    collectionLabel: false,
    singletonLabel: false,
    httpResponseInfoLabel: false,
    skipArgumentName: false,
    limitArgumentName: false,
    debug: false
  };

  var ResourceMock = function (baseUrl, dataSource, options) {
    this.baseUrl = baseUrl;
    this.dataSource = dataSource || {};

    this.options = angular.extend({}, DEFAULT_OPTIONS);
    this.setOptions(options || {});

    var requiredParams = 0;
    for (var cidx = 0; cidx < baseUrl.length; ++cidx) {
      if (baseUrl.charAt(cidx) === '?') { ++requiredParams; }
    }

    var urlPattern = baseUrl
      .replace('/', '\\/', 'g')
      .replace('?', '([\\w\\-]+)');
    var baseUrlRe = new RegExp( '^' + urlPattern  + '(?:/([\\w\\-]+))?(?:\\?.*)?$');

    var me = this;

    var defaultDebug = function(method, url, body, headers, code, resp) {
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
        '>>> ' + method + ' ' + url,
        '<<< ' + code,
        resp
      ]);
    };

    var buildResponse = function(data) {
      if (angular.isUndefined(data)) {
        data = new HttpError(404, 'Not Found');
      }

      var responseInfo = { code: 200, message: 'OK' };
      if (data instanceof HttpError) {
        responseInfo.code = data.code;
        responseInfo.message = data.message;
        if (me.options.httpResponseInfoLabel) {
          data = {};
        } else {
          data = responseInfo;
        }
      }

      if (me.options.httpResponseInfoLabel) {
        data[me.options.httpResponseInfoLabel] = responseInfo;
      }

      return [
        responseInfo.code,
        JSON.stringify(data),
        { 'Content-Type': 'application/json' }
      ];
    };

    var handle = function(method, rawUrl, body, headers, handlers) {
      var url = purl(rawUrl, true);
      var matches = baseUrlRe.exec(url.attr('path')).slice(1);
      var itemIds = [];
      for (var i = 0; i < matches.length; ++i) {
        if (typeof matches[i] !== 'null' && typeof matches[i] !== 'undefined') {
          itemIds.push(matches[i]);
        }
      }

      var data;
      var plural = false;
      if (handlers.atRoot && itemIds.length === requiredParams) {
        plural = (method === 'GET');
        data =
          handlers.atRoot.call(me, itemIds, url, body, headers);
      } else if (handlers.atItem && itemIds.length > requiredParams) {
        var superIds = itemIds.slice(0, -1);
        var itemId = itemIds[itemIds.length-1];
        data =
          handlers.atItem.call(me, superIds, itemId, url, body, headers);
      } else {
        // This action isn't handled
        data = new HttpError(400, 'Bad Request');
      }

      if (data && !(data instanceof HttpError)) {
        var label = null;
        if (plural && me.options.collectionLabel) {
          label = me.options.collectionLabel;
        } else if (!plural && me.options.singletonLabel) {
          label = me.options.singletonLabel;
        }
        if (label) {
          var encapData = data;
          data = {};
          data[label] = encapData;
        }
      }

      var response = buildResponse(data);
      if (me.options.debug) {
        var debug = me.options.debug;
        if (typeof debug !== 'function') {
          debug = defaultDebug;
        }
        debug(method, rawUrl, body, headers, response[0], JSON.parse(response[1]));
      }
      return response;
    };

    $httpBackend.whenGET(new RegExp(baseUrlRe))
    .respond(function(method, rawUrl, body, headers) {
      return handle(method, rawUrl, body, headers, {
        atRoot: me.indexAction,
        atItem: me.showAction
      });
    });

    $httpBackend.whenPOST(new RegExp(baseUrlRe))
    .respond(function(method, rawUrl, body, headers) {
      return handle(method, rawUrl, body, headers, {
        atRoot: me.createAction
      });
    });

    $httpBackend.whenPUT(new RegExp(baseUrlRe))
    .respond(function(method, rawUrl, body, headers) {
      return handle(method, rawUrl, body, headers, {
        atItem: me.updateAction
      });
    });

    $httpBackend.whenDELETE(new RegExp(baseUrlRe))
    .respond(function(method, rawUrl, body, headers) {
      return handle(method, rawUrl, body, headers, {
        atItem: me.deleteAction
      });
    });
  };

  ResourceMock.prototype = {
    subResourceMock: function(subUrl, subDataSource) {
      return new ResourceMock(this.baseUrl + '/?' + subUrl, subDataSource);
    },

    // Returns the object used for storing mock resource items
    getStorage: function(ids, autoCreate) {
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
    },

    setOptions: function(opts) {
      var me = this;
      angular.forEach(opts, function(v, k) {
        if (typeof DEFAULT_OPTIONS[k] === 'undefined') {
          throw 'Invalid option key ' + k;
        }
        me.options[k] = v;
      });
      return me;
    },

    indexAction: function(ids, url) {
      var storage = this.getStorage(ids);

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
          var skip = parseInt(url.param(this.options['skipArgumentName']), 10);
          if (skip) {
            keys = keys.slice(skip);
          }
        }

        if (this.options['limitArgumentName']) {
          var lim = parseInt(url.param(this.options['limitArgumentName']), 10);
          if (lim) {
            keys = keys.slice(0, lim);
          }
        }

        var a = [];
        angular.forEach(keys, function(k) { a.push(storage[k]); });
        return a;
      }
    },

    showAction: function(superIds, itemId) {
      var storage = this.getStorage(superIds);
      if (storage && storage[itemId]) { return storage[itemId]; }
    },

    createAction: function(ids, url, body) {
      var newItem = JSON.parse(body);
      newItem.id = Math.round(Math.random()*Math.pow(2, 32));
      this.getStorage(ids, true)[newItem.id] = newItem;
      return newItem;
    },

    updateAction: function(superIds, itemId, url, body) {
      var storage = this.getStorage(superIds);
      if (storage && storage[itemId]) {
        var newItem = JSON.parse(body);
        newItem.id = storage[itemId].id;
        storage[itemId] = newItem;
        return newItem;
      }
    },

    deleteAction: function(superIds, itemId) {
      var storage = this.getStorage(superIds);
      if (storage && storage[itemId]) {
        var item = storage[itemId];
        delete storage[itemId];
        return item;
      }
    }
  };

  ResourceMock.prototype.parent = ResourceMock.prototype;

  var ResourceMockFactory = function(baseUrl, dataSource) {
    return new ResourceMock(baseUrl, dataSource);
  };
  return ResourceMockFactory;
}]);
