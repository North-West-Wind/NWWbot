import * as dotenv from "dotenv";
import { AliceHandler } from "./handler";
import { NorthClient, ClientStorage } from "./classes/NorthClient";
import { RowDataPacket } from "mysql2";
import { getFetch, profile } from "./function";
import { Intents, Options, VoiceChannel } from "discord.js";
dotenv.config();

const fetch = getFetch();

const prefix = ">";
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
client.log = "678847114935271425";
NorthClient.storage = new ClientStorage(client);

client.prefix = prefix;
client.id = 1;
AliceHandler.setup(client, process.env.TOKEN1);

setInterval(async () => {
  try {
    const guild = await client.guilds.fetch("622311594654695434");
    const [results] = <RowDataPacket[][]> await client.pool.query(`SELECT uuid, dcid FROM dcmc`);
    for (const result of results) {
      const member = await guild.members.fetch(result.dcid);
      if (!member) continue;
      const { name } = await profile(result.uuid);
      const bw = (await fetch(`https://api.slothpixel.me/api/players/${name}?key=${process.env.API}`).then(res => res.json())).stats.BedWars;
      const firstHalf = `[${bw.level}⭐|${bw.final_k_d}]`;
      const newName = member.nickname.replace(/^\[\d+⭐\|[\d.]+\]/, firstHalf);
      if (newName.length > 32) await member.setNickname(`${newName.slice(0, 28 - firstHalf.length)}...`);
      else await member.setNickname(newName);
    }
  } catch (err) { }
}, 3600000);

setInterval(async () => {
  try {
    const guildApi = await fetch(`https://api.slothpixel.me/api/guilds/id/5b25306a0cf212fe4c98d739?key=${process.env.API}`).then(res => res.json());
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
  } catch (err) { }
}, 60000);