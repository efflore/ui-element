type UIIO<A> = {
    run: () => A;
    map: <B>(f: (a: A) => B) => UIIO<B>;
    chain: <B>(f: (a: A) => UIIO<B>) => UIIO<B>;
};
declare const io: <A>(effect: () => A) => UIIO<A>;
export { type UIIO, io };
