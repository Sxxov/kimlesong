import './env.js';
import { ClientSingleton } from './client/ClientSingleton.js';
import { CrashHandlerSingleton } from './client/CrashHandlerSingleton.js';

CrashHandlerSingleton.register();
await ClientSingleton.client.login(process.env.TOKEN);
