import 'dotenv/config';
import DbController from './db_controller.js';
import MessageBroker from './message_broker.js';
import moment from 'moment';
import { Queue } from '@datastructures-js/queue';
import Request from './request.js';
import { v4 as uuidv4 } from 'uuid';
import { Status } from './status.js';

export default class Manager {
    alphabet = process.env.ALPHABET;
    maxRequests = process.env.MAX_REQUESTS;
    workersCount = process.env.WORKERS_COUNT;
    workersHost = process.env.WORKER_HOST;
    workersPort = process.env.WORKER_PORT;
    requestTtl = process.env.COMPLETED_REQUEST_TTL;
    dbCleanuPeriod = process.env.DB_CLEANUP_PERIOD * 1000; // ms
    requests = new Map();
    queue = new Queue();
    db = new DbController();
    broker = new MessageBroker();
    currentReq = {
        id: "",
        total: 0,
        progress: 0,
    };

    constructor() {
        this.broker.onReceiveResult = (result) => {
            this.#updateRequestData(result)
            .catch((err) => console.log("Failed to update request data", err))
            .then((_) => console.log("Request data updated"));
        };
    }

    async init() {
        const oldRequests = await this.db.fetchRequests();
        for(const req of oldRequests) {
            this.requests.set(req._id, req);
            if (req.status != Status.Ready) {
                this.queue.push(req);
            }
        }

        await this.#deleteOldRequests();
        setInterval(async () => {
            await this.#deleteOldRequests();
        }, this.dbCleanuPeriod);

        console.log("Manager initialized");
        this.#scheduleTasks();
    }

    async #deleteOldRequests() {
        const requestsToDelete = new Array();
        const threshold = 
            moment()
            .subtract(this.requestTtl, "seconds")
            .toDate();
        for (let [_, req] of  this.requests.entries()) {
            if (req.status == Status.Ready && req.date < threshold) {
                requestsToDelete.push(req._id);
            }   
        }
        for (const id of requestsToDelete) {
            this.requests.delete(id);
        }
        await this.db.deleteRequests(requestsToDelete);
        console.log(`Delete ${requestsToDelete.length} old requests`);
    }

    hasRequest(id) {
        return this.requests.has(id);
    }

    async handleRequest(request) {
        const id = uuidv4();
        const req = new Request(id, request.hash, request.maxLength);
        console.log(`New request ${id}`);
        console.log(`Request h=${req.hash} maxLen=${req.maxLength}`);
        console.log(`Request date ${req.date}`);

        const saved = await this.db.saveRequest(req);
        if (saved) {
            this.requests.set(id, req);
            this.queue.push(req);
            this.#scheduleTasks();
            return id;
        } else {
            return null;
        }
    }

    async getRequestStatus(id) {
        console.log(`Send status for ${id}`);
        const req = this.requests.get(id);
        if (!this.#requestCompleted(id)) {
            const progress = await this.#fetchProgress();
            return req.getStatusWithProgress(progress);
        } else {
            return req.getStatus();
        }
    }

    #requestCompleted(id) {
        return this.currentReq.id == id 
            && this.currentReq.progress == this.currentReq.total;
    }

    async #updateRequestData(result) {
        const req = this.requests.get(result.requestId);
        if (!req) {
            return;
        }

        let requireUpdate = false;
        if (result.data.length > 0) {
            req.addData(result.data);
            requireUpdate = true;
        }
        this.currentReq.progress += result.count;

        if (this.currentReq.progress == this.currentReq.total) {
            req.complete();
            requireUpdate = true;
        }
        if (requireUpdate) {
            await this.db.updateRequest(req);

            if (req.completed()) {
                console.log(`Request completed ${result.requestId}`);
                this.#scheduleTasks();
            }
        }
    }

    #scheduleTasks() {
        if (this.queue.size() == 0 
            || this.currentReq.progress != this.currentReq.total) {
            return;
        }
        const req = this.queue.pop();
        console.log(`Start processing ${req._id}`);
        this.currentReq = {
            id: req._id,
            total: this.#permsCount(this.alphabet.length, req.maxLength),
            progress: 0
        };
        this.#sendTasks(req);
    }

    async #fetchProgress() {
        let current = 0;

        for (let i = 1; i <= this.workersCount; i++) {
            const url = `${this.workersHost}${i}:${this.workersPort}`;
            const res = await fetch(`${url}/internal/api/worker/hash/crack/progress`);
            if (!res.ok) {
                continue;
            }
            const body = await res.json();
            current += body.processed;
        }
     
        const total = this.currentReq.total;
        const progress = current + this.currentReq.progress;
        const percent = Math.floor((progress / total) * 100);
        console.log(`Progress ${progress}/${total} ${percent}%`);
        return percent;
    }

    #sendTasks(req) {
        const total = this.currentReq.total;
        const count = Math.floor(total / this.workersCount);
    
        let start = 0;
        for (let i = 1; i < this.workersCount; i++) {
            const task = {
                requestId: req._id,
                hash: req.hash,
                alphabet: this.alphabet,
                start: start,
                count: count
            };
            this.broker.sendTask(task);
            start += count;
        }
    
        const task = {
            requestId: req._id,
            hash: req.hash,
            alphabet: this.alphabet,
            start: start,
            count: total - start
        };
        this.broker.sendTask(task);
    }

    #permsCount(n, k) {
        let count = 0;
        for (let i = 1; i <= k; i++) {
            count += Math.pow(n, k);
        }
        return count;
    }

};
