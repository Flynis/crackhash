const express = require("express");
const { v4: uuidv4 } = require('uuid');
     
const app = express();
const port = 3000;
app.use(express.json());

let requests = new Map();

app.post("/api/hash/crack", function(req, res) {
    if (!req.body) {
        return res.sendStatus(400);
    }
    const hash = req.body.hash;
    const maxLength = req.body.maxLength;

    let request = {
        hash: hash,
        maxLength: maxLength,
        status: "IN_PROGRESS",
        data: []
    };

    const id = uuidv4();
    requests.set(id, request);

    const resBody = {
        requestId: id
    };
    res.send(resBody);
});

app.get("/api/hash/status:requestId", function(req, res) {
    const id = req.params.requestId;
    if (!requests.has(id)) {
        return res.sendStatus(400);
    }

    let request = requests.get(id);
    const data = (request.data.length > 0) ? request.data : null;

    const resBody = {
        status: request.status,
        data: data
    };
    res.send(resBody);
});

app.listen(port, function(){
    console.log("Manager started");
});