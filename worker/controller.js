import express from 'express';
import Worker from './worker.js';

const app = express();
const port = 5000;
const worker = new Worker();

app.use(express.json());

app.post("/internal/api/worker/hash/crack/task", function(req, res) {
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

    worker.processTask(task);

    res.sendStatus(200);
});

app.listen(port, function() {
    console.log("Worker started");
});