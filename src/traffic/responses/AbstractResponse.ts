export abstract class AbstractResponse {
	public source = 'main';
	public name = this.constructor.name;

	constructor(public messageId: string) {}
}
