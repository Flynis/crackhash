import express from 'express';
import Worker from './worker.js';

export default class WorkerService {
    app = express();
    worker = new Worker();

    constructor() {
        app.use(express.json());

        app.post("/internal/api/worker/hash/crack/task", (req, res) => {
            if (!req.body) {
                return res.sendStatus(400);
            }

            const task = {
                requestId: req.body.requestId,
                hash: req.body.hash,
                alphabet: req.body.alphabet,
                start: req.body.start,
                count: req.body.function
            };
            res.sendStatus(200);
            console.log(`Processing task ${task.requestId}`);
            console.log(`Range start=${task.start}, count=${task.count}`);

            worker.processTask(task);
        });
    }

    start(port) {
        app.listen(port, () => {
            console.log("Worker started");
        });
    }
};
