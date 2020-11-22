require("dotenv").config();
const functions = require("./function.js");
const { setup: addListener } = require("./handler.js");
console.realLog = console.log;
console.realError = console.error;
delete console["log"];
delete console["error"];
console.log = async function (str) {
  console.realLog(str);
  const logChannel = await client.channels.fetch("678847137391312917").catch(console.realError);
  if (logChannel) logChannel.send("`" + str + "`");
}
console.error = async function (str) {
  console.realError(str);
  const logChannel = await client.channels.fetch("678847137391312917").catch(console.realError);
  if (logChannel) logChannel.send(`\`ERROR!\`${(str.message ? `\n\`${str.message}\`` : `\n\`${str}\``)}`);
}
for (const property in functions) console[property] = functions[property];

const fs = require("fs");
const Discord = require("discord.js");
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
console.rm = [];
console.invites = {};
console.exit = [];
console.migrating = [];

for (let i = 0; i < 4; i++) for (let s = 0; s < 13; s++) console.card.set(twoDigits(i) + twoDigits(s), { color: i, number: s });
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
addListener(client, 0);
addListener(alice, 1);