import express from 'express';
import Manager from './manager';
     
const app = express();
const port = 3000;
const manager = new Manager();

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

    res.send({
        requestId: requestId        
    });
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