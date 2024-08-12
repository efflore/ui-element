type Attempt<A, E extends Error> = {
    map<B>(f: (a: A) => B): Attempt<B, E>;
    fold: <B>(onFailure: (reason: E) => B, onSuccess: (value: A) => B) => B;
    catch(f: (reason: E) => void): void;
};
declare const attempt: <A, E extends Error>(operation: () => A) => Attempt<A, E>;
export { type Attempt, attempt };
