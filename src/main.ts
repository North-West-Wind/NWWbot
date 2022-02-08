import * as dotenv from "dotenv";
import { Handler } from "./handler.js";
import { NorthClient, ClientStorage } from "./classes/NorthClient.js";
import { Intents, Options } from "discord.js";
import config from "../config.json";
dotenv.config();

const client = new NorthClient({
    restRequestTimeout: 60000,
    makeCache: Options.cacheWithLimits({
        MessageManager: 50,
        PresenceManager: 0
    }),
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
NorthClient.storage = new ClientStorage();

client.prefix = config.prefix0;
client.id = 0;
Handler.setup(client, process.env.TOKEN0);