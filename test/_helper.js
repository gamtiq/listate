import { expect } from 'chai';
import { createStore } from 'redux';

export const initState = {
    counter: 0,
    data: {},
    map: {}
};

// eslint-disable-next-line require-jsdoc
export function reducer(state, action) {
    const { payload } = action;
    let newState;
    switch (action.type) {
        case 'INC':
            newState = Object.assign({}, state);
            newState.counter += typeof payload === 'number'
                                    ? payload
                                    : 1;

            return newState;
        case 'SET':
            newState = Object.assign({}, state);
            newState.map = Object.assign({}, state.map);
            newState.map[payload.key] = payload.value;

            return newState;
        default:
            return state;
    }
}

// eslint-disable-next-line require-jsdoc
export function getStore() {
    return createStore(reducer, initState);
}

let listenerCounter;

// eslint-disable-next-line require-jsdoc
export function baseListener() {
    listenerCounter++;
}

// eslint-disable-next-line require-jsdoc
export function getListenerCounter() {
    return listenerCounter;
}

// eslint-disable-next-line require-jsdoc
export function resetListenerCounter() {
    listenerCounter = 0;
}

// eslint-disable-next-line require-jsdoc
export function checkListen(settings) {
    resetListenerCounter();
    const store = settings.store || getStore();
    // eslint-disable-next-line no-nested-ternary
    const actionList = Array.isArray(settings.action)
                        ? settings.action
                        : (settings.action
                            ? [settings.action]
                            : []);
    const len = actionList.length;

    if (settings.listener && ! settings.listener.handle) {
        settings.listener.handle = baseListener;
    }
    settings.listen(store, settings.listener || baseListener);

    for (let i = 0; i < len; i++) {
        store.dispatch( actionList[i] );
    }

    expect( (settings.getResult || getListenerCounter)() )
        .equal( ('result' in settings)
                    ? settings.result
                    : 0 );
    
    return {
        store
    };
}

