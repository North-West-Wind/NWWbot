require("dotenv").config();

const functions = require("./function.js");
const { ready, guildMemberAdd, guildMemberRemove, guildCreate, guildDelete, voiceStateUpdate, guildMemberUpdate, messageReactionAdd, messageReactionRemove, messageDelete, message, setPool } = require("./handler.js");
console.realLog = console.log;
console.realError = console.error;
delete console["log"];
delete console["error"];
console.log = async function (str) {
  console.realLog(str);
  const logChannel = await client.channels.fetch("678847137391312917").catch(console.realError);
  if (logChannel) logChannel.send("`" + str + "`");
}
console.error = async function (err) {
  if (["PROTOCOL_CONNECTION_LOST", "ECONNREFUSED"].includes(err.code)) await setPool();
  console.realError(err);
  const logChannel = await client.channels.fetch("678847137391312917").catch(console.realError);
  if (logChannel) logChannel.send(`\`ERROR!\`\n\`${(err.message ? err.message : err)}\``);
}
for (const property in functions) console[property] = functions[property];

const fs = require("fs");
const Discord = require("discord.js");
const { prefix0, prefix1 } = require("./config.json");
const { registerFont } = require("canvas");

const fontFiles = fs.readdirSync("./fonts").filter(file => file.endsWith(".ttf") && file.startsWith("NotoSans"));
for (const file of fontFiles) registerFont(`./fonts/${file}`, { family: "NotoSans", style: file.split(/[\-\.]/)[1].toLowerCase() });
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
console.rm = [];
console.invites = {};
console.exit = [];
console.migrating = [];

client.prefix = prefix0;
alice.prefix = prefix1;
client.id = 0;
alice.id = 1;

for (let i = 0; i < 4; i++) for (let s = 0; s < 13; s++) console.card.set(console.twoDigits(i) + console.twoDigits(s), { color: i, number: s });
console.card.set("0413", { color: 4, number: 13 });
console.card.set("0414", { color: 4, number: 14 });

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
const musicCommandFiles = fs.readdirSync("./musics").filter(file => file.endsWith(".js") && !file.startsWith("main"));
const itemFiles = fs.readdirSync("./items").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  console.commands.set(command.name, command);
}
for (const file of musicCommandFiles) {
  const command = require(`./musics/${file}`);
  console.commands.set(command.name, command);
}
for (const file of itemFiles) {
  const item = require(`./items/${file}`);
  console.items.set(item.name.toLowerCase(), item);
}

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