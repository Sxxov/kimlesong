import * as dotenv from 'dotenv';
import assert from 'assert';

dotenv.config();

assert(process.env.TOKEN);
assert(process.env.CLIENT_ID);
