export abstract class AbstractMoosickResponse {
	public static TYPE = 'moosick';
	public type = AbstractMoosickResponse.TYPE;
	public source = 'worker';
	public name = this.constructor.name;
}
