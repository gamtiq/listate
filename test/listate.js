import { expect } from 'chai';

import { baseListener, checkListen, getListenerCounter, getStore, initState, resetListenerCounter } from './_helper';

import listen, * as api from '../src/listate';

describe('listate', function listateTestSuite() {

    /* eslint-disable no-magic-numbers */

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
        beforeEach(resetListenerCounter);

        // eslint-disable-next-line require-jsdoc
        function check(settings) {
            return checkListen(Object.assign({listen}, settings));
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

        it('should call listener once', () => {
            check({
                listener: {
                    filter: (state) => state.counter,
                    once: true
                },
                action: [
                    {
                        type: 'INC'
                    },
                    {
                        type: 'INC',
                        payload: 2392
                    },
                    {
                        type: 'INC'
                    },
                ],
                result: 1
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
            const store = getStore();
            const unlisten = listen(store, baseListener);

            store.dispatch({type: 'INC'});
            expect( getListenerCounter() )
                .equal( 1 );

            unlisten();

            store.dispatch({type: 'INC'});
            expect( getListenerCounter() )
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

        describe('listen(store, {delay: number, ...})', () => {
            it('should call listener after specified delay', (done) => {
                check({
                    listener: {
                        delay: 200
                    },
                    action: {
                        type: 'INC'
                    },
                });

                setTimeout(() => {
                    expect( getListenerCounter() )
                        .equal( 1 );
                    done();
                }, 300);
            });

            it('should cancel scheduled listener call and slate another call', (done) => {
                const { store } = check({
                    listener: {
                        delay: 300
                    },
                    action: {
                        type: 'INC'
                    },
                });

                setTimeout(() => {
                    expect( getListenerCounter() )
                        .equal( 0 );
                    store.dispatch({type: 'INC'});
                }, 100);

                setTimeout(() => {
                    expect( getListenerCounter() )
                        .equal( 0 );
                }, 350);

                setTimeout(() => {
                    expect( getListenerCounter() )
                        .equal( 1 );
                    done();
                }, 500);
            });

            it('should call listener once', (done) => {
                const { store } = check({
                    listener: {
                        delay: 200
                    },
                    action: {
                        type: 'INC'
                    },
                });

                setTimeout(() => {
                    store.dispatch({type: 'INC'});
                }, 100);

                setTimeout(() => {
                    store.dispatch({type: 'INC'});
                }, 200);

                setTimeout(() => {
                    store.dispatch({type: 'INC'});
                }, 300);

                setTimeout(() => {
                    store.dispatch({type: 'INC'});
                }, 400);

                setTimeout(() => {
                    expect( getListenerCounter() )
                        .equal( 1 );
                    done();
                }, 700);
            });

            it('should call listener once because of "once" setting', (done) => {
                const { store } = check({
                    listener: {
                        delay: 100,
                        once: true
                    },
                    action: {
                        type: 'INC'
                    },
                });

                setTimeout(() => {
                    store.dispatch({type: 'INC'});
                }, 150);

                setTimeout(() => {
                    store.dispatch({type: 'INC'});
                }, 300);

                setTimeout(() => {
                    expect( getListenerCounter() )
                        .equal( 1 );
                    done();
                }, 450);
            });

            it('should call listener with fixed parameter', (done) => {
                let param;

                const { store } = check({
                    listener: {
                        filter: (state) => state.counter,
                        when: (current) => current < 3,
                        handle: (data) => {
                            baseListener();
                            param = data;
                        },
                        delay: 200,
                    },
                    action: {
                        type: 'INC'
                    },
                });

                setTimeout(() => {
                    store.dispatch({type: 'INC'});
                }, 100);

                setTimeout(() => {
                    store.dispatch({type: 'INC'});
                }, 200);

                setTimeout(() => {
                    store.dispatch({type: 'INC'});
                }, 250);

                setTimeout(() => {
                    expect( store.getState().counter )
                        .equal( 4 );
                    expect( getListenerCounter() )
                        .equal( 1 );
                    
                    // eslint-disable-next-line no-unused-expressions
                    expect( param )
                        .a( 'object' )
                        .and.not['null'];
                    expect( param.current )
                        .equal( 2 );
                    expect( param.prev )
                        .equal( 1 );
                    expect( param.state )
                        .eql( {
                            counter: 2,
                            data: initState.data,
                            map: initState.map
                        } );
                    expect( param.prevState )
                        .eql( {
                            counter: 1,
                            data: initState.data,
                            map: initState.map
                        } );
                    expect( param.store )
                        .equal( store );
                    
                    done();
                }, 400);
            });
        });
    });
});
