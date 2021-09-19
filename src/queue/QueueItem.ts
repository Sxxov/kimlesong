import { Item } from '../resources/blocks/classes/item/Item.js';

export class QueueItem extends Item {
	public declare title: string;
	public declare artist: string;
	public declare duration: number;
	public declare id: string;
	public declare playlistId?: string;
}
