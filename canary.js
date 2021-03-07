require("dotenv").config();

const { NorthClient } = require("./classes/NorthClient.js");
const { ClientStorage } = require("./classes/ClientStorage.js");

const canary = new NorthClient({ restRequestTimeout: 60000, messageCacheMaxSize: 50, messageCacheLifetime: 3600, messageSweepInterval: 300, partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'] });
NorthClient.storage = new ClientStorage(canary);

require("./common")(canary);
require("./canary/init")(canary);

setInterval(async () => {
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