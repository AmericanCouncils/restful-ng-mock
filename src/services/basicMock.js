'use strict';

angular.module('restfulNgMock')
.factory('basicMock', [
'$httpBackend',
function($httpBackend) {
  var HttpError = function(code, message) {
    this.code = code;
    this.message = message;
  };

  var DEFAULT_OPTIONS = {
    debug: false
  };

  var BasicMock = function (base, options) {
    if (!(/^\/[\w\-]+(\/[\w\-]+|\/\?)*$/).test(base)) {
      throw 'Invalid base for resourceMock: "' + base + '".';
    }

    this.base = base;
    this.options = angular.extend({}, DEFAULT_OPTIONS);
    this.setOptions(options || {});
  };

  BasicMock.prototype = {
    _buildResponse: function(data) {
      if (angular.isUndefined(data)) {
        data = new HttpError(404, 'Not Found');
      }

      var responseInfo = { code: 200, message: 'OK' };
      if (data instanceof HttpError) {
        responseInfo.code = data.code;
        responseInfo.message = data.message;
        if (this.options.httpResponseInfoLabel) {
          data = {};
        } else {
          data = responseInfo;
        }
      }

      if (this.options.httpResponseInfoLabel) {
        data[this.options.httpResponseInfoLabel] = responseInfo;
      }

      return [
        responseInfo.code,
        JSON.stringify(data),
        { 'Content-Type': 'application/json' }
      ];
    },

    route: function(method, pattern, func) {
      var fullPattern = this.base + pattern;
      var urlPattern = fullPattern
        .replace('/', '\\/', 'g')
        .replace('?', '([\\w\\-]+)');
      var re = new RegExp( '^' + urlPattern  + '(?:/([\\w\\-]+))?(?:\\?.*)?$');

      var me = this;
      $httpBackend.when(method, re).respond(
        function(method, rawUrl, body, headers) {
          var url = purl(rawUrl, true);
          var params = re.exec(url.attr('path')).slice(1);
          var r = func(params, method, url, body, headers);
          return me._buildResponse(r);
        }
      );
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
    }
  };

  var BasicMockFactory = function(base, options) {
    return new BasicMock(base, options);
  };
  return BasicMockFactory;
}]);
