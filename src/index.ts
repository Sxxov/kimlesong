import './env.js';
import AbortController from 'abort-controller';
import { ClientSingleton } from './client/ClientSingleton.js';
import { CrashHandlerSingleton } from './client/CrashHandlerSingleton.js';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(global as any).AbortController = AbortController;
CrashHandlerSingleton.register();
await ClientSingleton.client.login(process.env.TOKEN);
