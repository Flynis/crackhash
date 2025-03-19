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

            const request = {
                hash: req.body.hash,
                maxLength: req.body.maxLength
            };

            const id = this.manager.handleRequest(request);
            if (id) {
                res.send({
                    requestId: id        
                });
            } else {
                res.sendStatus(429);
            }
        });
        
        this.app.get("/api/hash/status", (req, res) => {
            const id = req.query.requestId;
        
            if (!this.manager.hasRequest(id)) {
                return res.sendStatus(400);
            }
        
            this.manager.getRequestStatus(id).then((status) => {
                res.send(status);
            });
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