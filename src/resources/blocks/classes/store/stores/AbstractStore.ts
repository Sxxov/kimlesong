import {
	IllegalAssignmentError,
	IllegalInvocationError,
} from '../../../../errors';

type Subscriber<T> = (v: T) => void;
type InvalidateCallback = () => void;
type SubscriberEntry<T> = [
	subscriber: Subscriber<T>,
	onInvalidate: InvalidateCallback,
];
type Unsubscriber = () => void;
type Updater<T> = (v: T) => T;

export abstract class AbstractStore<T> {
	public isWritable = true;

	public abstract set(v: T): void;
	public abstract update(updater: Updater<T>): void;
	public abstract subscribe(
		subscriber: Subscriber<T>,
		onInvalidate: InvalidateCallback,
	): Unsubscriber;

	public abstract subscribeLazy(
		subscriber: Subscriber<T>,
		onInvalidate: InvalidateCallback,
	): Unsubscriber;

	protected abstract unsubscribe(entry: SubscriberEntry<T>): void;

	public seal() {
		if (!this.isWritable) {
			throw new IllegalInvocationError(
				'Cannot seal non-writable store',
				this.constructor.name + '#seal()',
			);
		}

		this.isWritable = false;

		const { set } = this;

		this.set = this.nonWritableSet;

		return set.bind(this);
	}

	private nonWritableSet(_: T) {
		throw new IllegalAssignmentError(
			'This store is not writable',
			'PrimitiveStore#value',
		);
	}
}
