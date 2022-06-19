import canvas from "canvas";
import * as fs from "fs";
import { NorthClient, Card, FullCommand, Item, ClientStorage, Command } from "./classes/NorthClient.js";
import { twoDigits, deepReaddir, query, jsDate2Mysql } from "./function.js";
import isOnline from "is-online";
import SimpleNodeLogger, { Logger } from "simple-node-logger";
import memwatch from "node-memwatch-new";
import { AliceHandler, CanaryHandler, Handler, V2Handler } from "./handler.js";
import pkg from "../package.json";
var globalClient: NorthClient;
var logger: Logger;

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
    case 0:
      if (process.argv.includes("--old")) return Handler.setup(globalClient, token);
      else return V2Handler.setup(globalClient, token);
    case 1: return AliceHandler.setup(globalClient, token);
    case 2: return CanaryHandler.setup(globalClient, token);
  }
}

export default async (client: NorthClient) => {
  if (!fs.existsSync("log")) fs.mkdirSync("log");
  if (!fs.existsSync("log/memDump")) fs.mkdirSync("log/memDump");
  logger = SimpleNodeLogger.createSimpleLogger({
    logFilePath: `log/console_${client.id}.log`,
    timestampFormat:  'YYYY-MM-DD HH:mm:ss.SSS'
  });
  logger.setLevel("all");
  console.debug = (message: string, ...data: any[]) => logger.debug(message, ...data);
  console.log = (message: string, ...data: any[]) => logger.info(message, ...data);
  console.error = (message: string, ...data: any[]) => logger.error(message, ...data);
  client.setVersion(pkg.version);
  globalClient = client;
  memwatch.on("leak", (info: any) => {
    console.debug("Potentially leaking stuff!");
    console.debug(info);
  });
  const fontFiles = fs.readdirSync("./fonts").filter(file => file.endsWith(".ttf") && file.startsWith("NotoSans"));
  for (const file of fontFiles) canvas.registerFont(`./fonts/${file}`, { family: "NotoSans", style: file.split(/[\-\.]/)[1].toLowerCase() });
  canvas.registerFont("./fonts/FreeSans.ttf", { family: "free-sans" });

  for (let i = 0; i < 4; i++) for (let s = 0; s < 13; s++) NorthClient.storage.card.set(twoDigits(i) + twoDigits(s), new Card(i, s));
  NorthClient.storage.card.set("0413", new Card(4, 13));
  NorthClient.storage.card.set("0414", new Card(4, 14));

  const commandFiles = deepReaddir("./out/src/commands").filter(file => file.endsWith(".js"));
  const itemFiles = deepReaddir("./out/src/items").filter(file => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = <Command>(await import(file)).default;
    NorthClient.storage.commands.set(command.name, command);
  }
  for (const file of itemFiles) {
    const item = <Item>(await import(file)).default;
    NorthClient.storage.items.set(item.id, item);
  }
  if (!fs.existsSync(process.env.CACHE_DIR)) fs.mkdirSync(process.env.CACHE_DIR);

  setInterval(async () => {
    const results = await query(`SELECT id FROM leveling`);
    for (const data of Object.values(NorthClient.storage.guilds).map(guild => guild.levelData)) {
      for (const datum of data.values()) {
        if (!datum.changed) continue;
        const result = results.find(x => x.user == datum.author && x.guild == datum.guild);
        if (!result) await query(`INSERT INTO leveling(user, guild, exp, last) VALUES ('${datum.author}', '${datum.guild}', ${datum.exp}, '${jsDate2Mysql(datum.date)}')`);
        else await query(`UPDATE leveling SET exp = ${datum.exp}, last = '${datum.date}' WHERE user = '${datum.author}' AND guild = '${datum.guild}'`);
      }
    }
  }, 60000);
}

export { globalClient };