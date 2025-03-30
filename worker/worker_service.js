import express from 'express';
import WorkerControler from './worker_controller.js';

export default class WorkerService {
    app = express();
    controller = new WorkerControler();

    constructor() {
        this.app.use(express.json());

        this.app.post("/internal/api/worker/hash/crack/task", (req, res) => {
            if (!req.body) {
                return res.sendStatus(400);
            }

            const task = {
                requestId: req.body.requestId,
                hash: req.body.hash,
                alphabet: req.body.alphabet,
                start: req.body.start,
                count: req.body.count
            };
            
            const status = this.controller.processTask(task);
            if (status) {
                res.sendStatus(200);
            } else {
                res.sendStatus(429);
            }
        });

        this.app.get("/internal/api/worker/hash/crack/progress", (_, res) => {
            const progress = this.controller.getProgress();
            res.send(progress);
        });
    }

    start(port) {
        this.app.listen(port, () => {
            console.log("Worker started");
        });
    }
};
