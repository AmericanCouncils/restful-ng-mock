/***********************************************
* restful-ng-mock JavaScript Library
* https://github.com/AmericanCouncils/restful-ng-mock/ 
* License: MIT (http://www.opensource.org/licenses/mit-license.php)
* Compiled At: 09/06/2013 13:41
***********************************************/
(function(window) {
'use strict';
angular.module('restfulNgMock', []);

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
    httpResponseInfoLabel: false
  };

  var ResourceMock = function (baseUrl, dataSource, options) {
    if (!(/^\/[\w\-]+(\/[\w\-]+|\/\?)*$/).test(baseUrl)) {
      throw 'Invalid baseUrl for resourceMock: "' + baseUrl + '".';
    }
    this.baseUrl = baseUrl;
    this.dataSource = dataSource;

    this.options = angular.extend({}, DEFAULT_OPTIONS);
    this.setOptions(options || {});

    var requiredSegments = 0;
    for (var cidx = 0; cidx < baseUrl.length; ++cidx) {
      if (baseUrl.charAt(cidx) === '?') { ++requiredSegments; }
    }

    var urlPattern = baseUrl
      .replace('/', '\\/', 'g')
      .replace('?', '([\\w\\-]+)');
    var baseUrlRe = new RegExp( '^' + urlPattern  + '(?:/([\\w\\-]+))?(?:\\?.*)?$');

    var me = this;

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

    var handle = function(rawUrl, data, headers, handlers) {
      var url = purl(rawUrl);
      var matches = baseUrlRe.exec(url.attr('path')).slice(1);
      var itemIds = [];
      for (var i = 0; i < matches.length; ++i) {
        if (typeof matches[i] !== 'null' && typeof matches[i] !== 'undefined') {
          itemIds.push(matches[i]);
        }
      }

      var response, encapResponse;
      if (handlers.atRoot && itemIds.length === requiredSegments) {
        response =
          handlers.atRoot.call(me, itemIds, url, data, headers);

        if (response && me.options.collectionLabel) {
          encapResponse = response;
          response = {};
          response[me.options.collectionLabel] = encapResponse;
        }
        return buildResponse(response);
      } else if (handlers.atItem && itemIds.length > requiredSegments) {
        var superIds = itemIds.slice(0, -1);
        var itemId = itemIds[itemIds.length-1];
        response =
          handlers.atItem.call(me, superIds, itemId, url, data, headers);

        if (response && me.options.singletonLabel) {
          encapResponse = response;
          response = {};
          response[me.options.singletonLabel] = encapResponse;
        }
        return buildResponse(response);
      } else {
        // This action isn't handled
        return buildResponse( new HttpError(400, 'Bad Request') );
      }
    };

    $httpBackend.whenGET(new RegExp(baseUrlRe))
    .respond(function(method, rawUrl, data, headers) {
      return handle(rawUrl, data, headers, {
        atRoot: me.indexAction,
        atItem: me.showAction
      });
    });

    $httpBackend.whenPOST(new RegExp(baseUrlRe))
    .respond(function(method, rawUrl, data, headers) {
      return handle(rawUrl, data, headers, {
        atRoot: me.createAction
      });
    });

    $httpBackend.whenPUT(new RegExp(baseUrlRe))
    .respond(function(method, rawUrl, data, headers) {
      return handle(rawUrl, data, headers, {
        atItem: me.updateAction
      });
    });

    $httpBackend.whenDELETE(new RegExp(baseUrlRe))
    .respond(function(method, rawUrl, data, headers) {
      return handle(rawUrl, data, headers, {
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
    },

    indexAction: function(ids) {
      var storage = this.getStorage(ids);
      if (storage) {
        var a = [];
        for (var k in storage) {
          if (storage.hasOwnProperty(k)) {
            a.push(storage[k]);
          }
        }
        return a;
      }
    },

    showAction: function(superIds, itemId) {
      var storage = this.getStorage(superIds);
      if (storage && storage[itemId]) { return storage[itemId]; }
    },

    createAction: function(ids, url, data) {
      var newItem = JSON.parse(data);
      newItem.id = Math.round(Math.random()*Math.pow(2, 32)).toString();
      this.getStorage(ids, true)[newItem.id] = newItem;
      return newItem;
    },

    updateAction: function(superIds, itemId, url, data) {
      var storage = this.getStorage(superIds);
      if (storage && storage[itemId]) {
        var newItem = JSON.parse(data);
        newItem.id = itemId;
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

  var ResourceMockFactory = function(baseUrl, dataSource) {
    return new ResourceMock(baseUrl, dataSource);
  };
  return ResourceMockFactory;
}]);

}(window));