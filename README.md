# listate <a name="start"></a>

Library to listen/observe/watch changes of Redux store state.

[![NPM version](https://badge.fury.io/js/listate.png)](http://badge.fury.io/js/listate)
[![Build Status](https://secure.travis-ci.org/gamtiq/listate.png?branch=master)](http://travis-ci.org/gamtiq/listate)

## Table of contents

* [Installation](#install)
* [Usage](#usage)
* [Examples](#examples)
* [API](#api)
* [Contributing](#contributing)
* [License](#license)

## Installation <a name="install"></a> [&#x2191;](#start)

### Node

    npm install listate

### [Bower](http://bower.io)

    bower install listate

### AMD, &lt;script&gt;

Use `dist/listate.js` or `dist/listate.min.js` (minified version).

## Usage <a name="usage"></a> [&#x2191;](#start)

### ECMAScript 6

```js
import listen from 'listate';
```

### Node

```js
const listen = require('listate').listen;
```

### [Duo](http://duojs.org)

```js
const listen = require('gamtiq/listate').listen;
```

### AMD

```js
define(['path/to/dist/listate.js'], function(listate) {
    const listen = listate.listen;
});
```

### Bower, &lt;script&gt;

```html
<!-- Use bower_components/listate/dist/listate.js if the library was installed by Bower -->
<script type="text/javascript" src="path/to/dist/listate.js"></script>
<script type="text/javascript">
    // listate is available via listate field of window object
    const listen = listate.listen;
</script>
```

### Examples <a name="examples"></a> [&#x2191;](#start)

```js
import { createStore } from 'redux';
import listen from 'listate';

const initState = {
    user: null,
    section: '',
    map: {
        main: {}
    }
};

function reducer(state, action) {
    const { payload } = action;
    let newState;
    switch (action.type) {
        case 'AUTH':
            return Object.assign({}, state, {user: payload});
        case 'SELECT_SECTION':
            return Object.assign({}, state, {section: payload});
        case 'SET_SECTION':
            newState = Object.assign({}, state);
            newState.map = Object.assign({}, state.map);
            newState.map[payload.key] = payload.value;
            return newState;
        default:
            return state;
    }
}

const store = createStore(reducer, initState);

listen(store, {
    data: 'main',
    filter: (state) => state.user,
    handle: (data) => {
        // One-time listener
        data.unlisten();
        // Dispatch any action
        data.dispatch({
            type: 'SELECT_SECTION',
            // data.current === state.user, data.data === 'main'
            payload: data.current.favoriteSection || localStorage.getItem('selectedSection') || data.data
        });
    }
});
listen(store, {
    filter: (state) => state.section,
    when: (current, prev) => current !== prev && current !== 'exit',
    // Call the listener no more frequently than once per second
    delay: 1000,
    handle: (data) => {
        // data.current === state.section
        localStorage.setItem('selectedSection', data.current);
        console.log('Saved section: ', data.current);
    }
});
listen(store, {
    filter: (state) => state.map,
    when: (current, prev, data) => current.stat && data.state.user && data.state.section === 'video',
    handle: (data) => {
        console.log('data.prev:', data.prev);   // {main: {}}
        console.log('data.current:', data.current);   // {main: {}, stat: {a: 1}}
        
    }
});
...
store.dispatch({
    type: 'AUTH',
    payload: {login: 'commander'}
});
...
store.dispatch({
    type: 'SELECT_SECTION',
    payload: 'video'
});
...
store.dispatch({
    type: 'SET_SECTION',
    payload: {
        key: 'stat',
        value: {
            a: 1
        }
    }
});
...
store.dispatch({
    type: 'SELECT_SECTION',
    payload: 'news'
});
```

## API <a name="api"></a> [&#x2191;](#start)

### baseWhen(state, prevState): boolean

Checks whether current value (state) is not equal previous value (state).

Returns value of the following comparison: `state !== prevState`.

### listen(store, listener): Function

Adds/registers state change listener for the given store.

Arguments:

* `store: object` - Store for which listener should be added/registered.
* `listener: Function | object` - Specifies listener that should be called on a state change.
Can be a function or an object that defines listener settings/details.
* `listener.handle: Function` - Listener that should be called on a state change.
* `listener.context: object` (optional) - Object that should be used as `this` value when calling the listener.
* `listener.data: any` (optional) - Any data that should be passed into the listener.
* `listener.delay: number` (optional) - Specifies that listener should be called after the given number of milliseconds
have elapsed. Works similar to `debounce`: when several requests for the listener call arrive during the specified period
only the last one will be applied after the timeout.
* `listener.filter: (state) => state.part` (optional) - Function (selector) to extract state part
which will be used inside `when` to determine whether the listener should be called.
By default the entire state will be used.
* `listener.when: (current, prev, data) => boolean` (optional) - Function to determine
whether the listener should be called. By default `baseWhen` is used.
The listener will be called if the function returns true.
The following parameters will be passed into the function:

    - The current state or a part of the current state if `filter` is set.
    - The previous state or a part of the previous state if `filter` is set.
    - An object that will be passed into listener.

Returns a function that removes/unsubscribes the listener.

An object with the following fileds will be passed as parameter into the listener:

* `current: any` - The current state or a part of the current state if `filter` is set.
* `prev: any` - The previous state or a part of the previous state if `filter` is set.
* `state: object` - The current state.
* `prevState: object` - The previous state.
* `data: any` - The auxiliary data (value of `listener.data` parameter).
* `store: object` - The store for which listener is registered.
* `dispatch: Function` - Reference to `dispatch` method of the store.
* `unlisten: Function` - The function that removes/unsubscribes the listener.

See `doc` folder for details.

## Contributing <a name="contributing"></a> [&#x2191;](#start)
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality.
Lint and test your code.

## License <a name="license"></a> [&#x2191;](#start)
Copyright (c) 2017 Denis Sikuler  
Licensed under the MIT license.
