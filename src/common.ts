import { registerFont } from "canvas";
import * as fs from "fs";
import { NorthClient, Card, SlashCommand, Item, ClientStorage } from "./classes/NorthClient";
import { twoDigits, deepReaddir, query } from "./function";
import isOnline from "is-online";
import SimpleNodeLogger, { Logger } from "simple-node-logger";
import { AliceHandler, CanaryHandler, Handler } from "./handler";
const { version } = require("../package.json");
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
    case 0: return Handler.setup(globalClient, token);
    case 1: return AliceHandler.setup(globalClient, token);
    case 2: return CanaryHandler.setup(globalClient, token);
  }
}

export default async (client: NorthClient) => {
  if (!fs.existsSync("log")) fs.mkdirSync("log");
  logger = SimpleNodeLogger.createSimpleLogger({
    logFilePath: `log/console_${client.id}.log`,
    timestampFormat:  'YYYY-MM-DD HH:mm:ss.SSS'
  });
  logger.setLevel("all");
  console.log = (message: string, ...data: any[]) => logger.info(message, ...data);
  console.error = (message: string, ...data: any[]) => logger.error(message, ...data);
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
  client.setVersion(version);
  globalClient = client;

  setInterval(async () => {
    if (NorthClient.storage.queries.length < 1) return;
    console.log(`Starting message level sync. Memory used: ${process.memoryUsage().heapUsed / 1024 / 1024}MB`);
    try {
      const results = await query(`SELECT * FROM leveling`);
      for (const q of NorthClient.storage.queries) try {
        const result = results.find(x => x.user == q.author && x.guild == q.guild);
        if (!result) await query(`INSERT INTO leveling(user, guild, exp, last) VALUES ('${q.author}', '${q.guild}', ${q.exp}, '${q.date}')`);
        else {
          if (Date.now() - result.last < 60000) continue;
          const newExp = parseInt(result.exp) + q.exp;
          await query(`UPDATE leveling SET exp = ${newExp}, last = '${q.date}' WHERE user = '${q.author}' AND guild = '${q.guild}'`);
        }
      } catch (err: any) { }
      NorthClient.storage.queries = [];
    } catch (err: any) { }
    console.log(`Message level sync ended. Memory used: ${process.memoryUsage().heapUsed / 1024 / 1024}MB`);
  }, 60000);
}

export { globalClient };