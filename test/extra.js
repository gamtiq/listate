import { expect } from 'chai';

import { checkListen, resetListenerCounter } from './_helper';

import * as api from '../src/extra';

describe('extra', function extraTestSuite() {
    let undef;

    /* eslint-disable no-magic-numbers */

    const testObj = {
        a: {
            b: {
                c: {
                    d: 1,
                    e: 2,
                    f: 'value'
                },
                g: null,
                h: {
                    i: ['first', 'second', {t: 'third'} ]
                }
            },
            j: false,
            k: {}
        },
        l: 'last',
        m: {
            n: 'next',
            o: {
                p: [9, 8, 7, 6, 5],
                q: 'quattro'
            }
        },
        r: {
            s: 2
        }
    };

    describe('getPathValue(obj, path)', () => {
        const { getPathValue } = api;

        it('should return path value', () => {
            expect( getPathValue(testObj, 'a') )
                .equal( testObj.a );
            expect( getPathValue(testObj, 'a.b') )
                .equal( testObj.a.b );
            expect( getPathValue(testObj, 'a.b.c.d') )
                .equal( testObj.a.b.c.d );
            expect( getPathValue(testObj, 'a.b.c.f') )
                .equal( testObj.a.b.c.f );
            expect( getPathValue(testObj, 'a.b.g') )
                .equal( testObj.a.b.g );
            expect( getPathValue(testObj, 'a.b.h.i.2.t') )
                .equal( testObj.a.b.h.i[2].t );
            expect( getPathValue(testObj, 'a.j') )
                .equal( testObj.a.j );
            expect( getPathValue(testObj, 'a.k') )
                .equal( testObj.a.k );
            expect( getPathValue(testObj, 'l') )
                .equal( testObj.l );
        });

        it('should return undefined', () => {
            expect( getPathValue(testObj, 'x') )
                .equal( undef );
            expect( getPathValue(testObj, 'a.x') )
                .equal( undef );
            expect( getPathValue(testObj, 'a.b.c.x') )
                .equal( undef );
            expect( getPathValue(testObj, 'a.b.h.i.x') )
                .equal( undef );
            expect( getPathValue(testObj, 'a.b.h.i.2.x') )
                .equal( undef );
            expect( getPathValue(testObj, 'a.k.x') )
                .equal( undef );
        });
    });

    describe('getObjectPart(source, parts)', () => {
        const { getObjectPart } = api;

        it('should return object containing specified parts', () => {
            // eslint-disable-next-line require-jsdoc
            function check(parts, expected) {
                expect( getObjectPart(testObj, parts) )
                    .eql( expected );
            }

            check('a', {a: testObj.a});
            check('m.n', {'m.n': testObj.m.n});
            check(
                ['l', 'r'],
                {
                    l: testObj.l,
                    r: testObj.r
                }
            );
            check(
                {
                    f1: 'a.b.h.i.1',
                    f2: 'a.k',
                    f3: 'm.o.q'
                },
                {
                    f1: testObj.a.b.h.i[1],
                    f2: testObj.a.k,
                    f3: testObj.m.o.q
                }
            );
            check(
                {
                    a: 'a.b.d',
                    b: 'l.c.3',
                    c: 'm.o.p.2'
                },
                {
                    a: undef,
                    b: undef,
                    c: testObj.m.o.p[2]
                }
            );
        });
    });

    describe('getFieldFilter(path)', () => {
        const { getFieldFilter } = api;

        it('should return function that extracts value of the specified field path', () => {
            // eslint-disable-next-line require-jsdoc
            function check(path, expected) {
                const filter = getFieldFilter(path);
                expect( filter )
                    .a( 'function' );
                expect( filter(testObj) )
                    .equal( expected );
            }

            check('a', testObj.a);
            check('a.b.c.f', 'value');
            check('m.o.p.4', 5);
            check('r.a', undef);
        });
    });

    describe('getPartFilter(parts)', () => {
        const { getPartFilter } = api;

        it('should return function that creates an object containing the specified parts', () => {
            // eslint-disable-next-line require-jsdoc
            function check(parts, expected) {
                const filter = getPartFilter(parts);
                expect( filter )
                    .a( 'function' );
                expect( filter(testObj) )
                    .eql( expected );
            }

            check(
                {
                    a: 'a.b.c.e',
                    b: 'm.o.q',
                    c: 'l'
                },
                {
                    a: testObj.a.b.c.e,
                    b: testObj.m.o.q,
                    c: testObj.l
                }
            );
            check(
                {
                    e1: 'm.c.u',
                    f2: 'a.b.h.i.0',
                    g3: 'a.z.q.s',
                    h4: 'm.n'
                },
                {
                    e1: undef,
                    f2: testObj.a.b.h.i[0],
                    g3: undef,
                    h4: testObj.m.n
                }
            );
        });
    });

    describe('unlike', () => {
        const { unlike } = api;

        // eslint-disable-next-line max-params, require-jsdoc
        function check(state, prevState, deep, expected) {
            expect( unlike(state, prevState, deep) )
                .equal( expected || false );
        }

        // eslint-disable-next-line require-jsdoc
        function checkTrue(state, prevState, deep) {
            check(state, prevState, deep, true);
        }

        describe('unlike(state, prevState) / unlike(state, prevState, false)', () => {
            it('should return true', () => {
                expect( unlike({f: 1, z: {a: 1}}, {f: 1, z: {a: 1}}) )
                    .equal( true );
                
                checkTrue(5, 7);
                checkTrue({}, 1);
                checkTrue(true, '');
                checkTrue(null, undef);
                checkTrue('test', 'it');

                checkTrue(
                    {a: 1},
                    {b: 2}
                );
                checkTrue(
                    {a: 1, b: 2},
                    {b: 2}
                );
                checkTrue(
                    {a: 1, b: 2},
                    {a: 1, b: 2, c: 3}
                );
                checkTrue(
                    {a: undef},
                    {}
                );
                checkTrue(
                    {a: 1, b: undef},
                    {a: 1}
                );
                checkTrue(
                    {a: null, b: {}},
                    {a: null, b: {}}
                );
                checkTrue(
                    {a: [], b: 3},
                    {a: [], b: 3}
                );
                checkTrue(
                    {a: false, b: 3},
                    {a: null, b: 3}
                );

                checkTrue(
                    ['a'],
                    ['b']
                );
                checkTrue(
                    [ {} ],
                    [ {} ]
                );
                checkTrue(
                    ['a', 1],
                    ['a']
                );
                checkTrue(
                    [1],
                    [1, 'a']
                );
                checkTrue(
                    [1, 2, 3],
                    [1, 2, 4]
                );
                checkTrue(
                    [1, [2], 3],
                    [1, [2], 3]
                );

                checkTrue({}, []);
                checkTrue([], {});
                checkTrue(
                    ['a', 2],
                    {'1': 'a', '2': 2}
                );
                checkTrue(
                    {'1': true, '2': unlike, '3': api},
                    [true, unlike, api]
                );
            });

            it('should return false', () => {
                const arr = [9, 0];
                const obj = {field: 'value'};

                check(true, true);
                check(undef, undef);
                check('test', 'test');
                check({}, {});
                check([], []);

                check(
                    {a: obj},
                    {a: obj}
                );
                check(
                    {a: 7, b: 8, c: obj},
                    {a: 7, b: 8, c: obj}
                );
                check(
                    {a: 'next', b: arr, c: obj, d: false},
                    {a: 'next', b: arr, c: obj, d: false}
                );

                check(
                    [obj],
                    [obj]
                );
                check(
                    [obj, arr],
                    [obj, arr]
                );
                check(
                    ['a', 'b', 3, true, null],
                    ['a', 'b', 3, true, null]
                );
            });
        });

        describe('unlike(state, prevState, true)', () => {
            it('should return true', () => {
                checkTrue(-1, 'a', true);
                checkTrue(null, undef, true);
                checkTrue({}, [], true);
                checkTrue([], {}, true);

                checkTrue(
                    {a: 1, c: {x: 5}},
                    {b: 2, c: {x: 5}},
                    true
                );
                checkTrue(
                    {a: 1, c: {x: 5}},
                    {a: {x: 5}},
                    true
                );
                checkTrue(
                    {a: {x: 5}, b: {y: 0}},
                    {a: {x: 5}, b: {y: 7}},
                    true
                );
                checkTrue(
                    {a: {x: 5}, b: {}},
                    {a: {x: 5}, b: {y: 7}},
                    true
                );
                checkTrue(
                    {a: [1], b: {}},
                    {a: [], b: {y: null}},
                    true
                );
                checkTrue(
                    {a: [1], b: {}},
                    {a: [1], b: {y: undef}},
                    true
                );
                checkTrue(
                    {a: [1, 2], b: {}},
                    {a: [1, 2, 3], b: {}},
                    true
                );
                checkTrue(
                    {a: ['z', 'a'], b: {w: 1}},
                    {a: ['z', 'a'], b: {e: 1}},
                    true
                );

                checkTrue(
                    [1, 2, [3] ],
                    [1, 2, true],
                    true
                );
                checkTrue(
                    [1, 2, [3] ],
                    [1, 2, [5] ],
                    true
                );
                checkTrue(
                    [1, 2, {a: [3]} ],
                    [1, 2, [ [3] ] ],
                    true
                );
                checkTrue(
                    [ {a: 1}, [2, 3] ],
                    [ {a: 1}, [2, 7] ],
                    true
                );
                checkTrue(
                    [ {a: 1}, [2, 3] ],
                    [ {a: 2}, [2, 3] ],
                    true
                );
                checkTrue(
                    [ {a: 1}, [ {b: 2}, 3] ],
                    [ {a: 2}, [ {b: 9}, 3] ],
                    true
                );
                checkTrue(
                    [ {a: 1, x: {y: 5}}, [ {b: 'z'}, 3] ],
                    [ {a: 1, x: {y: null}}, [ {b: 'z'}, 3] ],
                    true
                );
            });

            it('should return false', () => {
                check(false, false, true);
                check('', '', true);
                check(0, 0, true);
                check({}, {}, true);
                check([], [], true);

                check(
                    {a: {b: {c: {d: 'end'}}}},
                    {a: {b: {c: {d: 'end'}}}},
                    true
                );
                check(
                    {a: {b: 1, c: [1, {} ]}},
                    {a: {b: 1, c: [1, {} ]}},
                    true
                );
                check(
                    {a: [1, {b: 2}, null], v: {d: 7, e: ['a', {oper: '<'}, 'b']}, res: 'unknown'},
                    {a: [1, {b: 2}, null], v: {d: 7, e: ['a', {oper: '<'}, 'b']}, res: 'unknown'},
                    true
                );

                check(
                    [ [ [ [1] ] ] ],
                    [ [ [ [1] ] ] ],
                    true
                );
                check(
                    [1, [2, 3, {a: [0, null], b: 'n'} ], true],
                    [1, [2, 3, {a: [0, null], b: 'n'} ], true],
                    true
                );
                check(
                    [ {a: 1, b: 2}, [100, 8, 'test'], null, {f: 5, g: 6} ],
                    [ {a: 1, b: 2}, [100, 8, 'test'], null, {f: 5, g: 6} ],
                    true
                );
            });
        });
    });

    describe('unlikeDeep(state, prevState)', () => {
        const { unlikeDeep } = api;

        // eslint-disable-next-line require-jsdoc
        function check(state, prevState, expected) {
            expect( unlikeDeep(state, prevState) )
                .equal( expected || false );
        }

        // eslint-disable-next-line require-jsdoc
        function checkTrue(state, prevState) {
            check(state, prevState, true);
        }

        it('should return true', () => {
            checkTrue(
                {a: 1, b: [2, 3]},
                {a: 1, b: [3]}
            );
            checkTrue(
                {a: 1, b: [2, 3, 4]},
                {a: 1, b: [2, 3, null]}
            );
            checkTrue(
                {a: 1, b: [2, {c: 3, d: undef} ]},
                {a: 1, b: [2, {c: 3, d: null} ]}
            );
            checkTrue(
                {a: {b: [0]}},
                {a: {b: ['0']}}
            );
        });

        it('should return false', () => {
            check(
                {a: {}, b: [ {c: 8} ]},
                {a: {}, b: [ {c: 8} ]}
            );
            check(
                {a: {f: [1, 2, 3, {x: [10, 11]} ]}, z: [ {c: 4, d: 'test'}, true]},
                {a: {f: [1, 2, 3, {x: [10, 11]} ]}, z: [ {c: 4, d: 'test'}, true]}
            );
        });
    });

    describe('listen', () => {
        const { listen } = api;

        beforeEach(resetListenerCounter);

        // eslint-disable-next-line require-jsdoc
        function check(settings) {
            return checkListen(Object.assign({listen}, settings));
        }

        describe('listen(store, listener)', () => {
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
                check({
                    listener: {
                        filter: (state) => {
                            return {
                                c: state.counter,
                                m: state.map
                            };
                        },
                    },
                    action: [
                        {
                            type: 'INC'
                        },
                        {
                            type: 'SET',
                            payload: {
                                key: 'y',
                                value: '---'
                            }
                        },
                        {
                            type: 'INC',
                            payload: 24
                        }
                    ],
                    result: 3
                });
            });

            it('should not call listener', () => {
                check({
                    listener: {
                        filter: (state) => {
                            return {
                                c: state.counter,
                                d: state.data
                            };
                        },
                    },
                    action: [
                        {
                            type: 'SET',
                            payload: {
                                key: 'y',
                                value: '---'
                            }
                        },
                        {
                            type: 'SET-IT',
                            payload: 'max'
                        },
                        {
                            type: 'SET',
                            payload: {
                                key: 'alfa',
                                value: 'beta'
                            }
                        }
                    ]
                });
            });

            describe('listen(store, {filter: "field"})', () => {
                it('should call listener', () => {
                    check({
                        listener: {
                            filter: 'counter',
                        },
                        action: [
                            {
                                type: 'INC'
                            },
                            {
                                type: 'SET',
                                payload: {
                                    key: 'a',
                                    value: 4
                                }
                            },
                            {
                                type: 'INC',
                                payload: 90
                            }
                        ],
                        result: 2
                    });
                });

                it('should not call listener', () => {
                    check({
                        listener: {
                            filter: 'data',
                        },
                        action: [
                            {
                                type: 'SET',
                                payload: {
                                    key: 'key',
                                    value: 'value'
                                }
                            },
                            {
                                type: 'INC',
                            }
                        ]
                    });
                });
            });

            describe('listen(store, {filter: ["field1", "field2", ...]})', () => {
                it('should call listener', () => {
                    check({
                        listener: {
                            filter: ['counter', 'map'],
                        },
                        action: [
                            {
                                type: 'INC'
                            },
                            {
                                type: 'SET',
                                payload: {
                                    key: 'r2',
                                    value: 'd2'
                                }
                            },
                            {
                                type: 'SET',
                                payload: {
                                    key: 'c',
                                    value: '3po'
                                }
                            },
                        ],
                        result: 3
                    });
                });

                it('should not call listener', () => {
                    check({
                        listener: {
                            filter: ['data', 'map'],
                        },
                        action: [
                            {
                                type: 'INC',
                                payload: 8
                            },
                            {
                                type: 'INC',
                            }
                        ]
                    });
                });
            });

            describe('listen(store, {filter: {field1: "state.part.a", field2: "state.x", ...}})', () => {
                it('should call listener', () => {
                    check({
                        listener: {
                            filter: {
                                c: 'counter',
                                xt: 'map.d'
                            },
                        },
                        action: [
                            {
                                type: 'INC'
                            },
                            {
                                type: 'SET',
                                payload: {
                                    key: 'd',
                                    value: false
                                }
                            },
                            {
                                type: 'SET',
                                payload: {
                                    key: 'x',
                                    value: 0
                                }
                            },
                            {
                                type: 'SET',
                                payload: {
                                    key: 'd',
                                    value: 'abc'
                                }
                            },
                        ],
                        result: 3
                    });
                });

                it('should not call listener', () => {
                    check({
                        listener: {
                            filter: {
                                c: 'counter',
                                xt: 'map.d'
                            },
                        },
                        action: [
                            {
                                type: 'SET',
                                payload: {
                                    key: 'star',
                                    value: 'trek'
                                }
                            },
                            {
                                type: 'SET',
                                payload: {
                                    key: 'x',
                                    value: 0
                                }
                            },
                        ]
                    });
                });
            });
        });
    });
});
