'use strict';

describe('restfulNgMock', function () {
  beforeEach(module('restfulNgMock'));

  describe('resourceMock', function () {
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

      inject(function(resourceMock, _$http_, _$httpBackend_) {
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
  });
});
