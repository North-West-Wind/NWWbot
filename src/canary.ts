import * as dotenv from "dotenv";
import { CanaryHandler } from "./handler";
import { NorthClient, ClientStorage } from "./classes/NorthClient";
import { Options, Intents } from "discord.js";
dotenv.config();

const { prefixC } = require("../config.json");
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
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_PRESENCES
    ]
});
client.log = "733912780679413886";
NorthClient.storage = new ClientStorage();

client.prefix = prefixC;
client.id = 2;
CanaryHandler.setup(client, process.env.TOKEN_CANARY);