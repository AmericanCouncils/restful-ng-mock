'use strict';

describe('resourceMock', function () {
  beforeEach(module('restfulNgMock'));

  var resourceMock, $http, $httpBackend;
  beforeEach(inject(function(_resourceMock_, _$http_, _$httpBackend_) {
    resourceMock = _resourceMock_;
    $http = _$http_;
    $httpBackend = _$httpBackend_;
  }));

  var METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

  var result;
  function grabHttpResult(h) {
    result = {};
    var grab = function(d, s, h, c) {
      result.data = d;
      result.status = s;
      result.headers = h;
      result.config = c;
    };
    h.success(grab).error(grab);
  }

  describe('when used incorrectly', function () {
    it('fails when given template URL without starting slash', function () {
      expect(function() {
        resourceMock("foo");
      }).toThrow();
    });

    it('fails when given template URL with closing slash', function () {
      expect(function() {
        resourceMock("/foo/"); // Shouldn't end with a slash
      }).toThrow();
    });

    it('fails when given template URL with invalid character', function () {
      expect(function() {
        resourceMock("/fo&o"); // Invalid character
      }).toThrow();
    });
  });

  describe('with a simple resource', function () {
    var books, booksMock;
    beforeEach(function() {
      books = {
        '1' : {
          id: '1',
          title: "A Woman of the Iron People",
          author: "Eleanor Arnason"
        },
        '2' : {
          id: '2',
          title: "Anathem",
          author: "Neal Stephensen"
        },
        '3' : {
          id: '3',
          title: "The C++ Programming Language",
          author: "Bjarne Stroustrup"
        }
      };

      booksMock = resourceMock('/books', books);
    });

    it('returns the full list on a simple get', function () {
      grabHttpResult($http.get('/books'));
      $httpBackend.flush();
      expect(result.status).toEqual(200);
      expect(result.data).toEqual(books);
    });

    it('returns a single item by id', function () {
      grabHttpResult($http.get('/books/2'));
      $httpBackend.flush();
      expect(result.status).toEqual(200);
      expect(result.data).toEqual(books['2']);
    });

    it('creates an item', function () {
      grabHttpResult($http.post('/books', {
        title: 'Godel, Escher, Bach',
        author: 'Douglas Hofstadter'
      }));
      $httpBackend.flush();
      expect(result.status).toEqual(200);
      expect(result.data.title).toEqual('Godel, Escher, Bach');
      expect(result.data.author).toEqual('Douglas Hofstadter');
      var newId = String(result.data.id);
      expect(newId.length).toBeGreaterThan(0);
      expect(newId).not.toEqual('1');
      expect(newId).not.toEqual('2');
      expect(newId).not.toEqual('3');
      expect(result.data).toEqual(books[newId]);
    });

    it('updates an item', function () {
      grabHttpResult($http.put('/books/2', {
        title: 'Diamond Age',
        author: 'Neal Stephensen'
      }));
      $httpBackend.flush();
      expect(result.data.title).toEqual('Diamond Age');
      expect(result.data.id).toEqual('2');
      expect(result.data).toEqual(books['2']);
    });

    it('deletes an item', function () {
      grabHttpResult($http.delete('/books/2'));
      $httpBackend.flush();
      expect(books[2]).not.toBeDefined();

      grabHttpResult($http.get('/books/2'));
      $httpBackend.flush()
      expect(result.status).toEqual(404);
    });

    it('returns a 404 error if item not found', function () {
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
  });

  describe('with nested resources', function () {
    var stores, storesMock, foods, foodsMock;
    beforeEach(function() {
      stores = {
        a: {
          id: 'a',
          name: 'Sticky Fingers Bakery'
        },
        b: {
          id: 'b',
          name: 'District of Pi'
        }
      };

      foods = {
        a: {
          '1': {
            id: '1',
            name: 'Tempeh Lettuce Tomato Sandwich'
          },
          '2': {
            id: '2',
            name: 'Coconut Cupcake'
          }
        },
        b: {
          '3': {
            id: '3',
            name: 'East Loop Pi',
          },
          '4': {
            id: '4',
            name: 'Maplewood Pi',
          },
          '5': {
            id: '5',
            name: 'Lincoln Park Pi'
          }
        }
      };

      storesMock = resourceMock('/stores', stores);
      foodsMock = storesMock.subResourceMock('/foods', foods);
    });

    it('returns the full list of subresources on a simple get', function () {
      grabHttpResult($http.get('/stores/b/foods'));
      $httpBackend.flush();
      expect(result.status).toEqual(200);
      expect(result.data).toEqual(foods['b']);
    });

    it('returns a single subitem by id', function () {
      grabHttpResult($http.get('/stores/b/foods/3'));
      $httpBackend.flush();
      expect(result.status).toEqual(200);
      expect(result.data).toEqual(foods['b']['3']);
    });

    it('creates a subitem', function () {
      grabHttpResult($http.post('/stores/b/foods', {
        name: 'Grove Pi'
      }));
      $httpBackend.flush();
      expect(result.status).toEqual(200);
      expect(result.data.name).toEqual('Grove Pi');
      var newId = String(result.data.id);
      expect(newId.length).toBeGreaterThan(0);
      expect(newId).not.toEqual('1');
      expect(newId).not.toEqual('2');
      expect(newId).not.toEqual('3');
      expect(newId).not.toEqual('4');
      expect(newId).not.toEqual('5');
      expect(result.data).toEqual(foods['b'][newId]);
    });

    it('creates new parent path for new subitem if needed', function () {
      // Note: This does not create a new store resource!

      grabHttpResult($http.post('/stores/x/foods', {
        name: 'Chicken-Fried Steak'
      }));
      $httpBackend.flush();
      expect(result.status).toEqual(200);
      expect(result.data.name).toEqual('Chicken-Fried Steak');
      var newId = String(result.data.id);
      expect(result.data).toEqual(foods['x'][newId]);

      grabHttpResult($http.get('/stores/x/foods/' + newId));
      $httpBackend.flush()
      expect(result.status).toEqual(200);
      expect(result.data.name).toEqual('Chicken-Fried Steak');
    });

    it('updates a subitem', function () {
      grabHttpResult($http.put('/stores/b/foods/4', {
        name: 'Grove Pi'
      }));
      $httpBackend.flush();
      expect(result.data.name).toEqual('Grove Pi');
      expect(result.data.id).toEqual('4');
      expect(result.data).toEqual(foods['b']['4']);
    });

    it('deletes a subitem', function () {
      grabHttpResult($http.delete('/stores/b/foods/3'));
      $httpBackend.flush();
      expect(foods['b']['3']).not.toBeDefined();
      // TODO: Check that deleted item was returned

      grabHttpResult($http.get('/stores/b/foods/3'));
      $httpBackend.flush()
      expect(result.status).toEqual(404);
    });

    it('returns a 404 error if subitem not found', function () {
      for (var i = 0; i < METHODS.length; ++i) {
        if (METHODS[i] != 'POST') {
          grabHttpResult($http[METHODS[i].toLowerCase()]('/stores/b/foods/22'));
          $httpBackend.flush();
          expect(result.status).toEqual(404);
          expect(result.data).toEqual({
            code: 404,
            message: "Not Found"
          });
        }
      }
    });
  });
});
