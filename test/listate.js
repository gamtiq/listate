import { expect } from 'chai';
import { createStore } from 'redux';

import listen, * as api from '../src/listate';

describe('listate', function listateTestSuite() {

    /* eslint-disable no-magic-numbers */

    const initState = {
        counter: 0,
        data: {},
        map: {}
    };

    // eslint-disable-next-line require-jsdoc
    function reducer(state, action) {
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

    describe('baseWhen(state, prevState)', () => {
        const { baseWhen } = api;

        it('should return true', () => {
            expect( baseWhen({}, {}) )
                .equal( true );
            expect( baseWhen(1, 2) )
                .equal( true );
            expect( baseWhen('a', 'b') )
                .equal( true );
            expect( baseWhen(false, null) )
                .equal( true );
            expect( baseWhen(0, '') )
                .equal( true );
        });

        it('should return false', () => {
            const state = {};

            expect( baseWhen(state, state) )
                .equal( false );
            expect( baseWhen(7, 7) )
                .equal( false );
            expect( baseWhen('state', 'state') )
                .equal( false );
            expect( baseWhen(null, null) )
                .equal( false );
        });
    });

    describe('listen(store, listener)', () => {
        let listenerCounter;

        beforeEach(() => {
            listenerCounter = 0;
        });

        // eslint-disable-next-line require-jsdoc
        function baseListener() {
            listenerCounter++;
        }

        // eslint-disable-next-line require-jsdoc
        function getListenerCounter() {
            return listenerCounter;
        }

        // eslint-disable-next-line require-jsdoc
        function check(settings) {
            listenerCounter = 0;
            const store = settings.store || createStore(reducer, initState);
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
            listen(store, settings.listener || baseListener);

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

        it('should call listener', () => {
            check({
                listener: {},
                action: {
                    type: 'INC'
                },
                result: 1
            });
        });

        it('should not call listener', () => {
            check({
                listener: {},
            });
            check({
                listener: {},
                action: {
                    type: 'UNKNOWN'
                },
            });
        });

        it('should use function as a listener', () => {
            check({
                action: [
                    {
                        type: 'INC'
                    },
                    {
                        type: 'SET',
                        payload: {
                            key: 'f1',
                            value: 5
                        }
                    }
                ],
                result: 2
            });
        });

        it('should call listener with given context', () => {
            const obj = {
                n: 1,
                handle(data) {
                    this.n += data.state.counter;
                }
            };

            check({
                listener: {
                    handle: obj.handle,
                    context: obj
                },
                action: {
                    type: 'INC',
                    payload: 3
                },
                getResult() {
                    return obj.n;
                },
                result: 4
            });
        });

        it('should pass parameter to listener', () => {
            const suppData = {};
            let param;

            check({
                listener: {
                    data: suppData,
                    filter: (state) => state.counter,
                    handle: (data) => {
                        param = data;
                    },
                },
                action: [
                    {
                        type: 'SET',
                        payload: {
                            key: 'a',
                            value: 1
                        }
                    },
                    {
                        type: 'INC',
                        payload: 3
                    }
                ],
            });

            // eslint-disable-next-line no-unused-expressions
            expect( param )
                .a( 'object' )
                .and.not['null'];
            expect( param.current )
                .equal( 3 );
            expect( param.prev )
                .equal( 0 );
            expect( param.state )
                .eql( {
                    counter: 3,
                    data: initState.data,
                    map: {
                        a: 1
                    }
                } );
            expect( param.prevState )
                .eql( {
                    counter: 0,
                    data: initState.data,
                    map: {
                        a: 1
                    }
                } );
            expect( param.data )
                .equal( suppData );
            expect( param.dispatch )
                .a( 'function' );
            expect( param.unlisten )
                .a( 'function' );
            // eslint-disable-next-line no-unused-expressions
            expect( param.store )
                .a( 'object' )
                .and.not['null'];
        });

        it('should call dispatch in listener', () => {
            let counter;

            const { store } = check({
                listener: {
                    handle: (data) => {
                        baseListener();
                        counter = data.state.counter;
                        if (counter < 2) {
                            data.dispatch({type: 'INC'});
                        }
                    },
                },
                action: [
                    {
                        type: 'SET',
                        payload: {
                            key: 'a',
                            value: 1
                        }
                    },
                    {
                        type: 'INC',
                    },
                    {
                        type: 'SET',
                        payload: {
                            key: 'b',
                            value: 2
                        }
                    },
                    {
                        type: 'INC',
                    }
                ],
                result: 6
            });

            expect( counter )
                .equal( 4 );
            expect( store.getState().counter )
                .equal( counter );
        });

        it('should remove listener in handle', () => {
            check({
                listener: {
                    handle: (data) => {
                        baseListener();
                        if (data.state.counter) {
                            data.unlisten();
                        }
                    },
                },
                action: [
                    {
                        type: 'SET',
                        payload: {
                            key: 'k',
                            value: 0
                        }
                    },
                    {
                        type: 'INC',
                    },
                    {
                        type: 'INC',
                    }
                ],
                result: 2
            });
        });

        it('should return function that can be used to remove listener', () => {
            const store = createStore(reducer, initState);
            const unlisten = listen(store, baseListener);

            store.dispatch({type: 'INC'});
            expect( listenerCounter )
                .equal( 1 );

            unlisten();

            store.dispatch({type: 'INC'});
            expect( listenerCounter )
                .equal( 1 );
        });

        describe('listen(store, {filter: (state) => value, ...})', () => {
            it('should select state part', () => {
                let part;

                check({
                    listener: {
                        filter: (state) => {
                            return {
                                c: state.counter,
                                v: 1
                            };
                        },
                        handle: (data) => {
                            baseListener();
                            part = data.current;
                        },
                    },
                    action: {
                        type: 'INC'
                    },
                    result: 1
                });

                expect( part )
                    .eql({
                        c: 1,
                        v: 1
                    });
            });

            it('should call listener', () => {
                check({
                    listener: {
                        filter: (state) => state.counter,
                    },
                    action: {
                        type: 'INC'
                    },
                    result: 1
                });
            });

            it('should not call listener', () => {
                check({
                    listener: {
                        filter: (state) => state.map,
                    },
                    action: {
                        type: 'INC'
                    },
                });

                check({
                    listener: {
                        filter: (state) => state.data,
                    },
                    action: [
                        {
                            type: 'INC'
                        },
                        {
                            type: 'SET',
                            payload: {
                                key: 'k',
                                value: 'v'
                            }
                        }
                    ],
                });

                check({
                    listener: {
                        filter: () => {},
                    },
                    action: {
                        type: 'INC'
                    },
                });
            });
        });

        describe('listen(store, {when: (current, prev, data) => boolean, ...})', () => {
            it('should call listener', () => {
                check({
                    listener: {
                        filter: (state) => state.counter,
                        when: (current) => current < 5
                    },
                    action: [
                        {
                            type: 'INC'
                        },
                        {
                            type: 'INC',
                            payload: 10
                        },
                        {
                            type: 'INC'
                        }
                    ],
                    result: 1
                });

                check({
                    listener: {
                        filter: (state) => state.map,
                        when: (current, prev) => current.a === prev.a
                    },
                    action: [
                        {
                            type: 'SET',
                            payload: {
                                key: 'a',
                                value: 1
                            }
                        },
                        {
                            type: 'INC',
                        },
                        {
                            type: 'SET',
                            payload: {
                                key: 'b',
                                value: 2
                            }
                        },
                        {
                            type: 'SET',
                            payload: {
                                key: 'a',
                                value: 2
                            }
                        },
                    ],
                    result: 2
                });
            });

            it('should not call listener', () => {
                check({
                    listener: {
                        filter: (state) => state.counter,
                        when: (current) => current === 0
                    },
                    action: {
                        type: 'INC'
                    },
                });

                check({
                    listener: {
                        filter: (state) => state.counter,
                        when: (current, prev) => current > prev
                    },
                    action: [
                        {
                            type: 'INC',
                            payload: -1
                        },
                        {
                            type: 'SET',
                            payload: {
                                key: 's',
                                value: 94
                            }
                        },
                        {
                            type: 'INC',
                            payload: -8
                        },
                    ],
                });

                check({
                    listener: {
                        filter: (state) => state.map,
                        when: (current, prev, data) => current.a !== prev.a && data.state.counter > 0
                    },
                    action: [
                        {
                            type: 'SET',
                            payload: {
                                key: 'a',
                                value: 1
                            }
                        },
                        {
                            type: 'SET',
                            payload: {
                                key: 'a',
                                value: 2
                            }
                        },
                        {
                            type: 'SET',
                            payload: {
                                key: 'a',
                                value: 3
                            }
                        },
                    ],
                });
            });
        });
    });
});
