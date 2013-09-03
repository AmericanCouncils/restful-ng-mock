'use strict';

angular.module('restfulNgMock')
.factory('resourceMock', [
'$httpBackend',
function($httpBackend) {
  var ResourceMock = function (baseUrl, dataSource) {
    if (!(/^\/[\w\/\-]+\w$/).test(baseUrl)) {
      throw 'Invalid baseUrl for resourceMock: "' + baseUrl + '".';
    }

    this.baseUrl = baseUrl;
    this.baseUrlRe = new RegExp('^' + baseUrl.replace('/', '\\/', 'g') + '(?:/([\\w\\-]+))?$');

    var me = this;

    $httpBackend.whenGET(new RegExp(this.baseUrlRe))
    .respond(function(method, rawUrl, data, headers) {
      return me.handle(rawUrl, data, headers, {
        atRoot: function() {
          return me.jsonResponse(dataSource);
        },
        atItem: function(itemId) {
          if (dataSource[itemId]) {
            return me.jsonResponse(dataSource[itemId]);
          }
          return me.jsonErrorResponse(404, 'Not Found');
        }
      });
    });

    $httpBackend.whenPOST(new RegExp(this.baseUrlRe))
    .respond(function(method, rawUrl, data, headers) {
      return me.handle(rawUrl, data, headers, {
      });
    });

    $httpBackend.whenPUT(new RegExp(this.baseUrlRe))
    .respond(function(method, rawUrl, data, headers) {
      return me.handle(rawUrl, data, headers, {
        atItem: function(itemId) {
          var item = dataSource[itemId];
          if (item) {
            // Do something
          }
          return me.jsonErrorResponse(404, 'Not Found');
        }
      });
    });

    $httpBackend.whenDELETE(new RegExp(this.baseUrlRe))
    .respond(function(method, rawUrl, data, headers) {
      return me.handle(rawUrl, data, headers, {
        atItem: function(itemId) {
          if (dataSource[itemId]) {
            delete dataSource[itemId];
          }
          return me.jsonErrorResponse(404, 'Not Found');
        }
      });
    });
  };

  ResourceMock.prototype = {
    handle: function(rawUrl, data, headers, handlers) {
      var url = purl(rawUrl);

      if (handlers.atRoot && url.attr('path') === this.baseUrl) {
        return handlers.atRoot(url, data, headers);
      }

      if (handlers.atItem) {
        var match = this.baseUrlRe.exec(url.attr('path'));
        if (match) {
          return handlers.atItem(match[1], url, data, headers);
        }
      }

      // TODO Throw here
    },

    jsonResponse: function(data, code) {
      code = code || 200;
      return [
        code,
        JSON.stringify(data),
        {
          'Content-Type': 'application/json'
        }
      ];
    },

    jsonErrorResponse: function(code, message) {
      var data = {
        code: code,
        message: message
      };
      return this.jsonResponse(data, code);
    }
  };

  var ResourceMockFactory = function(baseUrl, dataSource) {
    return new ResourceMock(baseUrl, dataSource);
  };
  return ResourceMockFactory;
}]);
