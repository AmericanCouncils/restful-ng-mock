'use strict';

window.METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

window.setupGrabHttpResult = function(backend) {
  window.grabHttpResult = function(h) {
    window.result = {};
    var grab = function(d, s, h, c) {
      result.data = d;
      result.status = s;
      result.headers = h;
      result.config = c;
    };
    h.success(grab).error(grab);
    backend.flush();
  }
}

window.objToArray = function(obj) {
  var a = [];
  _(obj).keys().sort().each(function (k) { a.push(obj[k]); });
  return a;
}
