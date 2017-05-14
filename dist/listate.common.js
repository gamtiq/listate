'use strict';

exports.__esModule = true;
exports.baseWhen = baseWhen;
exports.default = listen;
/*
 * listate
 * https://github.com/gamtiq/listate
 *
 * Copyright (c) 2017 Denis Sikuler
 * Licensed under the MIT license.
 */

/**
 * Library for listening on changes of Redux store state.
 * 
 * @module listate
 */

/**
 * Store object.
 *
 * @typedef {Object} Store
 *
 * @property {Function} dispatch
 *      Dispatches an action to trigger a state change.
 * @property {Function} getState
 *      Returns the current state.
 * @property {Function} subscribe
 *      Adds a change listener.
 */

/**
 * Check whether current value (state) is no equal previous value (state).
 *
 * Uses `!==` for comparison.
 *
 * @param {object} state
 *      A current value (state).
 * @param {object} prevState
 *      A previous value (state).
 * @return {boolean}
 *      `true` if current value is no equal previous value.
 */
function baseWhen(state, prevState) {
    return state !== prevState;
}

/**
 * Add/register state change listener for the given store.
 *
 * @param {Store} store
 *      Store for which listener should be added/registered.
 * @param {Function | object} listener
 *      Specifies listener that should be called on a state change.
 *      Can be a function or an object that defines listener settings/details.
 * @param {Function} listener.callback
 *      Listener that should be called on a state change.
 * @param {object} [listener.context]
 *      Object that should be used as `this` value when calling the listener.
 * @param {Function} [listener.filter=(state) => state]
 *      Function (selector) to extract state part which will be used inside `when` to determine
 *      whether the listener should be called. By default the entire state will be used.
 * @param {Function} [listener.when=baseWhen]
 *      Function to determine whether the listener should be called.
 *      The listener will be called if the function returns true.
 *      The following parameters will be passed into the function:
 *
 *      * the current state or a part of the current state if `filter` is set.
 *      * the previous state or a part of the previous state if `filter` is set.
 *      * an object that will be passed into listener.
 *
 * @return {Function}
 *      A function that removes/unsubscribes the listener.
 */
function listen(store, listener) {
    var settings = typeof listener === 'function' ? { callback: listener } : listener;
    var callback = settings.callback,
        context = settings.context,
        filter = settings.filter;

    var when = settings.when || baseWhen;
    var prevState = store.getState();

    var unlisten = store.subscribe(function () {
        var state = store.getState();
        var current = filter ? filter(state) : state;
        var prev = filter ? filter(prevState) : prevState;
        var param = {
            current: current,
            prev: prev,
            state: state,
            prevState: prevState,
            store: store,
            dispatch: store.dispatch,
            unlisten: unlisten
        };
        prevState = state;
        if (when(current, prev, param) && callback) {
            callback.call(context || null, param);
        }
    });

    return unlisten;
}

exports.listen = listen;
