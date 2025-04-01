import 'dotenv/config';
import {Connection} from 'rabbitmq-client'

export default class MessageBroker {
    rabbit = new Connection(process.env.BROKER_CONN_STR);
    taskQueue = "tasks";
    resultQueue = "result";
    onReceiveResult = (result) => { console.log(result); };

    constructor() {
        this.rabbit.on('error', (err) => {
            console.log('RabbitMQ connection error', err);
        });
        this.rabbit.on('connection', () => {
            console.log('RabbitMQ connection successfully (re)established');
        });

        this.taskPublisher = this.rabbit.createPublisher({
            confirm: true,
            maxAttempts: 2,
            exchanges: [{
                exchange: this.taskQueue, 
                type: "direct"
            }],
            queues: [{
                queue: this.taskQueue, 
                autoDelete: false, 
                durable: true,
                exclusive: false
            }],
            queueBindings: [{
                exchange: this.taskQueue, 
                routingKey: this.taskQueue,
                queue: this.taskQueue,
            }],
        });

        this.resultConsumer = this.rabbit.createConsumer({
            queue: this.resultQueue,
            queueOptions: {
                durable: true,
                autoDelete: false,
                durable: true,
                exclusive: false
            },
            qos: {prefetchCount: 1},
            exchanges: [{
                exchange: this.resultQueue, 
                type: "direct"
            }],
            queueBindings: [{
                exchange: this.resultQueue, 
                routingKey: this.resultQueue,
                queue: this.resultQueue,
            }],
        }, (msg) => {
            console.log('Received result');
            this.onReceiveResult(msg.body);
        });
        this.resultConsumer.on('error', (err) => {
            console.log('Result consumer error', err);
        });
    }

    sendTask(task) {
        this.taskPublisher.send({
            exchange: this.taskQueue, 
            routingKey: this.taskQueue
        }, task)
        .catch((err) => console.log("Failed to send task", err))
        .then((_) => console.log("Task sended"));
    }
    
};