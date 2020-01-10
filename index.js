const http = require("http");
const express = require("express");
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

const fs = require("fs");
const Discord = require("discord.js");
const { prefix } = require("./config.json");
const ytdl = require("ytdl-core");
const music = new require("./musictest.js");
const giveaways = require("discord-giveaways");
const giveaway = require("./giveaways.js");
const mysql = require("mysql");
const mysql_config = {
  host: "remotemysql.com",
  user: "AToOsccGeg",
  password: "EXtWjGJlwf",
  database: "AToOsccGeg",
  supportBigNumbers: true,
  bigNumberStrings: true
};

var pool = mysql.createPool(mysql_config);

const client = new Discord.Client();

client.commands = new Discord.Collection();

const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once("ready", () => {
  console.log("Ready!");

  client.user.setPresence({
    game: {
      name: "Being coded by owner",
      type: "WATCHING"
    },
    status: "online"
  });
});
// login to Discord with your app's token
client.login(process.env.TOKEN);

client.on("guildMemberAdd", member => {
  const guild = member.guild;
  pool.getConnection(function(err, con) {
    con.query(
      "SELECT welcome, wel_channel, autorole FROM servers WHERE id=" + guild.id,
      function(err, result, fields) {
        if (result[0].welcome === null || result[0].wel_channel === null) {
        } else {
          const channel = guild.channels.get(result[0].wel_channel);
          const splitMessage = result[0].welcome.split(" ");
          const messageArray = [];

          splitMessage.forEach(word => {
            if (word.startsWith("{#")) {
              const first = word.replace("{#", "");
              const second = first.replace("}", "");
              const mentionedChannel = guild.channels.find(
                channel => channel.name === second
              );
              if (mentionedChannel === null) {
                messageArray.push("#" + second);
              } else {
                messageArray.push(mentionedChannel);
              }
            } else if (word.startsWith("{&")) {
              const first = word.replace("{&", "");
              const second = first.replace("}", "");
              const mentionedRole = guild.roles.find(
                role => role.name === second
              );
              if (mentionedRole === null) {
                messageArray.push("@" + second);
              } else {
                messageArray.push(mentionedRole);
              }
            } else if (word.startsWith("{@")) {
              const first = word.replace("{@", "");
              const second = first.replace("}", "");
              const mentionedUser = client.users.find(
                user => user.username === second
              );
              if (mentionedUser === null) {
                messageArray.push("@" + second);
              } else {
                messageArray.push(mentionedUser);
              }
            } else {
              messageArray.push(word);
            }
          });

          const welcomeMessage = messageArray
            .join(" ")
            .replace("{user}", member);
          channel.send(welcomeMessage);
        }
        if (result[0].autorole === "[]") {
        } else {
          var roleArray = JSON.parse(result[0].autorole);
          for (let i = 0; i < roleArray.length; i++) {
            var role = member.guild.roles.find(
              role => role.name === roleArray[i]
            );

            if (role === null) {
            } else {
              member.addRole(role);
            }
          }
        }

        con.release();

        if (err) throw err;
      }
    );
  });
});

//joined a server
client.on("guildCreate", guild => {
  console.log("Joined a new guild: " + guild.name);

  pool.getConnection(function(err, con) {
    con.query(
      "INSERT INTO servers (id, autorole) VALUES (" + guild.id + ", '[]')",
      function(err, result) {
        if (err) throw err;
        console.log("Inserted record for " + guild.name);
      }
    );
    if (err) throw err;
    con.release();
  });

  //Your other stuff like adding to guildArray
});

//removed from a server
client.on("guildDelete", guild => {
  console.log("Left a guild: " + guild.name);
  pool.getConnection(function(err, con) {
    con.query("DELETE FROM servers WHERE id=" + guild.id, function(
      err,
      result
    ) {
      if (err) throw err;
      console.log("Deleted record for " + guild.name);
    });
    if (err) throw err;
    con.release();
  });

  //remove from guildArray
});

client.on("message", async message => {
  // client.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (music.checkAdminCmd(message)) return;

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

  if (!command) return;

  try {
    command.execute(message, args, pool);
  } catch (error) {
    console.error(error);
    message.reply("there was an error trying to execute that command!");
  }
});
