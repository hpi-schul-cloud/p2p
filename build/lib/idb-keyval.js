"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idbKeyval = function (e) {
  "use strict";

  var t = function () {
    function t() {
      var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "keyval-store";

      var _t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "keyval";

      _classCallCheck(this, t);

      this.storeName = _t, this._dbp = new Promise(function (r, n) {
        var o = indexedDB.open(e, 1);o.onerror = function () {
          return n(o.error);
        }, o.onsuccess = function () {
          return r(o.result);
        }, o.onupgradeneeded = function () {
          o.result.createObjectStore(_t);
        };
      });
    }

    _createClass(t, [{
      key: "_withIDBStore",
      value: function _withIDBStore(e, t) {
        var _this = this;

        return this._dbp.then(function (r) {
          return new Promise(function (n, o) {
            var s = r.transaction(_this.storeName, e);s.oncomplete = function () {
              return n();
            }, s.onabort = s.onerror = function () {
              return o(s.error);
            }, t(s.objectStore(_this.storeName));
          });
        });
      }
    }]);

    return t;
  }();

  var r = void 0;function n() {
    return r || (r = new t()), r;
  }return e.Store = t, e.get = function (e) {
    var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : n();
    var r = void 0;return t._withIDBStore("readonly", function (t) {
      r = t.get(e);
    }).then(function () {
      return r.result;
    });
  }, e.set = function (e, t) {
    var r = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : n();
    return r._withIDBStore("readwrite", function (r) {
      r.put(t, e);
    });
  }, e.del = function (e) {
    var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : n();
    return t._withIDBStore("readwrite", function (t) {
      t.delete(e);
    });
  }, e.clear = function () {
    var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : n();
    return e._withIDBStore("readwrite", function (e) {
      e.clear();
    });
  }, e.keys = function () {
    var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : n();
    var t = [];return e._withIDBStore("readonly", function (e) {
      (e.openKeyCursor || e.openCursor).call(e).onsuccess = function () {
        this.result && (t.push(this.result.key), this.result.continue());
      };
    }).then(function () {
      return t;
    });
  }, e;
}({});