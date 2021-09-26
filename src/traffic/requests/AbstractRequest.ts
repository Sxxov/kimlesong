export abstract class AbstractRequest {
	public source = 'worker';
	public name = this.constructor.name;

	constructor(public messageId: string) {}
}
