/* === Types === */

type UITask<A> = {
  (): Promise<A>
  map: <B>(f: (a: A) => B) => UITask<B>
  chain: <B>(f: (a: A) => UITask<B>) => UITask<B>
}

/* === Default Export === */

const task = <A>(effect: () => Promise<A>): UITask<A> => {
  const t = () => effect()
  t.map = <B>(f: (a: A) => B): UITask<B> => task(() => effect().then(f))
  t.chain = <B>(f: (a: A) => UITask<B>): UITask<B> => task(() => effect().then(a => f(a)()))
  return t
}

export { type UITask, task }