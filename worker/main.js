import WorkerService from "./service.js";
import 'dotenv/config';

const service = new WorkerService();
service.start(process.env.PORT);
