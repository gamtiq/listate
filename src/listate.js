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
 * Parameter that is passed when calling the listener.
 *
 * @typedef {Object} HandleParam
 *
 * @property {any} current
 *      The current state or a part of the current state if `filter` is set.
 * @property {any} data
 *      The auxiliary data (value of `listener.data` parameter).
 * @property {Function} dispatch
 *      Reference to `dispatch` method of the store.
 * @property {any} prev
 *      The previous state or a part of the previous state if `filter` is set.
 * @property {object} prevState
 *      The previous state.
 * @property {object} state
 *      The current state.
 * @property {module:listate~Store} store
 *      The store for which listener is registered.
 * @property {Function} unlisten
 *      The function that removes/unsubscribes the listener.
 */

/**
 * Check whether current value (state) is not equal previous value (state).
 *
 * Uses `!==` for comparison.
 *
 * @param {object} state
 *      A current value (state).
 * @param {object} prevState
 *      A previous value (state).
 * @return {boolean}
 *      `true` if current value is not equal previous value.
 */
export function baseWhen(state, prevState) {
    return state !== prevState;
}

/**
 * Add/register state change listener for the given store.
 *
 * @example
 * import listen from 'listate';
 *
 * const store = createStore(reducer, initState);
 *
 * listen(store, {
 *     filter: (state) => state.section,
 *     when: (current, prev) => current !== prev && current !== 'exit',
 *     handle: (data) => {
 *         // data.current === state.section
 *         localStorage.setItem('selectedSection', data.current);
 *     }
 * });
 *
 * @param {module:listate~Store} store
 *      Store for which listener should be added/registered.
 * @param {Function | object} listener
 *      Specifies listener that should be called on a state change.
 *      Can be a function or an object that defines listener settings/details.
 * @param {Function} listener.handle
 *      Listener that should be called on a state change.
 * @param {object} [listener.context]
 *      Object that should be used as `this` value when calling the listener.
 * @param {any} [listener.data]
 *      Any data that should be passed into the listener.
 * @param {Function} [listener.filter=(state) => state]
 *      Function (selector) to extract state part which will be used inside `when` to determine
 *      whether the listener should be called. By default the entire state will be used.
 * @param {Function} [listener.when=baseWhen]
 *      Function to determine whether the listener should be called.
 *      The listener will be called if the function returns true.
 *      The following parameters will be passed into the function:
 *
 *    * the current state or a part of the current state if `filter` is set.
 *    * the previous state or a part of the previous state if `filter` is set.
 *    * an object that will be passed into listener.
 *
 * @return {Function}
 *      A function that removes/unsubscribes the listener.
 */
export default function listen(store, listener) {
    const settings = typeof listener === 'function'
                        ? {handle: listener}
                        : listener;
    const { handle, context, data, filter } = settings;
    const when = settings.when || baseWhen;
    let prevState = store.getState();
    let prev = filter
                    ? filter(prevState)
                    : prevState;
    
    const unlisten = store.subscribe(() => {
        const state = store.getState();
        const current = filter
                            ? filter(state)
                            : state;
        const param = {
            current,
            prev,
            state,
            prevState,
            data,
            store,
            dispatch: store.dispatch,
            unlisten
        };
        prevState = state;
        if (when(current, prev, param) && handle) {
            prev = current;
            handle.call(context || null, param);
        }
        else {
            prev = current;
        }
    });

    return unlisten;
}

export { listen };
