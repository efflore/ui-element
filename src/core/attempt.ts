/* === Types === */

type Attempt<A, E extends Error> = {
  map<B>(f: (a: A) => B): Attempt<B, E>
  fold: <B>(onFailure: (reason: E) => B, onSuccess: (value: A) => B) => B
  catch(f: (reason: E) => void): void
}

/* === Internal Functions === */

const success = <A, E extends Error>(value: A): Attempt<A, E> => ({
  map: <B>(f: (a: A) => B): Attempt<B, E> => attempt(() => f(value)),
  /* chain: <B>(f: (a: A) => Attempt<B, E>): Attempt<B, E> => f(value),
  ap: <B>(fab: Attempt<(a: A) => B, E>): Attempt<B, E> =>
    fab.fold(reason => failure(reason), f => success(f(value))), */
  fold: <B>(_: (reason: E) => B, onSuccess: (value: A) => B): B => onSuccess(value),
  catch: () => {}
})

const failure = <A, E extends Error>(reason: E): Attempt<A, E> => ({
  map: () => failure(reason),
  /* chain: () => failure(reason),
  ap: () => failure(reason), */
  fold: <B>(onFailure: (reason: E) => B): B => onFailure(reason),
  catch: (f: (reason: E) => void): void => f(reason)
})

/* === Default Export === */

const attempt = <A, E extends Error>(operation: () => A): Attempt<A, E> => {
  try {
    return success(operation())
  } catch (reason) {
    return failure(reason)
  }
}

export { type Attempt, attempt }