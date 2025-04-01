import 'dotenv/config';
import ManagerService from './manager_service.js';

const service = new ManagerService();
await service.init();
service.start(process.env.MANAGER_PORT);
