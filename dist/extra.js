(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports', './listate'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require('./listate'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.listate);
        global.listate = global.listate || {};
        global.listate.extra = mod.exports;
    }
})(this, function (exports, _listate) {
    'use strict';

    exports.__esModule = true;
    exports.listen = undefined;
    exports.getPathValue = getPathValue;
    exports.getObjectPart = getObjectPart;
    exports.getFieldFilter = getFieldFilter;
    exports.getPartFilter = getPartFilter;
    exports.unlike = unlike;
    exports.unlikeDeep = unlikeDeep;
    exports.default = listen;

    var _listate2 = _interopRequireDefault(_listate);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _defineProperty(obj, key, value) {
        if (key in obj) {
            Object.defineProperty(obj, key, {
                value: value,
                enumerable: true,
                configurable: true,
                writable: true
            });
        } else {
            obj[key] = value;
        }

        return obj;
    }

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
    } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

    /**
     * Return value of specified field path inside given object.
     *
     * @example
     * const obj = {
     *     a: {
     *         b: {
     *            c: 'value'
     *         },
     *         d: true
     *     },
     *     e: 4,
     *     f: [1, 'z', null]
     * };
     *
     * getPathValue(obj, 'a.b.c');   // 'value'
     * getPathValue(obj, 'a.d');   // true
     * getPathValue(obj, 'e');   // 4
     * getPathValue(obj, 'f.1');   // 'z'
     * getPathValue(obj, 'g');   // undefined
     * getPathValue(obj, 'a.c');   // undefined
     * getPathValue(obj, 'e.a');   // undefined
     * getPathValue(obj, 'f.8');   // undefined
     *
     * @param {object} obj
     *      The object to traverse.
     * @param {string} path
     *      Dot-delimited path to a field whose value should be returned.
     * @return {any}
     *      Value of the field or `undefined` when the field is not found inside the object.
     */
    function getPathValue(obj, path) {
        var field = path.split('.');
        var len = field.length;
        var i = 0;
        var value = obj;
        var undef = void 0;
        while (i < len && value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
            value = value[field[i++]];
        }

        return i < len ? undef : value;
    }

    /**
     * Create an object containing specified parts of the given object.
     *
     * @example
     * const obj = {
     *     a: {
     *         b: {
     *            c: 'value',
     *            d: true
     *         },
     *         e: 4,
     *         f: [1, 'z', null]
     *     },
     *     g: 7,
     *     h: {
     *         i: false,
     *         j: 0
     *     },
     *     k: 'king',
     *     l: 'last'
     * };
     *
     * getObjectPart(obj, {f1: 'a.b.d', f2: 'a.f.1', f3: 'g', f4: 'h.j'});   // {f1: true, f2: 'z', f3: 7, f4: 0}
     * getObjectPart(obj, ['k', 'l']);   // {k: 'king', l: 'last'}
     * getObjectPart(obj, 'g');   // {g: 7}
     *
     * @param {object} source
     *      A source object that should be processed.
     * @param {array | object | string} parts
     *      Specifies which parts of the source object should be extracted.
     *      Parts are described as an object of the following form:
     *      `{resultField1: 'path.to.source.part1', resultField2: 'path.to.part2', ...}`.
     *      Each field of the object is a property name of resulting object
     *      whose value is the value of specified source object part.  
     *      String value `'field'` is equal to `{field: 'field'}`.  
     *      Array value `['a', 'b', 'c', ...]` is equal to `{a: 'a', b: 'b', c: 'c', ...}`.
     * @return {object}
     *      Object that contains the extracted parts of the source object.
     * @see {@link module:listate/extra.getPathValue getPathValue}
     */
    function getObjectPart(source, parts) {
        var partMap = void 0;
        if (typeof parts === 'string') {
            partMap = _defineProperty({}, parts, parts);
        } else if (Array.isArray(parts)) {
            partMap = {};
            for (var i = 0, len = parts.length; i < len; i++) {
                partMap[parts[i]] = parts[i];
            }
        } else {
            partMap = parts;
        }

        var result = {};
        for (var key in partMap) {
            result[key] = getPathValue(source, partMap[key]);
        }

        return result;
    }

    /**
     * Return a function that extracts value of the specified field path inside a given object.
     *
     * @example
     * const filter = getFieldFilter('a.d');
     * 
     * const obj = {
     *     a: {
     *         b: {
     *            c: 'value'
     *         },
     *         d: 17
     *     },
     *     e: 4,
     *     f: [1, 'z', null]
     * };
     *
     * filter(obj);   // 17
     * filter({a: 1, b: 2});   // undefined
     *
     * @param {string} path
     *      Dot-delimited path to a field whose value should be extracted.
     * @return {Function}
     *      A function that extracts value of the specified field path inside a given object.
     * @see {@link module:listate/extra.getPathValue getPathValue}
     */
    function getFieldFilter(path) {
        return function (obj) {
            return getPathValue(obj, path);
        };
    }

    /**
     * Return a function that creates an object containing the specified parts of a given object.
     *
     * @example
     * const filter = getPartFilter({f1: 'a.b.c', f2: 'h.j', f3: 'k'});
     * 
     * const obj = {
     *     a: {
     *         b: {
     *            c: 'value',
     *            d: true
     *         },
     *         e: 4,
     *         f: [1, 'z', null]
     *     },
     *     g: 7,
     *     h: {
     *         i: false,
     *         j: 0
     *     },
     *     k: 'king',
     *     l: 'last'
     * };
     *
     * filter(obj);   // {f1: 'value', f2: 0, f3: 'king'}
     * filter({a: 1, b: 2, k: 73});   // {f1: undefined, f2: undefined, f3: 73}
     *
     * @param {array | object | string} parts
     *      Specifies which parts should be extracted (see {@link module:listate/extra.getObjectPart getObjectPart}).
     * @return {Function}
     *      A function that creates an object containing the specified parts of a given object.
     * @see {@link module:listate/extra.getObjectPart getObjectPart}
     */
    function getPartFilter(parts) {
        return function (obj) {
            return getObjectPart(obj, parts);
        };
    }

    // eslint-disable-next-line max-params, require-jsdoc
    function isDifferentValue(state, prevState, field, deep) {
        var value = state[field];
        var prevValue = prevState[field];

        return value !== prevValue && (!deep || unlike(value, prevValue, deep)); // eslint-disable-line no-use-before-define
    }

    /**
     * Check whether current object (state) is not equal previous object (state)
     * comparing values of their fields.
     *
     * @example
     * unlike({a: 1}, {a: 2});   // true
     * unlike({a: 1, b: 2}, {a: 1});   // true
     * unlike({a: 1, b: 2}, {a: 1, b: 2});   // false
     * unlike({a: 1, b: {c: 3}}, {a: 1, b: {c: 3}});   // true
     * unlike({a: 1, b: {c: 3}}, {a: 1, b: {c: 3}}, true);   // false
     *
     * @param {object} state
     *      A current object (state).
     * @param {object} prevState
     *      A previous object (state).
     * @param {boolean} [deep=false]
     *      When `true` recursively calls the function to compare fields having object values.
     *      By default shallow equality comparison (`!==`) is used.
     * @return {boolean}
     *      `true` if current object is not equal previous object.
     */
    function unlike(state, prevState, deep) {
        if (state && prevState && (typeof state === 'undefined' ? 'undefined' : _typeof(state)) === 'object' && (typeof prevState === 'undefined' ? 'undefined' : _typeof(prevState)) === 'object') {
            var isArrayState = Array.isArray(state);
            var isArrayPrevState = Array.isArray(prevState);
            if (isArrayState && isArrayPrevState) {
                var len = state.length;
                if (len === prevState.length) {
                    for (var i = 0; i < len; i++) {
                        if (isDifferentValue(state, prevState, i, deep)) {
                            return true;
                        }
                    }
                } else {
                    return true;
                }
            } else if (isArrayState || isArrayPrevState) {
                return true;
            } else {
                var key = void 0;
                for (key in state) {
                    if (!(key in prevState) || isDifferentValue(state, prevState, key, deep)) {
                        return true;
                    }
                }
                for (key in prevState) {
                    if (!(key in state)) {
                        return true;
                    }
                }
            }

            return false;
        }

        return state !== prevState;
    }

    /**
     * Check whether current object (state) is not equal previous object (state)
     * deeply comparing values of their fields.
     *
     * The same as `{@link module:listate/extra.unlike unlike}(state, prevState, true)`.
     *
     * @param {object} state
     *      A current object (state).
     * @param {object} prevState
     *      A previous object (state).
     * @return {boolean}
     *      `true` if current object is not equal previous object.
     * @see {@link module:listate/extra.unlike unlike}
     */
    function unlikeDeep(state, prevState) {
        return unlike(state, prevState, true);
    }

    /**
     * Add/register state change listener for the given store.
     *
     * It is a wrap around {@link module:listate.listen listate.listen} that supports enhanced listener settings.
     *
     * @param {module:listate~Store} store
     *      Store for which listener should be added/registered.
     * @param {Function | object} listener
     *      Specifies listener that should be called on a state change.
     *      Can be a function or an object that defines listener settings/details.
     *      Settings are the same as for {@link module:listate.listate listate.listate} with the following exceptions.
     * @param {Array | Function | object | string} [listener.filter=(state) => state]
     *      Specifies which state part will be used inside `when` to determine
     *      whether the listener should be called.
     *      When an array or an object is passed, the used filter will be result of
     *      {@link module:listate/extra.getPartFilter getPartFilter(listener.filter)}.
     *      When a string is passed, the used filter will be result of
     *      {@link module:listate/extra.getFieldFilter getFieldFilter(listener.filter)}.
     * @param {Function} [listener.when=unlike]
     *      Function to determine whether the listener should be called.
     *      By default {@link module:listate/extra.unlike unlike} is used.
     * @return {Function}
     *      A function that removes/unsubscribes the listener.
     */
    function listen(store, listener) {
        var settings = void 0;
        if (typeof listener === 'function') {
            settings = { handle: listener };
        } else {
            settings = {};
            for (var key in listener) {
                settings[key] = listener[key];
            }
        }
        if (!settings.when) {
            settings.when = unlike;
        }
        var _settings = settings,
            filter = _settings.filter;

        if (filter) {
            var filterType = typeof filter === 'undefined' ? 'undefined' : _typeof(filter);
            if (filterType === 'object') {
                settings.filter = getPartFilter(filter);
            } else if (filterType === 'string') {
                settings.filter = getFieldFilter(filter);
            }
        }

        return (0, _listate2.default)(store, settings);
    }

    exports.listen = listen;
});
//# sourceMappingURL=extra.js.map