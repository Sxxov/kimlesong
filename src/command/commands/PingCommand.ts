import { AbstractCommand } from './AbstractCommand.js';

export class PingCommand extends AbstractCommand {
	public name = 'ping';
	public description = 'Pong (:';

	public reply(): string {
		throw new Error('Method not implemented.');
	}
}
