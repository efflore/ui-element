/* === Types === */

type UIIO<A> = {
  run: () => A
  map: <B>(f: (a: A) => B) => UIIO<B>
  chain: <B>(f: (a: A) => UIIO<B>) => UIIO<B>
}

/* === Default export === */

const io = <A>(effect: () => A): UIIO<A> => ({
  run: () => effect(),
  map: <B>(f: (a: A) => B): UIIO<B> => io(() => f(effect())),
  chain: <B>(f: (a: A) => UIIO<B>): UIIO<B> => io(() => f(effect()).run()),
});

export { type UIIO, io }