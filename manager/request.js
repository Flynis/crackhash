import {Status} from "./status.js";

export default class Request {
    status = Status.InProgress;
    data = new Array();
    date = Date.now();

    constructor(id, hash, maxLength) {
        this._id = id;
        this.hash = hash;
        this.maxLength = maxLength;
    }

    getStatusWithProgress(progress) {
        const status = this.getStatus();
        status.progress = progress;
        return status;
    }

    getStatus() {
        return {
            status: this.status,
            data: this.data,
        };
    }

    setErrorStatus() {
        if (this.status == Status.InProgress) {
            this.status = Status.Err;
        }
    }

    addData(data) {
        this.data.push(...data);
        if (this.data.length > 0) {
            this.status = Status.Partial;
        }
    }

    complete() {
        this.status = Status.Ready;
    }

    completed() {
        return this.status == Status.Ready;
    }

    static copy(req) {
        const r = new Request(req._id, req.hash, req.maxLength);
        r.status = req.status;
        for (let i = 0; i < req.data.length; i += 1) {
            r.data.push(i);
        }
        r.date = req.date;
        return r;
    }
    
};