type UITask<A> = {
    (): Promise<A>;
    map: <B>(f: (a: A) => B) => UITask<B>;
    chain: <B>(f: (a: A) => UITask<B>) => UITask<B>;
};
declare const task: <A>(effect: () => Promise<A>) => UITask<A>;
export { type UITask, task };
