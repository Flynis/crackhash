import express from 'express';
import Manager from './manager';
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

    let requestId = manager.handleCrackRequest(crackRequest);

    if (requestId) {
        res.send({
            requestId: requestId        
        });
    } else {
        res.sendStatus(500);
    }
    
});

app.get("/api/hash/status:requestId", function(req, res) {
    const id = req.params.requestId;

    if (!manager.hasRequest(id)) {
        return res.sendStatus(400);
    }

    const requestStatus = manager.getRequestStatus(id);

    res.send(requestStatus);
});

app.listen(port, function() {
    console.log("Manager started");
});