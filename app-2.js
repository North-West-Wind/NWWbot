require("dotenv").config();

const { twoDigits } = require("./function.js");
const { ready, guildMemberAdd, guildMemberRemove, guildCreate, guildDelete, voiceStateUpdate, guildMemberUpdate, messageReactionAdd, messageReactionRemove, messageDelete, message } = require("./handler.js");
console.realLog = console.log;
console.realError = console.error;
delete console["log"];
delete console["error"];
console.log = async function (str) {
  console.realLog(str);
  try {
    var logChannel = await client.channels.fetch("678847137391312917");
    if (logChannel)
      logChannel.send("`" + str + "`");
  } catch (err) {
    return console.realError(err)
  }
}
console.error = async function (str) {
  console.realError(str);
  try {
    var logChannel = await client.channels.fetch("678847137391312917");
    if (logChannel)
      logChannel.send(`\`ERROR!\`${(str.message ? `\n\`${str.message}\`` : `\n\`${str}\``)}`);
  } catch (err) {
    return console.realError(err)
  }
}
for (const property in functions) console[property] = functions[property];

const fs = require("fs");
const Discord = require("discord.js");
const { prefix0, prefix1 } = require("./config.json");
const { registerFont } = require("canvas");

const fontFiles = fs.readdirSync("./fonts").filter(file => file.endsWith(".ttf") && file.startsWith("NotoSans"));
for (const file of fontFiles) {
  const style = file.split(/[\-\.]/)[1];
  registerFont(`./fonts/${file}`, { family: "NotoSans", style: style.toLowerCase() })
}
registerFont("./fonts/FreeSans.ttf", { family: "free-sans" });

const alice = new Discord.Client({ restRequestTimeout: 60000, messageCacheMaxSize: 50, messageCacheLifetime: 3600, messageSweepInterval: 300 });
const client = new Discord.Client({ restRequestTimeout: 60000, messageCacheMaxSize: 50, messageCacheLifetime: 3600, messageSweepInterval: 300 });

console.commands = new Discord.Collection();
console.items = new Discord.Collection();
console.card = new Discord.Collection();
console.uno = new Discord.Collection();
console.timers = new Discord.Collection();
console.mathgames = new Discord.Collection();
console.noLog = [];

client.prefix = prefix0;
alice.prefix = prefix1;
client.id = 0;
alice.id = 1;

for (let i = 0; i < 4; i++) {
  for (let s = 0; s < 13; s++) {
    console.card.set(console.twoDigits(i) + console.twoDigits(s), { color: i, number: s });
  }
}
console.card.set("0413", { color: 4, number: 13 });
console.card.set("0414", { color: 4, number: 14 });

const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));
const musicCommandFiles = fs
  .readdirSync("./musics")
  .filter(file => file.endsWith(".js") && !file.startsWith("main"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  console.commands.set(command.name, command);
}
for (const file of musicCommandFiles) {
  const command = require(`./musics/${file}`);
  console.commands.set(command.name, command);
}

const itemFiles = fs
  .readdirSync("./items")
  .filter(file => file.endsWith(".js"));

for (const file of itemFiles) {
  const item = require(`./items/${file}`);
  console.items.set(item.name.toLowerCase(), item);
}

console.rm = [];
console.invites = {};
console.exit = [];
console.migrating = [];
client.once("ready", () => ready(client));
client.on("guildMemberAdd", guildMemberAdd);
client.on("guildMemberRemove", guildMemberRemove);
client.on("guildCreate", guildCreate);
client.on("guildDelete", guildDelete);
client.on("voiceStateUpdate", voiceStateUpdate);
client.on("guildMemberUpdate", guildMemberUpdate);
client.on("messageReactionAdd", messageReactionAdd);
client.on("messageReactionRemove", messageReactionRemove);
client.on("messageDelete", messageDelete);
client.on("message", message);

alice.once("ready", () => ready(alice));
alice.on("guildMemberAdd", guildMemberAdd);
alice.on("guildMemberRemove", guildMemberRemove);
alice.on("guildCreate", guildCreate);
alice.on("guildDelete", guildDelete);
alice.on("voiceStateUpdate", voiceStateUpdate);
alice.on("guildMemberUpdate", guildMemberUpdate);
alice.on("messageReactionAdd", messageReactionAdd);
alice.on("messageReactionRemove", messageReactionRemove);
alice.on("messageDelete", messageDelete);
alice.on("message", message);

client.login(process.env.TOKEN0);
alice.login(process.env.TOKEN1);
