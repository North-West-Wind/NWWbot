import * as dotenv from "dotenv";
import { CanaryHandler } from "./handler.js";
import { NorthClient, ClientStorage } from "./classes/NorthClient.js";
import { Options, Intents } from "discord.js";
import * as fs from "fs";
dotenv.config();
const config = JSON.parse(fs.readFileSync("config.json", { encoding: "utf8" })) || { prefix1: "%" };

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
NorthClient.storage = new ClientStorage();

client.prefix = config.prefixC;
client.id = 2;
CanaryHandler.setup(client, process.env.TOKEN_CANARY);