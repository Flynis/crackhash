
export default class Permutation {
    alphabet = "";

    constructor(alphabet) {
        this.alphabet = alphabet;
    }

    count(length) {
        return Math.pow(this.alphabet.length, length);
    }

    next(perm) {

    }

    at(index, length) {
        const n = this.alphabet.length;
        const zero = this.alphabet[0];
        const perm = zero.repeat(length);

        let i = index;
        let j = length;
        while(i) {
            const digit = i % n;
            const char = this.alphabet[digit];
            perm[j] = char;
            i /= n;
            j -= 1;
        }

        return perm;
    }
};