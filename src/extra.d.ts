// Created on the basis of http://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html

// export as namespace doesn't support nesting namespaces like listate.extra
// https://github.com/microsoft/TypeScript/issues/20990
// https://github.com/Microsoft/TypeScript/issues/26532
// export as namespace listate.extra;

import { ChangeHandler, ListenerSettings as BaseListenerSettings, StateFilter, Store, Unlisten } from './listate';

export { ChangeHandler, Dispatch, HandlerParam, StateFilter, Store, Unlisten } from './listate';

export function getPathValue(
    obj: object,
    path: string
): any;

export type ObjectParts = string | string[] | {[resultField: string]: string};

export function getObjectPart(
    source: object,
    parts: ObjectParts
): object;

export type FieldFilter = (obj: object) => any;

export function getFieldFilter(
    path: string
): FieldFilter;

export type PartFilter = (obj: object) => object;

export function getPartFilter(
    parts: ObjectParts
): PartFilter;

export function unlike(
    state: any,
    prevState: any,
    deep?: boolean
): boolean;

export function unlikeDeep(
    state: any,
    prevState: any
): boolean;

declare const {filter, ...listenerSettings}: BaseListenerSettings;
type ListenerSettings = typeof listenerSettings;

export interface ExtraListenerSettings extends ListenerSettings {
    filter?: StateFilter | ObjectParts;
}

export type Listener = ChangeHandler | ExtraListenerSettings;

export function listen(
    store: Store,
    listener: Listener
): Unlisten;

export default listen;
