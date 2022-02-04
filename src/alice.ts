import * as dotenv from "dotenv";
import { AliceHandler } from "./handler";
import { NorthClient, ClientStorage } from "./classes/NorthClient";
import { RowDataPacket } from "mysql2";
import { getFetch, profile, query, updateGuildMemberMC } from "./function";
import { Intents, Options, VoiceChannel } from "discord.js";
dotenv.config();

const fetch = getFetch();

const { prefix1 } = require("../config.json");
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

client.prefix = prefix1;
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

setInterval(async () => {
  try {
    const guildApi = <any> await fetch(`https://api.slothpixel.me/api/guilds/id/5b25306a0cf212fe4c98d739?key=${process.env.API}`).then(res => res.json());
    const level = Math.round(guildApi.level);
    const members = guildApi.members;
    var top = { member: null, exp: 0 };
    for (const member of members) {
      const exp = <number> Object.values(member.exp_history)[0];
      if (exp > top.exp) {
        top.exp = exp;
        top.member = member.uuid;
      }
    }
    (<VoiceChannel> await client.channels.fetch("871765968190324796")).edit({ name: `Guild Members: ${members.length}` });
    (<VoiceChannel> await client.channels.fetch("871768634228355162")).edit({ name: `Guild Level: ${level}` });
    (<VoiceChannel> await client.channels.fetch("871768862629187606")).edit({ name: `Daily Guild Top: ${(await profile(top.member)).name}` });
  } catch (err: any) { }
}, 60000);