require("dotenv").config();

const { NorthClient } = require("./classes/NorthClient.js");
const { ClientStorage } = require("./classes/ClientStorage.js");
const fetch = require("fetch-retry")(require("node-fetch"), { retries: 5, retryDelay: attempt => Math.pow(2, attempt) * 1000 });

const alice = new NorthClient({ restRequestTimeout: 60000, messageCacheMaxSize: 50, messageCacheLifetime: 3600, messageSweepInterval: 300, partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'] });
const client = new NorthClient({ restRequestTimeout: 60000, messageCacheMaxSize: 50, messageCacheLifetime: 3600, messageSweepInterval: 300, partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'] });
client.log = "678847137391312917";
NorthClient.storage = new ClientStorage(client);

require("./common")(client, alice);
require("./n0rthwestw1nd/init")(client);
require("./alice/init")(alice);

setInterval(async () => {
  try {
    const url = `https://api.mcsrvstat.us/2/${process.env.IP}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Received HTTP Status Code " + res.status);
    const body = await res.json();
    const online = body.players?.online ? body.players.online : 0;
    const channel = await alice.channels.fetch("817963845795708948");
    await channel.edit({ name: `Server Online: [${online}]` });
  } catch (err) { }
  if (NorthClient.storage.queries.length < 1) return;
  try {
    const con = await pool.getConnection();
    for (const query of NorthClient.storage.queries) try {
      const [results] = await con.query(`SELECT * FROM leveling WHERE user = '${query.author}' AND guild = '${query.guild}'`);
      if (results.length < 1) await con.query(`INSERT INTO leveling(user, guild, exp, last) VALUES ('${query.author}', '${query.guild}', ${query.exp}, '${query.date}')`);
      else {
        if (new Date() - results[0].last < 60000) return;
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
    const guild = await alice.guilds.fetch("622311594654695434");
    const [results] = await alice.pool.query(`SELECT uuid, dcid FROM dcmc`);
    for (const result of results) {
      const member = guild.members.fetch(result.dcid);
      if (!member) continue;
      const { name } = await require("./function").profile(result.uuid);
      const mcLen = name.length + 1;
      const bw = (await fetch(`https://api.slothpixel.me/api/players/${name}?key=${process.env.API}`).then(res => res.json())).stats.BedWars;
      const firstHalf = `[${bw.level}⭐|${bw.final_k_d}]`;
      if (firstHalf.length + mcLen > 32) await member.setNickname(`${firstHalf} ${name.slice(0, 28 - firstHalf.length)}...`);
      else await member.setNickname(`${firstHalf} ${name}`);
    }
  } catch (err) { }
}, 3600000);

process.on('uncaughtException', err => {
  NorthClient.storage.error(err);
});