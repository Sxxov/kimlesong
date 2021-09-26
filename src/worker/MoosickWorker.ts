import { parentPort } from 'worker_threads';
import { YoutubeMoosick } from 'youtube-moosick';
import { MoosickResponder } from '../moosick/MoosickResponder.js';

export class MoosickWorker {
	private static ytm: YoutubeMoosick;
	private static moosickResponder: MoosickResponder;

	public static async register() {
		this.ytm = await YoutubeMoosick.new();
		this.moosickResponder = new MoosickResponder(parentPort!, this.ytm);
	}
}

await MoosickWorker.register();
