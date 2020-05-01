const http = require("http");
const express = require("express");
const request = require("request");
const device = require("express-device");
const app = express();
app.use(device.capture());
app.get("/", (req, response) => {
  if(req.device.type === "phone")
    response.sendFile(__dirname + "/views/mobile/index.html");
  else
    response.sendFile(__dirname + "/views/index.html");
});
app.get("/news", (req, response) => {
  if(req.device.type === "phone")
    response.sendFile(__dirname + "/views/mobile/news.html");
  else
    response.sendFile(__dirname + "/views/news.html");
});
app.get("/about", (req, response) => {
  if(req.device.type === "phone")
    response.sendFile(__dirname + "/views/mobile/about.html");
  else
    response.sendFile(__dirname + "/views/about.html");
});
app.get("/manual", (req, response) => {
  request("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2Fmanual.pdf?v=1588168997714").pipe(response);
})
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

const { twoDigits, setTimeout_ } = require("./function.js");
console.realLog = console.log;
console.realError = console.error;

const fs = require("fs");
const Discord = require("discord.js");
const cleverbot = require("cleverbot-free");
const { exec } = require("child_process");
const { prefix } = require("./config.json");
const { Image, createCanvas, loadImage } = require("canvas");
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

var pool = mysql.createPool(mysql_config);

const client = new Discord.Client();

client.commands = new Discord.Collection();
client.items = new Discord.Collection();

const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

const itemFiles = fs
  .readdirSync("./items")
  .filter(file => file.endsWith(".js"));

for (const file of itemFiles) {
  const item = require(`./items/${file}`);
  client.items.set(item.name.toLowerCase(), item);
}

var musicCommandsArray = [];

const musicCommandFiles = fs
  .readdirSync("./musics")
  .filter(file => file.endsWith(".js"));

