'use strict';

describe('resourceMock', function () {
  beforeEach(module('restfulNgMock'));

  var basicMock, $http, $httpBackend;
  beforeEach(inject(function(_basicMock_, _resourceMock_, _$http_, _$httpBackend_) {
    basicMock = _basicMock_;
    $http = _$http_;
    $httpBackend = _$httpBackend_;
    setupGrabHttpResult($httpBackend);
  }));

  describe('with a basic mock', function () {
    var mock;
    beforeEach(function() {
      mock = basicMock('/foo');
      mock.route('GET', '', function () {
        return { foo: 'narf' };
      });
      mock.route('GET', '/bar/?', function (params) {
        return { foo: 'bar' + params[0] };
      });
    });

    it('responds on simple routes', function () {
      grabHttpResult($http.get('/foo'));
      expect(result.data).toEqual({ foo: 'narf' });
    });

    it('responds on parameterized routes', function () {
      grabHttpResult($http.get('/foo/bar/123'));
      expect(result.data).toEqual({ foo: 'bar123' });
    });
  });
});
