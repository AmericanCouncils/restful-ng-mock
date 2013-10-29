'use strict';

describe('basicMock', function () {
  beforeEach(module('restfulNgMock'));

  var basicMock, $http, $httpBackend;
  beforeEach(inject(function(_basicMock_, _$http_, _$httpBackend_) {
    basicMock = _basicMock_;
    $http = _$http_;
    $httpBackend = _$httpBackend_;
    setupGrabHttpResult($httpBackend);
  }));

  it('is chainable with setOptions', function () {
    var m = basicMock("/foo");
    expect(m.setOptions({
      debug: true
    })).toEqual(m);
  });

  describe('when used incorrectly', function () {
    it('fails when given template URL without starting slash', function () {
      expect(function() {
        basicMock("foo");
      }).toThrow();
    });

    it('fails when given template URL with closing slash', function () {
      expect(function() {
        basicMock("/foo/");
      }).toThrow();
    });

    it('fails when given template URL with invalid character', function () {
      expect(function() {
        basicMock("/fo&o");
      }).toThrow();
    });

    it('fails when given invalid options to setOptions', function () {
      var m = basicMock("/foo");
      expect(function() {
        m.setOptions({noSuchOption: 123});
      }).toThrow();
    });
  });

  describe('instance', function () {
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
