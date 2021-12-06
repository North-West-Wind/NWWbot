import { registerFont } from "canvas";
import * as fs from "fs";
import { NorthClient, Card, SlashCommand, Item, ClientStorage } from "./classes/NorthClient";
import { twoDigits, deepReaddir } from "./function";
import * as mysql from "mysql2";
import isOnline from "is-online";
import * as winston from "winston";
import { AliceHandler, CanaryHandler, Handler } from "./handler";
const { version } = require("../package.json");
var globalClient: NorthClient;

process.on('unhandledRejection', (reason) => {
  console.error('Reason:', reason);
  if (typeof reason === "string" && reason.includes("EAI_AGAIN")) {
    async function check() {
      if (await isOnline()) reloadClient();
      else setTimeout(check, 30000);
    }
    check();
  }
});

function reloadClient() {
  const options = globalClient.options;
  const token = globalClient.token;
  const prefix = globalClient.prefix;
  const id = globalClient.id;
  globalClient.destroy();

  globalClient = new NorthClient(options);
  NorthClient.storage = new ClientStorage();
  
  globalClient.prefix = prefix;
  globalClient.id = id;

  switch (id) {
    case 0: return Handler.setup(globalClient, token);
    case 1: return AliceHandler.setup(globalClient, token);
    case 2: return CanaryHandler.setup(globalClient, token);
  }
}

export default async (client: NorthClient) => {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.File({ filename: `error_${client.id}.log`, level: 'error' }),
      new winston.transports.File({ filename: `console_${client.id}.log` }),
    ],
  });
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple(),
    }));
  }

  const mysql_config = {
    connectTimeout: 30000,
    connectionLimit: 10,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPW,
    database: process.env.DBNAME,
    supportBigNumbers: true,
    charset: "utf8mb4"
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
  }
  for (const file of itemFiles) {
    const item = <Item>(await import(file)).default;
    NorthClient.storage.items.set(item.id, item);
  }
  if (!fs.existsSync(process.env.CACHE_DIR)) fs.mkdirSync(process.env.CACHE_DIR);

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
  client.setVersion(version);
  globalClient = client;

  setInterval(async () => {
    if (NorthClient.storage.queries.length < 1) return;
    try {
      const con = await client.pool.getConnection();
      for (const query of NorthClient.storage.queries) try {
        const [results] = <mysql.RowDataPacket[][]>await con.query(`SELECT * FROM leveling WHERE user = '${query.author}' AND guild = '${query.guild}'`);
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