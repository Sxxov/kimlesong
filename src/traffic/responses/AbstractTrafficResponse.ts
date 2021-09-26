export abstract class AbstractTrafficResponse {
	public static TYPE = 'traffic';
	public type = AbstractTrafficResponse.TYPE;
	public source = 'main';
	public name = this.constructor.name;

	constructor(public messageId: string) {}
}
