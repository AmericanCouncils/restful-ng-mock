'use strict';

angular.module('restfulNgMock')
.factory('basicMock', [
'$httpBackend',
function($httpBackend) {
  function BasicMock(baseUrl, options) {
    if (!(/^\/[\w\-]+(\/[\w\-]+|\/\?)*$/).test(baseUrl)) {
      throw 'Invalid baseUrl for resourceMock: "' + baseUrl + '".';
    }

    this._baseUrl = baseUrl;
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

  BasicMock.prototype.DEFAULT_OPTIONS = {
    debug: false,
    httpResponseInfoLabel: false
  };

  BasicMock.prototype._buildResponse = function(data, method, rawUrl, reqBody, reqHeaders) {
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

    if (this.options.httpResponseInfoLabel) {
      data[this.options.httpResponseInfoLabel] = responseInfo;
    }

    var jsonString = JSON.stringify(data);

    if (this.options.debug) {
      var debug = this.options.debug;
      if (typeof debug !== 'function') {
        debug = this._defaultDebug;
      }
      debug(
        method,
        rawUrl,
        reqBody,
        reqHeaders,
        responseInfo.code,
        JSON.parse(jsonString)
      );
    }

    return [
      responseInfo.code,
      jsonString,
      { 'Content-Type': 'application/json' }
    ];
  };

  BasicMock.prototype._defaultDebug = function(method, rawUrl, body, headers, code, resp) {
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
      '>>> ' + method + ' ' + rawUrl,
      '<<< ' + code,
      resp
    ]);
  };

  BasicMock.prototype.route = function(method, pattern, func) {
    var fullPattern = this._baseUrl + pattern;
    var urlPattern = fullPattern
      .replace(/\//g, '\\/')
      .replace(/\?/g, '([\\w\\-]+)');
    var re = new RegExp( '^' + urlPattern  + '(?:\\?.*)?$');

    var me = this;
    $httpBackend.when(method, re).respond(
      function(method, rawUrl, body, headers) {
        var url = purl(rawUrl, true);
        url.raw = rawUrl;
        var params = re.exec(url.attr('path')).slice(1);
        var r = func.call(me, params, method, url, body, headers);
        return me._buildResponse(r, method, rawUrl, body, headers);
      }
    );
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
