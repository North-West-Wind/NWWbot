import * as dotenv from "dotenv";
import { AliceHandler } from "./handler.js";
import { NorthClient, ClientStorage } from "./classes/NorthClient.js";
import { getFetch, getTokensAndMultiplier, profile, query, updateGuildMemberMC, updateTokens } from "./function.js";
import { Intents, Options, VoiceChannel } from "discord.js";
import config from "../config.json" assert { type: "json" };
dotenv.config();

const fetch = getFetch();

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

client.prefix = config.prefix1;
client.id = 1;
AliceHandler.setup(client, process.env.TOKEN1);

setInterval(async () => {
  try {
    const guild = await client.guilds.fetch("622311594654695434");
    const results = await query(`SELECT uuid, dcid FROM dcmc`);
    for (const result of results) {
      const member = await guild.members.fetch(result.dcid);
      if (!member) continue;
      await updateGuildMemberMC(member, result.uuid);
    }
  } catch (err: any) { }
}, 3600000);

const points = [5, 2, 1];
var top3: { uuid: string, exp: number }[] = [];
var lastDate: string;
setInterval(async () => {
  try {
    const guildApi = <any> await fetch(`https://api.slothpixel.me/api/guilds/id/5b25306a0cf212fe4c98d739?key=${process.env.API}`).then(res => res.json());
    const level = Math.round(guildApi.level);
    const members = guildApi.members;
    const latestDate = Object.keys(members[0].exp_history)[0];
    if (lastDate !== latestDate && top3.length == 3) {
      for (let ii = 0; ii < top3.length; ii++) {
        const top = top3[ii];
        const { tokens, multiplier } = await getTokensAndMultiplier(null, top.uuid);
        await updateTokens(null, top.uuid, tokens + points[ii] * multiplier);
      }
    }
    top3 = members.map((mem: any) => ({ uuid: mem.uuid, exp: mem.exp_history[latestDate] })).sort((a: any, b: any) => b.exp - a.exp).slice(0, 3);
    lastDate = latestDate;
    (<VoiceChannel> await client.channels.fetch("871768634228355162")).edit({ name: `Guild Level: ${level}` });
    (<VoiceChannel> await client.channels.fetch("871765968190324796")).edit({ name: `Guild Members: ${members.length}` });
    (<VoiceChannel> await client.channels.fetch("871768862629187606")).edit({ name: `Daily Guild Top: ${(await profile(top3[0].uuid)).name}` });
  } catch (err: any) { }
}, 60000);