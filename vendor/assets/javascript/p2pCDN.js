var P2pCDN =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var require;var require;

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
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

!function (e) {
  if ("object" == ( false ? undefined : _typeof(exports)) && "undefined" != typeof module) module.exports = e();else if (true) !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (e),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));else { var n; }
}(function () {
  return function e(n, t, r) {
    function o(i, a) {
      if (!t[i]) {
        if (!n[i]) {
          var c = "function" == typeof require && require;if (!a && c) return require(i, !0);if (s) return s(i, !0);var u = new Error("Cannot find module '" + i + "'");throw u.code = "MODULE_NOT_FOUND", u;
        }var f = t[i] = { exports: {} };n[i][0].call(f.exports, function (e) {
          var t = n[i][1][e];return o(t ? t : e);
        }, f, f.exports, e, n, t, r);
      }return t[i].exports;
    }for (var s = "function" == typeof require && require, i = 0; i < r.length; i++) {
      o(r[i]);
    }return o;
  }({ 1: [function (e, n, t) {
      function r() {
        throw new Error("setTimeout has not been defined");
      }function o() {
        throw new Error("clearTimeout has not been defined");
      }function s(e) {
        if (l === setTimeout) return setTimeout(e, 0);if ((l === r || !l) && setTimeout) return l = setTimeout, setTimeout(e, 0);try {
          return l(e, 0);
        } catch (n) {
          try {
            return l.call(null, e, 0);
          } catch (n) {
            return l.call(this, e, 0);
          }
        }
      }function i(e) {
        if (C === clearTimeout) return clearTimeout(e);if ((C === o || !C) && clearTimeout) return C = clearTimeout, clearTimeout(e);try {
          return C(e);
        } catch (n) {
          try {
            return C.call(null, e);
          } catch (n) {
            return C.call(this, e);
          }
        }
      }function a() {
        m && p && (m = !1, p.length ? h = p.concat(h) : g = -1, h.length && c());
      }function c() {
        if (!m) {
          var e = s(a);m = !0;for (var n = h.length; n;) {
            for (p = h, h = []; ++g < n;) {
              p && p[g].run();
            }g = -1, n = h.length;
          }p = null, m = !1, i(e);
        }
      }function u(e, n) {
        this.fun = e, this.array = n;
      }function f() {}var l,
          C,
          d = n.exports = {};!function () {
        try {
          l = "function" == typeof setTimeout ? setTimeout : r;
        } catch (e) {
          l = r;
        }try {
          C = "function" == typeof clearTimeout ? clearTimeout : o;
        } catch (e) {
          C = o;
        }
      }();var p,
          h = [],
          m = !1,
          g = -1;d.nextTick = function (e) {
        var n = new Array(arguments.length - 1);if (arguments.length > 1) for (var t = 1; t < arguments.length; t++) {
          n[t - 1] = arguments[t];
        }h.push(new u(e, n)), 1 !== h.length || m || s(c);
      }, u.prototype.run = function () {
        this.fun.apply(null, this.array);
      }, d.title = "browser", d.browser = !0, d.env = {}, d.argv = [], d.version = "", d.versions = {}, d.on = f, d.addListener = f, d.once = f, d.off = f, d.removeListener = f, d.removeAllListeners = f, d.emit = f, d.binding = function (e) {
        throw new Error("process.binding is not supported");
      }, d.cwd = function () {
        return "/";
      }, d.chdir = function (e) {
        throw new Error("process.chdir is not supported");
      }, d.umask = function () {
        return 0;
      };
    }, {}], 2: [function (e, n, t) {
      function r(e) {
        if (e = String(e), !(e.length > 100)) {
          var n = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(e);if (n) {
            var t = parseFloat(n[1]),
                r = (n[2] || "ms").toLowerCase();switch (r) {case "years":case "year":case "yrs":case "yr":case "y":
                return t * l;case "days":case "day":case "d":
                return t * f;case "hours":case "hour":case "hrs":case "hr":case "h":
                return t * u;case "minutes":case "minute":case "mins":case "min":case "m":
                return t * c;case "seconds":case "second":case "secs":case "sec":case "s":
                return t * a;case "milliseconds":case "millisecond":case "msecs":case "msec":case "ms":
                return t;default:
                return;}
          }
        }
      }function o(e) {
        return e >= f ? Math.round(e / f) + "d" : e >= u ? Math.round(e / u) + "h" : e >= c ? Math.round(e / c) + "m" : e >= a ? Math.round(e / a) + "s" : e + "ms";
      }function s(e) {
        return i(e, f, "day") || i(e, u, "hour") || i(e, c, "minute") || i(e, a, "second") || e + " ms";
      }function i(e, n, t) {
        if (!(e < n)) return e < 1.5 * n ? Math.floor(e / n) + " " + t : Math.ceil(e / n) + " " + t + "s";
      }var a = 1e3,
          c = 60 * a,
          u = 60 * c,
          f = 24 * u,
          l = 365.25 * f;n.exports = function (e, n) {
        n = n || {};var t = typeof e === "undefined" ? "undefined" : _typeof(e);if ("string" === t && e.length > 0) return r(e);if ("number" === t && isNaN(e) === !1) return n.long ? s(e) : o(e);throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(e));
      };
    }, {}], 3: [function (e, n, t) {
      function r(e) {
        var n,
            r = 0;for (n in e) {
          r = (r << 5) - r + e.charCodeAt(n), r |= 0;
        }return t.colors[Math.abs(r) % t.colors.length];
      }function o(e) {
        function n() {
          if (n.enabled) {
            var e = n,
                r = +new Date(),
                s = r - (o || r);e.diff = s, e.prev = o, e.curr = r, o = r;for (var i = new Array(arguments.length), a = 0; a < i.length; a++) {
              i[a] = arguments[a];
            }i[0] = t.coerce(i[0]), "string" != typeof i[0] && i.unshift("%O");var c = 0;i[0] = i[0].replace(/%([a-zA-Z%])/g, function (n, r) {
              if ("%%" === n) return n;c++;var o = t.formatters[r];if ("function" == typeof o) {
                var s = i[c];n = o.call(e, s), i.splice(c, 1), c--;
              }return n;
            }), t.formatArgs.call(e, i);var u = n.log || t.log || console.log.bind(console);u.apply(e, i);
          }
        }var o;return n.namespace = e, n.enabled = t.enabled(e), n.useColors = t.useColors(), n.color = r(e), n.destroy = s, "function" == typeof t.init && t.init(n), t.instances.push(n), n;
      }function s() {
        var e = t.instances.indexOf(this);return e !== -1 && (t.instances.splice(e, 1), !0);
      }function i(e) {
        t.save(e), t.names = [], t.skips = [];var n,
            r = ("string" == typeof e ? e : "").split(/[\s,]+/),
            o = r.length;for (n = 0; n < o; n++) {
          r[n] && (e = r[n].replace(/\*/g, ".*?"), "-" === e[0] ? t.skips.push(new RegExp("^" + e.substr(1) + "$")) : t.names.push(new RegExp("^" + e + "$")));
        }for (n = 0; n < t.instances.length; n++) {
          var s = t.instances[n];s.enabled = t.enabled(s.namespace);
        }
      }function a() {
        t.enable("");
      }function c(e) {
        if ("*" === e[e.length - 1]) return !0;var n, r;for (n = 0, r = t.skips.length; n < r; n++) {
          if (t.skips[n].test(e)) return !1;
        }for (n = 0, r = t.names.length; n < r; n++) {
          if (t.names[n].test(e)) return !0;
        }return !1;
      }function u(e) {
        return e instanceof Error ? e.stack || e.message : e;
      }t = n.exports = o.debug = o.default = o, t.coerce = u, t.disable = a, t.enable = i, t.enabled = c, t.humanize = e("ms"), t.instances = [], t.names = [], t.skips = [], t.formatters = {};
    }, { ms: 2 }], 4: [function (e, n, t) {
      (function (r) {
        function o() {
          return !("undefined" == typeof window || !window.process || "renderer" !== window.process.types) || ("undefined" == typeof navigator || !navigator.userAgent || !navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) && ("undefined" != typeof document && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || "undefined" != typeof window && window.console && (window.console.firebug || window.console.exception && window.console.table) || "undefined" != typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || "undefined" != typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
        }function s(e) {
          var n = this.useColors;if (e[0] = (n ? "%c" : "") + this.namespace + (n ? " %c" : " ") + e[0] + (n ? "%c " : " ") + "+" + t.humanize(this.diff), n) {
            var r = "color: " + this.color;e.splice(1, 0, r, "color: inherit");var o = 0,
                s = 0;e[0].replace(/%[a-zA-Z%]/g, function (e) {
              "%%" !== e && (o++, "%c" === e && (s = o));
            }), e.splice(s, 0, r);
          }
        }function i() {
          return "object" == (typeof console === "undefined" ? "undefined" : _typeof(console)) && console.log && Function.prototype.apply.call(console.log, console, arguments);
        }function a(e) {
          try {
            null == e ? t.storage.removeItem("debug") : t.storage.debug = e;
          } catch (e) {}
        }function c() {
          var e;try {
            e = t.storage.debug;
          } catch (e) {}return !e && "undefined" != typeof r && "env" in r && (e = r.env.DEBUG), e;
        }function u() {
          try {
            return window.localStorage;
          } catch (e) {}
        }t = n.exports = e("./debug"), t.log = i, t.formatArgs = s, t.save = a, t.load = c, t.useColors = o, t.storage = "undefined" != typeof chrome && "undefined" != typeof chrome.storage ? chrome.storage.local : u(), t.colors = ["#0000CC", "#0000FF", "#0033CC", "#0033FF", "#0066CC", "#0066FF", "#0099CC", "#0099FF", "#00CC00", "#00CC33", "#00CC66", "#00CC99", "#00CCCC", "#00CCFF", "#3300CC", "#3300FF", "#3333CC", "#3333FF", "#3366CC", "#3366FF", "#3399CC", "#3399FF", "#33CC00", "#33CC33", "#33CC66", "#33CC99", "#33CCCC", "#33CCFF", "#6600CC", "#6600FF", "#6633CC", "#6633FF", "#66CC00", "#66CC33", "#9900CC", "#9900FF", "#9933CC", "#9933FF", "#99CC00", "#99CC33", "#CC0000", "#CC0033", "#CC0066", "#CC0099", "#CC00CC", "#CC00FF", "#CC3300", "#CC3333", "#CC3366", "#CC3399", "#CC33CC", "#CC33FF", "#CC6600", "#CC6633", "#CC9900", "#CC9933", "#CCCC00", "#CCCC33", "#FF0000", "#FF0033", "#FF0066", "#FF0099", "#FF00CC", "#FF00FF", "#FF3300", "#FF3333", "#FF3366", "#FF3399", "#FF33CC", "#FF33FF", "#FF6600", "#FF6633", "#FF9900", "#FF9933", "#FFCC00", "#FFCC33"], t.formatters.j = function (e) {
          try {
            return JSON.stringify(e);
          } catch (e) {
            return "[UnexpectedJSONParseError]: " + e.message;
          }
        }, t.enable(c());
      }).call(this, e("_process"));
    }, { "./debug": 3, _process: 1 }] }, {}, [4])(4);
});
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ServiceWorkerMiddleware = function () {
  function ServiceWorkerMiddleware(config) {
    _classCallCheck(this, ServiceWorkerMiddleware);

    if (config.verbose) {
      this.log = getLogger('p2pCDN:ServiceWorkerMiddleware');
      this.logDetail = getLogger('p2pCDN:ServiceWorkerMiddleware:detail');
    } else {
      this.log = function (message) {};
      this.logDetail = function (_) {};
    }

    this._initServiceWorker(config);
  }

  _createClass(ServiceWorkerMiddleware, [{
    key: '_initServiceWorker',
    value: function _initServiceWorker(config) {
      var _this = this;

      var sw = navigator.serviceWorker;

      if (typeof sw === 'undefined' || typeof idbKeyval === 'undefined') {
        this.log("Failed to register service worker");
        return false;
      }

      idbKeyval.set('swConfig', config).then(function () {
        // window.addEventListener('load', () => {
        if (sw.controller) {
          _this.log('serviceWorker already registered');
        } else {
          sw.register(config.serviceWorker.path, { scope: config.serviceWorker.scope }).then(function (registration) {
            _this.log('registration successful, scope: %s', registration.scope);
          }, function (err) {
            _this.log('registration failed: %s', err);
          });
        }
        // });
      });
      this._initListeners();
    }
  }, {
    key: '_onRequest',
    value: function _onRequest(hash, cb) {
      var msg = { hash: hash, cb: cb };

      document.dispatchEvent(new CustomEvent('peer:onRequestResource', { detail: msg }));
    }
  }, {
    key: '_onUpdate',
    value: function _onUpdate(hash) {
      document.dispatchEvent(new CustomEvent('peer:onUpdatePeers', { detail: hash }));
    }
  }, {
    key: '_onAddedResource',
    value: function _onAddedResource(hash) {
      document.dispatchEvent(new CustomEvent('peer:onAddedResource', { detail: hash }));
    }
  }, {
    key: '_onRemovedResource',
    value: function _onRemovedResource(hash) {
      document.dispatchEvent(new CustomEvent('peer:onRemovedResource', { detail: hash }));
    }
  }, {
    key: '_onServiceWorkerMessage',
    value: function _onServiceWorkerMessage(event) {
      var _this2 = this;

      this.logDetail('received request for: %o', event.data);

      if (event.data.type === 'addedResource') {
        this._onAddedResource(event.data.hash);
      } else if (event.data.type === 'removedResource') {
        this._onRemovedResource(event.data.hash);
      } else if (event.data.type === 'request') {
        var reply = function reply(response) {
          _this2.logDetail('have received something: %s', response);
          event.ports[0].postMessage(response);
        };
        this._onRequest(event.data.hash, reply);
      } else if (event.data.type === 'heartbeat') {
        this._sendHeartbeat(event);
      } else {
        this.log('cant match request!');
      }
    }
  }, {
    key: '_onClientReady',
    value: function _onClientReady() {
      var msg = { type: 'status', msg: 'ready' };
      this.messageToServiceWorker(msg);
    }
  }, {
    key: '_sendHeartbeat',
    value: function _sendHeartbeat(event) {
      var msg = { type: 'heartbeat' };
      event.ports[0].postMessage(msg);
    }
  }, {
    key: '_onRequestCache',
    value: function _onRequestCache(event) {
      var msg = { type: "cache" };
      this.messageToServiceWorker(msg).then(function (cachedResources) {
        event.detail(cachedResources);
      });
    }
  }, {
    key: '_onRequestResource',
    value: function _onRequestResource(event) {
      var msg = { type: "resource", resource: event.detail.hash };

      this.messageToServiceWorker(msg).then(function (resource) {
        event.detail.cb(resource);
      });
    }
  }, {
    key: '_initListeners',
    value: function _initListeners() {
      if (typeof navigator.serviceWorker === 'undefined') {
        return;
      }
      navigator.serviceWorker.addEventListener('message', this._onServiceWorkerMessage.bind(this));

      document.addEventListener('sw:clientReady', this._onClientReady.bind(this));

      document.addEventListener('sw:onRequestCache', this._onRequestCache.bind(this));

      document.addEventListener('sw:onRequestResource', this._onRequestResource.bind(this));
    }
  }, {
    key: 'messageToServiceWorker',
    value: function messageToServiceWorker(msg) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
          resolve(undefined);
          return;
        }
        var msg_chan = new MessageChannel();
        // Handler for receiving message reply from service worker
        msg_chan.port1.onmessage = function (event) {
          if (event.data.error) {
            resolve(undefined);
          } else {
            resolve(event.data);
          }
        };

        _this3.logDetail('ask service worker for %o', msg);
        // Send message to service worker along with port for reply
        navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
      });
    }
  }]);

  return ServiceWorkerMiddleware;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Signaling = function () {
  function Signaling(config) {
    _classCallCheck(this, Signaling);

    if (config.verbose) {
      this.log = getLogger('p2pCDN:client-signaling');
      this.logDetail = getLogger('p2pCDN:client-signaling:detail');
    } else {
      this.log = function (message) {};
      this.logDetail = function (_) {};
    }

    this.mesh = config.channel;
    this.peerId = config.clientId;
    this.socket = new FayeConnection();
    this._dispatcher();
    this.join();
  }

  _createClass(Signaling, [{
    key: 'join',
    value: function join() {
      this.socket.send(this._getChannel('joined'), { peerId: this.peerId });
    }
  }, {
    key: '_getChannel',
    value: function _getChannel(channel) {
      return this.mesh + '/' + channel;
    }
  }, {
    key: '_dispatcher',
    value: function _dispatcher() {
      this.socket.on(this._getChannel('joined'), this._onJoined.bind(this));
      this.socket.on(this._getChannel('message/' + this.peerId), this._onMessage.bind(this));
    }
  }, {
    key: '_onJoined',
    value: function _onJoined(message) {
      var peerId = message.peerId;

      this.log('client %s has joined.', peerId);
      document.dispatchEvent(new CustomEvent('peer:onNewConnection', { detail: peerId }));
    }
  }, {
    key: '_onMessage',
    value: function _onMessage(message) {
      this.logDetail('received message %o from %s', message.message, message.peerId);
      document.dispatchEvent(new CustomEvent('peer:onSignalingMessage', { detail: { message: message.message, peerId: message.peerId } }));
    }
  }, {
    key: 'send',
    value: function send(to, message) {
      this.logDetail('send message %o to client %s', message, to);
      this.socket.sendTo(this._getChannel('message'), to, { peerId: this.peerId, message: message });
    }
  }]);

  return Signaling;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Peer = function () {
  function Peer(config) {
    _classCallCheck(this, Peer);

    this.config = config;

    if (config.verbose) {
      this.log = getLogger('p2pCDN:peer');
      this.logDetail = getLogger('p2pCDN:peer:detail');
    } else {
      this.log = function (message) {};
      this.logDetail = function (_) {};
    }

    this.signaling = new Signaling(config);
    this.serviceWorker = new ServiceWorkerMiddleware(config);
    this.stunServer = { iceServers: [] };
    if (config.stunServer && config.stunServer.iceServers.length !== 0 && config.stunServer.iceServers[0].urls !== '') {
      this.stunServer = config.stunServer;
    }
    this.peerId = this.config.clientId;
    this.peers = [];
    this.requests = [];
    this.channel = config.channel;
    this.pendingResourceRequests = {};

    this.message = Object.freeze({
      types: {
        addedResource: 1,
        removedResource: 2,
        startedDownload: 3,
        request: 4,
        chunk: 5,
        response: 6
      },
      sizes: { // in byte
        type: 1,
        peerId: config.idLength,
        hash: 64,
        chunkId: 8,
        chunkCount: 8,
        maxData: 65536
      }
    });

    this._registerEvents();
  }

  _createClass(Peer, [{
    key: '_updateUI',
    value: function _updateUI() {
      document.dispatchEvent(new CustomEvent('ui:onUpdate', {
        detail: {
          peerId: this.peerId, peers: this.peers
        }
      }));
    }
  }, {
    key: '_updateSW',
    value: function _updateSW() {
      document.dispatchEvent(new CustomEvent('sw:clientReady'));
    }
  }, {
    key: '_onAddedResource',
    value: function _onAddedResource(event) {
      this.updatePeers(event.detail, this.message.types.addedResource);
      this._updateUI();
    }
  }, {
    key: '_onRemovedResource',
    value: function _onRemovedResource(event) {
      this.updatePeers(event.detail, this.message.types.removedResource);
      this._updateUI();
    }
  }, {
    key: '_onNewConnection',
    value: function _onNewConnection(event) {
      if (event.detail === this.peerId) {
        return;
      }
      this.connectTo(event.detail);
      this._updateUI();
    }
  }, {
    key: '_onRequestResource',
    value: function _onRequestResource(event) {
      var msg = event.detail;
      this.requestResourceFromPeers(msg.hash, msg.cb);
    }
  }, {
    key: '_onSignalingMessage',
    value: function _onSignalingMessage(event) {
      var msg = event.detail;
      this.receiveSignalMessage(msg.peerId, msg.message);
      this._updateUI();
    }
  }, {
    key: '_registerEvents',
    value: function _registerEvents() {
      document.addEventListener('peer:onAddedResource', this._onAddedResource.bind(this));
      document.addEventListener('peer:onRemovedResource', this._onRemovedResource.bind(this));
      document.addEventListener('peer:onNewConnection', this._onNewConnection.bind(this));
      document.addEventListener('peer:onRequestResource', this._onRequestResource.bind(this));
      document.addEventListener('peer:onSignalingMessage', this._onSignalingMessage.bind(this));
    }
  }, {
    key: '_getPeerIdx',
    value: function _getPeerIdx(peerId) {
      return this.peers.map(function (p) {
        return p.id;
      }).indexOf(peerId);
    }
  }, {
    key: '_getPeer',
    value: function _getPeer(peerId) {
      var idx = -1;

      for (var i = 0; i < this.peers.length; i++) {
        if (this.peers[i].id === peerId) {
          idx = i;
          break;
        }
      }

      if (idx >= 0) return this.peers[idx];
      return undefined;
    }
  }, {
    key: '_getRequestId',
    value: function _getRequestId(from, hash) {
      var idx = -1;
      for (var i = 0; i < this.requests.length; i++) {
        if (this.requests[i].from === from && this.requests[i].hash === hash) {
          idx = i;
          break;
        }
      }
      return idx;
    }
  }, {
    key: '_getRequest',
    value: function _getRequest(from, hash) {
      var idx = this._getRequestId(from, hash);

      if (idx >= 0) {
        return this.requests[idx];
      }
      return undefined;
    }
  }, {
    key: '_removeRequest',
    value: function _removeRequest(from, hash) {
      var idx = this._getRequestId(from, hash);

      if (idx >= 0) {
        this.requests.splice(idx, 1);
      }
    }
  }, {
    key: '_onLocalSessionCreated',
    value: function _onLocalSessionCreated(peerId, desc) {
      var _this = this;

      this.logDetail('local session created: %o', desc);

      var peer = this._getPeer(peerId);
      if (typeof peer.con === 'undefined') return;
      peer.con.setLocalDescription(desc).then(function () {
        if (typeof peer.con === 'undefined') return;
        _this.logDetail('sending local desc: %o', peer.con.localDescription);
        _this.signaling.send(peer.id, peer.con.localDescription);
      });
    }
  }, {
    key: '_getStateFor',
    value: function _getStateFor(peer) {
      return peer.dataChannel ? peer.dataChannel.readyState : 'connecting';
    }
  }, {
    key: '_sendViaDataChannel',
    value: function _sendViaDataChannel(peer, message) {
      var state = this._getStateFor(peer);
      var send = function send(msg) {
        try {
          // maximum buffer size is 16mb
          if (peer.dataChannel.bufferedAmount <= 16000000) {
            peer.dataChannel.send(msg);
            return;
          }
          // if maximum buffersize is reached delay sending of chunks
          peer.requestQueue.push(msg);
          peer.dataChannel.bufferedAmountLowThreshold = 65536;
          peer.dataChannel.onbufferedamountlow = function () {
            var reqs = peer.requestQueue.slice();
            peer.requestQueue = [];
            reqs.forEach(function (_msg) {
              return send(_msg);
            });
          };
        } catch (error) {
          if (console) {
            console.log(error);
          }
        }
      };
      switch (state) {
        case 'connecting':
          this.logDetail('connection not open; queueing: %s', message);
          peer.requestQueue.push(message);
          break;
        case 'open':
          send(message);
          if (peer.requestQueue.size >= 1) {
            peer.requestQueue.forEach(function (msg) {
              return send(msg);
            });
            peer.requestQueue = [];
          }
          break;
        case 'closing':
          this.logDetail('attempted to send message while closing: %s', message);
          break;
        case 'closed':
          this.logDetail('attempted to send while connection closed: %s', message);
          break;
      }
    }
  }, {
    key: '_sendToPeer',
    value: function _sendToPeer(peer, msgType, hash) {
      var dataAb = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;

      var typeAb = strToAb(msgType);
      var peerId = "0".repeat(this.message.sizes.peerId - this.peerId.toString().length) + this.peerId;
      var fromAb = strToAb(peerId);
      var hashAb = strToAb(hash);

      var msg = void 0;
      if (dataAb) {
        msg = concatAbs([typeAb, fromAb, hashAb, dataAb]);
      } else {
        msg = concatAbs([typeAb, fromAb, hashAb]);
      }
      this._sendViaDataChannel(peer, msg);
    }
  }, {
    key: '_requestPeer',
    value: function _requestPeer(peer, msgType, hash, cb) {
      var _this2 = this;

      var request = { from: peer.id, hash: hash, chunks: [], respond: cb };

      this.log('Request resource %s from peer %s', hash, peer.id);
      this._sendToPeer(peer, msgType, hash);
      this.requests.push(request);

      // Remove request after timeout to prevent dangling requests
      setTimeout(function () {
        request.respond({ 'error': 'Not finished in time' });
        _this2._removeRequest(peer.id, hash);
      }, 20000);
    }
  }, {
    key: '_addResource',
    value: function _addResource(peer, resource) {
      if (peer.resources.indexOf(resource) === -1) {
        peer.resources.push(resource);
        var index = peer.downloadingResources.indexOf(resource);
        if (index !== -1) {
          this._triggerPendingRequestsFor(peer, resource);
          peer.downloadingResources.splice(index, 1);
        }
        this._updateUI();
      }
    }
  }, {
    key: '_addResourcesFrom',
    value: function _addResourcesFrom(peer, resources) {
      for (var i = 0; i < resources.length; i += 1) {
        this._addResource(peer, resources[i]);
      }
    }
  }, {
    key: '_startedDownloadFrom',
    value: function _startedDownloadFrom(peer, resource) {
      this.log('Peer %s started to download resource %s', peer.id, resource);
      peer.downloadingResources.push(resource);
    }
  }, {
    key: '_removeResourceFrom',
    value: function _removeResourceFrom(peer, resource) {
      var index = peer.resources.indexOf(resource);
      if (index !== -1) {
        peer.resources.splice(index, 1);
        this._updateUI();
      }
    }
  }, {
    key: '_checkCache',
    value: function _checkCache(peer) {
      var _this3 = this;

      var cb = function cb(cachedResources) {
        _this3.logDetail('cached resources %o', cachedResources);
        if (cachedResources && cachedResources.length > 0) {
          if (peer.dataChannel) {
            _this3.logDetail('update %s about cached resources', peer.id);
            _this3._sendToPeer(peer, _this3.message.types.addedResource, cachedResources[0], strToAb(cachedResources.toString()));
          }
        }
      };
      document.dispatchEvent(new CustomEvent('sw:onRequestCache', { detail: cb }));
    }
  }, {
    key: '_abToMessage',
    value: function _abToMessage(ab) {
      var message = {
        type: null,
        from: null,
        hash: null,
        chunkId: null,
        chunkCount: null,
        data: null
      };

      // Get type
      var chunkStart = 0;
      var chunkEnd = this.message.sizes.type;
      var typeAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

      // Get from
      chunkStart = chunkEnd;
      chunkEnd += this.message.sizes.peerId;
      var fromAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

      // Get hash
      chunkStart = chunkEnd;
      chunkEnd += this.message.sizes.hash;
      var resourceAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

      message.type = parseInt(abToStr(typeAb));
      message.from = abToStr(fromAb);
      message.hash = abToStr(resourceAb);

      // Get chunk
      if (message.type === this.message.types.chunk) {
        // Get chunkId
        chunkStart = chunkEnd;
        chunkEnd += this.message.sizes.chunkId;
        var chunkIdAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

        // Get chunkCount
        chunkStart = chunkEnd;
        chunkEnd += this.message.sizes.chunkCount;
        var chunkCountAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

        chunkStart = chunkEnd;
        message.data = new Uint8Array(ab.slice(chunkStart));
        message.chunkId = parseInt(abToStr(chunkIdAb));
        message.chunkCount = parseInt(abToStr(chunkCountAb));
      }

      // Get response
      if (message.type === this.message.types.response || message.type === this.message.types.addedResource) {
        chunkStart = chunkEnd;
        message.data = new Uint8Array(ab.slice(chunkStart));
      }

      return message;
    }
  }, {
    key: '_triggerPendingRequestsFor',
    value: function _triggerPendingRequestsFor(peer, resource) {
      var pendingRequests = this.pendingResourceRequests[peer.id];
      if (typeof pendingRequests === 'undefined' || typeof pendingRequests[resource] === 'undefined') {
        return;
      }
      var resourceRequest = pendingRequests[resource];
      this.requestResourceFromPeers(resource, resourceRequest.cb);
      delete this.pendingResourceRequests[peer.id][resource];
    }
  }, {
    key: '_handleUpdate',
    value: function _handleUpdate(message, type) {
      var peer = this._getPeer(message.from);
      if (!peer) {
        this.logDetail('Could not send update to peer');
        return;
      }

      this.logDetail('updated peer %s with resource %s', message.from, message.hash);
      if (type === this.message.types.addedResource) {
        this._addResourcesFrom(peer, abToStr(message.data).split(','));
        return;
      }
      if (type === this.message.types.startedDownload) {
        this._startedDownloadFrom(peer, message.hash);
        return;
      }
      this._removeResourceFrom(peer, message.hash);
    }
  }, {
    key: '_handleRequest',
    value: function _handleRequest(message) {
      var _this4 = this;

      var cb = function cb(response) {
        _this4._handleResponse(message, response);
      };

      document.dispatchEvent(new CustomEvent('sw:onRequestResource', { detail: {
          hash: message.hash, cb: cb }
      }));
    }
  }, {
    key: '_handleResponse',
    value: function _handleResponse(message, responseAb) {
      var peer = this._getPeer(message.from);
      this.log('Sending request %s to peer: %s', message.hash, message.from);
      if (typeof responseAb === 'undefined' || responseAb.byteLength <= this.message.sizes.maxData) {
        this._sendToPeer(peer, this.message.types.response, message.hash, responseAb);
      } else {
        this._sendChunkedToPeer(peer, message.hash, responseAb);
      }
    }
  }, {
    key: '_handleChunk',
    value: function _handleChunk(message) {
      // this code leads to problems when a peer requests the same resource from the same peer at the same time
      var req = this._getRequest(message.from, message.hash);
      var response = {};
      if (typeof req === 'undefined') return;
      req.chunks.push({ id: message.chunkId, data: message.data });

      if (req.chunks.length === message.chunkCount) {
        response.data = this._concatMessage(req.chunks);
        response.from = message.from;
        response.peerId = this.peerId;
        this._removeRequest(message.from, message.hash);
        req.respond(response);
      }
    }
  }, {
    key: '_handleAnswer',
    value: function _handleAnswer(message) {
      var req = this._getRequest(message.from, message.hash);

      if (req) {
        this._removeRequest(message.from, message.hash);
        message.peerId = this.peerId;
        req.respond(message);
      } else {
        this.logDetail('error, could not find response!?');
      }
    }
  }, {
    key: '_sendChunkedToPeer',
    value: function _sendChunkedToPeer(peer, hash, dataAb) {
      this.logDetail('have to chunk data %s', hash);
      var s = this.message.sizes;
      var dataSize = dataAb.byteLength;
      var chunkSize = s.maxData - (s.peerId + s.hash + s.type + s.chunkId + s.chunkCount);
      var chunkCount = Math.ceil(dataSize / chunkSize);

      var applyPadding = function applyPadding(number, length) {
        var result = number.toString();

        while (result.length < length) {
          result = '0' + result;
        }

        return result;
      };

      var buildChunk = function buildChunk(id, max, dataAb) {
        var idAb = strToAb(id);
        var maxAb = strToAb(max);

        return concatAbs([idAb, maxAb, dataAb]);
      };

      var chunkEnd = chunkSize;
      var chunkId = 0;

      for (var i = 0; i < dataSize; i += chunkSize) {
        var chunkAb = void 0;
        if (i < dataSize) {
          chunkAb = new Uint8Array(dataAb.slice(i, chunkEnd));
        } else {
          chunkAb = new Uint8Array(dataAb.slice(i));
        }
        chunkEnd += chunkSize;

        var id = applyPadding(chunkId, s.chunkId);
        var count = applyPadding(chunkCount, s.chunkCount);
        var chunk = buildChunk(id, count, chunkAb);
        this._sendToPeer(peer, this.message.types.chunk, hash, chunk);
        chunkId += 1;
      }
      this.logDetail('sent chunked data for %s', hash);
    }
  }, {
    key: '_concatMessage',
    value: function _concatMessage(chunks) {
      this.logDetail('concat message');

      chunks.sort(function (a, b) {
        if (a.id < b.id) {
          return -1;
        }
        if (a.id > b.id) {
          return 1;
        }
        return 0;
      });

      return concatAbs(chunks.map(function (c) {
        return c.data;
      }));
    }
  }, {
    key: '_onDataChannelCreated',
    value: function _onDataChannelCreated(peer) {
      var _this5 = this;

      var channel = peer.dataChannel;
      this.logDetail('onDataChannelCreated: %o', channel);

      channel.binaryType = 'arraybuffer';

      channel.onopen = function () {
        _this5.logDetail('data channel opened');
        _this5._checkCache(peer);
      };

      channel.onclose = function () {
        _this5.logDetail('data channel closed');
      };

      channel.onmessage = function (event) {
        var message = _this5._abToMessage(event.data);
        var types = _this5.message.types;

        _this5.logDetail('decoded message %o', message);

        // adapt for deletes
        switch (message.type) {
          case types.update:
            _this5._handleUpdate(message);
            break;
          case types.addedResource:
          case types.removedResource:
          case types.startedDownload:
            _this5._handleUpdate(message, message.type);
            break;
          case types.request:
            _this5._handleRequest(message);
            break;
          case types.chunk:
            _this5._handleChunk(message);
            break;
          case types.response:
            _this5._handleAnswer(message);
            break;
        }
      };
    }
  }, {
    key: 'addPeer',
    value: function addPeer(peerID) {
      var peer = {
        id: peerID,
        con: new RTCPeerConnection(this.stunServer),
        dataChannel: null,
        resources: [],
        requestQueue: [],
        downloadingResources: []
      };
      this.removePeer(peerID);

      this.peers.push(peer);

      return peer;
    }
  }, {
    key: 'connectTo',
    value: function connectTo(peerID) {
      var _this6 = this;

      var isInitiator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      var peer;
      this.logDetail('creating connection as initiator? %s', isInitiator);
      peer = this.addPeer(peerID);

      peer.con.onicecandidate = function (event) {
        _this6.logDetail('icecandidate event: %o', event);

        if (event.candidate) {
          _this6.signaling.send(peer.id, {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate
          });
        }
      };

      peer.con.oniceconnectionstatechange = function (event) {
        if (event.target.iceConnectionState === 'disconnected' || event.target.iceConnectionState === 'closed') {
          _this6.removePeer(peerID);
          _this6.logDetail(event.target.iceConnectionState);
        }
      };

      if (isInitiator) {
        this.logDetail('creating data channel');
        peer.dataChannel = peer.con.createDataChannel('data');
        this._onDataChannelCreated(peer);

        this.logDetail('creating an offer');
        peer.con.createOffer().then(function (desc) {
          _this6._onLocalSessionCreated(peer.id, desc);
        });
      } else {
        peer.con.ondatachannel = function (event) {
          _this6.log('established connection to peer: %s', peer.id);

          peer.dataChannel = event.channel;
          _this6._onDataChannelCreated(peer);
        };
      }
    }
  }, {
    key: '_handleCreateDescriptionError',
    value: function _handleCreateDescriptionError(error) {
      if (console) {
        console.log("Failed to establish peer connection: " + error);
      }
    }
  }, {
    key: 'receiveSignalMessage',
    value: function receiveSignalMessage(peerId, message) {
      var _this7 = this;

      //Todo: ensure that this never happens
      if (!peerId || peerId === this.peerId) {
        return;
      }
      var peer = this._getPeer(peerId);

      // potential loop since connectTo calls this method
      if (!peer) {
        this.connectTo(peerId, false);
        peer = this._getPeer(peerId);
      }
      if (typeof peer.con === 'undefined') return;

      if (message.type === 'offer') {
        this.logDetail('Got offer %o. Sending answer to peer.', message);
        peer.con.setRemoteDescription(message).then(function () {
          if (typeof peer.con === 'undefined') return;
          peer.con.createAnswer().then(function (desc) {
            _this7._onLocalSessionCreated(peer.id, desc);
          });
        }).catch(this._handleCreateDescriptionError);
      } else if (message.type === 'answer') {
        this.logDetail('Got answer. %o', message);
        peer.con.setRemoteDescription(message).catch(this._handleCreateDescriptionError);
      } else if (message.type === 'candidate') {
        peer.con.addIceCandidate(message).then(function () {
          _this7.logDetail('Set addIceCandidate successfully %o', message);
        }).catch(function (e) {
          return _this7.log('error: %o', e);
        });
      }
    }
  }, {
    key: 'removePeer',
    value: function removePeer(peerId) {
      var idx = this._getPeerIdx(peerId);

      if (idx >= 0) {
        this.log('remove peer %s', peerId);
        var con = this.peers[idx].con;
        this.peers[idx].con = null;
        this.peers.splice(idx, 1);

        var i = 0;
        while (i < this.requests.length) {
          var req = this.requests[i];

          if (req.from === peerId) {
            this.logDetail('remove pending request from %s', peerId);
            this.requests.splice(i, 1);
          } else {
            i += 1;
          }
        }
        con.close();
      }
    }
  }, {
    key: 'updatePeers',
    value: function updatePeers(hash, msgType) {
      var _this8 = this;

      if (this.peers.length > 0) {
        this.logDetail('broadcast peers for %s', hash);
        this.peers.forEach(function (peer) {
          _this8._sendToPeer(peer, msgType, hash, strToAb(hash));
        });
      }
    }
  }, {
    key: '_currentlyDownloading',
    value: function _currentlyDownloading(resource) {
      var peers = this.peers.filter(function (p) {
        return p.downloadingResources.indexOf(resource) >= 0;
      });
      return peers;
    }
  }, {
    key: 'requestResourceFromPeers',
    value: function requestResourceFromPeers(hash, cb) {
      this.log('try to find a peer for resource %s', hash);
      var peers = this.peers.filter(function (p) {
        return p.resources.indexOf(hash) >= 0;
      });
      var count = peers.length;
      this.logDetail('found %d peers', count);

      if (count > 0) {
        var randomPeerId = Math.floor(Math.random() * count);
        var peer = peers[randomPeerId];
        this._requestPeer(peer, this.message.types.request, hash, cb);
      } else {
        var _randomPeerId = Math.floor(Math.random() * count);
        peers = this._currentlyDownloading(hash);
        count = peers.length;
        if (count > 0) {
          var _peer = peers[_randomPeerId];
          if (typeof this.pendingResourceRequests[_peer.id] === 'undefined') {
            this.pendingResourceRequests[_peer.id] = {};
          }
          this.pendingResourceRequests[_peer.id][hash] = { 'cb': cb

            // Send a downloading message to other peers even if you are waiting
            // for another download to be finished. Prevents a situation where
            // all peers are trying to download the resource from a single client
          };this.updatePeers(hash, this.message.types.startedDownload);
        } else {
          this.updatePeers(hash, this.message.types.startedDownload);
          cb(undefined);
        }
      }
    }
  }]);

  return Peer;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SystemTest = function () {
  function SystemTest(p2pCDN) {
    _classCallCheck(this, SystemTest);

    this.p2pCDN = p2pCDN;
    this.tests = {
      'webrtcInitialized': false
    };
    this.maxWaitTime = 3000;
    this._initListeners();
  }

  _createClass(SystemTest, [{
    key: 'testBrowser',
    value: function testBrowser() {
      for (var feature in Modernizr) {
        if (Modernizr.hasOwnProperty(feature) && !feature) {
          return false;
        }
      }
      return typeof navigator.serviceWorker !== 'undefined';
    }
  }, {
    key: 'webrtcInitialized',
    value: function webrtcInitialized() {
      return this._executeWithRetry(function () {
        return this.tests.webrtcInitialized;
      }.bind(this));
    }
  }, {
    key: 'clientConnected',
    value: function clientConnected() {
      return this._executeWithRetry(function () {
        if (this.p2pCDN.peer.peers.length === 0) {
          return false;
        }
        var peer = this.p2pCDN.peer.peers[0];
        return this.p2pCDN.peer._getStateFor(peer) === 'open';
      }.bind(this));
    }
  }, {
    key: '_executeWithRetry',
    value: function _executeWithRetry(validator) {
      return new Promise(function (resolve, reject) {
        var result = validator();
        if (validator()) {
          return resolve(true);
        }
        setTimeout(function () {
          resolve(validator());
        }, this.maxWaitTime);
      }.bind(this));
    }
  }, {
    key: '_initListeners',
    value: function _initListeners() {
      document.addEventListener('sw:clientReady', function (event) {
        this.tests.webrtcInitialized = true;
      }.bind(this));
    }
  }]);

  return SystemTest;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var P2pCDN = function () {
  function P2pCDN(config) {
    _classCallCheck(this, P2pCDN);

    if (!config.clientId) return;
    this.systemTest = new SystemTest(this);

    if (!this.systemTest.testBrowser()) return;

    var idLength = config.idLength;
    if (config.logLevel === 'all') {
      localStorage.debug = '*';
    } else {
      localStorage.debug = '*,-*:detail';
    }

    // Fixed id size is needed for binary data transmission via datachannels
    var adjustCount = idLength - config.clientId.toString().length;
    if (adjustCount < 0) {
      config.clientId = config.clientId.slice(0, idLength);
    } else {
      config.clientId = "0".repeat(adjustCount) + config.clientId;
    }

    this.peer = new Peer(config);
  }

  _createClass(P2pCDN, [{
    key: 'systemTest',
    value: function systemTest() {
      return this.systemTest;
    }
  }]);

  return P2pCDN;
}();

module.exports = P2pCDN;
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FayeConnection = function () {
  function FayeConnection() {
    _classCallCheck(this, FayeConnection);

    this.client = new Faye.Client(window.location.origin + '/faye');
  }

  _createClass(FayeConnection, [{
    key: 'on',
    value: function on(channel, callback) {
      this.client.subscribe('/' + channel, callback);
    }
  }, {
    key: 'send',
    value: function send(channel, message) {
      this.client.publish('/' + channel, message);
    }
  }, {
    key: 'sendTo',
    value: function sendTo(channel, to, message) {
      this.client.publish('/' + channel + '/' + to, message);
    }
  }]);

  return FayeConnection;
}();
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*! modernizr 3.6.0 (Custom Build) | MIT *
 * https://modernizr.com/download/?-MessageChannel-applicationcache-cookies-customevent-datachannel-dataview-getusermedia-indexeddb-peerconnection-postmessage-quotamanagement-serviceworker-websockets !*/
!function (e, n, t) {
  function r(e, n) {
    return (typeof e === "undefined" ? "undefined" : _typeof(e)) === n;
  }function o() {
    var e, n, t, o, i, a, s;for (var l in _) {
      if (_.hasOwnProperty(l)) {
        if (e = [], n = _[l], n.name && (e.push(n.name.toLowerCase()), n.options && n.options.aliases && n.options.aliases.length)) for (t = 0; t < n.options.aliases.length; t++) {
          e.push(n.options.aliases[t].toLowerCase());
        }for (o = r(n.fn, "function") ? n.fn() : n.fn, i = 0; i < e.length; i++) {
          a = e[i], s = a.split("."), 1 === s.length ? Modernizr[s[0]] = o : (!Modernizr[s[0]] || Modernizr[s[0]] instanceof Boolean || (Modernizr[s[0]] = new Boolean(Modernizr[s[0]])), Modernizr[s[0]][s[1]] = o), x.push((o ? "" : "no-") + s.join("-"));
        }
      }
    }
  }function i(e, n) {
    return !!~("" + e).indexOf(n);
  }function a() {
    return "function" != typeof n.createElement ? n.createElement(arguments[0]) : k ? n.createElementNS.call(n, "http://www.w3.org/2000/svg", arguments[0]) : n.createElement.apply(n, arguments);
  }function s() {
    var e = n.body;return e || (e = a(k ? "svg" : "body"), e.fake = !0), e;
  }function l(e, t, r, o) {
    var i,
        l,
        u,
        f,
        d = "modernizr",
        c = a("div"),
        p = s();if (parseInt(r, 10)) for (; r--;) {
      u = a("div"), u.id = o ? o[r] : d + (r + 1), c.appendChild(u);
    }return i = a("style"), i.type = "text/css", i.id = "s" + d, (p.fake ? p : c).appendChild(i), p.appendChild(c), i.styleSheet ? i.styleSheet.cssText = e : i.appendChild(n.createTextNode(e)), c.id = d, p.fake && (p.style.background = "", p.style.overflow = "hidden", f = b.style.overflow, b.style.overflow = "hidden", b.appendChild(p)), l = t(c, e), p.fake ? (p.parentNode.removeChild(p), b.style.overflow = f, b.offsetHeight) : c.parentNode.removeChild(c), !!l;
  }function u(e) {
    return e.replace(/([A-Z])/g, function (e, n) {
      return "-" + n.toLowerCase();
    }).replace(/^ms-/, "-ms-");
  }function f(n, t, r) {
    var o;if ("getComputedStyle" in e) {
      o = getComputedStyle.call(e, n, t);var i = e.console;if (null !== o) r && (o = o.getPropertyValue(r));else if (i) {
        var a = i.error ? "error" : "log";i[a].call(i, "getComputedStyle returning null, its possible modernizr test results are inaccurate");
      }
    } else o = !t && n.currentStyle && n.currentStyle[r];return o;
  }function d(n, r) {
    var o = n.length;if ("CSS" in e && "supports" in e.CSS) {
      for (; o--;) {
        if (e.CSS.supports(u(n[o]), r)) return !0;
      }return !1;
    }if ("CSSSupportsRule" in e) {
      for (var i = []; o--;) {
        i.push("(" + u(n[o]) + ":" + r + ")");
      }return i = i.join(" or "), l("@supports (" + i + ") { #modernizr { position: absolute; } }", function (e) {
        return "absolute" == f(e, null, "position");
      });
    }return t;
  }function c(e) {
    return e.replace(/([a-z])-([a-z])/g, function (e, n, t) {
      return n + t.toUpperCase();
    }).replace(/^-/, "");
  }function p(e, n, o, s) {
    function l() {
      f && (delete P.style, delete P.modElem);
    }if (s = r(s, "undefined") ? !1 : s, !r(o, "undefined")) {
      var u = d(e, o);if (!r(u, "undefined")) return u;
    }for (var f, p, v, g, m, h = ["modernizr", "tspan", "samp"]; !P.style && h.length;) {
      f = !0, P.modElem = a(h.shift()), P.style = P.modElem.style;
    }for (v = e.length, p = 0; v > p; p++) {
      if (g = e[p], m = P.style[g], i(g, "-") && (g = c(g)), P.style[g] !== t) {
        if (s || r(o, "undefined")) return l(), "pfx" == n ? g : !0;try {
          P.style[g] = o;
        } catch (y) {}if (P.style[g] != m) return l(), "pfx" == n ? g : !0;
      }
    }return l(), !1;
  }function v(e, n) {
    return function () {
      return e.apply(n, arguments);
    };
  }function g(e, n, t) {
    var o;for (var i in e) {
      if (e[i] in n) return t === !1 ? e[i] : (o = n[e[i]], r(o, "function") ? v(o, t || n) : o);
    }return !1;
  }function m(e, n, t, o, i) {
    var a = e.charAt(0).toUpperCase() + e.slice(1),
        s = (e + " " + T.join(a + " ") + a).split(" ");return r(n, "string") || r(n, "undefined") ? p(s, n, o, i) : (s = (e + " " + z.join(a + " ") + a).split(" "), g(s, n, t));
  }function h(e) {
    var n = b.className,
        t = Modernizr._config.classPrefix || "";if (k && (n = n.baseVal), Modernizr._config.enableJSClass) {
      var r = new RegExp("(^|\\s)" + t + "no-js(\\s|$)");n = n.replace(r, "$1" + t + "js$2");
    }Modernizr._config.enableClasses && (n += " " + t + e.join(" " + t), k ? b.className.baseVal = n : b.className = n);
  }function y(e, n) {
    if ("object" == (typeof e === "undefined" ? "undefined" : _typeof(e))) for (var t in e) {
      O(e, t) && y(t, e[t]);
    } else {
      e = e.toLowerCase();var r = e.split("."),
          o = Modernizr[r[0]];if (2 == r.length && (o = o[r[1]]), "undefined" != typeof o) return Modernizr;n = "function" == typeof n ? n() : n, 1 == r.length ? Modernizr[r[0]] = n : (!Modernizr[r[0]] || Modernizr[r[0]] instanceof Boolean || (Modernizr[r[0]] = new Boolean(Modernizr[r[0]])), Modernizr[r[0]][r[1]] = n), h([(n && 0 != n ? "" : "no-") + r.join("-")]), Modernizr._trigger(e, n);
    }return Modernizr;
  }function C(e, n) {
    var t = e.deleteDatabase(n);t.onsuccess = function () {
      y("indexeddb.deletedatabase", !0);
    }, t.onerror = function () {
      y("indexeddb.deletedatabase", !1);
    };
  }var _ = [],
      w = { _version: "3.6.0", _config: { classPrefix: "", enableClasses: !0, enableJSClass: !0, usePrefixes: !0 }, _q: [], on: function on(e, n) {
      var t = this;setTimeout(function () {
        n(t[e]);
      }, 0);
    }, addTest: function addTest(e, n, t) {
      _.push({ name: e, fn: n, options: t });
    }, addAsyncTest: function addAsyncTest(e) {
      _.push({ name: null, fn: e });
    } },
      Modernizr = function Modernizr() {};Modernizr.prototype = w, Modernizr = new Modernizr();var x = [];Modernizr.addTest("applicationcache", "applicationCache" in e), Modernizr.addTest("cookies", function () {
    try {
      n.cookie = "cookietest=1";var e = -1 != n.cookie.indexOf("cookietest=");return n.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT", e;
    } catch (t) {
      return !1;
    }
  }), Modernizr.addTest("customevent", "CustomEvent" in e && "function" == typeof e.CustomEvent), Modernizr.addTest("dataview", "undefined" != typeof DataView && "getFloat64" in DataView.prototype);var S = "Moz O ms Webkit",
      T = w._config.usePrefixes ? S.split(" ") : [];w._cssomPrefixes = T;var b = n.documentElement,
      k = "svg" === b.nodeName.toLowerCase(),
      E = { elem: a("modernizr") };Modernizr._q.push(function () {
    delete E.elem;
  });var P = { style: E.elem.style };Modernizr._q.unshift(function () {
    delete P.style;
  });var z = w._config.usePrefixes ? S.toLowerCase().split(" ") : [];w._domPrefixes = z, w.testAllProps = m;var N = function N(n) {
    var r,
        o = prefixes.length,
        i = e.CSSRule;if ("undefined" == typeof i) return t;if (!n) return !1;if (n = n.replace(/^@/, ""), r = n.replace(/-/g, "_").toUpperCase() + "_RULE", r in i) return "@" + n;for (var a = 0; o > a; a++) {
      var s = prefixes[a],
          l = s.toUpperCase() + "_" + r;if (l in i) return "@-" + s.toLowerCase() + "-" + n;
    }return !1;
  };w.atRule = N;var O,
      j = w.prefixed = function (e, n, t) {
    return 0 === e.indexOf("@") ? N(e) : (-1 != e.indexOf("-") && (e = c(e)), n ? m(e, n, t) : m(e, "pfx"));
  };!function () {
    var e = {}.hasOwnProperty;O = r(e, "undefined") || r(e.call, "undefined") ? function (e, n) {
      return n in e && r(e.constructor.prototype[n], "undefined");
    } : function (n, t) {
      return e.call(n, t);
    };
  }(), w._l = {}, w.on = function (e, n) {
    this._l[e] || (this._l[e] = []), this._l[e].push(n), Modernizr.hasOwnProperty(e) && setTimeout(function () {
      Modernizr._trigger(e, Modernizr[e]);
    }, 0);
  }, w._trigger = function (e, n) {
    if (this._l[e]) {
      var t = this._l[e];setTimeout(function () {
        var e, r;for (e = 0; e < t.length; e++) {
          (r = t[e])(n);
        }
      }, 0), delete this._l[e];
    }
  }, Modernizr._q.push(function () {
    w.addTest = y;
  }), Modernizr.addAsyncTest(function () {
    var n;try {
      n = j("indexedDB", e);
    } catch (t) {}if (n) {
      var r = "modernizr-" + Math.random(),
          o = n.open(r);o.onerror = function () {
        o.error && "InvalidStateError" === o.error.name ? y("indexeddb", !1) : (y("indexeddb", !0), C(n, r));
      }, o.onsuccess = function () {
        y("indexeddb", !0), C(n, r);
      };
    } else y("indexeddb", !1);
  }), Modernizr.addTest("messagechannel", "MessageChannel" in e), Modernizr.addTest("postmessage", "postMessage" in e), Modernizr.addTest("quotamanagement", function () {
    var e = j("temporaryStorage", navigator),
        n = j("persistentStorage", navigator);return !(!e || !n);
  }), Modernizr.addTest("serviceworker", "serviceWorker" in navigator);var L = !1;try {
    L = "WebSocket" in e && 2 === e.WebSocket.CLOSING;
  } catch (M) {}Modernizr.addTest("websockets", L), Modernizr.addTest("peerconnection", !!j("RTCPeerConnection", e)), Modernizr.addTest("datachannel", function () {
    if (!Modernizr.peerconnection) return !1;for (var n = 0, t = z.length; t > n; n++) {
      var r = e[z[n] + "RTCPeerConnection"];if (r) {
        var o = new r(null);return "createDataChannel" in o;
      }
    }return !1;
  }), Modernizr.addTest("getUserMedia", "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices), o(), delete w.addTest, delete w.addAsyncTest;for (var R = 0; R < Modernizr._q.length; R++) {
    Modernizr._q[R]();
  }e.Modernizr = Modernizr;
}(window, document);
'use strict';

function getLogger(scope) {
  if (typeof debug !== 'undefined') {
    return debug(scope);
  }
  return function () {};
}

function toHex(buffer) {
  var hexCodes = [];
  var view = new DataView(buffer);

  for (var i = 0; i < view.byteLength; i += 4) {
    var value = view.getUint32(i);
    var stringValue = value.toString(16);
    var padding = '00000000';
    var paddedValue = (padding + stringValue).slice(-padding.length);

    hexCodes.push(paddedValue);
  }
  // Join all the hex strings into one
  return hexCodes.join('');
}

function sha256(str) {
  var buffer = new TextEncoder('utf-8').encode(str);

  return crypto.subtle.digest('SHA-256', buffer).then(function (hash) {
    return toHex(hash);
  });
}

function abToStr(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function strToAb(input) {
  var str = input;
  if (typeof input === 'number') str = input.toString();

  var buf = new ArrayBuffer(str.length); // 1 bytes for each char
  var bufView = new Uint8Array(buf);

  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }

  return buf;
}

function concatAbs(abs) {
  var byteLength = 0;
  var length = 0;

  abs.forEach(function (ab) {
    byteLength += ab.byteLength;
  });

  var result = new Uint8Array(byteLength);

  abs.forEach(function (ab) {
    result.set(new Uint8Array(ab), length);
    length += ab.byteLength;
  });

  return result;
}

/***/ })
/******/ ]);