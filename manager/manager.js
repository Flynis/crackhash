import { v4 as uuidv4 } from 'uuid';
import Request from './request.js';
import 'dotenv/config';

export default class Manager {
    alphabet = process.env.ALPHABET;
    timeout = process.env.TIMEOUT;
    workersCount = process.env.WORKERS_COUNT;
    workersHost = process.env.WORKERS_HOST;
    workersPort = process.env.WORKERS_PORT;
    freeWorkers = 0;
    requests = new Map();

    constructor() {
        this.freeWorkers = workersCount;
    }

    handleRequest(request) {
        const req = new Request(request.hash, request.maxLength);

        if (this.freeWorkers != this.workersCount) {
            return null;
        }

        const id = uuidv4();
        this.requests.set(id, req);
        this.#sendTasks(id, req);

        req.timerId = setTimeout(() => {
            this.#requestTimeoutExpired(id);
        }, this.timeout);

        return id;
    }

    hasRequest(id) {
        return this.requests.has(id);
    }

    getRequestStatus(id) {
        const req = this.requests.get(id);
        console.log(`Request status ${id}`);
        return req.getStatus();
    }

    updateRequestData(id, data) {
        console.log(`Updating request ${id}`);
        this.freeWorkers += 1;

        const req = this.requests.get(id);
        req.addData(data);

        if (this.freeWorkers == this.workersCount) {
            req.complete();
            console.log(`Request completed ${id}`);
            clearTimeout(req.timerId);
        }
    }

    #requestTimeoutExpired(requestId) {
        const req = this.requests.get(requestId);
        req.setError();
        console.log(`Request timeout expired ${requestId}`);
    }

    #sendTasks(id, req) {
        const allPermsCount = permutationsCount(this.alphabet.length, req.maxLength);
        const countPerTask = Math.floor(allPermsCount / this.workersCount);
    
        const task = {
            requestId: id,
            hash: req.hash,
            alphabet: this.alphabet,
            start: 0,
            count: countPerTask
        };
    
        for (let i = 1; i < this.workersCount; i++) {
            this.#sendTask(i, task);
            task.start += countPerTask;
        }
    
        task.count = allPermsCount - task.start;
        this.#sendTask(this.workersCount, task);
    }
    
    #sendTask(worker, task) {
        const url = `${this.workersHost}${worker}:${this.workersPort}`;
        fetch(`${url}/internal/api/worker/hash/crack/task`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(task)
        }).catch((reason) => {
            console.log(reason);
        }).then((_) => {
            console.log(`${worker} task sended`);
            this.freeWorkers -= 1;
        });
    }

};

function permutationsCount(n, k) {
    let count = 0;
    for (let i = 1; i <= k; i++) {
        count += Math.pow(n, k);
    }
    return count;
}
