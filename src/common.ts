import canvas from "canvas";
import * as fs from "fs";
import { NorthClient, Card, Item, ClientStorage, Command } from "./classes/NorthClient.js";
import { __dirname, twoDigits, deepReaddir, query, jsDate2Mysql } from "./function.js";
import isOnline from "is-online";
import SimpleNodeLogger, { Logger } from "simple-node-logger";
import { AliceHandler, CanaryHandler, Handler, V2Handler } from "./handler.js";
const pkg = JSON.parse(fs.readFileSync("package.json", { encoding: "utf8" }));
let globalClient: NorthClient;
let logger: Logger;
let localIp: string;

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
  localIp = process.env.USE_LOCAL ? "localhost" : "192.168.1.29";
  if (!fs.existsSync("log")) fs.mkdirSync("log");
  if (!fs.existsSync("log/memDump")) fs.mkdirSync("log/memDump");
  logger = SimpleNodeLogger.createSimpleLogger({
    logFilePath: `log/console_${client.id}.log`,
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
  });
  logger.setLevel("all");
  console.debug = (message: string, ...data: any[]) => logger.debug(message, ...data);
  console.log = (message: string, ...data: any[]) => logger.info(message, ...data);
  console.error = (message: string, ...data: any[]) => logger.error(message, ...data);
  client.setVersion(pkg.version);
  globalClient = client;
  const fontFiles = fs.readdirSync("./fonts").filter(file => file.endsWith(".ttf") && file.startsWith("NotoSans"));
  for (const file of fontFiles) canvas.registerFont(`./fonts/${file}`, { family: "NotoSans", style: file.split(/[\-\.]/)[1].toLowerCase() });
  canvas.registerFont("./fonts/FreeSans.ttf", { family: "free-sans" });

  for (let i = 0; i < 4; i++) for (let s = 0; s < 13; s++) NorthClient.storage.card.set(twoDigits(i) + twoDigits(s), new Card(i, s));
  NorthClient.storage.card.set("0413", new Card(4, 13));
  NorthClient.storage.card.set("0414", new Card(4, 14));

  const commandFiles = deepReaddir(__dirname + "/commands").filter(file => file.endsWith(".js"));
  const itemFiles = deepReaddir(__dirname + "/items").filter(file => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = <Command>(await import(file)).default;
    NorthClient.storage.commands.set(command.name, command);
  }
  for (const file of itemFiles) {
    const item = <Item>(await import(file)).default;
    NorthClient.storage.items.set(item.id, item);
  }

  setInterval(async () => {
    const results = await query(`SELECT * FROM leveling`);
    for (const data of Object.values(NorthClient.storage.guilds).map(guild => guild.levelData)) {
      for (const datum of data.values()) {
        if (!datum.changed) continue;
        const result = results.find(x => x.user == datum.author && x.guild == datum.guild);
        if (!result) {
          await query(`INSERT INTO leveling(user, guild, exp, last) VALUES ('${datum.author}', '${datum.guild}', ${datum.exp}, '${jsDate2Mysql(datum.date)}')`);
          const [{ id }] = await query(`SELECT id FROM leveling WHERE user = '${datum.author}' AND guild = '${datum.guild}'`);
          datum.id = id;
          NorthClient.storage.guilds[datum.guild].levelData.set(datum.author, datum);
        } else await query(`UPDATE leveling SET exp = ${datum.exp}, last = '${jsDate2Mysql(datum.date)}' WHERE user = '${datum.author}' AND guild = '${datum.guild}'`);
      }
    }
  }, 60000);
}

export { globalClient, localIp };