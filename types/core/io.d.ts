type IO<A> = {
    run: () => A;
};
declare const io: <A>(effect: () => A) => IO<A>;
export { type IO, io };
