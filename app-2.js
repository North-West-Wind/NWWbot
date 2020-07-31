require("dotenv").config();

const { twoDigits, setTimeout_ } = require("./function.js");
const { ready, guildMemberAdd, guildMemberRemove, guildCreate, guildDelete } = require("./handler.js");
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
const wait = require("util").promisify(setTimeout);

const fs = require("fs");
const Discord = require("discord.js");
const cleverbot = require("cleverbot-free");
const { exec } = require("child_process");
const { prefix } = require("./config.json");
const { Image, createCanvas, loadImage, registerFont } = require("canvas");
const mysql = require("mysql");
const mysql_config = {
  connectTimeout: 60 * 60 * 1000,
  acquireTimeout: 60 * 60 * 1000,
  timeout: 60 * 60 * 1000,
  connectionLimit: 1000,
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPW,
  database: process.env.DBNAME,
  supportBigNumbers: true,
  bigNumberStrings: true,
  charset: "utf8mb4"
};

registerFont("./fonts/FreeSans.ttf", { family: "free-sans" });

var pool = mysql.createPool(mysql_config);

const client = new Discord.Client();

console.commands = new Discord.Collection();
console.items = new Discord.Collection();
console.card = new Discord.Collection();
console.uno = new Discord.Collection();
console.timers = new Discord.Collection();
console.noLog = [];

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

// when the client is ready, run this code
// this event will only trigger one time after logging in
var rm = [];
console.invites = {};
client.once("ready", () => {
  ready(client, 0);
});
// login to Discord with your app's token
client.login(process.env.TOKEN);

client.on("guildMemberAdd", member => {
  guildMemberAdd(member, client, 0);
});

//someone left

client.on("guildMemberRemove", async member => {
  guildMemberRemove(member, client, 0);
});

//joined a server
client.on("guildCreate", async guild => {
  guildCreate(guild);
});

//removed from a server
client.on("guildDelete", guild => {
  guildDelete(guild);
});


var exit = [];

client.on("voiceStateUpdate", async (oldState, newState) => {
  
});

client.on("guildMemberUpdate", (oldMember, newMember) => {
  
});

client.on("messageReactionAdd", async(r, user) => {
  var roleMessage = rm.find(x => x.id === r.message.id);
  if(!roleMessage) return;
  var emojis = JSON.parse(roleMessage.emojis);
  if(!emojis.includes(r.emoji.name)) return;
  var index = emojis.indexOf(r.emoji.name);
  var guild = await client.guilds.cache.get(roleMessage.guild);
  var member = await guild.members.fetch(user);
  member.roles.add([JSON.parse(roleMessage.roles)[index]]).catch(console.error);
});

client.on("messageReactionRemove", async(r, user) => {
  var roleMessage = rm.find(x => x.id === r.message.id);
  if(!roleMessage) return;
  var emojis = JSON.parse(roleMessage.emojis);
  if(!emojis.includes(r.emoji.name)) return;
  var index = emojis.indexOf(r.emoji.name);
  var guild = await client.guilds.cache.get(roleMessage.guild);
  var member = await guild.members.fetch(user);
  member.roles.remove([JSON.parse(roleMessage.roles)[index]]).catch(console.error);
});

client.on("messageDelete", (message) => {
  var roleMessage = rm.find(x => x.id === message.id);
  if(!roleMessage) return;
  rm.splice(rm.indexOf(roleMessage), 1);
  pool.getConnection((err, con) => {
    con.query(`DELETE FROM rolemsg WHERE id = '${message.id}'`, (err) => {
      if(err) return console.error(err);
    });
    con.release();
  });
});

var hypixelQueries = 0;
setInterval(() => (hypixelQueries = 0), 60000);
client.on("message", async message => {
  // client.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) {
    if(!message.author.bot) {
      if(Math.floor(Math.random() * 1000) === 69) 
        cleverbot(message.content).then(response => message.channel.send(response));
    }
    return;
  };

  const args = message.content.slice(prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (commandName.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;

    if (command.usage) {
      reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
  }

  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      cmd => cmd.aliases && cmd.aliases.includes(commandName)
    );

  if (!command) {
    return;
  } else {
    if(message.guild !== null) {
      if(!message.channel.permissionsFor(message.guild.me).has(["SEND_MESSAGES", "VIEW_CHANNEL", "EMBED_LINKS", "READ_MESSAGE_HISTORY"])) return message.author.send("I don't have the required permissions! Please tell your server admin that I at least need `" + ["SEND_MESSAGES", "VIEW_CHANNEL", "EMBED_LINKS", "READ_MESSAGE_HISTORY"].join("`, `") + "`!")
    }
    if (musicCommandsArray.includes(command.name) == true) {
      const mainMusic = require("./musics/main.js");
      try {
        return await mainMusic.music(message, commandName, pool, exit);
      } catch (error) {
        console.error(error);
        return await message.reply(
          "there was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the support server."
        );
      }
    }
    try {
      command.execute(message, args, pool, musicCommandsArray, hypixelQueries, rm);
    } catch (error) {
      console.error(error);
      message.reply("there was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the support server.");
    }
  }
});
