import * as dotenv from "dotenv";
import { RowDataPacket } from "mysql2";
import { CanaryHandler } from "./handler";
import { NorthClient, ClientStorage } from "./classes/NorthClient";
dotenv.config();

const canary = new NorthClient({ restRequestTimeout: 60000, messageCacheMaxSize: 50, messageCacheLifetime: 3600, messageSweepInterval: 300, partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'] });
canary.log = "733912780679413886";
NorthClient.storage = new ClientStorage(canary);

canary.prefix = "%";
canary.id = 0;
CanaryHandler.setup(canary, process.env.TOKEN_CANARY);

setInterval(async () => {
    if (NorthClient.storage.queries.length < 1) return;
    try {
        const con = await canary.pool.getConnection();
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