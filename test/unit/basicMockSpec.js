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

    describe('with debug mode enabled with a simple boolean flag', function () {
      beforeEach(function() {
        mock.setOptions({
          debug: true
        });

        spyOn(console, 'log');
      });

      it('outputs information about requests to console.log', function () {
        grabHttpResult($http.get('/foo/bar/99'));
        expect(console.log).toHaveBeenCalledWith([
          jasmine.any(String), // timestamp
          '>>> GET /foo/bar/99',
          '<<< 200',
          { foo: 'bar99' }
        ]);
      });
    });

    describe('with debug mode enabled with a custom function', function () {
      var debugSpy;
      beforeEach(function() {
        debugSpy = jasmine.createSpy('debugSpy');
        mock.setOptions({
          debug: debugSpy
        });
      });

      it('calls the function with request and response info', function () {
        grabHttpResult($http.get('/foo/bar/89'));
        expect(debugSpy).toHaveBeenCalledWith(
          'GET',
          '/foo/bar/89',
          undefined,
          jasmine.any(Object),
          200,
          { foo: 'bar89' }
        );
      });
    });

  });
});
