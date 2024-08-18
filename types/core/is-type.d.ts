interface Functor<A> {
    map(f: (a: A) => unknown): Functor<unknown>;
}
interface Applicative<A> extends Functor<A> {
    ap<B>(fab: Applicative<(a: A) => B>): Applicative<B>;
}
interface Monad<A> extends Applicative<A> {
    chain<B>(f: (a: A) => Monad<B>): Monad<B>;
}
declare const isOfType: <T>(type: string) => (value: unknown) => value is T;
declare const isUndefined: (value: unknown) => value is undefined;
declare const isSymbol: (value: unknown) => value is undefined;
declare const isBoolean: (value: unknown) => value is boolean;
declare const isNumber: (value: unknown) => value is number;
declare const isString: (value: unknown) => value is string;
declare const isObject: (value: unknown) => value is object;
declare const isFunction: (value: unknown) => value is Function;
declare const isNull: (value: unknown) => value is null;
declare const isNullish: (value: unknown) => value is null | undefined;
declare const isDefined: <T>(value: unknown) => value is NonNullable<T>;
declare const isFalse: (value: unknown) => boolean;
declare const isFalsy: (value: unknown) => boolean;
declare const isTrue: (value: unknown) => boolean;
declare const isTruthy: (value: unknown) => boolean;
declare const isDefinedObject: (value: unknown) => value is Record<string, unknown>;
declare const hasMethod: <T, K extends keyof T>(obj: T, name: K) => obj is T & Record<K, Function>;
declare const isFunctor: (value: unknown) => value is Functor<unknown>;
declare const isInstanceOf: (constructor: typeof Element) => (value: Node) => value is Element;
declare const isElement: (node: Node) => boolean;
declare const isComment: (node: Node) => boolean;
export { type Functor, type Applicative, type Monad, isOfType, isUndefined, isSymbol, isBoolean, isNumber, isString, isObject, isFunction, isNull, isNullish, isDefined, isFalse, isFalsy, isTrue, isTruthy, isDefinedObject, hasMethod, isFunctor, isInstanceOf, isElement, isComment };
