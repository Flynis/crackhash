import { v4 as uuidv4 } from 'uuid';
import * as Combinatorics from './combinatorics.js';

export default class Manager {
    alphabet = "abcdefghijklmnopqrstuvwxyz1234567890";
    requests = new Map();

    handleCrackRequest(crackRequest) {
        const request = {
            hash: crackRequest.hash,
            maxLength: crackRequest.maxLength,
            status: "IN_PROGRESS",
            data: []
        }

        const id = uuidv4();
        this.requests.set(id, request);

        

        return id;
    }

    hasRequest(requestId) {
        return this.requests.has(requestId);
    }

    getRequestStatus(requestId) {
        const request = requests.get(requestId);
        const data = (request.data.length > 0) ? request.data : null;
    
        const requestStatus = {
            status: request.status,
            data: data
        };

        return requestStatus;
    }

};
