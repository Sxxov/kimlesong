import { IllegalInvocationError } from '../../../errors';

export class AsyncConstructor {
	private static isBeingInstantiated = false;

	protected constructor() {
		if (
			!(this.constructor as typeof AsyncConstructor).isBeingInstantiated
		) {
			throw new IllegalInvocationError(
				`Constructor was called directly. (Use "await ${
					this?.constructor?.name ?? '[unknown]'
				}.new()" instead)`,
			);
		}

		(this.constructor as typeof AsyncConstructor).isBeingInstantiated =
			false;
	}

	public static async new<T = AsyncConstructor>(..._args: any[]): Promise<T> {
		this.brace();

		return undefined as unknown as Promise<T>;
	}

	protected static brace(): void {
		this.isBeingInstantiated = true;
	}
}
