import { Worker } from 'worker_threads';
import TaskProgress, { TaskProgressSize } from './task_progress.js';
import { MessageType } from './message_type.js';
import path from 'path';
import 'dotenv/config';

export default class WorkerControler {
    managerUrl = process.env.MANAGER_URL;
    buffer = new SharedArrayBuffer(TaskProgressSize);
    taskProgress = new TaskProgress(this.buffer);
    currentTask = {
        requestId: "",
        hash: "",
        alphabet: "",
        start: 0,
        count: 0
    };
    completed = true;

    constructor() {
        this.worker = new Worker(path.join(__dirname, 'worker.js'));

        this.worker.on('message', (msg) => {
            const {type, data} = msg;
            if (type == MessageType.Result) {
                this.completed = true;
                this.#sendResult(data);
            }
        });

        this.worker.postMessage({
            type: MessageType.Init,
            data: this.buffer
        });
    }

    processTask(task) {
        if (!this.completed) {
            return false;
        }

        console.log(`Processing task ${task.requestId}`);
        console.log(`Range start=${task.start}, count=${task.count}`);

        this.currentTask = task;
        this.completed = false;
        this.taskProgress.current = 0;
        this.worker.postMessage({
            type: "task",
            data: task,
        });

        return true;
    }

    getProgress() {
        const progress = {
            processed: this.taskProgress.current,
            count: this.currentTask.count,
        };
        const percent = (progress.processed / progress.count) * 100;
        console.log(`Progress ${progress.processed}/${progress.count} ${percent}%`);
        return progress;
    }

    #sendResult(result) {
        console.log(`Found ${result.length} words`);
        fetch(`${this.managerUrl}/internal/api/manager/hash/crack/request`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                requestId: this.currentTask.requestId,
                data: result
            })
        }).catch((reason) => {
            console.log(reason)
        }).then((_) => {
            console.log("Result sended");
        });
    }
};