import * as dotenv from "dotenv";
import { CanaryHandler } from "./handler.js";
import { NorthClient, ClientStorage } from "./classes/NorthClient.js";
import { Options, GatewayIntentBits, Partials } from "discord.js";
import * as fs from "fs";
dotenv.config();
const config = JSON.parse(fs.readFileSync("config.json", { encoding: "utf8" })) || { prefix1: "%" };

const client = new NorthClient({
    closeTimeout: 60000,
    makeCache: Options.cacheWithLimits({
        MessageManager: 50,
        PresenceManager: 0
    }),
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember],
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ]
});
NorthClient.storage = new ClientStorage();

client.prefix = config.prefixC;
client.id = 2;
CanaryHandler.setup(client, process.env.TOKEN_CANARY);