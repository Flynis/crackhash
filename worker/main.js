import WorkerService from "./service.js";
import 'dotenv/config';

const service = WorkerService();
service.start(process.env.PORT);
