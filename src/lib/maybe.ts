import { isNullish } from './is-type';

/* === Types === */

type Maybe<A> = {
  map<B>(f: (a: A) => B): Maybe<B>
  fold: <B>(onNothing: () => B, onSomething: (value: A) => B) => B
  toString: () => string
};

/* === Exported Functions === */

const nothing = <A>(): Maybe<A> => {
  const handler: ProxyHandler<any> = {
    get: (_, prop: string): any => {
      if (prop === 'toString') return () => ''
      // if (prop === 'chain') return <B>(f: () => Maybe<B>): Maybe<B> => f()
      if (prop === 'fold') return <B>(onNothing: () => B): B => onNothing()
      return (): Maybe<any> => nothing() // 'map', 'ap' are no-op and return nothing()
    }
  };
  return new Proxy({}, handler)
};

const something = <A>(value: A): Maybe<A> => ({
  map: <B>(f: (a: A) => B): Maybe<B> => something(f(value)),
  /* chain: <B>(f: (a: A) => Maybe<B>): Maybe<B> => f(value),
  ap: <B>(fab: Maybe<(a: A) => B>): Maybe<B> =>
    fab.fold(() => nothing(), (f) => something(f(value))), */
  fold: <B>(_: () => B, onSomething: (value: A) => B): B => onSomething(value),
  toString: () => String(value),
});

/* === Default Export === */

/**
 * Create a container for a given value to gracefully handle nullable values
 * 
 * @since 0.8.0
 * @param {unknown} value - value to wrap in a container
 * @returns {Maybe<T>} - container of either "something" or "nothing" for the given value
 */
const maybe = <T>(value: T | null | undefined): Maybe<T> => isNullish(value) ? nothing() : something(value)

export { type Maybe, maybe, nothing, something };