for (const file of musicCommandFiles) {
  const musicCommand = require(`./musics/${file}`);
  musicCommandsArray.push(musicCommand.name);
  client.commands.set(musicCommand.name, musicCommand);
}

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once("ready", () => {
  exec("rm -rf .cache", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log("Cleared cache");
  });
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
  console.log("Ready!");

  client.user.setActivity("You", { type: "WATCHING" });
  pool.getConnection(function(err, con) {
    if (err) return console.error(err);
    con.query("SELECT id, queue, looping, repeating FROM servers", function(err, results) {
      if(err) return console.error(err);
      const { setQueue } = require("./musics/main.js");
      var count = 0;
      results.forEach(result => {
        if(result.queue !== null || result.looping !== null || result.repeating !== null) {
        var queue = result.queue !== null ? JSON.parse(unescape(result.queue)) : [];
        setQueue(result.id, queue, result.looping === 1 ? true : false, result.repeating === 1 ? true : false);
          count += 1;
        }
      });
      console.log("Set " + count + " queues");
    });
    con.query("SELECT * FROM giveaways ORDER BY endAt ASC", function(
      err,
      results,
      fields
    ) {
      console.log("Found " + results.length + " giveaways");
      results.forEach(async result => {
        if(result.guild === "622311594654695434") return;
        var currentDate = new Date();
        var millisec = result.endAt - currentDate;
        if (err) return console.error(err);
        setTimeout_(async function() {
          try {
            var channel = await client.channels.fetch(result.channel);
          } catch (err) {
            console.log("Failed fetching guild/channel of giveaway.");
            return console.error(err);
          }
          try {
            var msg = await channel.messages.fetch(result.id);
          } catch (err) {
            con.query("DELETE FROM giveaways WHERE id = " + result.id, function(
              err,
              con
            ) {
              if (err) return console.error(err);
              console.log("Deleted an ended giveaway record.");
            });
            return;
          }
          if (msg.deleted === true) {
            con.query("DELETE FROM giveaways WHERE id = " + msg.id, function(
              err,
              con
            ) {
              if (err) return console.error(err);
              console.log("Deleted an ended giveaway record.");
            });
            return;
          } else {
            var fetchUser = await client.users.fetch(result.author);
            var endReacted = [];
            var peopleReacted = await msg.reactions.cache.get(result.emoji);
            try {
              await peopleReacted.users.fetch();
            } catch(err) {
              con.query("DELETE FROM giveaways WHERE id = " + msg.id, function(
                err,
                con
              ) {
                if (err) return console.error(err);
                console.log("Deleted an ended giveaway record.");
              });
            }
            try {
              for (const user of peopleReacted.users.cache.values()) {
                const data = user.id;
                endReacted.push(data);
              }
            } catch (err) {
              return console.error(err);
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
                if (err) return console.error(err);
                console.log("Deleted an ended giveaway record.");
              });
              const Ended = new Discord.MessageEmbed()
                .setColor(parseInt(result.color))
                .setTitle(unescape(result.item))
                .setDescription("Giveaway ended")
                .addField("Winner(s)", "None. Cuz no one reacted.")
                .setTimestamp()
                .setFooter(
                  "Hosted by " +
                    fetchUser.username +
                    "#" +
                    fetchUser.discriminator,
                  fetchUser.displayAvatarURL()
                );
              msg.edit(Ended);
              msg.reactions.removeAll().catch(err => console.error(err));
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

              const Ended = new Discord.MessageEmbed()
                .setColor(parseInt(result.color))
                .setTitle(unescape(result.item))
                .setDescription("Giveaway ended")
                .addField("Winner(s)", winnerMessage)
                .setTimestamp()
                .setFooter(
                  "Hosted by " +
                    fetchUser.username +
                    "#" +
                    fetchUser.discriminator,
                  fetchUser.displayAvatarURL()
                );
              msg.edit(Ended);
              var link = `https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
              msg.channel.send(
                "Congratulation, " +
                  winnerMessage +
                  "! You won **" +
                  unescape(result.item) +
                  "**!\n" +
                  link
              );
              msg.reactions
                .removeAll()
                .catch(error =>
                  console.error("Failed to clear reactions: ", error)
                );

              con.query("DELETE FROM giveaways WHERE id = " + msg.id, function(
                err,
                con
              ) {
                if (err) return console.error(err);
                console.log("Deleted an ended giveaway record.");
              });
            }
          }
        }, millisec);
      });
    });
    con.query("SELECT * FROM poll ORDER BY endAt ASC", function(
      err,
      results,
      fields
    ) {
      if (err) return console.error(err);
      console.log("Found " + results.length + " polls.");
      results.forEach(result => {
        if(result.guild === "622311594654695434") return;
        var currentDate = new Date();
        var time = result.endAt - currentDate;
        setTimeout_(async function() {
          try {
            var channel = await client.channels.fetch(result.channel);
          } catch (err) {
            console.log("Failed fetching guild/channel of giveaway.");
            return console.error(err);
          }
          try {
            var msg = await channel.messages.fetch(result.id);
          } catch (err) {
            con.query("DELETE FROM poll WHERE id = " + result.id, function(
              err,
              con
            ) {
              if (err) return console.error(err);
              console.log("Deleted an ended poll.");
            });
            return;
          }

          if (msg.deleted === true) {
            con.query("DELETE FROM poll WHERE id = " + msg.id, function(
              err,
              result
            ) {
              if (err) return console.error(err);
              console.log("Deleted an ended poll.");
            });
            return;
          } else {
            var author = await client.users.fetch(result.author);
            var allOptions = await JSON.parse(result.options);

            var pollResult = [];
            var end = [];
            for (const emoji of msg.reactions.cache.values()) {
              await pollResult.push(emoji.count);
              var mesg =
                "**" +
                (emoji.count - 1) +
                "** - `" +
                unescape(allOptions[pollResult.length - 1]) +
                "`";
              await end.push(mesg);
            }
            var pollMsg = "⬆**Poll**⬇";
            const Ended = new Discord.MessageEmbed()
              .setColor(parseInt(result.color))
              .setTitle(unescape(result.title))
              .setDescription(
                "Poll ended. Here are the results:\n\n\n" +
                  end
                    .join("\n\n")
                    .replace(/#quot;/g, "'")
                    .replace(/#dquot;/g, '"')
              )
              .setTimestamp()
              .setFooter(
                "Hosted by " + author.username + "#" + author.discriminator,
                author.displayAvatarURL()
              );
            msg.edit(pollMsg, Ended);
            var link = `https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;

            msg.channel.send("A poll has ended!\n" + link);
            msg.reactions.removeAll().catch(err => {
              console.error(err);
            });
            con.query("DELETE FROM poll WHERE id = " + msg.id, function(
              err,
              result
            ) {
              if (err) return console.error(err);
              console.log("Deleted an ended poll.");
            });
          }
        }, time);
      });
    });
    con.release();
  });
});
// login to Discord with your app's token
client.login(process.env.TOKEN);

client.on("guildMemberAdd", member => {
  const guild = member.guild;
  if (guild.id === "677780367188557824")
    setTimeout(async () => {
      var role = await guild.roles.fetch("677785442099396608");
      member.roles.add(role);
    }, 60000);
  if (member.user.bot) return;
  pool.getConnection(function(err, con) {
    if (err) return console.error(err);
    con.query(
      "SELECT welcome, wel_channel, wel_img, autorole FROM servers WHERE id=" +
        guild.id,
      async function(err, result, fields) {
        if (result[0] === undefined || result[0].wel_channel === null) {
          if (result[0] === undefined) {
            pool.getConnection(function(err, con) {
              if (err) return console.error(err);
              con.query(
                "SELECT * FROM servers WHERE id = " + guild.id,
                function(err, result, fields) {
                  if (err) return console.error(err);
                  if (result.length > 0) {
                    console.log(
                      "Found row inserted for this server before. Cancelling row insert..."
                    );
                  } else {
                    con.query(
                      "INSERT INTO servers (id, autorole, giveaway) VALUES (" +
                        guild.id +
                        ", '[]', '🎉')",
                      function(err, result) {
                        if (err) return console.error(err);
                        console.log("Inserted record for " + guild.name);
                      }
                    );
                  }
                }
              );

              if (err) return console.error(err);
              con.release();
            });
          }
        } else {
          //get channel
          const channel = guild.channels.resolve(result[0].wel_channel);
          

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
                const mentionedChannel = guild.channels.resolve(second);
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

          if(result[0].welcome !== null) {
          try {
          //send message only
          channel.send(welcomeMessage);
          } catch(err) {
            console.error(err);
          }
          }
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
              const avatar = await loadImage(
                member.user.displayAvatarURL({ format: "png" })
              );

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
              var attachment = new Discord.MessageAttachment(
                canvas.toBuffer(),
                "welcome-image.png"
              );

              try{
              //send message
              channel.send("", attachment);
              } catch(err) {
                console.error(err);
              }
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

          for (var i = 0; i < roleArray.length; i++) {
            var roleID = roleArray[i];
            if (isNaN(parseInt(roleID))) {
              var role = await guild.roles.find(x => x.name === roleID);
            } else {
              var role = await guild.roles.fetch(roleID);
            }
            try {
            //loop array
            member.roles.add(role);
              console.log(`Added ${member.displayName} to ${role.name}`)
            } catch(err) {
              console.error(err);
            }
          }
        }

        //release SQL
        con.release();

        if (err) return console.error(err);
      }
    );
  });
});

//someone left

client.on("guildMemberRemove", async member => {
  const guild = member.guild;
  pool.getConnection(function(err, con) {
    if (err) return console.error(err);
    con.query(
      "SELECT leave_msg, leave_channel FROM servers WHERE id=" + guild.id,
      async function(err, result, fields) {
        if (
          result[0] === undefined ||
          result[0].leave_msg === null ||
          result[0].leave_channel === null
        ) {
          if (result[0] === undefined) {
              con.query(
                "SELECT * FROM servers WHERE id = " + guild.id,
                function(err, result, fields) {
                  if (err) return console.error(err);
                  if (result.length > 0) {
                    console.log(
                      "Found row inserted for this server before. Cancelling row insert..."
                    );
                  } else {
                    con.query(
                      "INSERT INTO servers (id, autorole, giveaway) VALUES (" +
                        guild.id +
                        ", '[]', '🎉')",
                      function(err, result) {
                        if (err) return console.error(err);
                        console.log("Inserted record for " + guild.name);
                      }
                    );
                  }
                }
              );

              if (err) return console.error(err);
          }
        } else {
          if(guild.me.hasPermission("VIEW_AUDIT_LOGS")) {
            const fetchedLogs = await guild.fetchAuditLogs({
		          limit: 1,
		          type: 'MEMBER_KICK',
	          });
	          const kickLog = fetchedLogs.entries.first();
	          if (kickLog) return;
          } else {
            console.log("Can't view audit logs of " + guild.name);
          }
          const channel = guild.channels.resolve(result[0].leave_channel);
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
                const mentionedChannel = guild.channels.resolve(second);
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
            .replace(/{user}/g, `**${member.user.tag}**`);
          
          try {
          channel.send(leaveMessage);
          } catch(err) {
            console.error(err);
          }
        }

        con.release();

        if (err) return console.error(err);
      }
    );
  });
});

//joined a server
client.on("guildCreate", guild => {
  console.log("Joined a new guild: " + guild.name);

  pool.getConnection(function(err, con) {
    if (err) return console.error(err);
    con.query("SELECT * FROM servers WHERE id = " + guild.id, function(
      err,
      result,
      fields
    ) {
      if (err) return console.error(err);
      if (result.length > 0) {
        console.log(
          "Found row inserted for this server before. Cancelling row insert..."
        );
      } else {
        con.query(
          "INSERT INTO servers (id, autorole, giveaway) VALUES (" +
            guild.id +
            ", '[]', '🎉')",
          function(err, result) {
            if (err) return console.error(err);
            console.log("Inserted record for " + guild.name);
          }
        );
      }
    });

    if (err) return console.error(err);
    con.release();
  });

  //Your other stuff like adding to guildArray
});

//removed from a server
client.on("guildDelete", guild => {
  console.log("Left a guild: " + guild.name);
  pool.getConnection(function(err, con) {
    if (err) return console.error(err);
    con.query("DELETE FROM servers WHERE id=" + guild.id, function(
      err,
      result
    ) {
      if (err) return console.error(err);
      console.log("Deleted record for " + guild.name);
    });
    if (err) return console.error(err);
    con.release();
  });

  //remove from guildArray
});

var exit = new Map();

client.on("voiceStateUpdate", async (oldState, newState) => {
  const guild = oldState.guild || newState.guild;
  let newUserChannel = newState.channel;
  let oldUserChannel = oldState.channel;
  if (oldUserChannel === null && newUserChannel !== null) {
    if (newUserChannel.id !== guild.me.voice.channelID) return;
    // User Joins a voice channel
    exit.set(guild.id, false);
  } else if (newUserChannel === null) {
    try {
      if (oldUserChannel.id !== guild.me.voice.channelID) return;
    } catch (err) {
      return;
    }
    // User leaves a voice channel

    if (guild.me.voice.channel.members.size <= 1) {
      var pendingExit = await exit.get(guild.id);

      if (pendingExit == true) return;

      exit.set(guild.id, true);

      console.log("Pending exit in " + guild.name);

      setTimeout(async function() {
        var shouldExit = await exit.get(guild.id);

        if (!shouldExit || shouldExit == false) return;

        const mainMusic = require("./musics/main.js");
        return await mainMusic.stop(guild);
      }, 30000);
    }
  }
});

client.on("guildMemberUpdate", (oldMember, newMember) => {
  if(oldMember.premiumSinceTimestamp !== null || newMember.premiumSinceTimestamp === null) return;
  pool.getConnection(function(err, con) {
    if(err) return console.error(err);
    con.query("SELECT boost_msg, boost_channel FROM servers WHERE id = '" + newMember.guild.id + "'", async function(err, result) {
      if(err) return console.error(err);
      if(result[0] === undefined || result[0].boost_msg === null || result[0].boost_channel === null) return;
      try {
        var channel = await client.channels.fetch(result[0].boost_channel);
      } catch(err) {
        return console.error(err);
      }
      channel.send(result[0].boost_msg.replace(/{user}/g, `<@${newMember.id}>`));
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
        return await mainMusic.music(message, commandName, pool);
      } catch (error) {
        console.error(error);
        return await message.reply(
          "there was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the support server."
        );
      }
    }
    try {
      command.execute(message, args, pool, musicCommandsArray, hypixelQueries, console.realLog);
    } catch (error) {
      console.error(error);
      message.reply("there was an error trying to execute that command!\nIf it still doesn't work after a few tries, please contact NorthWestWind or report it on the support server.");
    }
  }
});
