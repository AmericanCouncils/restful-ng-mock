'use strict';

describe('restfulNgMock', function () {
  beforeEach(module('restfulNgMock'));

  var METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

  describe('resourceMock', function () {
    var resourceMock;
    beforeEach(inject(function(_resourceMock_) {
      resourceMock = _resourceMock_;
    }));

    it('errors out when given an invalid base URL', function () {
      expect(function() {
        resourceMock("foo"); // Needs a starting slash
      }).toThrow();

      expect(function() {
        resourceMock("/foo/"); // Shouldn't end with a slash
      }).toThrow();

      expect(function() {
        resourceMock("/fo&o"); // Invalid character
      }).toThrow();
    });

    describe('in usage', function () {
      var books, booksMock, $http, $httpBackend;
      beforeEach(function() {
        books = {
          '1' : {
            title: "A Woman of the Iron People",
            author: "Eleanor Arnason"
          },
          '2' : {
            title: "Anathem",
            author: "Neal Stephensen"
          },
          '3' : {
            title: "The C++ Programming Language",
            author: "Bjarne Stroustrup"
          }
        };

        inject(function(_$http_, _$httpBackend_) {
          booksMock = resourceMock('/books', books);
          $http = _$http_;
          $httpBackend = _$httpBackend_;
        });
      });

      var result;
      function grabHttpResult(h) {
        var grab = function(d, s, h, c) {
          result = {};
          result.data = d;
          result.status = s;
          result.headers = h;
          result.config = c;
        };
        h.success(grab).error(grab);
      }

      it('returns the full list on a simple get', function () {
        grabHttpResult($http.get('/books'));
        $httpBackend.flush();
        expect(result.status).toEqual(200);
        expect(result.data).toEqual(books);
      });

      it('can return a single item by id', function () {
        grabHttpResult($http.get('/books/2'));
        $httpBackend.flush();
        expect(result.status).toEqual(200);
        expect(result.data).toEqual(books['2']);
      });

      it('returns a 404 error if id not found', function () {
        for (var i = 0; i < METHODS.length; ++i) {
          if (METHODS[i] != 'POST') {
            grabHttpResult($http[METHODS[i].toLowerCase()]('/books/22'));
            $httpBackend.flush();
            expect(result.status).toEqual(404);
            expect(result.data).toEqual({
              code: 404,
              message: "Not Found"
            });
          }
        }
      });

      it('can delete an item by id', function () {
        grabHttpResult($http.delete('/books/2'));
        $httpBackend.flush();
        expect(books[2]).not.toBeDefined();

        grabHttpResult($http.get('/books/2'));
        $httpBackend.flush()
        expect(result.status).toEqual(404);
      });
    });
  });
});
