import * as dotenv from "dotenv";
import { RowDataPacket } from "mysql2";
import { Handler } from "./handler";
import { NorthClient, ClientStorage } from "./classes/NorthClient";
dotenv.config();

const prefix = "?";
const client = new NorthClient({ restRequestTimeout: 60000, messageCacheMaxSize: 50, messageCacheLifetime: 3600, messageSweepInterval: 300, partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'] });
client.log = "678847137391312917";
NorthClient.storage = new ClientStorage(client);

client.prefix = prefix;
client.id = 0;
Handler.setup(client, process.env.TOKEN0);