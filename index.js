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
const { Image, createCanvas, loadImage } = require("canvas");
const ytdl = require("ytdl-core");
const music = new require("./music.js");
const giveaways = require("discord-giveaways");
const mysql = require("mysql");
const mysql_config = {
  host: "remotemysql.com",
  user: "AToOsccGeg",
  password: process.env.DBPW,
  database: "AToOsccGeg",
  supportBigNumbers: true,
  bigNumberStrings: true,
  charset: "utf8mb4"
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

function setTimeout_ (fn, delay) {
    var maxDelay = Math.pow(2,31)-1;

    if (delay > maxDelay) {
        var args = arguments;
        args[1] -= maxDelay;

        return setTimeout(function () {
            setTimeout_.apply(fn, args);
        }, maxDelay);
    }

    return setTimeout.apply(fn, arguments);
}

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once("ready", () => {
  console.log("Ready!");

  client.user.setPresence({
    game: {
      name: prefix + "help",
      type: "WATCHING"
    },
    status: "online"
  });
  pool.getConnection(function(err, con) {
    if (err) throw err;
    con.query("SELECT * FROM giveaways ORDER BY endAt ASC", function(
      err,
      results,
      fields
    ) {
      console.log("Found " + results.length + " giveaways");
      results.forEach(async result => {
        var currentDate = new Date();
        var millisec = (result.endAt) - currentDate;
        if (err) throw err;
        setTimeout_(async function() {
          var fetchGuild = await client.guilds.get(result.guild);
          var channel = await fetchGuild.channels.get(result.channel);
          var msg = await channel.fetchMessage(result.id);
          
          var fetchUser = await client.fetchUser(result.author);
          var endReacted = [];
          var peopleReacted = await msg.reactions.get(result.emoji);
          await peopleReacted.fetchUsers();
          try {
          for (const user of peopleReacted.users.values()) {
            const data = user.id;
            endReacted.push(data);
          }
          } catch(err) {
            console.error(err);
          }

          const remove = endReacted.indexOf("649611982428962819");
          if (remove > -1) {
            endReacted.splice(remove, 1);
          }
          
          if (endReacted.length === 0) {
            con.query("DELETE FROM giveaways WHERE id = " + msg.id, function(
              err,
              result
            ) {
              if (err) throw err;
              console.log("Deleted an ended giveaway record.");
            });
            const Ended = new Discord.RichEmbed()
              .setColor(parseInt(result.color))
              .setTitle(result.item)
              .setDescription("Giveaway ended")
              .addField("Winner(s)", "None. Cuz no one reacted.")
              .setTimestamp()
              .setFooter(
                "Hosted by " +
                  fetchUser.username +
                  "#" +
                  fetchUser.discriminator,
                fetchUser.displayAvatarURL
              );
            msg.edit(Ended);
            msg.clearReactions().catch(err => console.error(err));
            return;
          } else {

          
          var index = Math.floor(Math.random() * endReacted.length);
          var winners = [];
          var winnerMessage = "";
          var winnerCount = result.winner;

          for (var i = 0; i < winnerCount; i++) {
            winners.push(endReacted[index]);
            index = Math.floor(Math.random() * endReacted.length);
          }

          for (var i = 0; i < winners.length; i++) {
            winnerMessage += "<@" + winners[i] + "> ";
          }
          
          const Ended = new Discord.RichEmbed()
            .setColor(parseInt(result.color))
            .setTitle(result.item)
            .setDescription("Giveaway ended")
          .addField("Winner(s)", winnerMessage)
            .setTimestamp()
            .setFooter(
              "Hosted by " + fetchUser.username + "#" + fetchUser.discriminator,
              fetchUser.displayAvatarURL
            );
          msg.edit(Ended);
          msg
            .clearReactions()
            .catch(error =>
              console.error("Failed to clear reactions: ", error)
            );

          con.query("DELETE FROM giveaways WHERE id = " + msg.id, function(
            err,
            con
          ) {
            if (err) throw err;
            console.log("Deleted an ended giveaway record.");
          });
        }
        }, millisec);
      });
    });
    con.query("SELECT * FROM poll ORDER BY endAt ASC", function(err, results, fields) {
      if(err) throw err;
      console.log("Found " + results.length + " polls.");
      results.forEach(result => {
        var currentDate = new Date();
        var time = (result.endAt) - currentDate;
        setTimeout_(async function() {
        var guild = await client.guilds.get(result.guild);
          var channel = await guild.channels.get(result.channel);
          var msg = await channel.fetchMessage(result.id);
          var author = await client.fetchUser(result.author);
          var allOptions = await JSON.parse(result.options);
          
          var pollResult = [];
          var end = [];
          for (const emoji of msg.reactions.values()) {
            await pollResult.push(emoji.count);
            var mesg =
              "**" +
              (emoji.count - 1) +
              "** - `" +
              allOptions[pollResult.length - 1] +
              "`";
            await end.push(mesg);
          }
          var pollMsg = "⬆**Poll**⬇";
          const Ended = new Discord.RichEmbed()
            .setColor(result.color)
            .setTitle(result.title)
            .setDescription(
              "Poll ended. Here are the results:\n\n\n" + end.join("\n\n").replace(/#quot;/g, "'").replace(/#dquot;/g, '"')
            )
            .setTimestamp()
            .setFooter(
              "Hosted by " + author.username + "#" + author.discriminator,
              author.displayAvatarURL
            );
          msg.edit(pollMsg, Ended);
          msg.clearReactions().catch(err => {
            console.error(err);
          });
          con.query("DELETE FROM poll WHERE id = " + msg.id, function(
            err,
            result
          ) {
            if (err) throw err;
            console.log("Deleted an ended poll.");
          });
        }, time);
        
      })
    })
    con.release();
  });
});
// login to Discord with your app's token
client.login(process.env.TOKEN);

client.on("guildMemberAdd", member => {
  const guild = member.guild;
  console.log(member.user.username + " has joined " + guild.name);
  pool.getConnection(function(err, con) {
    con.query(
      "SELECT welcome, wel_channel, wel_img, autorole FROM servers WHERE id=" +
        guild.id,
      function(err, result, fields) {
        if (result[0].wel_channel === null || result[0] === undefined) {
        } else {
          //get channel
          const channel = guild.channels.get(result[0].wel_channel);

          //convert message into array
          const splitMessage = result[0].welcome.split(" ");
          const messageArray = [];

          splitMessage.forEach(word => {
            //check channel
            if (word.startsWith("{#")) {
              const first = word.replace("{#", "");
              const second = first.replace("}", "");
              if (isNaN(parseInt(second))) {
                const mentionedChannel = guild.channels.find(
                  x => x.name === second
                );
                if (mentionedChannel === null) {
                  messageArray.push("#" + second);
                } else {
                  messageArray.push(mentionedChannel);
                }
              } else {
                const mentionedChannel = guild.channels.get(second);
                if (mentionedChannel === null) {
                  messageArray.push("<#" + second + ">");
                } else {
                  messageArray.push(mentionedChannel);
                }
              }
            }

            //check role
            else if (word.startsWith("{&")) {
              const first = word.replace("{&", "");
              const second = first.replace("}", "");
              if (isNaN(parseInt(second))) {
                const mentionedRole = guild.roles.find(x => x.name === second);
                if (mentionedRole === null) {
                  messageArray.push("@" + second);
                } else {
                  messageArray.push(mentionedRole);
                }
              } else {
                const mentionedRole = guild.roles.get(second);
                if (mentionedRole === null) {
                  messageArray.push("<@&" + second + ">");
                } else {
                  messageArray.push(mentionedRole);
                }
              }
            }

            //check mentioned users
            else if (word.startsWith("{@")) {
              const first = word.replace("{@", "");
              const second = first.replace("}", "");
              if (isNaN(parseInt(second))) {
                const mentionedUser = client.users.find(x => x.name === second);
                if (mentionedUser === null) {
                  messageArray.push("@" + second);
                } else {
                  messageArray.push(mentionedUser);
                }
              } else {
                const mentionedUser = client.users.get(second);
                if (mentionedUser === null) {
                  messageArray.push("<@" + second + ">");
                } else {
                  messageArray.push(mentionedUser);
                }
              }
            } else {
              messageArray.push(word);
            }
          });

          //construct message
          const welcomeMessage = messageArray
            .join(" ")
            .replace(/{user}/g, member);

          //send message only
          channel.send(welcomeMessage);

          //check image link
          if (result[0].wel_img === null) {
          } else {
            //canvas
            var img = new Image();

            //when image load
            img.onload = async function() {
              var height = img.height;
              var width = img.width;

              //create canvas + get context
              const canvas = createCanvas(width, height);
              const ctx = canvas.getContext("2d");

              //applyText function
              const applyText = (canvas, text) => {
                const ctx = canvas.getContext("2d");

                //calculate largest font size
                let fontSize = canvas.width / 12;

                //reduce font size loop
                do {
                  //reduce font size
                  ctx.font = `${(fontSize -= 5)}px sans-serif`;
                  // Compare pixel width of the text to the canvas minus the approximate avatar size
                } while (
                  ctx.measureText(text).width >
                  canvas.width - canvas.width / 10
                );

                // Return the result to use in the actual canvas
                return ctx.font;
              };

              //welcomeText function
              const welcomeText = (canvas, text) => {
                const ctx = canvas.getContext("2d");

                //calculate largest font size
                let fontSize = canvas.width / 24;

                //reduce font size loop
                do {
                  //reduce font size
                  ctx.font = `${(fontSize -= 5)}px sans-serif`;
                  // Compare pixel width of the text to the canvas minus the approximate avatar size
                } while (
                  ctx.measureText(text).width >
                  canvas.width - canvas.width / 4
                );

                // Return the result to use in the actual canvas
                return ctx.font;
              };

              //fetch the image
              const image = await loadImage(url);

              //fetch user avatar
              const avatar = await loadImage(member.user.displayAvatarURL);

              //draw background
              ctx.drawImage(image, 0, 0, width, height);

              //declare the text
              var txt = member.user.username + " #" + member.user.discriminator;

              //draw font
              ctx.font = applyText(canvas, txt);
              ctx.strokeStyle = "black";
              ctx.lineWidth = canvas.width / 102.4;
              ctx.strokeText(
                txt,
                canvas.width / 2 - ctx.measureText(txt).width / 2,
                (canvas.height * 3) / 4
              );
              ctx.fillStyle = "#ffffff";
              ctx.fillText(
                txt,
                canvas.width / 2 - ctx.measureText(txt).width / 2,
                (canvas.height * 3) / 4
              );

              //declare welcome message
              var welcome = "Welcome to the server!";

              //draw font
              ctx.font = welcomeText(canvas, welcome);
              ctx.strokeStyle = "black";
              ctx.lineWidth = canvas.width / 204.8;
              ctx.strokeText(
                welcome,
                canvas.width / 2 - ctx.measureText(welcome).width / 2,
                (canvas.height * 6) / 7
              );
              ctx.fillStyle = "#ffffff";
              ctx.fillText(
                welcome,
                canvas.width / 2 - ctx.measureText(welcome).width / 2,
                (canvas.height * 6) / 7
              );

              // Pick up the pen
              ctx.beginPath();
              //line width setting
              ctx.lineWidth = canvas.width / 51.2;
              // Start the arc to form a circle
              ctx.arc(
                canvas.width / 2,
                canvas.height / 3,
                canvas.height / 5,
                0,
                Math.PI * 2,
                true
              );
              // Put the pen down
              ctx.closePath();
              ctx.strokeStyle = "#dfdfdf";
              ctx.stroke();
              // Clip off the region you drew on
              ctx.clip();

              //draw avatar in circle
              ctx.drawImage(
                avatar,
                canvas.width / 2 - canvas.height / 5,
                canvas.height / 3 - canvas.height / 5,
                canvas.height / 2.5,
                canvas.height / 2.5
              );

              //declare attachment
              var attachment = new Discord.Attachment(
                canvas.toBuffer(),
                "welcome-image.png"
              );

              //send message
              channel.send("", attachment);
            };

            //image url
            var url = result[0].wel_img;

            //give source
            img.src = url;
          }
        }

        //check any autorole
        if (result[0].autorole === "[]" || result[0] === undefined) {
        } else {
          //parse array
          var roleArray = JSON.parse(result[0].autorole);

          //loop array
          for (let i = 0; i < roleArray.length; i++) {
            var role = member.guild.roles.find(
              role => role.name === roleArray[i]
            );

            //check if roles are found
            if (role === null) {
            } else {
              //assign role
              member.addRole(role);
            }
          }
        }

        //release SQL
        con.release();

        if (err) throw err;
      }
    );
  });
});

//someone left

client.on("guildMemberRemove", member => {
  const guild = member.guild;
  pool.getConnection(function(err, con) {
    con.query(
      "SELECT leave_msg, leave_channel FROM servers WHERE id=" + guild.id,
      function(err, result, fields) {
        if (
          result[0].leave_msg === null ||
          result[0].leave_channel === null ||
          result[0] === undefined
        ) {
        } else {
          const channel = guild.channels.get(result[0].leave_channel);
          const splitMessage = result[0].leave_msg.split(" ");
          const messageArray = [];

          splitMessage.forEach(word => {
            //check channel
            if (word.startsWith("{#")) {
              const first = word.replace("{#", "");
              const second = first.replace("}", "");
              if (isNaN(parseInt(second))) {
                const mentionedChannel = guild.channels.find(
                  x => x.name === second
                );
                if (mentionedChannel === null) {
                  messageArray.push("#" + second);
                } else {
                  messageArray.push(mentionedChannel);
                }
              } else {
                const mentionedChannel = guild.channels.get(second);
                if (mentionedChannel === null) {
                  messageArray.push("<#" + second + ">");
                } else {
                  messageArray.push(mentionedChannel);
                }
              }
            }

            //check role
            else if (word.startsWith("{&")) {
              const first = word.replace("{&", "");
              const second = first.replace("}", "");
              if (isNaN(parseInt(second))) {
                const mentionedRole = guild.roles.find(x => x.name === second);
                if (mentionedRole === null) {
                  messageArray.push("@" + second);
                } else {
                  messageArray.push(mentionedRole);
                }
              } else {
                const mentionedRole = guild.roles.get(second);
                if (mentionedRole === null) {
                  messageArray.push("<@&" + second + ">");
                } else {
                  messageArray.push(mentionedRole);
                }
              }
            }

            //check mentioned users
            else if (word.startsWith("{@")) {
              const first = word.replace("{@", "");
              const second = first.replace("}", "");
              if (isNaN(parseInt(second))) {
                const mentionedUser = client.users.find(x => x.name === second);
                if (mentionedUser === null) {
                  messageArray.push("@" + second);
                } else {
                  messageArray.push(mentionedUser);
                }
              } else {
                const mentionedUser = client.users.get(second);
                if (mentionedUser === null) {
                  messageArray.push("<@" + second + ">");
                } else {
                  messageArray.push(mentionedUser);
                }
              }
            } else {
              messageArray.push(word);
            }
          });

          const leaveMessage = messageArray
            .join(" ")
            .replace(/{user}/g, member);
          channel.send(leaveMessage);
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
    con.query("SELECT * FROM servers WHERE id = " + guild.id, function(
      err,
      result,
      fields
    ) {
      if (err) throw err;
      if (result.length > 0) {
        console.log(
          "Found row inserted for this server before. Cancelling row insert..."
        );
      } else {
        con.query(
          "INSERT INTO servers (id, autorole) VALUES (" + guild.id + ", '[]')",
          function(err, result) {
            if (err) throw err;
            console.log("Inserted record for " + guild.name);
          }
        );
      }
    });

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

  if (music.checkAdminCmd(message, pool)) return;

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
    try {
      command.execute(message, args, pool);
    } catch (error) {
      console.error(error);
      message.reply("there was an error trying to execute that command!");
    }
  }
});
