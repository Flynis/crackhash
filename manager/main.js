import ManagerService from './service.js';
import 'dotenv/config';

const service = new ManagerService();
service.start(process.env.PORT);
