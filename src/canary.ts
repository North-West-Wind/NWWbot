import * as dotenv from "dotenv";
import { RowDataPacket } from "mysql2";
import { CanaryHandler } from "./handler";
import { NorthClient, ClientStorage } from "./classes/NorthClient";
dotenv.config();

const canary = new NorthClient({ restRequestTimeout: 60000, messageCacheMaxSize: 50, messageCacheLifetime: 3600, messageSweepInterval: 300, partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'] });
canary.log = "733912780679413886";
NorthClient.storage = new ClientStorage(canary);

canary.prefix = "%";
canary.id = 0;
CanaryHandler.setup(canary, process.env.TOKEN_CANARY);