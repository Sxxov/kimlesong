export abstract class AbstractMoosickRequest {
	public static TYPE = 'moosick';
	public type = AbstractMoosickRequest.TYPE;
	public source = 'worker';
	public name = this.constructor.name;
}
