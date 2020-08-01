require("dotenv").config();

const { twoDigits } = require("./function.js");
const { ready, guildMemberAdd, guildMemberRemove, guildCreate, guildDelete, voiceStateUpdate, guildMemberUpdate, messageReactionAdd, messageReactionRemove, messageDelete, message } = require("./handler.js");
console.realLog = console.log;
console.realError = console.error;
delete console["log"];
delete console["error"];
console.log = async function(str) {
 	console.realLog(str);
 	try {
   	var logChannel = await client.channels.fetch("678847137391312917");
 	} catch(err) {
   	return console.realError(err)
 	}
    logChannel.send("`" + str + "`");
}
console.error = async function(str) {
  console.realError(str);
  try {
    var logChannel = await client.channels.fetch("678847137391312917");
  } catch(err) {
    return console.realError(err)
  }
    logChannel.send("`ERROR!`\n`" + str.message + "`");
}

const fs = require("fs");
const Discord = require("discord.js");
const { prefix, prefix2 } = require("./config.json");
const { registerFont } = require("canvas");

registerFont("./fonts/FreeSans.ttf", { family: "free-sans" });

const alice = new Discord.Client();
const client = new Discord.Client();

console.commands = new Discord.Collection();
console.items = new Discord.Collection();
console.card = new Discord.Collection();
console.uno = new Discord.Collection();
console.timers = new Discord.Collection();
console.noLog = [];

alice.prefix = prefix2;
client.prefix = prefix;

for(let i = 0; i < 4; i++) {
  for(let s = 0; s < 13; s++) {
    console.card.set(twoDigits(i) + twoDigits(s), { color: i, number: s});
  }
}
console.card.set("0400", { color: 4, number: 13 });
console.card.set("0401", { color: 4, number: 14 });

const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  console.commands.set(command.name, command);
}

const itemFiles = fs
  .readdirSync("./items")
  .filter(file => file.endsWith(".js"));

for (const file of itemFiles) {
  const item = require(`./items/${file}`);
  console.items.set(item.name.toLowerCase(), item);
}

var musicCommandsArray = [];

const musicCommandFiles = fs
  .readdirSync("./musics")
  .filter(file => file.endsWith(".js"));

for (const file of musicCommandFiles) {
  const musicCommand = require(`./musics/${file}`);
  musicCommandsArray.push(musicCommand.name);
  console.commands.set(musicCommand.name, musicCommand);
}

console.rm = [];
console.invites = {};
var hypixelQueries = 0;
setInterval(() => (hypixelQueries = 0), 60000);
var exit = [];
client.once("ready", () => ready(client, 0));
client.login(process.env.TOKEN);
client.on("guildMemberAdd", member => guildMemberAdd(member, client, 0));
client.on("guildMemberRemove", async member => guildMemberRemove(member, client, 0));
client.on("guildCreate", async guild => guildCreate(guild));
client.on("guildDelete", guild => guildDelete(guild));
client.on("voiceStateUpdate", async (oldState, newState) => voiceStateUpdate(oldState, newState, client, exit));
client.on("guildMemberUpdate", (oldMember, newMember) => guildMemberUpdate(oldMember, newMember, client));
client.on("messageReactionAdd", async(r, user) => messageReactionAdd(r, user));
client.on("messageReactionRemove", async(r, user) => messageReactionRemove(r, user));
client.on("messageDelete", (message) => messageDelete(message));
client.on("message", async msg => message(msg, musicCommandsArray, hypixelQueries, exit, client, 0));

alice.once("ready", () => ready(alice, 1));
alice.login(process.env.TOKEN2);
alice.on("guildMemberAdd", member => guildMemberAdd(member, alice, 1));
alice.on("guildMemberRemove", async member => guildMemberRemove(member, alice, 1));
alice.on("guildCreate", async guild => guildCreate(guild));
alice.on("guildDelete", guild => guildDelete(guild));
alice.on("voiceStateUpdate", async (oldState, newState) => voiceStateUpdate(oldState, newState, alice, exit));
alice.on("guildMemberUpdate", (oldMember, newMember) => guildMemberUpdate(oldMember, newMember, alice));
alice.on("messageReactionAdd", async(r, user) => messageReactionAdd(r, user));
alice.on("messageReactionRemove", async(r, user) => messageReactionRemove(r, user));
alice.on("messageDelete", (message) => messageDelete(message));
alice.on("message", async msg => message(msg, musicCommandsArray, hypixelQueries, exit, alice, 1));