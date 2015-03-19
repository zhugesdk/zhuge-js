/*
 * Zhuge JS Library v1.2
 *
 * Copyright 2015, 37degree, Inc. All Rights Reserved
 * http://37degree.com/
 *
 * Includes portions of Underscore.js
 * http://underscorejs.org/
 * (c) 2009-2014 Jeremy Ashkenas, DocumentCloud Inc.
 * Released under the MIT License.
 */
(function() {
    var ArrayProto = Array.prototype,
        ObjProto = Object.prototype,
        slice = ArrayProto.slice,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty,
        windowConsole = window.console,
        navigator = window.navigator,
        document = window.document,
        userAgent = navigator.userAgent;

    var _ = {},
        SDK_VERSION = '1.2',
        HTTP_PROTOCOL = ("https:" == document.location.protocol) ? "https://" : "http://",
        USE_XHR = window.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest(),
        DEBUG = false,
        DEFAULT_CONFIG = {
            api_host: HTTP_PROTOCOL + 'apipool.37degree.com/web_event/?method=web_event_srv.upload',
            debug: false,
            ping : false,
            ping_interval: 12000,
            idle_timeout: 300000,
            idle_threshold: 10000,
            track_link_timeout: 300,
            cookie_expire_days: 365,
            cookie_cross_subdomain: true,
            cookie_secure: false,
            info_upload_interval_days: 7,
            session_interval_mins: 30,
            app_channel: 'web',
            app_version: '1.0'
        };

    // UNDERSCORE
    // Embed part of the Underscore Library
    (function() {
        var nativeForEach = ArrayProto.forEach,
            nativeIsArray = Array.isArray,
            breaker = {};

        _.each = function(obj, iterator, context) {
            if (obj == null) return;
            if (nativeForEach && obj.forEach === nativeForEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
                }
            } else {
                for (var key in obj) {
                    if (hasOwnProperty.call(obj, key)) {
                        if (iterator.call(context, obj[key], key, obj) === breaker) return;
                    }
                }
            }
        };

        _.extend = function(obj) {
            _.each(slice.call(arguments, 1), function(source) {
                for (var prop in source) {
                    if (source[prop] !== void 0) obj[prop] = source[prop];
                }
            });
            return obj;
        };

        _.isUndefined = function(obj) {
            return obj === void 0;
        };

        _.isString = function(obj) {
            return toString.call(obj) == '[object String]';
        };

        _.isArray = nativeIsArray || function(obj) {
            return toString.call(obj) === '[object Array]';
        };

        _.isFunction = function(f) {
            try {
                return /^\s*\bfunction\b/.test(f);
            } catch (x) {
                return false;
            }
        };

        _.isObject = function(obj) {
            return (obj === Object(obj) && !_.isArray(obj));
        };

        _.includes = function(str, needle) {
            return str.indexOf(needle) !== -1;
        };
    })();

    // Underscore Addons
    _.truncate = function(obj, length) {
        var ret;

        if (typeof(obj) === "string") {
            ret = obj.slice(0, length);
        } else if (_.isArray(obj)) {
            ret = [];
            _.each(obj, function(val) {
                ret.push(_.truncate(val, length));
            });
        } else if (_.isObject(obj)) {
            ret = {};
            _.each(obj, function(val, key) {
                ret[key] = _.truncate(val, length);
            });
        } else {
            ret = obj;
        }

        return ret;
    };

    _.strip_empty_properties = function(p) {
        var ret = {};
        _.each(p, function(v, k) {
            if (_.isString(v) && v.length > 0) {
                ret[k] = v;
            }
        });
        return ret;
    };

    _.JSONEncode = (function() {
        return function(mixed_val) {
            var indent;
            var value = mixed_val;
            var i;

            var quote = function(string) {
                var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
                var meta = { // table of character substitutions
                    '\b': '\\b',
                    '\t': '\\t',
                    '\n': '\\n',
                    '\f': '\\f',
                    '\r': '\\r',
                    '"': '\\"',
                    '\\': '\\\\'
                };

                escapable.lastIndex = 0;
                return escapable.test(string) ?
                    '"' + string.replace(escapable, function(a) {
                        var c = meta[a];
                        return typeof c === 'string' ? c :
                            '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                    }) + '"' :
                    '"' + string + '"';
            };

            var str = function(key, holder) {
                var gap = '';
                var indent = '    ';
                var i = 0; // The loop counter.
                var k = ''; // The member key.
                var v = ''; // The member value.
                var length = 0;
                var mind = gap;
                var partial = [];
                var value = holder[key];

                // If the value has a toJSON method, call it to obtain a replacement value.
                if (value && typeof value === 'object' &&
                    typeof value.toJSON === 'function') {
                    value = value.toJSON(key);
                }

                // What happens next depends on the value's type.
                switch (typeof value) {
                    case 'string':
                        return quote(value);

                    case 'number':
                        // JSON numbers must be finite. Encode non-finite numbers as null.
                        return isFinite(value) ? String(value) : 'null';

                    case 'boolean':
                    case 'null':
                        // If the value is a boolean or null, convert it to a string. Note:
                        // typeof null does not produce 'null'. The case is included here in
                        // the remote chance that this gets fixed someday.

                        return String(value);

                    case 'object':
                        // If the type is 'object', we might be dealing with an object or an array or
                        // null.
                        // Due to a specification blunder in ECMAScript, typeof null is 'object',
                        // so watch out for that case.
                        if (!value) {
                            return 'null';
                        }

                        // Make an array to hold the partial results of stringifying this object value.
                        gap += indent;
                        partial = [];

                        // Is the value an array?
                        if (toString.apply(value) === '[object Array]') {
                            // The value is an array. Stringify every element. Use null as a placeholder
                            // for non-JSON values.

                            length = value.length;
                            for (i = 0; i < length; i += 1) {
                                partial[i] = str(i, value) || 'null';
                            }

                            // Join all of the elements together, separated with commas, and wrap them in
                            // brackets.
                            v = partial.length === 0 ? '[]' :
                                gap ? '[\n' + gap +
                                partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                                '[' + partial.join(',') + ']';
                            gap = mind;
                            return v;
                        }

                        // Iterate through all of the keys in the object.
                        for (k in value) {
                            if (hasOwnProperty.call(value, k)) {
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                }
                            }
                        }

                        // Join all of the member texts together, separated with commas,
                        // and wrap them in braces.
                        v = partial.length === 0 ? '{}' :
                            gap ? '{' + partial.join(',') + '' +
                            mind + '}' : '{' + partial.join(',') + '}';
                        gap = mind;
                        return v;
                }
            };

            // Make a fake root object containing our value under the key of ''.
            // Return the result of stringifying the value.
            return str('', {
                '': value
            });
        };
    })();

    _.JSONDecode = (function() { // https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
        var at, // The index of the current character
            ch, // The current character
            escapee = {
                '"': '"',
                '\\': '\\',
                '/': '/',
                'b': '\b',
                'f': '\f',
                'n': '\n',
                'r': '\r',
                't': '\t'
            },
            text,
            error = function(m) {
                throw {
                    name: 'SyntaxError',
                    message: m,
                    at: at,
                    text: text
                };
            },
            next = function(c) {
                // If a c parameter is provided, verify that it matches the current character.
                if (c && c !== ch) {
                    error("Expected '" + c + "' instead of '" + ch + "'");
                }
                // Get the next character. When there are no more characters,
                // return the empty string.
                ch = text.charAt(at);
                at += 1;
                return ch;
            },
            number = function() {
                // Parse a number value.
                var number,
                    string = '';

                if (ch === '-') {
                    string = '-';
                    next('-');
                }
                while (ch >= '0' && ch <= '9') {
                    string += ch;
                    next();
                }
                if (ch === '.') {
                    string += '.';
                    while (next() && ch >= '0' && ch <= '9') {
                        string += ch;
                    }
                }
                if (ch === 'e' || ch === 'E') {
                    string += ch;
                    next();
                    if (ch === '-' || ch === '+') {
                        string += ch;
                        next();
                    }
                    while (ch >= '0' && ch <= '9') {
                        string += ch;
                        next();
                    }
                }
                number = +string;
                if (!isFinite(number)) {
                    error("Bad number");
                } else {
                    return number;
                }
            },

            string = function() {
                // Parse a string value.
                var hex,
                    i,
                    string = '',
                    uffff;
                // When parsing for string values, we must look for " and \ characters.
                if (ch === '"') {
                    while (next()) {
                        if (ch === '"') {
                            next();
                            return string;
                        }
                        if (ch === '\\') {
                            next();
                            if (ch === 'u') {
                                uffff = 0;
                                for (i = 0; i < 4; i += 1) {
                                    hex = parseInt(next(), 16);
                                    if (!isFinite(hex)) {
                                        break;
                                    }
                                    uffff = uffff * 16 + hex;
                                }
                                string += String.fromCharCode(uffff);
                            } else if (typeof escapee[ch] === 'string') {
                                string += escapee[ch];
                            } else {
                                break;
                            }
                        } else {
                            string += ch;
                        }
                    }
                }
                error("Bad string");
            },
            white = function() {
                // Skip whitespace.
                while (ch && ch <= ' ') {
                    next();
                }
            },
            word = function() {
                // true, false, or null.
                switch (ch) {
                    case 't':
                        next('t');
                        next('r');
                        next('u');
                        next('e');
                        return true;
                    case 'f':
                        next('f');
                        next('a');
                        next('l');
                        next('s');
                        next('e');
                        return false;
                    case 'n':
                        next('n');
                        next('u');
                        next('l');
                        next('l');
                        return null;
                }
                error("Unexpected '" + ch + "'");
            },
            value, // Placeholder for the value function.
            array = function() {
                // Parse an array value.
                var array = [];

                if (ch === '[') {
                    next('[');
                    white();
                    if (ch === ']') {
                        next(']');
                        return array; // empty array
                    }
                    while (ch) {
                        array.push(value());
                        white();
                        if (ch === ']') {
                            next(']');
                            return array;
                        }
                        next(',');
                        white();
                    }
                }
                error("Bad array");
            },
            object = function() {
                // Parse an object value.
                var key,
                    object = {};

                if (ch === '{') {
                    next('{');
                    white();
                    if (ch === '}') {
                        next('}');
                        return object; // empty object
                    }
                    while (ch) {
                        key = string();
                        white();
                        next(':');
                        if (Object.hasOwnProperty.call(object, key)) {
                            error('Duplicate key "' + key + '"');
                        }
                        object[key] = value();
                        white();
                        if (ch === '}') {
                            next('}');
                            return object;
                        }
                        next(',');
                        white();
                    }
                }
                error("Bad object");
            };

        value = function() {
            // Parse a JSON value. It could be an object, an array, a string,
            // a number, or a word.
            white();
            switch (ch) {
                case '{':
                    return object();
                case '[':
                    return array();
                case '"':
                    return string();
                case '-':
                    return number();
                default:
                    return ch >= '0' && ch <= '9' ? number() : word();
            }
        };

        // Return the json_parse function. It will have access to all of the
        // above functions and variables.
        return function(source) {
            var result;

            text = source;
            at = 0;
            ch = ' ';
            result = value();
            white();
            if (ch) {
                error("Syntax error");
            }

            return result;
        };
    })();

    _.HTTPBuildQuery = function(formdata, arg_separator) {
        var key, use_val, use_key, tmp_arr = [];

        if (typeof(arg_separator) === "undefined") {
            arg_separator = '&';
        }

        _.each(formdata, function(val, key) {
            use_val = encodeURIComponent(val.toString());
            use_key = encodeURIComponent(key);
            tmp_arr[tmp_arr.length] = use_key + '=' + use_val;
        });

        return tmp_arr.join(arg_separator);
    };

    _.getQueryParam = function(url, param) {
        param = param.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&#]" + param + "=([^&#]*)",
            regex = new RegExp( regexS ),
            results = regex.exec(url);
        if (results === null || (results && typeof(results[1]) !== 'string' && results[1].length)) {
            return '';
        } else {
            return decodeURIComponent(results[1]).replace(/\+/g, ' ');
        }
    };

    _.register_event = (function() {
        var register_event = function(element, type, handler, oldSchool) {
            if (!element) {
                console.error("No valid element provided to register_event");
                return;
            }

            if (element.addEventListener && !oldSchool) {
                element.addEventListener(type, handler, false);
            } else {
                var ontype = 'on' + type;
                var old_handler = element[ontype]; // can be undefined
                element[ontype] = makeHandler(element, handler, old_handler);
            }
        };

        function makeHandler(element, new_handler, old_handlers) {
            var handler = function(event) {
                event = event || fixEvent(window.event);

                if (!event) {
                    return undefined;
                }

                var ret = true;
                var old_result, new_result;

                if (_.isFunction(old_handlers)) {
                    old_result = old_handlers(event);
                }
                new_result = new_handler.call(element, event);

                if ((false === old_result) || (false === new_result)) {
                    ret = false;
                }

                return ret;
            };

            return handler;
        };

        function fixEvent(event) {
            if (event) {
                event.preventDefault = fixEvent.preventDefault;
                event.stopPropagation = fixEvent.stopPropagation;
            }
            return event;
        };
        fixEvent.preventDefault = function() {
            this.returnValue = false;
        };
        fixEvent.stopPropagation = function() {
            this.cancelBubble = true;
        };

        return register_event;
    })();

    _.cookie = {
        get: function(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length,c.length));
            }
            return null;
        },

        parse: function(name) {
            var cookie;
            try {
                cookie = _.JSONDecode(_.cookie.get(name)) || {};
            } catch (err) {}
            return cookie;
        },

        set: function(name, value, days, cross_subdomain, is_secure) {
            var cdomain = "", expires = "", secure = "";

            if (cross_subdomain) {
                var matches = document.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i)
                    , domain = matches ? matches[0] : '';

                cdomain   = ((domain) ? "; domain=." + domain : "");
            }

            if (days) {
                var date = new Date();
                date.setTime(date.getTime()+(days*24*60*60*1000));
                expires = "; expires=" + date.toGMTString();
            }

            if (is_secure) {
                secure = "; secure";
            }

            document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/" + cdomain + secure;
        },

        remove: function(name, cross_subdomain) {
            _.cookie.set(name, '', -1, cross_subdomain);
        }
    };

    _.UUID = (function() {

        // Time/ticks information
        // 1*new Date() is a cross browser version of Date.now()
        var T = function() {
            var d = 1*new Date()
            , i = 0;

            // this while loop figures how many browser ticks go by
            // before 1*new Date() returns a new number, ie the amount
            // of ticks that go by per millisecond
            while (d == 1*new Date()) { i++; }

            return d.toString(16) + i.toString(16);
        };

        // Math.Random entropy
        var R = function() {
            return Math.random().toString(16).replace('.','');
        };

        // User agent entropy
        // This function takes the user agent string, and then xors
        // together each sequence of 8 bytes.  This produces a final
        // sequence of 8 bytes which it returns as hex.
        var UA = function(n) {
            var ua = userAgent, i, ch, buffer = [], ret = 0;

            function xor(result, byte_array) {
                var j, tmp = 0;
                for (j = 0; j < byte_array.length; j++) {
                    tmp |= (buffer[j] << j*8);
                }
                return result ^ tmp;
            }

            for (i = 0; i < ua.length; i++) {
                ch = ua.charCodeAt(i);
                buffer.unshift(ch & 0xFF);
                if (buffer.length >= 4) {
                    ret = xor(ret, buffer);
                    buffer = [];
                }
            }

            if (buffer.length > 0) { ret = xor(ret, buffer); }

            return ret.toString(16);
        };

        return function() {
            var se = (screen.height*screen.width).toString(16);
            return (T()+"-"+R()+"-"+UA()+"-"+se+"-"+T());
        };
    })();

    _.info = {
        campaignParams: function() {
            var campaign_keywords = 'utm_source utm_medium utm_campaign utm_content utm_term'.split(' ')
                , kw = ''
                , params = {};
            _.each(campaign_keywords, function(kwkey) {
                kw = _.getQueryParam(document.URL, kwkey);
                if (kw.length) {
                    params[kwkey] = kw;
                }
            });

            return params;
        },

        searchEngine: function(referrer) {
            if (referrer.search('https?://(.*)google.([^/?]*)') === 0) {
                return 'google';
            } else if (referrer.search('https?://(.*)baidu.com') === 0) {
                return 'baidu';
            } else if (referrer.search('https?://(.*)sogou.com') === 0) {
                return 'sogou';
            } else if (referrer.search('https?://(.*)haosou.com') === 0) {
                return 'haosou';
            } else {
                return null;
            }
        },

        searchKeyword: function(referrer) {
            var search = _.info.searchEngine(referrer);

            if (search == 'google') {
                return _.getQueryParam(referrer, 'q');
            } else if (search == 'baidu') {
                return _.getQueryParam(referrer, 'wd');
            } else if (search == 'sogou') {
                return _.getQueryParam(referrer, 'query');
            } else if (search == 'haosou') {
                return _.getQueryParam(referrer, 'q');
            } else {
                return null;                
            }
        },

        referringDomain: function(referrer) {
            var split = referrer.split("/");
            if (split.length >= 3) {
                return split[2];
            }
            return "";
        },

        browser: function(user_agent, vendor, opera) {
            var vendor = vendor || ''; // vendor is undefined for at least IE9
            if (opera) {
                if (_.includes(user_agent, "Mini")) {
                    return "Opera Mini";
                }
                return "Opera";
            } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
                return 'BlackBerry';
            } else if (_.includes(user_agent, "FBIOS")) {
                return "Facebook Mobile";
            } else if (_.includes(user_agent, "Chrome")) {
                return "Chrome";
            } else if (_.includes(user_agent, "CriOS")) {
                return "Chrome iOS";
            } else if (_.includes(vendor, "Apple")) {
                if (_.includes(user_agent, "Mobile")) {
                    return "Mobile Safari";
                }
                return "Safari";
            } else if (_.includes(user_agent, "Android")) {
                return "Android Mobile";
            } else if (_.includes(user_agent, "Konqueror")) {
                return "Konqueror";
            } else if (_.includes(user_agent, "Firefox")) {
                return "Firefox";
            } else if (_.includes(user_agent, "MSIE") || _.includes(user_agent, "Trident/")) {
                return "Internet Explorer";
            } else if (_.includes(user_agent, "Gecko")) {
                return "Mozilla";
            } else {
                return "";
            }
        },

        os: function() {
            var a = userAgent;
            if (/Windows/i.test(a)) {
                if (/Phone/.test(a)) {
                    return 'Windows Mobile';
                }
                return 'Windows';
            } else if (/(iPhone|iPad|iPod)/.test(a)) {
                return 'iOS';
            } else if (/Android/.test(a)) {
                return 'Android';
            } else if (/(BlackBerry|PlayBook|BB10)/i.test(a)) {
                return 'BlackBerry';
            } else if (/Mac/i.test(a)) {
                return 'Mac OS X';
            } else if (/Linux/.test(a)) {
                return 'Linux';
            } else {
                return '';
            }
        },

        device: function(user_agent) {
            if (/iPad/.test(user_agent)) {
                return 'iPad';
            } else if (/iPod/.test(user_agent)) {
                return 'iPod Touch';
            } else if (/iPhone/.test(user_agent)) {
                return 'iPhone';
            } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
                return 'BlackBerry';
            } else if (/Windows Phone/i.test(user_agent)) {
                return 'Windows Phone';
            } else if (/Android/.test(user_agent)) {
                return 'Android';
            } else {
                return '';
            }
        },

        resolution: function() {
            return screen.width + '*' + screen.height;
        },

        properties: function() {
            var referrer = document.referrer;
            return _.strip_empty_properties({
                'os': _.info.os(),
                'br': _.info.browser(userAgent, navigator.vendor, window.opera),
                'dv': _.info.device(userAgent),
                'rs': _.info.resolution(),
                'search': _.info.searchEngine(referrer),
                'keyword': _.info.searchKeyword(referrer),
                'url': document.URL,
                'referrer': referrer,
                'referrer_domain': _.info.referringDomain(referrer)
            });
        }
    };

    // Console override
    var console = {
        log: function() {
            if (DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
                try {
                    windowConsole.log.apply(windowConsole, arguments);
                } catch (err) {
                    _.each(arguments, function(arg) {
                        windowConsole.log(arg);
                    });
                }
            }
        },
        error: function() {
            if (DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
                var args = ["Zhuge error:"].concat(_.toArray(arguments));
                try {
                    windowConsole.error.apply(windowConsole, args);
                } catch (err) {
                    _.each(args, function(arg) {
                        windowConsole.error(arg);
                    });
                }
            }
        }
    };

    var ZGCookie = function(config) {
        this.name = "_zg";
        this['props'] = {};
        this['config'] = _.extend({}, config);

        this.load();
    };

    ZGCookie.prototype.load = function() {
        var cookie = _.cookie.parse(this.name);
        if (cookie) {
            this['props'] = _.extend({}, cookie);
        }
    };

    ZGCookie.prototype.save = function() {
        _.cookie.set(
            this.name,
            _.JSONEncode(this['props']),
            this['config']['cookie_expire_days'],
            this['config']['cookie_cross_subdomain'],
            this['config']['cookie_secure']
        );
    };

    ZGCookie.prototype.register_once = function(props, default_value) {
        if (_.isObject(props)) {
            if (typeof(default_value) === 'undefined') { default_value = "None"; }
            _.each(props, function(val, prop) {
                if (!this['props'][prop] || this['props'][prop] === default_value) {
                    this['props'][prop] = val;
                }
            }, this);
            this.save();
            return true;
        }
        return false;
    };

    ZGCookie.prototype.register = function(props) {
        if (_.isObject(props)) {
            _.extend(this['props'], props);
            this.save();
            return true;
        }
        return false;
    };

    var ZGTracker = function() {
        this['config'] = {};
        _.extend(this['config'], DEFAULT_CONFIG);
        this.idle = 0;
        this.last_activity = new Date();
    };
    
    ZGTracker.prototype._init = function(key, config) {
        this._key = key;
        this['_jsc'] = function() {};
        if (_.isObject(config)) {
            _.extend(this['config'], config);
            DEBUG = DEBUG || this['config']['debug'];
        }
        this['cookie'] = new ZGCookie(this['config']);
        this['cookie'].register_once({'uuid': _.UUID(), 'sid': 0, 'updated': 0, 'info': 0}, "");
        this._session();
        this._info();
        this._startPing();
    };

    ZGTracker.prototype._session = function() {
        var updated = this['cookie']['props']['updated'];
        var sid = this['cookie']['props']['sid'];
        var now = (1 * new Date())/1000;

        if(sid == 0 || now > updated + this['config']['session_interval_mins']*60) {
            if(sid > 0 && updated > 0) {
                var se = {};
                se.et = 'se';
                se.sid = sid;
                se.dr = Math.round((updated - sid)*1000)/1000;
                this._batchTrack(se);
            }

            sid = now;

            var ss = {};
            ss.et = 'ss';
            ss.sid = sid;
            ss.cn = this['config']['app_channel'];
            ss.vn = this['config']['app_version'];
            ss.pr = _.extend(_.info.properties(), _.info.campaignParams());
            this._batchTrack(ss);
            this['cookie'].register({'sid': sid}, "");
        }
        this['cookie'].register({'updated': now}, "");
    };

    ZGTracker.prototype._info = function() {
        var lastUpdated = this['cookie']['props']['info'];
        var now = 1 * new Date();
        if(now > lastUpdated + this['config']['info_upload_interval_days']*24*60*60*1000) {
            var evt = {};
            evt.et = 'info';
            evt.pr = _.extend(_.info.properties(),{'cn':this['config']['app_channel'],'vn':this['config']['app_version']});
            this._batchTrack(evt);
            this['cookie'].register({'info': now}, "");
        }
    };

    ZGTracker.prototype.debug = function(debug) {
        DEBUG = debug;
    };

    ZGTracker.prototype.identify = function(uid, props, callback) {
        this['cookie'].register({'cuid': uid}, "");
        this._session();
        var evt = {};
        evt.et = 'idf';
        evt.cuid = uid;
        evt.pr = props;
        evt.sid = this['cookie']['props']['sid'];
        this._batchTrack(evt, callback);
    };

    ZGTracker.prototype.page = function(page, callback) {
        this._session();
        var url = document.location.href;
        var evt = {};
        evt.et = 'pg';
        evt.pid = url;
        evt.pn = typeof(page) === "undefined" ? url : page;
        evt.tl = document.title;
        evt.ref = document.referrer;
        evt.sid = this['cookie']['props']['sid'];
        this._batchTrack(evt, callback);
    };

    ZGTracker.prototype.track = function(eventName, properties, callback) {
        this._session();
        var evt = {};
        evt.et = 'cus';
        evt.eid = eventName;
        evt.pr = properties;
        evt.sid = this['cookie']['props']['sid'];
        this._batchTrack(evt, callback);
    };

    ZGTracker.prototype.trackLink = function(links, eventName, properties) {
        if (!links) return this;
        if (!_.isArray(links)) links = [links]; // always arrays

        var self = this;
        _.each(links, function(el) {
            var handler = function(e) {
                self.track(eventName, properties);

                if (el.href && el.target !== '_blank' && !e.metaKey && e.which !== 2) {
                    e.preventDefault();
                    window.setTimeout(function() {
                        window.location.href = el.href;
                    }, this['config']['track_link_timeout']);
                }
            };
            _.register_event(el, 'click', handler);
        });

        return this;
    };

    ZGTracker.prototype.trackForm = function(forms, eventName, properties) {
        if (!forms) return this;
        if (!_.isArray(forms)) forms = [forms]; // always arrays


        var self = this;
        _.each(forms, function(el) {
            var handler = function(e) {
                e.preventDefault();
                self.track(eventName, properties);

                window.setTimeout(function() {
                    el.submit();
                }, TRACK_LINK_TIMEOUT);
            };

            // support the events happening through jQuery or Zepto instead of through
            // the normal DOM API, since `el.submit` doesn't bubble up events...
            var $ = window.jQuery || window.Zepto;
            if ($) {
                $(el).submit(handler);
            } else {
                _.register_event(el, 'submit', handler);
            }
        });

        return this;
    };

    ZGTracker.prototype._moved = function(e) {
        this.last_activity = new Date();
        this.idle = 0;
    };

    ZGTracker.prototype._startPing = function() {
        var self = this;
        _.register_event(window, 'mousemove', function() {
            self._moved.apply(self, arguments);
        });

        if (typeof this.pingInterval === 'undefined') {
            this.pingInterval = window.setInterval(function() {
                self._ping();
            }, this['config']['ping_interval']);
        }
    };

    ZGTracker.prototype._stopPing = function() {
        if (typeof this.pingInterval !== 'undefined') {
            window.clearInterval(this.pingInterval);
            delete this.pingInterval;
        }
    };

    ZGTracker.prototype._ping = function() {
        if (this['config']['ping'] && this.idle < this['config']['idle_timeout']) {
            var evt = {};
            evt.type = 'ping';
            evt.sdk = 'web';
            evt.sdkv = SDK_VERSION;
            evt.ak = this._key;
            evt.did = this['cookie']['props']['uuid'];
            evt.cuid = this['cookie']['props']['cuid'];
            this._sendTrackRequest(evt);
        } else {
            this._stopPing();
        }

        var now = new Date();
        if (now - this.last_activity > this['config']['idle_threshold']) {
            this.idle = now - this.last_activity;
        }

        return this;
    };

    ZGTracker.prototype._batchTrack = function(evt, callback) {
        var batch = {};
        batch.type = 'statis';
        batch.sdk = 'web';
        batch.sdkv = SDK_VERSION;
        batch.cn = this['config']['app_channel'];
        batch.vn = this['config']['app_version'];
        batch.ak = this._key;
        batch.did = this['cookie']['props']['uuid'];
        batch.cuid = this['cookie']['props']['cuid'];
        batch.ts = (1*new Date())/1000;
        var data = [];
        data.push(evt);
        batch.data = data;

        this._sendTrackRequest(batch, this._prepareCallback(callback, batch));
    };

    ZGTracker.prototype._prepareCallback = function(callback, data) {
        if (_.isUndefined(callback)) {
            return null;
        }

        if (USE_XHR) {
            var callback_function = function(response) {
                callback(response, data);
            };

            return callback_function;
        } else {
            var jsc = this['_jsc'],
                randomized_cb = '' + Math.floor(Math.random() * 100000000),
                callback_string = 'zhuge_jsc["' + randomized_cb + '"]';
            jsc[randomized_cb] = function(response) {
                delete jsc[randomized_cb];
                callback(response, data);
            };
            return callback_string;
        }
    };

    ZGTracker.prototype._sendTrackRequest = function(evt, callback) {
        var truncated_data = _.truncate(evt, 255),
            json_data = _.JSONEncode(truncated_data);

        console.log("ZHUGE REQUEST DATA:");
        console.log(truncated_data);

        data = {
            'event': json_data,
            '_': new Date().getTime().toString()
        };
        var url = this['config']['api_host'] + '&' + _.HTTPBuildQuery(data);

        this._sendRequest(url, callback);
    };

    ZGTracker.prototype._sendRequest = function(url, callback) {
        if (USE_XHR) {
            var req = new XMLHttpRequest();
            req.open("GET", url, true);
            // 支持自定义cookie http://www.html5rocks.com/en/tutorials/cors/
            req.withCredentials = true;
            req.onreadystatechange = function(e) {
                if (req.readyState === 4) { 
                    if (req.status !== 200) {
                        var error = 'Bad HTTP status: ' + req.status + ' ' + req.statusText;
                        console.error(error);
                    }
                    if (callback) callback(req.status);
                }
            };
            req.send(null);
        } else {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.async = true;
            script.defer = true;
            script.src = url;
            var s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(script, s);
        }
    };

    ZGTracker.prototype.push = function(args) {
        var method = args.shift();
        if (!this[method]) return;
        this[method].apply(this, args);
    };

    var zhugeq = window.zhuge || [];
    var zhuge = new ZGTracker();

    while (zhugeq && zhugeq.length > 0) {
        var args = zhugeq.shift();
        var method = args.shift();
        if (zhuge[method]) zhuge[method].apply(zhuge, args);
    }

    window.zhuge = zhuge;
})();