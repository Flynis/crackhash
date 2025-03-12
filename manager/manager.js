import { v4 as uuidv4 } from 'uuid';

export default class Manager {
    alphabet = "abcdefghijklmnopqrstuvwxyz1234567890";
    requests = new Map();
    workersCount = 0;
    freeWorkers = 0;

    constructor(workersCount) {
        this.workersCount = workersCount;
        this.freeWorkers = workersCount;
    }

    async handleCrackRequest(crackRequest) {
        const request = {
            hash: crackRequest.hash,
            maxLength: crackRequest.maxLength,
            status: "IN_PROGRESS",
            data: []
        }

        if (this.freeWorkers != this.workersCount) {
            return null;
        }

        const id = uuidv4();
        this.requests.set(id, request);

        await sendTasks(this.workersCount, id, this.alphabet, crackRequest.hash, crackRequest.maxLength);

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

    #sendTasks(workersCount, requestId, alphabet, hash, maxLength) {
        const allPermsCount = permutationsCount(alphabet.length, maxLength);
        const countPerTask = Math.floor(allPermsCount / workersCount);
    
        const task = {
            requestId: requestId,
            hash: hash,
            alphabet: alphabet,
            start: 0,
            count: countPerTask
        };
    
        for (let i = 0; i < workersCount - 1; i++) {
            sendTask(i, task);
            task.start += countPerTask;
        }
    
        task.count = allPermsCount - task.start;
        sendTask(workersCount - 1, task);
    }
    
    #sendTask(worker, task) {
        fetch(`worker${worker}/internal/api/worker/hash/crack/task`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(task)
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
