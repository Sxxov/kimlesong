export abstract class AbstractTrafficRequest {
	public static TYPE = 'traffic';
	public type = AbstractTrafficRequest.TYPE;
	public source = 'worker';
	public name = this.constructor.name;

	constructor(public messageId: string) {}
}
