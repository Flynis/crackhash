import express from 'express';
import Manager from './manager.js';
import 'dotenv/config';
     
const app = express();
const port = 3000;
const workersCount = process.env.WORKERS_COUNT;
const manager = new Manager(workersCount);

app.use(express.json());

app.post("/api/hash/crack", function(req, res) {
    if (!req.body) {
        return res.sendStatus(400);
    }

    const crackRequest = {
        hash: req.body.hash,
        maxLength: req.body.maxLength
    };
    console.log(crackRequest);

    let requestId = manager.handleCrackRequest(crackRequest);

    if (requestId) {
        res.send({
            requestId: requestId        
        });
    } else {
        res.sendStatus(500);
    }
});

app.get("/api/hash/status", function(req, res) {
    const id = req.query.requestId;

    if (!manager.hasRequest(id)) {
        return res.sendStatus(400);
    }

    const requestStatus = manager.getRequestStatus(id);

    res.send(requestStatus);
});

app.patch("/internal/api/manager/hash/crack/request", function(req, res) {
    if (!req.body) {
        return res.sendStatus(400);
    }

    const requestId = req.body.requestId;
    if (!manager.hasRequest(requestId)) {
        return res.sendStatus(400);
    }

    const data = req.body.data;
    manager.updateRequestData(requestId, data);

    res.sendStatus(200);
});

app.listen(port, function() {
    console.log("Manager started");
});