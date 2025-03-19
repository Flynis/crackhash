import Permutation from './permutation.js';
import { md5 } from 'js-md5';

export default class HashBruteForce {

    crackHash({hash, alphabet, start, count}, trackProgress) {
        const n = alphabet.length;
        const permutation = new Permutation(n);
    
        let k = 1;
        let threshold = this.#permutationsCount(n, k);
        while (start > threshold) {
            k += 1;
            threshold += this.#permutationsCount(n, k);
        }
    
        const result = new Array();
        const index = start - (threshold - this.#permutationsCount(n, k));
        let p = permutation.at(index, k);
        while (count > 0) {
            const word = this.#permutationToWord(p, alphabet);
            const h = md5(word);
            if (h == hash) {
                result.push(word);
            }
    
            count -= 1;
            trackProgress();
            if (!permutation.next(p)) {
                k += 1;
                p = permutation.at(0, k);
            }
        }
    
        return result;
    }

    #permutationsCount(n, k) {
        return Math.pow(n, k);
    }
    
    #permutationToWord(perm, alphabet) {
        const chars = perm.map((x) => alphabet[x]);
        return chars.join("");
    }
};