'use strict';

angular.module('restfulNgMock')
.factory('resourceMock', [
'$httpBackend',
function($httpBackend) {
    var ResourceMock = function (baseUrl, dataSource) {
        this.baseUrl = baseUrl;
        this.dataSource = dataSource;

        $httpBackend.whenGET(baseUrl).respond(dataSource);
    };

    var ResourceMockFactory = function(baseUrl, dataSource) {
        return new ResourceMock(baseUrl, dataSource);
    };
    return ResourceMockFactory;
}]);
