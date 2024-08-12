type IO<A> = {
    run: () => A;
    map: <B>(f: (a: A) => B) => IO<B>;
    chain: <B>(f: (a: A) => IO<B>) => IO<B>;
};
declare const io: <A>(effect: () => A) => IO<A>;
export { type IO, io };