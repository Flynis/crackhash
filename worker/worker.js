import Permutation from './permutation.js';
import { md5 } from 'js-md5';

export default class Worker {

    async processTask(task) {
        const result = await this.#crackHash(task);

        await fetch('manager:3000/internal/api/manager/hash/crack/request', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                requestId: task.requestId,
                data: result
            })
        });
    }

    #crackHash({hash, alphabet, start, count}) {
        const n = alphabet.length;
        const permutation = new Permutation(n);
    
        let k = 1;
        let threshold = permutationsCount(n, k);
        while (start > threshold) {
            k += 1;
            threshold += permutationsCount(n, k);
        }
    
        const result = new Array();
        const index = start - (threshold - permutationsCount(n, k));
        let p = permutation.at(index, k);
        while (count > 0) {
            const word = permutationToWord(p);
            const h = md5(word);
            if (h == hash) {
                result.push(word);
            }
    
            count -= 1;
            if (!permutation.next(p)) {
                k += 1;
                p = permutation.at(0, k);
            }
        }
    
        return result;
    }

};

function permutationsCount(n, k) {
    return Math.pow(n, k);
}

function permutationToWord(perm, alphabet) {
    return perm.map((x) => alphabet[x]);
}