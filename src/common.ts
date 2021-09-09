import { registerFont } from "canvas";
import * as fs from "fs";
import { NorthClient, Card, SlashCommand, Item } from "./classes/NorthClient";
import { twoDigits, deepReaddir } from "./function";
import * as mysql from "mysql2";
import { RowDataPacket } from "mysql2";
var globalClient: NorthClient;

export default async (client: NorthClient) => {
  const mysql_config = {
    connectTimeout: 60 * 1000,
    connectionLimit: 100,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPW,
    database: process.env.DBNAME,
    supportBigNumbers: true,
    charset: "utf8mb4",
    waitForConnections: true,
    queueLimit: 0
  };
  const fontFiles = fs.readdirSync("./fonts").filter(file => file.endsWith(".ttf") && file.startsWith("NotoSans"));
  for (const file of fontFiles) registerFont(`./fonts/${file}`, { family: "NotoSans", style: file.split(/[\-\.]/)[1].toLowerCase() });
  registerFont("./fonts/FreeSans.ttf", { family: "free-sans" });

  for (let i = 0; i < 4; i++) for (let s = 0; s < 13; s++) NorthClient.storage.card.set(twoDigits(i) + twoDigits(s), new Card(i, s));
  NorthClient.storage.card.set("0413", new Card(4, 13));
  NorthClient.storage.card.set("0414", new Card(4, 14));

  const commandFiles = deepReaddir("./out/commands").filter(file => file.endsWith(".js"));
  const itemFiles = deepReaddir("./out/items").filter(file => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = <SlashCommand>(await import(file)).default;
    NorthClient.storage.commands.set(command.name, command);
    if (command.init) command.init();
  }
  for (const file of itemFiles) {
    const item = <Item>(await import(file)).default;
    NorthClient.storage.items.set(item.id, item);
  }

  var pool = mysql.createPool(mysql_config).promise();
  pool.on("connection", con => con.on("error", async err => {
    if (["PROTOCOL_CONNECTION_LOST", "ECONNREFUSED", "ETIMEDOUT"].includes(err.code) || (err.message === "Pool is closed.")) try {
      await pool.end();
    } catch (err: any) {
      console.error(err);
    } finally {
        pool = mysql.createPool(mysql_config).promise();
        client.setPool(pool);
      }
  }));
  client.setPool(pool);
  client.setVersion("5.0.0");
  globalClient = client;

  setInterval(async () => {
    if (NorthClient.storage.queries.length < 1) return;
    try {
      const con = await client.pool.getConnection();
      for (const query of NorthClient.storage.queries) try {
        const [results] = <RowDataPacket[][]>await con.query(`SELECT * FROM leveling WHERE user = '${query.author}' AND guild = '${query.guild}'`);
        if (results.length < 1) await con.query(`INSERT INTO leveling(user, guild, exp, last) VALUES ('${query.author}', '${query.guild}', ${query.exp}, '${query.date}')`);
        else {
          if (Date.now() - results[0].last < 60000) return;
          const newExp = parseInt(results[0].exp) + query.exp;
          await con.query(`UPDATE leveling SET exp = ${newExp}, last = '${query.date}' WHERE user = '${query.author}' AND guild = '${query.guild}'`);
        }
      } catch (err: any) { }
      NorthClient.storage.queries = [];
      con.release();
    } catch (err: any) { }
  }, 60000);
}

export { globalClient };