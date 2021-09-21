import { Item } from '../resources/blocks/classes/item/Item.js';

export class ClientCredentialsItem extends Item {
	public declare token: string;
	public declare clientId: string;
}
