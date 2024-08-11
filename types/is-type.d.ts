interface Functor<A> {
    map: <B>(fn: (value: A) => B) => Functor<B>;
}
declare const isOfType: <T>(type: string) => (value: unknown) => value is T;
declare const isUndefined: (value: unknown) => value is undefined;
declare const isSymbol: (value: unknown) => value is undefined;
declare const isBoolean: (value: unknown) => value is boolean;
declare const isNumber: (value: unknown) => value is number;
declare const isString: (value: unknown) => value is string;
declare const isObject: (value: unknown) => value is object;
declare const isFunction: (value: unknown) => value is ((...args: any[]) => any);
declare const isNull: (value: unknown) => value is null;
declare const isNullish: (value: unknown) => value is null | undefined;
declare const isDefined: <T>(value: unknown) => value is NonNullable<T>;
declare const isFalse: (value: unknown) => boolean;
declare const isFalsy: (value: unknown) => boolean;
declare const isTrue: (value: unknown) => boolean;
declare const isTruthy: (value: unknown) => boolean;
declare const isDefinedObject: (value: unknown) => value is {} | ((...args: any[]) => any);
declare const hasMethod: (obj: object, name: string) => boolean;
declare const isFunctor: (value: unknown) => value is Functor<unknown>;
declare const isInstanceOf: (constructor: typeof Element) => (value: Node) => value is Element;
declare const isElement: (node: Node) => boolean;
declare const isComment: (node: Node) => boolean;
export { type Functor, isOfType, isUndefined, isSymbol, isBoolean, isNumber, isString, isObject, isFunction, isNull, isNullish, isDefined, isFalse, isFalsy, isTrue, isTruthy, isDefinedObject, hasMethod, isFunctor, isInstanceOf, isElement, isComment };
