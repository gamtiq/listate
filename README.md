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
Use `dist/extra.js` or `dist/extra.min.js` (minified version) to apply extra functions.

## Usage <a name="usage"></a> [&#x2191;](#start)

### ECMAScript 6

```js
import listen from 'listate';
// Or if you need extra functionality
import extListen from 'listate/extra';
```

### Node

```js
const listen = require('listate').listen;
// Or if you need extra functionality
const extListen = require('listate/extra').listen;
```

### AMD

```js
define(['path/to/dist/listate.js', 'path/to/dist/extra.js'], function(listate, extra) {
    const listen = listate.listen;
    // Import extra.js if you need extra functionality
    const extListen = extra.listen;
});
```

### Bower, &lt;script&gt;

```html
<!-- Use bower_components/listate/dist/listate.js and bower_components/listate/dist/extra.js if the library was installed by Bower -->
<script type="text/javascript" src="path/to/dist/listate.js"></script>
<!-- Or if you need extra functionality -->
<script type="text/javascript" src="path/to/dist/extra.js"></script>
<script type="text/javascript">
    // listate is available via listate field of window object
    const listen = listate.listen;
    // Extra functionality is available inside extra namespace
    const extListen = listate.extra.listen;
</script>
```

### Examples <a name="examples"></a> [&#x2191;](#start)

```js
import { createStore } from 'redux';
import listen from 'listate';
import extListen from 'listate/extra';

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
    // One-time listener
    once: true,
    handle(data) {
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
    handle(data) {
        // data.current === state.section
        localStorage.setItem('selectedSection', data.current);
        console.log('Saved section: ', data.current);
    }
});
listen(store, {
    description: 'map change listener',
    context: true,
    filter: (state) => state.map,
    when: (current, prev, data) => current.stat && data.state.user && data.state.section === 'video',
    handle(data) {
        console.log('data.prev:', data.prev);   // {main: {}}
        console.log('data.current:', data.current);   // {main: {}, stat: {a: 1}}
        console.log('this.description:', this.description);   // map change listener
    }
});
extListen(store, {
    filter: {s: 'section', main: 'map.main'},
    handle(data) {
        console.log('extListen: data.prev -', data.prev);
        console.log('extListen: data.current -', data.current);
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
...
store.dispatch({
    type: 'SET_SECTION',
    payload: {
        key: 'main',
        value: {
            content: 'text'
        }
    }
});
```

## API <a name="api"></a> [&#x2191;](#start)

### Base functionality (listate, dist/listate.js)

#### baseWhen(state, prevState): boolean

Checks whether current value (state) is not equal previous value (state).

Returns value of the following comparison: `state !== prevState`.

#### listen(store, listener): Function

Adds/registers state change listener for the given store.

Arguments:

* `store: object` - Store for which listener should be added/registered.
* `listener: Function | object` - Specifies listener that should be called on a state change.
Can be a function or an object that defines listener settings/details.
* `listener.handle: Function` - Listener that should be called on a state change.
* `listener.context: boolean | object` (optional) - Specifies object that should be used as `this` value when calling the listener.
* `listener.data: any` (optional) - Any data that should be passed into the listener.
* `listener.delay: number` (optional) - Specifies that listener should be called after the given number of milliseconds
have elapsed. Works similar to `debounce`: when several requests for the listener call arrive during the specified period
only the last one will be applied after the timeout. `0` means that the listener should be called asynchronuosly.
* `listener.filter: (state) => state.part` (optional) - Function (selector) to extract state part
which will be used inside `when` to determine whether the listener should be called.
By default the entire state will be used.
* `listener.once: boolean` (optional) - Whether the listener should be called just once (by default `false`).
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

### Extra functionality (listate/extra, dist/extra.js)

#### getPathValue(obj, path): any

Return value of specified field path inside given object.

```js
import { getPathValue } from 'listate/extra';
const obj = {
    a: {
        b: {
           c: 'value'
        },
        d: true
    },
    e: 4,
    f: [1, 'z', null]
};
getPathValue(obj, 'a.b.c');   // 'value'
getPathValue(obj, 'a.c');   // undefined
```

#### getObjectPart(source, parts): object

Create an object containing specified parts of the given object.

```js
import { getObjectPart } from 'listate/extra';
const obj = {
    a: {
        b: {
           c: 'value',
           d: true
        },
        e: 4,
        f: [1, 'z', null]
    },
    g: 7,
    h: {
        i: false,
        j: 0
    },
    k: 'king',
    l: 'last'
};
getObjectPart(obj, {f1: 'a.b.d', f2: 'a.f.1', f3: 'g', f4: 'h.j'});   // {f1: true, f2: 'z', f3: 7, f4: 0}
```

#### getFieldFilter(path): Function

Return a function that extracts value of the specified field path inside a given object.

```js
import { getFieldFilter } from 'listate/extra';
const filter = getFieldFilter('a.d');
const obj = {
    a: {
        b: {
           c: 'value'
        },
        d: 17
    },
    e: 4,
    f: [1, 'z', null]
};
filter(obj);   // 17
```

#### getPartFilter(parts): Function

Return a function that creates an object containing the specified parts of a given object.

```js
import { getPartFilter } from 'listate/extra';
const filter = getPartFilter({f1: 'a.b.c', f2: 'h.j', f3: 'k'});
const obj = {
    a: {
        b: {
           c: 'value',
           d: true
        },
        e: 4,
        f: [1, 'z', null]
    },
    g: 7,
    h: {
        i: false,
        j: 0
    },
    k: 'king',
    l: 'last'
};
filter(obj);   // {f1: 'value', f2: 0, f3: 'king'}
```

#### unlike(state, prevState, deep): boolean

Check whether current object (state) is not equal previous object (state) comparing values of their fields.

```js
import { unlike } from 'listate/extra';
unlike({a: 1, b: 2}, {a: 1, b: 2});   // false
unlike({a: 1, b: {c: 3}}, {a: 1, b: {c: 3}});   // true
unlike({a: 1, b: {c: 3}}, {a: 1, b: {c: 3}}, true);   // false
```

#### unlikeDeep(state, prevState): boolean

Check whether current object (state) is not equal previous object (state) deeply comparing values of their fields.

The same as `unlike(state, prevState, true)`.

#### listen(store, listener): Function

Add/register state change listener for the given store.

It is a wrap around base `listate.listen` that supports the following enhanced listener settings:

* `listener.filter`.
When an array or an object is passed, the used filter will be result of `getPartFilter(listener.filter)`.
When a string is passed, the used filter will be result of `getFieldFilter(listener.filter)`.
* `listener.when`. By default `unlike` is used.

See `doc` folder for details.

## Contributing <a name="contributing"></a> [&#x2191;](#start)
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality.
Lint and test your code.

## License <a name="license"></a> [&#x2191;](#start)
Copyright (c) 2017-2019 Denis Sikuler  
Licensed under the MIT license.
