import { Worker } from 'worker_threads';
import TaskProgress, { TaskProgressSize } from './task_progress.js';
import { MessageType } from './message_type.js';
import 'dotenv/config';

export default class WorkerControler {
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
    onComplete = (result) => { console.log(result); };

    constructor() {
        this.worker = new Worker('./worker.js');

        this.worker.on('message', (msg) => {
            const {type, data} = msg;
            if (type == MessageType.Result) {
                this.completed = true;
                const result = {
                    requestId: this.currentTask.requestId,
                    data: data,
                    count: this.currentTask.count
                };
                console.log("Task completed");
                this.onComplete(result);
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
        const percent = Math.floor((progress.processed / progress.count) * 100);
        console.log(`Progress ${progress.processed}/${progress.count} ${percent}%`);
        return progress;
    }
};