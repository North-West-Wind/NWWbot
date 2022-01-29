import * as dotenv from "dotenv";
import { AliceHandler } from "./handler";
import { NorthClient, ClientStorage } from "./classes/NorthClient";
import { RowDataPacket } from "mysql2";
import { getFetch, profile } from "./function";
import { GuildMember, Intents, Options, VoiceChannel } from "discord.js";
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
    const [results] = <RowDataPacket[][]> await client.pool.query(`SELECT uuid, dcid FROM dcmc`);
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

export async function updateGuildMemberMC(member: GuildMember, mcUuid: string) {
  const { name } = await profile(mcUuid);
  const res = await fetch(`https://api.slothpixel.me/api/players/${name}?key=${process.env.API}`).then(res => res.json());
  const mcLen = res.username.length + 1;
  const bw = res.stats.BedWars;
  const firstHalf = `[${bw.level}⭐|${bw.final_k_d}]`;
  if (firstHalf.length + mcLen > 32) await member.setNickname(`${firstHalf} ${res.username.slice(0, 28 - firstHalf.length)}...`);
  else await member.setNickname(`${firstHalf} ${res.username}`);
  const gInfo = <any> await fetch(`https://api.slothpixel.me/api/guilds/${mcUuid}?key=${process.env.API}`).then(res => res.json());
  const roles = member.roles;
  if (gInfo.id === "5b25306a0cf212fe4c98d739") await roles.add("622319008758104064");
  await roles.add("676754719120556042");
  await roles.add("837345908697989171");
  await roles.remove("837345919010603048");

  await roles.remove(["851471525802803220", "851469005168181320", "851469138647842896", "851469218310389770", "851469264664789022", "851469323444944907", "851469358076788766", "851469389806829596", "851469422971584573", "851469455791489034", "851469501115793408", "851469537030307870", "851469565287858197", "851469604840013905", "851469652940161084", "851469683764887572", "851469718955229214", "851469754677985280", "851469812050690068", "851469858675097660", "851469898547068938", "851469933606862848", "851469969685479424", "851470006520905748", "851470041031245854", "851470070022406204", "851470099558039622", "851470140410822677", "851470173503881218", "851470230370910248", "851471153188569098"]);
  if (bw.level < 100) await roles.add("851471525802803220");
  else if (bw.level < 200) await roles.add("851469005168181320");
  else if (bw.level < 300) await roles.add("851469138647842896");
  else if (bw.level < 400) await roles.add("851469218310389770");
  else if (bw.level < 500) await roles.add("851469264664789022");
  else if (bw.level < 600) await roles.add("851469323444944907");
  else if (bw.level < 700) await roles.add("851469358076788766");
  else if (bw.level < 800) await roles.add("851469389806829596");
  else if (bw.level < 900) await roles.add("851469422971584573");
  else if (bw.level < 1000) await roles.add("851469455791489034");
  else if (bw.level < 1100) await roles.add("851469501115793408");
  else if (bw.level < 1200) await roles.add("851469537030307870");
  else if (bw.level < 1300) await roles.add("851469565287858197");
  else if (bw.level < 1400) await roles.add("851469604840013905");
  else if (bw.level < 1500) await roles.add("851469652940161084");
  else if (bw.level < 1600) await roles.add("851469683764887572");
  else if (bw.level < 1700) await roles.add("851469718955229214");
  else if (bw.level < 1800) await roles.add("851469754677985280");
  else if (bw.level < 1900) await roles.add("851469812050690068");
  else if (bw.level < 2000) await roles.add("851469858675097660");
  else if (bw.level < 2100) await roles.add("851469898547068938");
  else if (bw.level < 2200) await roles.add("851469933606862848");
  else if (bw.level < 2300) await roles.add("851469969685479424");
  else if (bw.level < 2400) await roles.add("851470006520905748");
  else if (bw.level < 2500) await roles.add("851470041031245854");
  else if (bw.level < 2600) await roles.add("851470070022406204");
  else if (bw.level < 2700) await roles.add("851470099558039622");
  else if (bw.level < 2800) await roles.add("851470140410822677");
  else if (bw.level < 2900) await roles.add("851470173503881218");
  else if (bw.level < 3000) await roles.add("851470230370910248");
  else await roles.add("851471153188569098");

  await roles.remove(["662895829815787530", "837271174827212850", "837271174073155594", "837271173027856404", "837271172319674378", "837271171619356692"]);
  if (res.rank === "YOUTUBER") await roles.add("662895829815787530");
  else if (res.rank === "VIP") await roles.add("837271174827212850");
  else if (res.rank === "VIP_PLUS") await roles.add("837271174073155594");
  else if (res.rank === "MVP") await roles.add("837271173027856404");
  else if (res.rank === "MVP_PLUS") await roles.add("837271172319674378");
  else if (res.rank === "MVP_PLUS_PLUS") await roles.add("837271171619356692");
}