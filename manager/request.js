import {Status} from "./status.js";

export default class Request {
    status = Status.InProgress;
    data = new Array();
    timerId = 0;

    constructor(id, hash, maxLength) {
        this.id = id;
        this.hash = hash;
        this.maxLength = maxLength;
    }

    getStatus(progress) {
        const data = (this.data.length > 0) ? this.data : null;
        return {
            status: this.status,
            progress: progress,
            data: data,
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
};