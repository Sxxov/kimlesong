import {
	Store,
	STORE_SET_KEY,
	Storify,
} from '../resources/blocks/classes/store/Store.js';
import { ArrayStore } from '../resources/blocks/classes/store/stores/ArrayStore.js';
import type { GuildState } from './states/GuildState.js';
import type { VoiceChannelState } from './states/VoiceChannelState.js';

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
	@contextual public static guilds = new ArrayStore<GuildState>();
	@contextual public static voiceChannels =
		new ArrayStore<VoiceChannelState>();
}
