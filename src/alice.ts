import * as dotenv from "dotenv";
import { AliceHandler } from "./handler.js";
import { NorthClient, ClientStorage } from "./classes/NorthClient.js";
import { changeTokens, getFetch, getWeek, profile, query, updateGuildMemberMC } from "./function.js";
import { Intents, Options, VoiceChannel } from "discord.js";
import * as fs from "fs";
dotenv.config();
const config = JSON.parse(fs.readFileSync("config.json", { encoding: "utf8" })) || { prefix1: ">" };

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

const points = [5, 2, 1];
var top3: { uuid: string, exp: number }[] = [];
var lastDate: string, lastWeek = getWeek(new Date());
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
  try {
    const guildApi = <any> await fetch(`https://api.slothpixel.me/api/guilds/id/5b5548e70cf21fddabf8c6c1?key=${process.env.API}`).then(res => res.json());
    const level = Math.round(guildApi.level);
    const members = guildApi.members;
    const latestDate = Object.keys(members[0].exp_history)[0];
    if (lastDate && lastDate !== latestDate) {
      console.debug("Crossing date!");
      if (top3.length === 3) {
        for (let ii = 0; ii < top3.length; ii++) {
          const top = top3[ii];
          await changeTokens(null, top.uuid, points[ii]);
        }
      }
      const last2Date = Object.keys(members[0].exp_history)[2];
      for (const member of members.filter(mem => mem.exp_history[lastDate] < 2000)) await changeTokens(null, member.uuid, -4);
      for (const member of members.filter(mem => mem.exp_history[lastDate] <= 0 && mem.exp_history[last2Date] <= 0)) await changeTokens(null, member.uuid, -4);
    }
    lastDate = latestDate;
    top3 = members.map((mem: any) => ({ uuid: mem.uuid, exp: mem.exp_history[latestDate] })).sort((a: any, b: any) => b.exp - a.exp).slice(0, 3);
    (<VoiceChannel> await client.channels.fetch("871768634228355162")).edit({ name: `Guild Level: ${level}` });
    (<VoiceChannel> await client.channels.fetch("871765968190324796")).edit({ name: `Guild Members: ${members.length}` });
    (<VoiceChannel> await client.channels.fetch("871768862629187606")).edit({ name: `Daily Guild Top: ${(await profile(top3[0].uuid)).name}` });

    const latestWeek = getWeek(new Date());
    if (lastWeek !== latestWeek) {
      const guild = await client.guilds.fetch("622311594654695434");
      const position = (await guild.roles.fetch("640148120579211265")).position;
      for (const member of (await guild.members.fetch()).filter(mem => (mem.roles.highest?.position || 0) > position).values()) await changeTokens(member.id, null, 5);
      lastWeek = latestWeek;
    }
  } catch (err: any) { console.error(err); }
}, 1800000);