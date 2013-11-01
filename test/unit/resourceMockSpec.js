'use strict';

describe('resourceMock', function () {
  beforeEach(module('restfulNgMock'));

  var resourceMock, $http, $httpBackend;
  beforeEach(inject(function(_basicMock_, _resourceMock_, _$http_, _$httpBackend_) {
    resourceMock = _resourceMock_;
    $http = _$http_;
    $httpBackend = _$httpBackend_;
    setupGrabHttpResult($httpBackend);
  }));

  describe('instance', function () {
    var books, booksMock;
    beforeEach(function() {
      books = {
        1 : {
          id: 1,
          title: "A Woman of the Iron People",
          author: "Eleanor Arnason"
        },
        3 : {
          id: 3,
          title: "The C++ Programming Language",
          author: "Bjarne Stroustrup"
        },
        2 : {
          id: 2,
          title: "Anathem",
          author: "Neal Stephensen"
        }
      };

      booksMock = resourceMock('/books', books);
    });

    it('returns the full list in key order on a simple get', function () {
      grabHttpResult($http.get('/books'));
      expect(result.status).toEqual(200);
      expect(result.data).toEqual(objToArray(books));
    });

    it('returns a single item by id', function () {
      grabHttpResult($http.get('/books/2'));
      expect(result.status).toEqual(200);
      expect(result.data).toEqual(books[2]);
    });

    it('creates an item', function () {
      grabHttpResult($http.post('/books', {
        title: 'Godel, Escher, Bach',
        author: 'Douglas Hofstadter'
      }));
      expect(result.status).toEqual(200);
      expect(result.data.title).toEqual('Godel, Escher, Bach');
      expect(result.data.author).toEqual('Douglas Hofstadter');
      expect(typeof result.data.id).toEqual('number');
      expect(result.data.id).toBeGreaterThan(5);
      expect(result.data).toEqual(books[result.data.id]);
    });

    it('updates an item', function () {
      grabHttpResult($http.put('/books/2', {
        title: 'Diamond Age',
        author: 'Neal Stephensen'
      }));
      expect(result.data.title).toEqual('Diamond Age');
      expect(result.data.id).toEqual(2);
      expect(result.data).toEqual(books[2]);
    });

    it('deletes an item', function () {
      grabHttpResult($http.delete('/books/2'));
      expect(books[2]).not.toBeDefined();
      expect(result.status).toEqual(200);
      expect(result.data.title).toEqual('Anathem');

      grabHttpResult($http.get('/books/2'));
      expect(result.status).toEqual(404);
    });

    it('returns a 404 error if item not found', function () {
      for (var i = 0; i < METHODS.length; ++i) {
        if (METHODS[i] != 'POST') {
          grabHttpResult($http[METHODS[i].toLowerCase()]('/books/22'));
          expect(result.status).toEqual(404);
          expect(result.data).toEqual({
            code: 404,
            message: "Not Found"
          });
        }
      }
    });

    it('overrides an action with a custom method', function () {
      booksMock.indexAction = function() {
        return [{foo: 'bar'}];
      };

      grabHttpResult($http.get('/books'));
      expect(result.status).toEqual(200);
      expect(result.data).toEqual([{foo: 'bar'}]);
    });

    it('overrides an action with wrapper method', function () {
      booksMock.indexAction = function(request) {
        return this.parent.indexAction.call(this, request).slice(1);
      };

      grabHttpResult($http.get('/books'));
      expect(result.status).toEqual(200);
      expect(result.data).toEqual(objToArray(books).slice(1));
    });

    it('filters index results with addIndexFilter in a sensible default way', function () {
      grabHttpResult($http.get('/books?title=Anathem'));
      expect(result.data).toEqual(objToArray(books));

      booksMock.addIndexFilter('title');
      grabHttpResult($http.get('/books?title=Anathem'));
      expect(result.data).toEqual([books[2]]);
    });

    it('filters index results with addIndexFilter and custom filter funcs', function () {
      booksMock.addIndexFilter('authorInitial', function(arg, object) {
        return object.author.charAt(0) === arg;
      });
      grabHttpResult($http.get('/books?authorInitial=E'));
      expect(result.data).toEqual([books[1]]);
    });

    it('filters index results with addIndexArrayFilter', function () {
      booksMock.addIndexArrayFilter('id');
      grabHttpResult($http.get('/books?id=1,3'));
      expect(result.data).toEqual([books[1], books[3]]);
    });

    describe('with response labellers', function () {
      var otherJunk;
      beforeEach(function() {
        booksMock.addLabeller('book', 'books');
      });

      it('encapsulates index results', function () {
        grabHttpResult($http.get('/books'));
        expect(result.data.books).toEqual(objToArray(books));
      });

      it('encapsulates show results', function () {
        grabHttpResult($http.get('/books/2'));
        expect(result.data.book).toEqual(books[2]);
      });

      it('encapsulates creation results', function () {
        grabHttpResult($http.post('/books', {
          title: 'Godel, Escher, Bach',
          author: 'Douglas Hofstadter'
        }));
        expect(result.data.book.title).toEqual('Godel, Escher, Bach');
      });

      it('encapsulates update results', function () {
        grabHttpResult($http.put('/books/2', {
          title: 'Diamond Age',
          author: 'Neal Stephensen'
        }));
        expect(result.data.book.title).toEqual('Diamond Age');
      });

      it('encapsulates delete results', function () {
        grabHttpResult($http.delete('/books/2'));
        expect(result.data.book.title).toEqual('Anathem');
      });

      it('leaves http errors at the root of the response', function () {
        grabHttpResult($http.get('/books/22'));
        expect(result.data).toEqual({
          code: 404,
          message: "Not Found"
        });
        expect(result.data.response).toBeUndefined();
      });

      describe('and encapsulated http response info', function () {
        beforeEach(function() {
          booksMock.setOptions({
            httpResponseInfoLabel: 'response'
          });
        });

        var ok = {code: 200, message: "OK"};

        it('includes http response info with index results', function () {
          grabHttpResult($http.get('/books'));
          expect(result.data).toEqual({
            books: objToArray(books),
            response: ok
          });
        });

        it('includes http response info with show results', function () {
          grabHttpResult($http.get('/books/2'));
          expect(result.data).toEqual({book: books[2], response: ok});
        });

        it('includes http response info with singleton action results', function () {
          grabHttpResult($http.put('/books/2', {
            title: 'Diamond Age',
            author: 'Neal Stephensen'
          }));
          expect(result.data.book).toEqual(books[2]);
          expect(books[2].title).toEqual('Diamond Age');
          expect(result.data.response).toEqual(ok);
        });

        it('encapsulates http errors', function () {
          grabHttpResult($http.get('/books/22'));
          expect(result.data.code).toBeUndefined();
          expect(result.data.message).toBeUndefined();
          expect(result.data.response).toEqual({
            code: 404,
            message: "Not Found"
          });
        });
      });
    });

    describe('with pagination support', function () {
      beforeEach(function() {
        booksMock.addIndexPagination();
      });

      it('skips the first N results', function () {
        grabHttpResult($http.get('/books?skip=2'));
        expect(result.data).toEqual([books[3]]);
      });

      it('limits to N results', function () {
        grabHttpResult($http.get('/books?limit=2'));
        expect(result.data).toEqual([books[1], books[2]]);
      });

      it('skips and limits together to allow pagination', function () {
        grabHttpResult($http.get('/books?skip=1&limit=1'));
        expect(result.data).toEqual([books[2]]);
      });
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
          1: {
            id: 1,
            name: 'Tempeh Lettuce Tomato Sandwich'
          },
          2: {
            id: 2,
            name: 'Coconut Cupcake'
          }
        },
        b: {
          3: {
            id: 3,
            name: 'East Loop Pi',
          },
          4: {
            id: 4,
            name: 'Maplewood Pi',
          },
          5: {
            id: 5,
            name: 'Lincoln Park Pi'
          }
        }
      };

      storesMock = resourceMock('/stores', stores);
      foodsMock = storesMock.subResourceMock('/foods', foods);
    });

    it('returns the full list of subresources on a simple get', function () {
      grabHttpResult($http.get('/stores/b/foods'));
      expect(result.status).toEqual(200);
      expect(result.data).toEqual(objToArray(foods['b']));
    });

    it('returns a single subitem by id', function () {
      grabHttpResult($http.get('/stores/b/foods/3'));
      expect(result.status).toEqual(200);
      expect(result.data).toEqual(foods['b'][3]);
    });

    it('creates a subitem', function () {
      grabHttpResult($http.post('/stores/b/foods', {
        name: 'Grove Pi'
      }));
      expect(result.status).toEqual(200);
      expect(result.data.name).toEqual('Grove Pi');
      expect(typeof result.data.id).toEqual('number');
      expect(result.data.id).toBeGreaterThan(5);
      expect(result.data).toEqual(foods['b'][result.data.id]);
    });

    it('creates new parent path for new subitem if needed', function () {
      // Note: This does not create a new store resource!

      grabHttpResult($http.post('/stores/x/foods', {
        name: 'Chicken-Fried Steak'
      }));
      expect(result.status).toEqual(200);
      expect(result.data.name).toEqual('Chicken-Fried Steak');
      var newId = String(result.data.id);
      expect(result.data).toEqual(foods['x'][newId]);

      grabHttpResult($http.get('/stores/x/foods/' + newId));
      expect(result.status).toEqual(200);
      expect(result.data.name).toEqual('Chicken-Fried Steak');
    });

    it('updates a subitem', function () {
      grabHttpResult($http.put('/stores/b/foods/4', {
        name: 'Grove Pi'
      }));
      expect(result.data.name).toEqual('Grove Pi');
      expect(result.data.id).toEqual(4);
      expect(result.data).toEqual(foods['b'][4]);
    });

    it('deletes a subitem', function () {
      grabHttpResult($http.delete('/stores/b/foods/3'));
      expect(foods['b'][3]).not.toBeDefined();
      expect(result.status).toEqual(200);
      expect(result.data.name).toEqual('East Loop Pi');

      grabHttpResult($http.get('/stores/b/foods/3'));
      expect(result.status).toEqual(404);
    });

    it('returns a 404 error if subitem not found', function () {
      for (var i = 0; i < METHODS.length; ++i) {
        if (METHODS[i] != 'POST') {
          grabHttpResult($http[METHODS[i].toLowerCase()]('/stores/b/foods/22'));
          expect(result.status).toEqual(404);
          expect(result.data).toEqual({
            code: 404,
            message: "Not Found"
          });
        }
      }
    });
  });

  it('creates an empty data source if none is supplied', function () {
    var m = resourceMock("/foo"); // No data source argument
    grabHttpResult($http.get("/foo"));
    expect(result.data).toEqual([]);
    $http.post("/foo", { foo: 'bar' });
    grabHttpResult($http.get("/foo"));
    expect(result.data).toEqual([{foo: 'bar', id: jasmine.any(Number) }]);
  });
});
