import * as dotenv from "dotenv";
import { Handler } from "./handler";
import { NorthClient, ClientStorage } from "./classes/NorthClient";
import { Intents, Options } from "discord.js";
dotenv.config();

const prefix = "?";
const client = new NorthClient({
    restRequestTimeout: 60000,
    makeCache: Options.cacheWithLimits({
        MessageManager: 50,
        PresenceManager: 0
    }),
    messageCacheLifetime: 3600,
    messageSweepInterval: 300,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'],
    intents: [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES
    ]
});
client.log = "678847137391312917";
NorthClient.storage = new ClientStorage(client);

client.prefix = prefix;
client.id = 0;
Handler.setup(client, process.env.TOKEN0);