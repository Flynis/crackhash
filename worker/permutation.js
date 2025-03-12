export default class Permutation {
    n = 0;

    /**
     * @param {*} n set cardinality
     */
    constructor(n) {
        this.n = n;
    }

    next(perm) {
        const n = this.n;
        const k = perm.length;

        let i = k - 1;
        while (i >= 0 && perm[i] == n - 1) {
            perm[i] = 0;
            i -= 1;
        }
            
        if (i < 0) {
            // perm was the last permutation
            return false;
        } else {
            perm[i] += 1;
        }

        return true;
    }

    at(index, k) {
        const perm = Array(k).fill(0);
        const n = this.n;

        let i = index;
        let j = k - 1;
        while(i) {
            const digit = i % n;
            perm[j] = digit;
            i = Math.floor(i / n);
            j -= 1;
        }

        return perm;
    }
};