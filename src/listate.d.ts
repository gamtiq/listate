// Created on the basis of http://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html

export as namespace listate;

export type Dispatch = (action: any) => any;

export type Unlisten = () => void;

export interface Store {
    dispatch: Dispatch;
    getState: () => any;
    subscribe: (listener: () => void) => Unlisten;
}

export interface HandlerParam {
    current: any;
    data: any;
    dispatch: Dispatch;
    prev: any;
    prevState: any;
    state: any;
    store: Store;
    unlisten: Unlisten;
}

export type ChangeHandler = (param: HandlerParam) => void;

export type StateFilter = (state: any) => any;

export interface ListenerSettings {
    context?: boolean | object;
    data?: any;
    delay?: number;
    filter?: StateFilter;
    handle: ChangeHandler;
    once?: boolean;
    when?: (current: any, prev: any, param: HandlerParam) => boolean;
}

export type Listener = ChangeHandler | ListenerSettings;

export function baseWhen(
    state: any,
    prevState: any
): boolean;

export function listen(
    store: Store,
    listener: Listener
): Unlisten;

export default listen;
