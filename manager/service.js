import express from 'express';
import Manager from './manager.js';

export default class ManagerService {
    app = express();
    manager = new Manager();

    constructor() {
        this.app.use(express.json());

        this.app.post("/api/hash/crack", (req, res) => {
            if (!req.body) {
                return res.sendStatus(400);
            }

            const crackRequest = {
                hash: req.body.hash,
                maxLength: req.body.maxLength
            };
            let requestId = this.manager.handleRequest(crackRequest);
            console.log(`Request hash ${crackRequest.hash}`);
        
            if (requestId) {
                res.send({
                    requestId: requestId        
                });
            } else {
                res.sendStatus(500);
            }
        });
        
        this.app.get("/api/hash/status", (req, res) => {
            const id = req.query.requestId;
        
            if (!this.manager.hasRequest(id)) {
                return res.sendStatus(400);
            }
        
            const status = this.manager.getRequestStatus(id);
            res.send(status);
        });
        
        this.app.patch("/internal/api/manager/hash/crack/request", (req, res) => {
            if (!req.body) {
                return res.sendStatus(400);
            }
        
            const id = req.body.requestId;
            if (!this.manager.hasRequest(id)) {
                return res.sendStatus(400);
            }
        
            const data = req.body.data;
            this.manager.updateRequestData(id, data);
        
            res.sendStatus(200);
        });
    }

    start(port) {
        this.app.listen(port, () => {
            console.log("Manager started");
        });
    }
};