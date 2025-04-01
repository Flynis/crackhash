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

            this.manager.handleRequest(request)
            .catch((err) => {
                console.log(err);
                res.sendStatus(500);
            })
            .then((id) => {
                if (id) {
                    res.send({
                        requestId: id        
                    });
                } else {
                    res.sendStatus(429);
                }
            });
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
    }

    async init() {
        await this.manager.init();
    }

    start(port) {
        this.app.listen(port, () => {
            console.log("Manager service started");
        });
    }

};