import { parentPort } from 'worker_threads';
import { MessageType } from './message_type.js';
import TaskProgress from './task_progress.js';
import HashBruteForce from './hash_brute_force.js';

let taskProgress = null;
const hash = new HashBruteForce();

parentPort.on('message', (msg) => {
    const {type, data} = msg;
    switch(type) {
        case MessageType.Init:  
            taskProgress = new TaskProgress(data);
            break;
        case MessageType.Task:  
            const result = hash.crackHash(data, () => {
                taskProgress.current += 1;
            });
            parentPort.postMessage({
                type: MessageType.Result,
                data: result,
            });
            break;
        default: break;
    }
});
