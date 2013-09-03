'use strict';

angular.module('restfulNgMock')
.factory('resourceMock', [
'$httpBackend',
function($httpBackend) {
  var ResourceMock = function (baseUrl, dataSource) {
    if (!(/^\/[\w\/\-]+\w$/).test(baseUrl)) {
      throw 'Invalid baseUrl for resourceMock: "' + baseUrl + '".';
    }
    var baseUrlRe = new RegExp('^' + baseUrl.replace('/', '\\/', 'g') + '/?(.*)$');

    var me = this;

    $httpBackend.whenGET(new RegExp(baseUrlRe))
    .respond(function(method, rawUrl/*, data, headers*/) {
      var url = purl(rawUrl);

      if (url.attr('path') === baseUrl) {
        return me.jsonResponse(dataSource);
      }

      var match = baseUrlRe.exec(url.attr('path'));
      if (match && /^[\w\-]+$/.test(match[1])) {
        var item = dataSource[match[1]];
        if (item) {
          return me.jsonResponse(item);
        } else {
          return me.jsonErrorResponse(404, 'File not found');
        }
      }
    });
  };

  ResourceMock.prototype = {
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
