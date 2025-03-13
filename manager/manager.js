import { v4 as uuidv4 } from 'uuid';

export default class Manager {
    alphabet = "abcdefghijklmnopqrstuvwxyz1234567890";
    requests = new Map();
    workersCount = 0;
    freeWorkers = 0;

    constructor(workersCount) {
        console.log(`Workers count = ${workersCount}`);
        this.workersCount = workersCount;
        this.freeWorkers = workersCount;
    }

    handleCrackRequest(crackRequest) {
        const request = {
            hash: crackRequest.hash,
            maxLength: crackRequest.maxLength,
            status: "IN_PROGRESS",
            data: new Array(),
            timerId: 0
        }

        if (this.freeWorkers != this.workersCount) {
            return null;
        }

        const id = uuidv4();
        this.requests.set(id, request);

        this.#sendTasks(id, crackRequest.hash, crackRequest.maxLength);

        const delay = 6000; // ms
        request.timerId = setTimeout(() => {
            this.#requestTimeoutExpired(id);
        }, delay);

        return id;
    }

    hasRequest(requestId) {
        return this.requests.has(requestId);
    }

    getRequestStatus(requestId) {
        const request = requests.get(requestId);
        const data = (request.data.length > 0) ? request.data : null;
    
        const requestStatus = {
            status: request.status,
            data: data
        };

        return requestStatus;
    }

    updateRequestData(id, data) {
        this.freeWorkers += 1;

        const request = requests.get(id);

        if (request.status == "ERROR") {
            return;
        }

        request.data.push(data);
        if (this.freeWorkers == this.workersCount) {
            request.status = "READY";
            clearTimeout(request.timerId);
        }
    }

    #requestTimeoutExpired(requestId) {
        const request = requests.get(requestId);

        if (request.status != "READY") {
            request.status = "ERROR";
        }
    }

    #sendTasks(requestId, hash, maxLength) {
        const allPermsCount = permutationsCount(this.alphabet.length, maxLength);
        const countPerTask = Math.floor(allPermsCount / this.workersCount);
    
        const task = {
            requestId: requestId,
            hash: hash,
            alphabet: alphabet,
            start: 0,
            count: countPerTask
        };
    
        for (let i = 0; i < workersCount - 1; i++) {
            this.#sendTask(i, task);
            task.start += countPerTask;
        }
    
        task.count = allPermsCount - task.start;
        this.#sendTask(workersCount - 1, task);
    }
    
    #sendTask(worker, task) {
        fetch(`worker${worker}:5000/internal/api/worker/hash/crack/task`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(task)
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
