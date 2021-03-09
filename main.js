require("dotenv").config();

const { NorthClient } = require("./classes/NorthClient.js");
const { ClientStorage } = require("./classes/ClientStorage.js");
const fetch = require("fetch-retry")(require("node-fetch"), { retries: 5, retryDelay: attempt => Math.pow(2, attempt) * 1000 });

const alice = new NorthClient({ restRequestTimeout: 60000, messageCacheMaxSize: 50, messageCacheLifetime: 3600, messageSweepInterval: 300, partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'] });
const client = new NorthClient({ restRequestTimeout: 60000, messageCacheMaxSize: 50, messageCacheLifetime: 3600, messageSweepInterval: 300, partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'] });
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
    await channel.edit({ name: `Server Online: [${online}]` })
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