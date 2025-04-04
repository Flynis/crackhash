import 'dotenv/config';
import DbController from './db_controller.js';
import MessageBroker from './message_broker.js';
import moment from 'moment';
import { Queue } from '@datastructures-js/queue';
import Request from './request.js';
import { v4 as uuidv4 } from 'uuid';
import { Status } from './status.js';
import State, { freeState } from './state.js';

export default class Manager {
    alphabet = process.env.ALPHABET;
    maxRequests = process.env.MAX_REQUESTS;
    workersCount = process.env.WORKERS_COUNT;
    workerStatus = new Array(this.workersCount);
    requests = new Map();
    queue = new Queue();
    db = new DbController();
    broker = new MessageBroker();
    state = freeState();

    constructor() {
        this.workerStatus.fill(true);
        this.broker.onReceiveResult = async (result) => {
            await this.#updateRequestData(result);
            console.log("Request data updated"); 
        };
    }

    async init() {
        await this.db.init();

        const state = await this.db.fetchState();
        if (state) {
            this.state = State.copy(state);
        } else {
            await this.db.updateState(this.state);
        }

        const oldRequests = await this.db.fetchRequests();
        for(const req of oldRequests) {
            this.requests.set(req._id, Request.copy(req));
            if (req.status != Status.Ready && req._id != this.state.req) {
                this.queue.push(req);
            }
        }

        await this.#deleteOldRequests();
        const dbCleanuPeriod = process.env.DB_CLEANUP_PERIOD * 1000; // ms
        setInterval(async () => {
            await this.#deleteOldRequests();
        }, dbCleanuPeriod);

        const healthCheckPeriod = process.env.HEALTH_CHECK_PERIOD * 1000; // ms
        setInterval(() => {
            this.#healthCheck();
        }, healthCheckPeriod);

        console.log("Manager initialized ", this.state);

        
        if (this.state.completed) {
            this.#scheduleTasks();
        } else {
            if (this.state.pending.size > 0) {
                const req = this.requests.get(this.state.req);
                for (const taskId of this.state.pending) {
                    this.#sendTask(taskId, req);
                }
            }
            if (this.state.inProgressTasks.size > 0) {
                console.log(`Wait for result of tasks ${this.state.inProgressTasks.toString()}`);
            }
        }
    }

    async #healthCheck() {
        const aliveWorkers = new Array();
        for (let i = 1; i <= this.workersCount; i++) {
            const url = this.#getWorkerUrl(i);
            const workerIndex = i - 1;
            try {
                const res = await fetch(`${url}/internal/api/worker/health`);
                if (!res.ok) {
                    this.workerStatus[workerIndex] = false;
                    continue;
                } else {
                    this.workerStatus[workerIndex] = true;
                    aliveWorkers.push(i);
                }
            } catch(err) {
                this.workerStatus[workerIndex] = false;
            }
        }
        console.log(`Alive workers: ${aliveWorkers.toString()}`);
    }

    async #deleteOldRequests() {
        const requestsToDelete = new Array();
        const requestTtl = process.env.COMPLETED_REQUEST_TTL;
        const threshold = 
            moment()
            .subtract(requestTtl, "seconds")
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
        if (this.queue.size() >= this.maxRequests) {
            return null;
        }

        const id = uuidv4();
        const req = new Request(id, request.hash, request.maxLength);
        console.log(`New request ${id}`);
        console.log(`Request h=${req.hash} maxLen=${req.maxLength}`);

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
        return this.state.req == id && this.state.completed;
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

        this.state.complete(result.taskId, result.count);
        if (this.state.completed) {
            req.complete();
            requireUpdate = true;
        }

        if (requireUpdate) {
            await this.db.updateRequestAndState(req, this.state);

            if (req.completed()) {
                console.log(`Request completed ${result.requestId}`);
                this.#scheduleTasks();
            }
        } else {
            await this.db.updateState(this.state);
        }
    }

    #scheduleTasks() {
        if (this.queue.size() == 0 
            || !this.state.completed) {
            return;
        }

        const req = this.queue.pop();
        console.log(`Start processing ${req._id}`);

        const total = this.#permsCount(this.alphabet.length, req.maxLength);
        this.state = new State(req._id, this.workersCount, total);

        this.db.updateState(this.state).then((_) => {
            this.#sendTasks(req);
        });
    }

    async #fetchProgress() {
        let current = 0;

        const progressEndpoint = "/internal/api/worker/hash/crack/progress";
        for (let i = 1; i <= this.workersCount; i++) {
            const workerIndex = i - 1;
            if (!this.workerStatus[workerIndex]) {
                continue;
            }
            const url = this.#getWorkerUrl(i);
            try {
                const res = await fetch(`${url}${progressEndpoint}`);
                if (!res.ok) {
                    continue;
                }
                const body = await res.json();
                current += body.processed;
            } catch(err) {
                this.workerStatus[workerIndex] = false;
            }
        }
     
        const total = this.state.total;
        const progress = current + this.state.progress;
        const percent = Math.floor((progress / total) * 100);
        console.log(`Progress ${progress}/${total} ${percent}%`);
        return percent;
    }

    #getWorkerUrl(worker) {
        const workersHost = process.env.WORKER_HOST;
        const workersPort = process.env.WORKER_PORT;
        return `${workersHost}${worker}:${workersPort}`;
    }

    #sendTasks(req) {
        for (let i = 0; i < this.workersCount; i++) {
            this.#sendTask(i, req);
        }
    }

    #sendTask(taskId, req) {
        const workersCount = this.workersCount;
        const total = this.state.total;
        const count = Math.floor(total / workersCount);
        const start = taskId * count;
        const taskSize = (taskId + 1 == workersCount) ? total - start : count;

        const task = {
            requestId: req._id,
            hash: req.hash,
            taskId: taskId,
            alphabet: this.alphabet,
            start: start,
            count: taskSize,
        };
        this.broker.sendTask(task)
        .catch((err) => console.log(`Failed to send task${taskId}`, err))
        .then((_) => {
            console.log(`Task${taskId} sended`);
            this.state.confirm(taskId);
            this.db.updateState(this.state); 
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
