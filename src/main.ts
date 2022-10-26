import { Handler, V2Handler } from "./handler.js";
import { NorthClient, ClientStorage } from "./classes/NorthClient.js";
import { GatewayIntentBits, Options, Partials } from "discord.js";
import express from "express";
import * as fs from "fs";
const config = JSON.parse(fs.readFileSync("config.json", { encoding: "utf8" })) || { prefix1: "?" };

const client = new NorthClient({
    closeTimeout: 60000,
    makeCache: Options.cacheWithLimits({
        MessageManager: 50,
        PresenceManager: 0
    }),
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember],
    intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates
    ]
});
NorthClient.storage = new ClientStorage();

client.prefix = config.prefix0;
client.id = 0;
if (process.argv.includes("--old")) Handler.setup(client, process.env.TOKEN_OLD);
else V2Handler.setup(client, process.env.TOKEN0);

const app = express();

app.get("/checkGuild/:guild", async (req, res) => {
    let isInGuild = false;
    let id = null;
    try {
        const guild = await client.guilds.fetch(req.params.guild);
        if (guild) {
            isInGuild = true;
            id = guild.id;
        }
    } catch (err) { }
    res.json({ guildId: id, isIn: isInGuild });
});

if (process.argv.includes("--old")) app.listen(3001);