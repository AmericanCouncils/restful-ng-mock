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
