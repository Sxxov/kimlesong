import assert from 'assert';
import { ClientSingleton } from './client/ClientSingleton.js';

assert(process.env.TOKEN);

await ClientSingleton.client.login(process.env.TOKEN);
