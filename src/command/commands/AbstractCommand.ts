export abstract class AbstractCommand {
	public abstract name: string;
	public abstract description: string;
	public abstract reply(): string;
}
