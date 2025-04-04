import 'dotenv/config';
import {Connection} from 'rabbitmq-client'
import express from 'express';
import WorkerControler from './worker_controller.js';

export default class WorkerService {
    app = express();
    rabbit = new Connection(process.env.BROKER_CONN_STR);
    controller = new WorkerControler();
    taskQueue = "tasks";
    resultQueue = "result";

    constructor() {
        this.rabbit.on('error', (err) => {
            console.log('RabbitMQ connection error', err.message);
        });
        this.rabbit.on('connection', () => {
            console.log('RabbitMQ connection successfully (re)established');
        });

        this.resultPublisher = this.rabbit.createPublisher({
            confirm: true,
            maxAttempts: 2,
            exchanges: [{
                exchange: this.resultQueue, 
                type: 'direct'
            }],
            queues: [{
                queue: this.resultQueue, 
                autoDelete: false, 
                durable: true,
                exclusive: false
            }],
            queueBindings: [{
                exchange: this.resultQueue, 
                routingKey: this.resultQueue,
                queue: this.resultQueue,
            }],
        });
        this.controller.onComplete = (result, resolve) => {
            this.resultPublisher.send({
                exchange: this.resultQueue, 
                routingKey: this.resultQueue,
                durable: true,
            }, result)
            .catch((err) => console.log("Failed to send result", err.message))
            .then((_) => {
                console.log("Result sended");
                resolve();
            });
        };
        
        this.taskConsumer = this.rabbit.createConsumer({
            queue: this.taskQueue,
            queueOptions: {
                durable: true,
                autoDelete: false,
                exclusive: false
            },
            qos: {prefetchCount: 1},
            exchanges: [{
                exchange: this.taskQueue, 
                type: 'direct'
            }],
            queueBindings: [{
                exchange: this.taskQueue, 
                routingKey: this.taskQueue,
                queue: this.taskQueue,
            }],
        }, async (msg) => {
            console.log('Received task');
            await this.controller.processTask(msg.body);
            console.log("Task completed");
        });
        this.taskConsumer.on('error', (err) => {
            console.log('Task consumer error', err);
        });

        this.app.use(express.json());
        this.app.get("/internal/api/worker/hash/crack/progress", (_, res) => {
            const progress = this.controller.getProgress();
            res.send(progress);
        });
        this.app.get("/internal/api/worker/health", (_, res) => {
            console.log("Health check");
            res.sendStatus(200);
        });
    }

    start(port) {
        this.app.listen(port, () => {
            console.log("Worker service started");
        });
    }
    
};
