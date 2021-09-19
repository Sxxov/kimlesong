import type { ContinuablePlaylistURL } from 'youtube-moosick';
import type { QueueItem } from '../queue/QueueItem.js';
import {
	Store,
	STORE_SET_KEY,
	Storify,
} from '../resources/blocks/classes/store/Store.js';
import type { ArrayStore } from '../resources/blocks/classes/store/stores/ArrayStore.js';
import { MapStore } from '../resources/blocks/classes/store/stores/MapStore.js';

function contextual(target: typeof States, name: keyof typeof State.s): void {
	// no need to define extra setter (like set/get decorators)
	// to capture initialization as this is used on static values,
	// which will be initialized before this decorator is called

	State.s[name] = new Store<any>(target[name]);

	Object.defineProperty(State, name, {
		set(v) {
			(State.s[name] as Store<any>)[STORE_SET_KEY](v);
		},
		get() {
			return State.s[name].value;
		},
	});
}

type CtxStoreMap = {
	[Q in Exclude<keyof typeof States, 'prototype'>]: Storify<typeof States[Q]>;
};

// @ts-expect-error props will be initialized later
export const State: {
	s: CtxStoreMap;
} & Pick<typeof States, Exclude<keyof typeof States, 'prototype'>> = {
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	s: {} as CtxStoreMap,
};

export class States {
	@contextual public static guildIdToQueue: MapStore<
		string,
		ArrayStore<QueueItem>
	> = new MapStore();

	@contextual public static guildIdToQueuedPlaylists: MapStore<
		string,
		ArrayStore<ContinuablePlaylistURL>
	> = new MapStore();

	@contextual public static guildIdToQueueMoreTimeout: MapStore<
		string,
		ReturnType<typeof setTimeout>
	> = new MapStore();

	// for if the server crashes, it can reply with an error instead of disappearing
	@contextual public static guildIdToQueueChannelId: MapStore<
		string,
		string
	> = new MapStore();

	@contextual public static guildIds: ArrayStore<string> | undefined =
		undefined;
}
