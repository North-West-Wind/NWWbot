import * as dotenv from "dotenv";
import { AliceHandler } from "./handler";
import { NorthClient, ClientStorage } from "./classes/NorthClient";
import { RowDataPacket } from "mysql2";
import { getFetch, profile } from "./function";
dotenv.config();

const fetch = getFetch();

const prefix = ">";
const client = new NorthClient({ restRequestTimeout: 60000, messageCacheMaxSize: 50, messageCacheLifetime: 3600, messageSweepInterval: 300, partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'] });
client.log = "678847114935271425";
NorthClient.storage = new ClientStorage(client);

client.prefix = prefix;
client.id = 1;
AliceHandler.setup(client, process.env.TOKEN1);

setInterval(async () => {
  if (NorthClient.storage.queries.length < 1) return;
  try {
    const con = await client.pool.getConnection();
    for (const query of NorthClient.storage.queries) try {
      const [results] = <RowDataPacket[][]> await con.query(`SELECT * FROM leveling WHERE user = '${query.author}' AND guild = '${query.guild}'`);
      if (results.length < 1) await con.query(`INSERT INTO leveling(user, guild, exp, last) VALUES ('${query.author}', '${query.guild}', ${query.exp}, '${query.date}')`);
      else {
        if (Date.now() - results[0].last < 60000) return;
        const newExp = parseInt(results[0].exp) + query.exp;
        await con.query(`UPDATE leveling SET exp = ${newExp}, last = '${query.date}' WHERE user = '${query.author}' AND guild = '${query.guild}'`);
      }
    } catch (err) { }
    NorthClient.storage.queries = [];
    con.release();
  } catch (err) { }
}, 60000);

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