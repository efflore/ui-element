/* === Types === */

type IO<A> = {
  run: () => A
  // map: <B>(f: (a: A) => B) => IO<B>
  // chain: <B>(f: (a: A) => IO<B>) => IO<B>
}

/* === Default export === */

const io = <A>(effect: () => A): IO<A> => ({
  run: () => effect(),
  // map: <B>(f: (a: A) => B): IO<B> => io(() => f(effect())),
  // chain: <B>(f: (a: A) => IO<B>): IO<B> => io(() => f(effect()).run())
})

export { type IO, io }