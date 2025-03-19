import { v4 as uuidv4 } from 'uuid';
import Request from './request.js';
import { Queue } from '@datastructures-js/queue';
import 'dotenv/config';

export default class Manager {
    alphabet = process.env.ALPHABET;
    timeout = process.env.TIMEOUT;
    workersCount = process.env.WORKERS_COUNT;
    workersHost = process.env.WORKERS_HOST;
    workersPort = process.env.WORKERS_PORT;
    freeWorkers = 0;
    requests = new Map();
    maxQueueSize = process.env.QUEUE_SIZE;
    queue = new Queue();

    constructor() {
        this.freeWorkers = workersCount;
    }

    handleRequest(request) {
        if (this.queue.size() >= this.maxQueueSize) {
            return null;
        }

        const id = uuidv4();
        const req = new Request(id, request.hash, request.maxLength);
        console.log(`New request ${id}`);
        console.log(`Request h=${req.hash} maxLen=${req.maxLength}`);

        this.requests.set(id, req);
        this.queue.push(req);

        this.#scheduleTasks();
        return id;
    }

    hasRequest(id) {
        return this.requests.has(id);
    }

    async getRequestStatus(id) {
        const req = this.requests.get(id);

        let current = 0;
        let total = 0;

        for (let i = 1; i <= this.workersCount; i++) {
            const url = `${this.workersHost}${i}:${this.workersPort}`;
            const res = await fetch(`${url}/internal/api/worker/hash/crack/progress`);
            if (!res.ok) {
                continue;
            }
            const body = await res.json();
            current += body.processed;
            total += body.count;
        }
     
        const percent = Math.floor((current / total) * 100);
        console.log(`Progress ${current}/${total} ${percent}%`);
        console.log(`Send status for ${id}`);
        return req.getStatus(percent);
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
            this.#scheduleTasks();
        }
    }

    #scheduleTasks() {
        if (this.queue.size() == 0 || this.freeWorkers < this.workersCount) {
            return;
        }

        const req = this.queue.pop();
        console.log(`Start processing ${req.id}`);
        this.#sendTasks(req);

        req.timerId = setTimeout(() => {
            this.#requestTimeoutExpired(req.id);
        }, this.timeout);
    }

    #requestTimeoutExpired(requestId) {
        const req = this.requests.get(requestId);
        req.setError();
        console.log(`Request timeout expired ${requestId}`);
    }

    #sendTasks(req) {
        const total = this.#permsCount(this.alphabet.length, req.maxLength);
        const countPerTask = Math.floor(total / this.workersCount);
    
        const task = {
            requestId: req.id,
            hash: req.hash,
            alphabet: this.alphabet,
            start: 0,
            count: countPerTask
        };
    
        for (let i = 1; i < this.workersCount; i++) {
            this.#sendTask(i, task);
            task.start += countPerTask;
        }
    
        task.count = total - task.start;
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

    #permsCount(n, k) {
        let count = 0;
        for (let i = 1; i <= k; i++) {
            count += Math.pow(n, k);
        }
        return count;
    }

};
