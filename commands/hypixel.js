const Discord = require("discord.js");
var Buffer = require("buffer").Buffer;
const http = require("http");
var color = Math.floor(Math.random() * 16777214) + 1;

function twoDigits(d) {
  if (0 <= d && d < 10) return "0" + d.toString();
  if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
  return d.toString();
}

module.exports = {
  name: "hypixel",
  description: "Connect to Hypixel API.",
  args: true,
  aliases: ["hy"],
  usage: "<subcommand> <username>",
  subcommands: ["achievements", "tnt", "bedwars", "duels"],
  subaliases: ["ach", "bw", "du"],
  execute(message, args) {
    const MojangAPI = require("mojang-api");
    if (!args[1]) {
      if (!args[0]) {
        return message.reply(
          "please provide a Minecraft username or use the subcommands."
        );
      }
      MojangAPI.nameToUuid(`${args[0]}`, function(err, res) {
        if (err) console.log(err);
        else {
          if (res[0] === undefined) {
            return message.channel.send(
              "Cannot find player named **" + args[0] + "**."
            );
          }
          const guildurl =
            "https://api.hypixel.net/findGuild?key=" +
            process.env.API +
            "&byUuid=" +
            res[0].id;
          const url =
            "https://api.hypixel.net/player?name=" +
            res[0].name +
            "&key=" +
            process.env.API;
          var request = require("request");
          request(
            {
              url: url,
              json: true
            },

            function(error, response, body) {
              if (!error && response.statusCode === 200) {
                console.log("someone's api"); // Print the json response
                if (body.player.newPackageRank === "VIP") {
                  var rank = "[VIP]";
                }
                if (body.player.newPackageRank === "VIP_PLUS") {
                  var rank = "[VIP+]";
                }
                if (body.player.newPackageRank === "MVP") {
                  var rank = "[MVP]";
                }
                if (body.player.newPackageRank === "MVP_PLUS") {
                  var rank = "[MVP+]";
                }
                if (body.player.newPackageRank === "MVP_PLUS_PLUS") {
                  var rank = "[MVP++]";
                }
                if (body.player.rank === "YOUTUBER") {
                  var rank = "[Youtuber]";
                }
                if (body.player.prefix === "§c[OWNER]") {
                  var rank = "[OWNER]";
                }
                if (body.player.prefix === "§d[PIG§b+++§d]") {
                  var rank = "[PIG+++]";
                }
                if (body.player.rank === "ADMIN") {
                  var rank = "[ADMIN]";
                }
                if (!body.player.newPackageRank && !body.player.rank) {
                  var rank = "Non";
                }
                const exp = body.player.networkExp;

                const BASE = 10000;
                const GROWTH = 2500;
                /* Constants to generate the total amount of XP to complete a level */
                const HALF_GROWTH = 0.5 * GROWTH;
                /* Constants to look up the level from the total amount of XP */
                const REVERSE_PQ_PREFIX = -(BASE - 0.5 * GROWTH) / GROWTH;
                const REVERSE_CONST = REVERSE_PQ_PREFIX * REVERSE_PQ_PREFIX;
                const GROWTH_DIVIDES_2 = 2 / GROWTH;

                if (exp < 0) {
                  var level = 1;
                } else {
                  var level = Math.floor(
                    1 +
                      REVERSE_PQ_PREFIX +
                      Math.sqrt(REVERSE_CONST + GROWTH_DIVIDES_2 * exp)
                  );
                }
                request(
                  {
                    url: guildurl,
                    json: true
                  },
                  function(err, resp, stuff) {
                    if (!error && response.statusCode === 200) {
                      if (stuff.guild === null) {
                        var firstdate = new Date(body.player.firstLogin);
                        var firstlogin = firstdate.toLocaleString();
                        if (typeof body.player.karma === "undefined") {
                          var karma = 0;
                        } else {
                          var karma = body.player.karma
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        }
                        // Create a new JavaScript Date object based on the timestamp
                        // multiplied by 1000 so that the argument is in milliseconds, not seconds.
                        var lastdate = new Date(body.player.lastLogin);
                        var lastlogin = lastdate.toLocaleString();
                        const rank2 = rank.replace(/[\[\]']+/g, "");
                        let skin =
                          "https://visage.surgeplay.com/full/256/" + res[0].id;
                        if (rank === "Non") {
                          var Embed = new Discord.RichEmbed()
                            .setColor(color)
                            .setTitle(res[0].name)
                            .setURL("https://hypixel.net/player/" + res[0].name)
                            .setDescription("General stats")
                            .setThumbnail(
                              "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2Fhypixel.jpg?v=1579257362271"
                            )
                            .addField("Rank", rank2, true)
                            .addField("Level", level, true)
                            .addField(
                              "Minecraft Version",
                              body.player.mcVersionRp,
                              true
                            )
                            .addField("Guild", "No guild", true)
                            .addField("Karma", karma, true)
                            .addField(
                              "First/Last login",
                              "`" + firstlogin + " | " + lastlogin + "`",
                              true
                            )
                            .setImage(skin)
                            .setTimestamp()
                            .setFooter(
                              "Have a nice day! :)",
                              message.client.user.displayAvatarURL
                            );
                        } else {
                          var Embed = new Discord.RichEmbed()
                            .setColor(color)
                            .setTitle(rank + res[0].name)
                            .setURL("https://hypixel.net/player/" + res[0].name)
                            .setDescription("General stats")
                            .setThumbnail(
                              "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2Fhypixel.jpg?v=1579257362271"
                            )
                            .addField("Rank", rank2, true)
                            .addField("Level", level, true)
                            .addField(
                              "Minecraft Version",
                              body.player.mcVersionRp,
                              true
                            )
                            .addField("Guild", "No guild", true)
                            .addField("Karma", karma, true)
                            .addField(
                              "First/Last login",
                              "`" + firstlogin + " | " + lastlogin + "`",
                              true
                            )
                            .setImage(skin)
                            .setTimestamp()
                            .setFooter(
                              "Have a nice day! :)",
                              message.client.user.displayAvatarURL
                            );
                        }
                        if (body.player.socialMedia.links.DISCORD) {
                          Embed.addField(
                            "Discord",
                            "@" + body.player.socialMedia.links.DISCORD
                          );
                        } else {
                        }
                        message.channel.send(Embed);
                      } else {
                        console.log("someone's guild"); // Print the json response
                        const guild =
                          "https://api.hypixel.net/guild?key=" +
                          process.env.API +
                          "&id=" +
                          stuff.guild;

                        request(
                          {
                            url: guild,
                            json: true
                          },
                          function(gerr, gres, gbody) {
                            if (!error && response.statusCode === 200) {
                              console.log("guild stuff"); // Print the json response

                              // Create a new JavaScript Date object based on the timestamp
                              // multiplied by 1000 so that the argument is in milliseconds, not seconds.
                              var firstdate = new Date(body.player.firstLogin);
                              var firstlogin = firstdate.toLocaleString();
                              if (typeof body.player.karma === "undefined") {
                                var karma = 0;
                              } else {
                                var karma = body.player.karma
                                  .toString()
                                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                              }
                              // Create a new JavaScript Date object based on the timestamp
                              // multiplied by 1000 so that the argument is in milliseconds, not seconds.
                              var lastdate = new Date(body.player.lastLogin);
                              var lastlogin = lastdate.toLocaleString();
                              const rank2 = rank.replace(/[\[\]']+/g, "");
                              let skin =
                                "https://visage.surgeplay.com/full/256/" +
                                res[0].id;
                              if (rank === "Non") {
                                var Embed = new Discord.RichEmbed()
                                  .setColor(color)
                                  .setTitle(res[0].name)
                                  .setURL(
                                    "https://hypixel.net/player/" + res[0].name
                                  )
                                  .setDescription("General stats")
                                  .setThumbnail(
                                    "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2Fhypixel.jpg?v=1579257362271"
                                  )
                                  .addField("Rank", rank2, true)
                                  .addField("Level", level, true)
                                  .addField(
                                    "Minecraft Version",
                                    body.player.mcVersionRp,
                                    true
                                  )
                                  .addField("Guild", gbody.guild.name, true)
                                  .addField("Karma", karma, true)
                                  .addField(
                                    "First/Last login",
                                    "`" + firstlogin + " | " + lastlogin + "`",
                                    true
                                  )
                                  .setImage(skin)
                                  .setTimestamp()
                                  .setFooter(
                                    "Have a nice day! :)",
                                    message.client.user.displayAvatarURL
                                  );
                              } else {
                                var Embed = new Discord.RichEmbed()
                                  .setColor(color)
                                  .setTitle(rank + res[0].name)
                                  .setURL(
                                    "https://hypixel.net/player/" + res[0].name
                                  )
                                  .setDescription("General stats")
                                  .setThumbnail(
                                    "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2Fhypixel.jpg?v=1579257362271"
                                  )
                                  .addField("Rank", rank2, true)
                                  .addField("Level", level, true)
                                  .addField(
                                    "Minecraft Version",
                                    body.player.mcVersionRp,
                                    true
                                  )
                                  .addField("Guild", gbody.guild.name, true)
                                  .addField("Karma", karma, true)
                                  .addField(
                                    "First/Last login",
                                    "`" + firstlogin + " | " + lastlogin + "`",
                                    true
                                  )
                                  .setImage(skin)
                                  .setTimestamp()
                                  .setFooter(
                                    "Have a nice day! :)",
                                    message.client.user.displayAvatarURL
                                  );
                              }
                              message.channel.send(Embed);
                            }
                          }
                        );
                      }
                    }
                  }
                );
              }
            }
          );
        }
      });
    } else {
      MojangAPI.nameToUuid(`${args[1]}`, function(err, res) {
        if (err) console.log(err);
        else {
          if (res[0] === undefined) {
            return message.channel.send(
              "Cannot find player named **" + args[0] + "**."
            );
          }
          const guildurl =
            "https://api.hypixel.net/findGuild?key=" +
            process.env.API +
            "&byUuid=" +
            res[0].id;
          const url =
            "https://api.hypixel.net/player?name=" +
            res[0].name +
            "&key=" +
            process.env.API;
          var request = require("request");
          request(
            {
              url: url,
              json: true
            },

            function(error, response, body) {
              if (!error && response.statusCode === 200) {
                console.log("someone's api"); // Print the json response
                if (body.player.newPackageRank === "VIP") {
                  var rank = "[VIP]";
                }
                if (body.player.newPackageRank === "VIP_PLUS") {
                  var rank = "[VIP+]";
                }
                if (body.player.newPackageRank === "MVP") {
                  var rank = "[MVP]";
                }
                if (body.player.newPackageRank === "MVP_PLUS") {
                  var rank = "[MVP+]";
                }
                if (body.player.newPackageRank === "MVP_PLUS_PLUS") {
                  var rank = "[MVP++]";
                }
                if (body.player.rank === "YOUTUBER") {
                  var rank = "[Youtuber]";
                }
                if (body.player.prefix === "§c[OWNER]") {
                  var rank = "[OWNER]";
                }
                if (body.player.prefix === "§d[PIG§b+++§d]") {
                  var rank = "[PIG+++]";
                }
                if (body.player.rank === "ADMIN") {
                  var rank = "[ADMIN]";
                }
                if (args[0] === "guild" || args[0] === "g") {
                  request(
                    {
                      url: guildurl,
                      json: true
                    },
                    function(err, guildResponse, guildBody) {
                      if (!err && guildResponse.statusCode === 200) {
                        if (guildBody.guild === null) {
                          return message.channel.send(
                            "This player doesn't have a guild!"
                          );
                        }
                        var guildURL =
                          "https://api.hypixel.net/guild?key=" +
                          process.env.API +
                          "&id=" +
                          guildBody.guild;
                        request(
                          {
                            url: guildURL,
                            json: true
                          },
                          async function(guErr, guRes, guBody) {
                            if (!guErr && guRes.statusCode === 200) {
                               var exp = [];
                              var guildId = guBody.guild._id;
                              var guildName = guBody.guild.name;
                              var guildCoins = guBody.guild.coins
                                .toString()
                                .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                              var guildCreated = new Date(guBody.guild.created);
                              var date = guildCreated.getDate();
                              var month = guildCreated.getMonth();
                              var year = guildCreated.getFullYear();
                              var hour = guildCreated.getHours();
                              var minute = guildCreated.getMinutes();
                              var second = guildCreated.getSeconds();

                              var readableTime =
                                twoDigits(date) +
                                "/" +
                                twoDigits(month + 1) +
                                "/" +
                                twoDigits(year) +
                                " " +
                                twoDigits(hour) +
                                ":" +
                                twoDigits(minute) +
                                ":" +
                                twoDigits(second) +
                                " UTC";
                              var member = guBody.guild.members;
                              function compare(a, b) {
                                var first = Object.values(a.expHistory);
                                var second = Object.values(b.expHistory);
                                if (first[0] < second[0]) {
                                  return 1;
                                }
                                if (first[0] > second[0]) {
                                  return -1;
                                }
                                return 0;
                              }
                              await member.sort(compare);
                              
                              const Embed = new Discord.RichEmbed()
                                .setColor(color)
                                .setTitle(guildName)
                                .setDescription("Guild of " + res[0].name)
                                .addField("Guild ID", "`" + guildId + "`", true)
                                .addField("Guild Name", guildName, true)
                                .addField("Guild coins", guildCoins, true)
                                .addField(
                                  "Guild member count",
                                  member.length,
                                  true
                                )
                                .addField(
                                  "Created date",
                                  "`" + readableTime + "`",
                                  true
                                )
                                .setTimestamp()
                                .setFooter(
                                  "Have a nice day! :)",
                                  message.client.user.displayAvatarURL
                                );
                              const topPlayer = new Discord.RichEmbed()
                                .setColor(color)
                                .setTitle(guildName)
                                .setDescription("Top 10 GEXP gatherer")
                                .setTimestamp()
                                .setFooter(
                                  "Have a nice day! :)",
                                  message.client.user.displayAvatarURL
                                );
                             
                              for (var i = 0; i < 9; i++) {
                                 console.log(member[i].expHistory);
                                MojangAPI.profile(member[i].uuid, async function(err, result) {
                                  if (err) console.log(err);
                                  else {
                                    var username = result.name;
                                    var gexp = await Object.values(member[i].expHistory)
                                    
                                    topPlayer.addField(username, gexp[0]);
                                  }
                                });
                                
                              }
                              const filter = (reaction, user) => {
                                return (
                                  ["◀", "▶", "⏮", "⏭", "⏹"].includes(
                                    reaction.emoji.name
                                  ) && user.id === message.author.id
                                );
                              };

                              var allEmbeds = [Embed, topPlayer];

                              const userReactions = message.reactions.filter(
                                reaction =>
                                  reaction.users.has(message.author.id)
                              );

                              var s = 0;
                              function wait(s) {
                                message.channel
                                  .send(allEmbeds[s])
                                  .then(async msg => {
                                    try {
                                      await msg.react("⏮");
                                      await msg.react("◀");
                                      await msg.react("▶");
                                      await msg.react("⏭");
                                      await msg.react("⏹");
                                      await msg
                                        .awaitReactions(filter, {
                                          max: 1,
                                          time: 60000,
                                          errors: ["time"]
                                        })
                                        .then(async collected => {
                                          const reaction = collected.first();

                                          if (reaction.emoji.name === "◀") {
                                            s -= 1;
                                            if (s < 0) {
                                              s = 1;
                                            }
                                            reaction.remove(message.author.id);

                                            edit(msg, s);
                                          } else if (
                                            reaction.emoji.name === "▶"
                                          ) {
                                            s += 1;
                                            if (s > 1) {
                                              s = 0;
                                            }
                                            reaction.remove(message.author.id);
                                            edit(msg, s);
                                          } else if (
                                            reaction.emoji.name === "⏮"
                                          ) {
                                            s = 0;
                                            reaction.remove(message.author.id);

                                            edit(msg, s);
                                          } else if (
                                            reaction.emoji.name === "⏭"
                                          ) {
                                            s = 1;
                                            reaction.remove(message.author.id);

                                            edit(msg, s);
                                          } else {
                                            msg.clearReactions().catch(err => {
                                              console.log(err);
                                            });
                                          }
                                        })
                                        .catch(collected => {
                                          msg.clearReactions().catch(err => {
                                            console.log(err);
                                          });
                                        });
                                    } catch {
                                      err => {
                                        console.log(err);
                                      };
                                    }
                                  });
                              }

                              function edit(mesg, s) {
                                mesg.edit(allEmbeds[s]).then(async msg => {
                                  try {
                                    await msg.react("⏮");
                                    await msg.react("◀");
                                    await msg.react("▶");
                                    await msg.react("⏭");
                                    await msg.react("⏹");
                                    await msg
                                      .awaitReactions(filter, {
                                        max: 1,
                                        time: 60000,
                                        errors: ["time"]
                                      })
                                      .then(async collected => {
                                        const reaction = collected.first();

                                        if (reaction.emoji.name === "◀") {
                                          s -= 1;
                                          if (s < 0) {
                                            s = 1;
                                          }
                                          reaction.remove(message.author.id);

                                          edit(msg, s);
                                        } else if (
                                          reaction.emoji.name === "▶"
                                        ) {
                                          s += 1;
                                          if (s > 1) {
                                            s = 0;
                                          }
                                          reaction.remove(message.author.id);

                                          edit(msg, s);
                                        } else if (
                                          reaction.emoji.name === "⏮"
                                        ) {
                                          s = 0;
                                          reaction.remove(message.author.id);

                                          edit(msg, s);
                                        } else if (
                                          reaction.emoji.name === "⏭"
                                        ) {
                                          s = 1;
                                          reaction.remove(message.author.id);

                                          edit(msg, s);
                                        } else {
                                          msg.clearReactions().catch(err => {
                                            console.log(err);
                                          });
                                        }
                                      })
                                      .catch(collected => {
                                        msg.clearReactions().catch(err => {
                                          console.log(err);
                                        });
                                      });
                                  } catch {
                                    err => {
                                      console.log(err);
                                    };
                                  }
                                });
                              }

                              wait(s);
                            }
                          }
                        );
                      }
                    }
                  );
                } else if (args[0] === "achievements" || args[0] === "ach") {
                  message.author
                    .send("**Long list incoming!**")
                    .then(() => {
                      if (message.channel.type === "dm") return;
                      message.reply("look at your DM!");
                    })
                    .catch(error => {
                      console.error(
                        `Could not send help DM to ${message.author.tag}.\n`,
                        error
                      );
                      message.reply("why don't you let me DM you ;-;");
                    });

                  body.player.achievementsOneTime.forEach(function(
                    item,
                    index,
                    array
                  ) {
                    var item2 = item.replace(/_/g, " ");

                    const item3 =
                      item2.charAt(0).toUpperCase() + item2.substring(1);
                    message.author.send(item3);
                  });
                } else if (args[0] === "tnt") {
                  const tnt = body.player.stats.TNTGames;

                  if (!tnt.coins) {
                    var coins = 0;
                  } else {
                    var coins = tnt.coins;
                  }

                  if (!tnt.deaths_bowspleef) {
                    var deaths_bowspleef = 0;
                  } else {
                    var deaths_bowspleef = tnt.deaths_bowspleef;
                  }
                  if (!tnt.wins_bowspleef) {
                    var wins_bowspleef = 0;
                  } else {
                    var wins_bowspleef = tnt.wins_bowspleef;
                  }
                  if (!tnt.wins_tntag) {
                    var wins_tntag = 0;
                  } else {
                    var wins_tntag = tnt.wins_tntag;
                  }
                  if (!tnt.wins_tntrun) {
                    var wins_tntrun = 0;
                  } else {
                    var wins_tntrun = tnt.wins_tntrun;
                  }
                  if (!tnt.record_tntrun) {
                    var record_tntrun = "00:00";
                  } else {
                    const recordremainder = tnt.record_tntrun % 60;
                    var formattedNumber = ("0" + recordremainder).slice(-2);

                    var record_tntrun =
                      Math.floor(tnt.record_tntrun / 60) +
                      ":" +
                      formattedNumber;
                  }
                  if (!tnt.deaths_capture) {
                    var deaths_capture = 0;
                  } else {
                    var deaths_capture = tnt.deaths_capture;
                  }
                  if (!tnt.wins_capture) {
                    var wins_capture = 0;
                  } else {
                    var wins_capture = tnt.wins_capture;
                  }
                  if (!tnt.kills_capture) {
                    var kills_capture = 0;
                  } else {
                    var kills_capture = tnt.kills_capture;
                  }

                  const Embed = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("TNT Games Stats")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FTNT.png?v=1579257361129"
                    )
                    .addField("Coins", coins)
                    .addField("Bowspleef deaths", deaths_bowspleef, true)
                    .addField("Bowspleef wins", wins_bowspleef, true)
                    .addField("TNTag kills", wins_tntag, true)
                    .addField("TNT Run wins", wins_tntrun, true)
                    .addField("TNT Run record", record_tntrun, true)

                    .addField("Wizard deaths", deaths_capture, true)
                    .addField("Wizard wins", wins_capture, true)
                    .addField("Wizard kills", kills_capture, true)

                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  message.channel.send(Embed);
                } else if (args[0] === "bw" || args[0] === "bedwars") {
                  const bw = body.player.stats.Bedwars;

                  //overall

                  if (!bw.coins) {
                    var coins = 0;
                  } else {
                    var coins = bw.coins;
                  }

                  if (!bw.winstreak) {
                    var winstreak = 0;
                  } else {
                    var winstreak = bw.winstreak;
                  }

                  if (!bw.games_played_bedwars) {
                    var played = 0;
                  } else {
                    var played = bw.games_played_bedwars;
                  }

                  if (!bw.kills_bedwars) {
                    var kills = 0;
                  } else {
                    var kills = bw.kills_bedwars;
                  }

                  if (!bw.wins_bedwars) {
                    var wins = 0;
                  } else {
                    var wins = bw.wins_bedwars;
                  }

                  if (!bw.deaths_bedwars) {
                    var deaths = 0;
                  } else {
                    var deaths = bw.deaths_bedwars;
                  }

                  if (!bw.losses_bedwars) {
                    var loss = 0;
                  } else {
                    var loss = bw.losses_bedwars;
                  }

                  const kdr = Math.round((kills / deaths) * 100) / 100;
                  const wlr = Math.round((wins / loss) * 100) / 100;

                  if (!bw.final_kills_bedwars) {
                    var final = 0;
                  } else {
                    var final = bw.final_kills_bedwars;
                  }

                  if (!bw.beds_broken_bedwars) {
                    var bed = 0;
                  } else {
                    var bed = bw.beds_broken_bedwars;
                  }

                  if (!bw.final_deaths_bedwars) {
                    var fdeath = 0;
                  } else {
                    var fdeath = bw.final_deaths_bedwars;
                  }

                  if (!bw.beds_lost_bedwars) {
                    var bedlost = 0;
                  } else {
                    var bedlost = bw.beds_lost_bedwars;
                  }

                  const fkdr = Math.round((final / fdeath) * 100) / 100;
                  const bbr = Math.round((bed / bedlost) * 100) / 100;

                  const Embed = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Bedwars - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FBedWars.png?v=1579257358530"
                    )
                    .addField(
                      "Level",
                      body.player.achievements.bedwars_level,
                      true
                    )
                    .addField("Coins", coins, true)
                    .addField("Game played", played, true)
                    .addField("Wins", wins, true)
                    .addField("Losses", loss, true)
                    .addField("WLR", wlr, true)
                    .addField("Kills", kills, true)
                    .addField("Deaths", deaths, true)
                    .addField("KDR", kdr, true)
                    .addField("Bed broken", bed, true)
                    .addField("Bed lost", bedlost, true)
                    .addField("Bed broken/lost", bbr, true)
                    .addField("Final kills", final, true)
                    .addField("Final deaths", fdeath, true)
                    .addField("Final KDR", fkdr, true)

                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //solo

                  if (!bw.eight_one_games_played_bedwars) {
                    var playedSolo = 0;
                  } else {
                    var playedSolo = bw.eight_one_games_played_bedwars;
                  }

                  if (!bw.eight_one_wins_bedwars) {
                    var winsSolo = 0;
                  } else {
                    var winsSolo = bw.eight_one_wins_bedwars;
                  }

                  if (!bw.eight_one_losses_bedwars) {
                    var lossSolo = 0;
                  } else {
                    var lossSolo = bw.eight_one_losses_bedwars;
                  }
                  var wlrSolo = Math.round((winsSolo / lossSolo) * 100) / 100;

                  if (!bw.eight_one_kills_bedwars) {
                    var killsSolo = 0;
                  } else {
                    var killsSolo = bw.eight_one_kills_bedwars;
                  }

                  if (!bw.eight_one_deaths_bedwars) {
                    var deathsSolo = 0;
                  } else {
                    var deathsSolo = bw.eight_one_deaths_bedwars;
                  }

                  var kdrSolo =
                    Math.round((killsSolo / deathsSolo) * 100) / 100;

                  if (!bw.eight_one_beds_broken_bedwars) {
                    var bedSolo = 0;
                  } else {
                    var bedSolo = bw.eight_one_beds_broken_bedwars;
                  }

                  if (!bw.eight_one_beds_lost_bedwars) {
                    var bedlostSolo = 0;
                  } else {
                    var bedlostSolo = bw.eight_one_beds_lost_bedwars;
                  }

                  var bbrSolo = Math.round((bedSolo / bedlostSolo) * 100) / 100;

                  if (!bw.eight_one_final_kills_bedwars) {
                    var finalSolo = 0;
                  } else {
                    var finalSolo = bw.eight_one_final_kills_bedwars;
                  }

                  if (!bw.eight_one_final_deaths_bedwars) {
                    var fdeathSolo = 0;
                  } else {
                    var fdeathSolo = bw.eight_one_final_deaths_bedwars;
                  }

                  if (!bw.eight_one_winstreak) {
                    var winstSolo = 0;
                  } else {
                    var winstSolo = bw.eight_one_winstreak;
                  }

                  var fkdrSolo =
                    Math.round((finalSolo / fdeathSolo) * 100) / 100;

                  const EmbedSolo = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Bedwars - **Solo**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FBedWars.png?v=1579257358530"
                    )
                    .addField(
                      "Level",
                      body.player.achievements.bedwars_level,
                      true
                    )
                    .addField("Winstreak", winstSolo, true)
                    .addField("Game played", playedSolo, true)
                    .addField("Wins", winsSolo, true)
                    .addField("Losses", lossSolo, true)
                    .addField("WLR", wlrSolo, true)
                    .addField("Kills", killsSolo, true)
                    .addField("Deaths", deathsSolo, true)
                    .addField("KDR", kdrSolo, true)
                    .addField("Bed broken", bedSolo, true)
                    .addField("Bed lost", bedlostSolo, true)
                    .addField("Bed broken/lost", bbrSolo, true)
                    .addField("Final kills", finalSolo, true)
                    .addField("Final deaths", fdeathSolo, true)
                    .addField("Final KDR", fkdrSolo, true)

                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //double

                  if (!bw.eight_two_winstreak) {
                    var winstTwo = 0;
                  } else {
                    var winstTwo = bw.eight_two_winstreak;
                  }

                  if (!bw.eight_two_games_played_bedwars) {
                    var playedTwo = 0;
                  } else {
                    var playedTwo = bw.eight_two_games_played_bedwars;
                  }

                  if (!bw.eight_two_wins_bedwars) {
                    var winsTwo = 0;
                  } else {
                    var winsTwo = bw.eight_two_wins_bedwars;
                  }

                  if (!bw.eight_two_losses_bedwars) {
                    var lossTwo = 0;
                  } else {
                    var lossTwo = bw.eight_two_losses_bedwars;
                  }

                  if (!bw.eight_two_kills_bedwars) {
                    var killsTwo = 0;
                  } else {
                    var killsTwo = bw.eight_two_kills_bedwars;
                  }

                  if (!bw.eight_two_deaths_bedwars) {
                    var deathsTwo = 0;
                  } else {
                    var deathsTwo = bw.eight_two_deaths_bedwars;
                  }

                  if (!bw.eight_two_beds_broken_bedwars) {
                    var bedTwo = 0;
                  } else {
                    var bedTwo = bw.eight_two_beds_broken_bedwars;
                  }

                  if (!bw.eight_two_beds_lost_bedwars) {
                    var bedlostTwo = 0;
                  } else {
                    var bedlostTwo = bw.eight_two_beds_lost_bedwars;
                  }

                  if (!bw.eight_two_final_kills_bedwars) {
                    var finalTwo = 0;
                  } else {
                    var finalTwo = bw.eight_two_final_kills_bedwars;
                  }

                  if (!bw.eight_two_final_deaths_bedwars) {
                    var fdeathTwo = 0;
                  } else {
                    var fdeathTwo = bw.eight_two_final_deaths_bedwars;
                  }

                  var wlrTwo = Math.round((winsTwo / lossTwo) * 100) / 100;
                  var kdrTwo = Math.round((killsTwo / deathsTwo) * 100) / 100;
                  var bbrTwo = Math.round((bedTwo / bedlostTwo) * 100) / 100;
                  var fkdrTwo = Math.round((finalTwo / fdeathTwo) * 100) / 100;

                  const EmbedTwo = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Bedwars - **Double**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FBedWars.png?v=1579257358530"
                    )
                    .addField(
                      "Level",
                      body.player.achievements.bedwars_level,
                      true
                    )
                    .addField("Winstreak", winstTwo, true)
                    .addField("Game played", playedTwo, true)
                    .addField("Wins", winsTwo, true)
                    .addField("Losses", lossTwo, true)
                    .addField("WLR", wlrTwo, true)
                    .addField("Kills", killsTwo, true)
                    .addField("Deaths", deathsTwo, true)
                    .addField("KDR", kdrTwo, true)
                    .addField("Bed broken", bedTwo, true)
                    .addField("Bed lost", bedlostTwo, true)
                    .addField("Bed broken/lost", bbrTwo, true)
                    .addField("Final kills", finalTwo, true)
                    .addField("Final deaths", fdeathTwo, true)
                    .addField("Final KDR", fkdrTwo, true)

                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //triple

                  if (!bw.four_three_winstreak) {
                    var winstTri = 0;
                  } else {
                    var winstTri = bw.four_three_winstreak;
                  }

                  if (!bw.four_three_games_played_bedwars) {
                    var playedTri = 0;
                  } else {
                    var playedTri = bw.four_three_games_played_bedwars;
                  }

                  if (!bw.four_three_wins_bedwars) {
                    var winsTri = 0;
                  } else {
                    var winsTri = bw.four_three_wins_bedwars;
                  }

                  if (!bw.four_three_losses_bedwars) {
                    var lossTri = 0;
                  } else {
                    var lossTri = bw.four_three_losses_bedwars;
                  }

                  if (!bw.four_three_kills_bedwars) {
                    var killsTri = 0;
                  } else {
                    var killsTri = bw.four_three_kills_bedwars;
                  }

                  if (!bw.four_three_deaths_bedwars) {
                    var deathsTri = 0;
                  } else {
                    var deathsTri = bw.four_three_deaths_bedwars;
                  }

                  if (!bw.four_three_beds_broken_bedwars) {
                    var bedTri = 0;
                  } else {
                    var bedTri = bw.four_three_beds_broken_bedwars;
                  }

                  if (!bw.four_three_beds_lost_bedwars) {
                    var bedlostTri = 0;
                  } else {
                    var bedlostTri = bw.four_three_beds_lost_bedwars;
                  }

                  if (!bw.four_three_final_kills_bedwars) {
                    var finalTri = 0;
                  } else {
                    var finalTri = bw.four_three_final_kills_bedwars;
                  }

                  if (!bw.four_three_final_deaths_bedwars) {
                    var fdeathTri = 0;
                  } else {
                    var fdeathTri = bw.four_three_final_deaths_bedwars;
                  }

                  var wlrTri = Math.round((winsTri / lossTri) * 100) / 100;
                  var kdrTri = Math.round((killsTri / deathsTri) * 100) / 100;
                  var bbrTri = Math.round((bedTri / bedlostTri) * 100) / 100;
                  var fkdrTri = Math.round((finalTri / fdeathTri) * 100) / 100;

                  const EmbedTri = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Bedwars - **3v3v3v3**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FBedWars.png?v=1579257358530"
                    )
                    .addField(
                      "Level",
                      body.player.achievements.bedwars_level,
                      true
                    )
                    .addField("Winstreak", winstTri, true)
                    .addField("Game played", playedTri, true)
                    .addField("Wins", winsTri, true)
                    .addField("Losses", lossTri, true)
                    .addField("WLR", wlrTri, true)
                    .addField("Kills", killsTri, true)
                    .addField("Deaths", deathsTri, true)
                    .addField("KDR", kdrTri, true)
                    .addField("Bed broken", bedTri, true)
                    .addField("Bed lost", bedlostTri, true)
                    .addField("Bed broken/lost", bbrTri, true)
                    .addField("Final kills", finalTri, true)
                    .addField("Final deaths", fdeathTri, true)
                    .addField("Final KDR", fkdrTri, true)

                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //quadruple

                  if (!bw.four_four_winstreak) {
                    var winst4 = 0;
                  } else {
                    var winst4 = bw.four_four_winstreak;
                  }

                  if (!bw.four_four_games_played_bedwars) {
                    var played4 = 0;
                  } else {
                    var played4 = bw.four_four_games_played_bedwars;
                  }

                  if (!bw.four_four_wins_bedwars) {
                    var wins4 = 0;
                  } else {
                    var wins4 = bw.four_four_wins_bedwars;
                  }

                  if (!bw.four_four_losses_bedwars) {
                    var loss4 = 0;
                  } else {
                    var loss4 = bw.four_four_losses_bedwars;
                  }

                  if (!bw.four_four_kills_bedwars) {
                    var kills4 = 0;
                  } else {
                    var kills4 = bw.four_four_kills_bedwars;
                  }

                  if (!bw.four_four_deaths_bedwars) {
                    var deaths4 = 0;
                  } else {
                    var deaths4 = bw.four_four_deaths_bedwars;
                  }

                  if (!bw.four_four_beds_broken_bedwars) {
                    var bed4 = 0;
                  } else {
                    var bed4 = bw.four_four_beds_broken_bedwars;
                  }

                  if (!bw.four_four_beds_lost_bedwars) {
                    var bedlost4 = 0;
                  } else {
                    var bedlost4 = bw.four_four_beds_lost_bedwars;
                  }

                  if (!bw.four_four_final_kills_bedwars) {
                    var final4 = 0;
                  } else {
                    var final4 = bw.four_four_final_kills_bedwars;
                  }

                  if (!bw.four_four_final_deaths_bedwars) {
                    var fdeath4 = 0;
                  } else {
                    var fdeath4 = bw.four_four_final_deaths_bedwars;
                  }

                  var wlr4 = Math.round((wins4 / loss4) * 100) / 100;
                  var kdr4 = Math.round((kills4 / deaths4) * 100) / 100;
                  var bbr4 = Math.round((bed4 / bedlost4) * 100) / 100;
                  var fkdr4 = Math.round((final4 / fdeath4) * 100) / 100;

                  const Embed4 = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Bedwars - **4v4v4v4**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FBedWars.png?v=1579257358530"
                    )
                    .addField(
                      "Level",
                      body.player.achievements.bedwars_level,
                      true
                    )
                    .addField("Winstreak", winst4, true)
                    .addField("Game played", played4, true)
                    .addField("Wins", wins4, true)
                    .addField("Losses", loss4, true)
                    .addField("WLR", wlr4, true)
                    .addField("Kills", kills4, true)
                    .addField("Deaths", deaths4, true)
                    .addField("KDR", kdr4, true)
                    .addField("Bed broken", bed4, true)
                    .addField("Bed lost", bedlost4, true)
                    .addField("Bed broken/lost", bbr4, true)
                    .addField("Final kills", final4, true)
                    .addField("Final deaths", fdeath4, true)
                    .addField("Final KDR", fkdr4, true)

                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );
                  const filter = (reaction, user) => {
                    return (
                      ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
                      user.id === message.author.id
                    );
                  };

                  var allEmbeds = [
                    Embed,
                    EmbedSolo,
                    EmbedTwo,
                    EmbedTri,
                    Embed4
                  ];

                  const userReactions = message.reactions.filter(reaction =>
                    reaction.users.has(message.author.id)
                  );

                  var s = 0;
                  function wait(s) {
                    message.channel.send(allEmbeds[s]).then(async msg => {
                      try {
                        await msg.react("⏮");
                        await msg.react("◀");
                        await msg.react("▶");
                        await msg.react("⏭");
                        await msg.react("⏹");
                        await msg
                          .awaitReactions(filter, {
                            max: 1,
                            time: 60000,
                            errors: ["time"]
                          })
                          .then(async collected => {
                            const reaction = collected.first();

                            if (reaction.emoji.name === "◀") {
                              s -= 1;
                              if (s < 0) {
                                s = 4;
                              }
                              reaction.remove(message.author.id);

                              edit(msg, s);
                            } else if (reaction.emoji.name === "▶") {
                              s += 1;
                              if (s > 4) {
                                s = 0;
                              }
                              reaction.remove(message.author.id);
                              edit(msg, s);
                            } else if (reaction.emoji.name === "⏮") {
                              s = 0;
                              reaction.remove(message.author.id);

                              edit(msg, s);
                            } else if (reaction.emoji.name === "⏭") {
                              s = 4;
                              reaction.remove(message.author.id);

                              edit(msg, s);
                            } else {
                              msg.clearReactions().catch(err => {
                                console.log(err);
                              });
                            }
                          })
                          .catch(collected => {
                            msg.clearReactions().catch(err => {
                              console.log(err);
                            });
                          });
                      } catch {
                        err => {
                          console.log(err);
                        };
                      }
                    });
                  }

                  function edit(mesg, s) {
                    mesg.edit(allEmbeds[s]).then(async msg => {
                      try {
                        await msg.react("⏮");
                        await msg.react("◀");
                        await msg.react("▶");
                        await msg.react("⏭");
                        await msg.react("⏹");
                        await msg
                          .awaitReactions(filter, {
                            max: 1,
                            time: 60000,
                            errors: ["time"]
                          })
                          .then(async collected => {
                            const reaction = collected.first();

                            if (reaction.emoji.name === "◀") {
                              s -= 1;
                              if (s < 0) {
                                s = 4;
                              }
                              reaction.remove(message.author.id);

                              edit(msg, s);
                            } else if (reaction.emoji.name === "▶") {
                              s += 1;
                              if (s > 4) {
                                s = 0;
                              }
                              reaction.remove(message.author.id);

                              edit(msg, s);
                            } else if (reaction.emoji.name === "⏮") {
                              s = 0;
                              reaction.remove(message.author.id);

                              edit(msg, s);
                            } else if (reaction.emoji.name === "⏭") {
                              s = 4;
                              reaction.remove(message.author.id);

                              edit(msg, s);
                            } else {
                              msg.clearReactions().catch(err => {
                                console.log(err);
                              });
                            }
                          })
                          .catch(collected => {
                            msg.clearReactions().catch(err => {
                              console.log(err);
                            });
                          });
                      } catch {
                        err => {
                          console.log(err);
                        };
                      }
                    });
                  }

                  wait(s);
                } else if (args[0] === "duels" || args[0] === "du") {
                  const du = body.player.stats.Duels;

                  //UHC

                  if (!du.uhc_duel_health_regenerated) {
                    var uhcRegen = 0;
                  } else {
                    var uhcRegen = du.uhc_duel_health_regenerated;
                  }

                  if (!du.uhc_duel_bow_shots) {
                    var uhcBow = 0;
                  } else {
                    var uhcBow = du.uhc_duel_bow_shots;
                  }

                  if (!du.uhc_duel_melee_swings) {
                    var uhcMelee = 0;
                  } else {
                    var uhcMelee = du.uhc_duel_melee_swings;
                  }

                  if (!du.uhc_duel_kills) {
                    var uhcKills = 0;
                  } else {
                    var uhcKills = du.uhc_duel_kills;
                  }

                  if (!du.uhc_duel_bow_hits) {
                    var uhcBowHits = 0;
                  } else {
                    var uhcBowHits = du.uhc_duel_bow_hits;
                  }

                  if (!du.uhc_duel_rounds_played) {
                    var uhcRounds = 0;
                  } else {
                    var uhcRounds = du.uhc_duel_rounds_played;
                  }

                  if (!du.uhc_duel_damage_dealt) {
                    var uhcDamage = 0;
                  } else {
                    var uhcDamage = du.uhc_duel_damage_dealt;
                  }

                  if (!du.uhc_duel_wins) {
                    var uhcWins = 0;
                  } else {
                    var uhcWins = du.uhc_duel_wins;
                  }

                  if (!du.uhc_duel_melee_hits) {
                    var uhcMeleeHits = 0;
                  } else {
                    var uhcMeleeHits = du.uhc_duel_melee_hits;
                  }

                  if (!du.uhc_duel_losses) {
                    var uhcLosses = 0;
                  } else {
                    var uhcLosses = du.uhc_duel_losses;
                  }

                  if (!du.uhc_duel_deaths) {
                    var uhcDeaths = 0;
                  } else {
                    var uhcDeaths = du.uhc_duel_deaths;
                  }

                  var uhcWlr = Math.round((uhcWins / uhcLosses) * 100) / 100;
                  var uhcKdr = Math.round((uhcKills / uhcDeaths) * 100) / 100;

                  const EmbedUhc = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **UHC**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", uhcRounds)
                    .addField("Wins", uhcWins, true)
                    .addField("Losses", uhcLosses, true)
                    .addField(
                      "WLR",
                      uhcWlr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Kills", uhcKills, true)
                    .addField("Deaths", uhcDeaths, true)
                    .addField(
                      "KDR",
                      uhcKdr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Melee Swings", uhcMelee, true)
                    .addField("Melee Hits", uhcMeleeHits, true)
                    .addField("Damage Dealt", uhcDamage, true)
                    .addField("Bow Shots", uhcBow, true)
                    .addField("Bow Hits", uhcBowHits, true)
                    .addField("HP Regenerated", uhcRegen, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //SW

                  if (!du.sw_duel_health_regenerated) {
                    var swRegen = 0;
                  } else {
                    var swRegen = du.sw_duel_health_regenerated;
                  }

                  if (!du.sw_duel_losses) {
                    var swLosses = 0;
                  } else {
                    var swLosses = du.sw_duel_losses;
                  }

                  if (!du.sw_duel_damage_dealt) {
                    var swDamage = 0;
                  } else {
                    var swDamage = du.sw_duel_damage_dealt;
                  }

                  if (!du.sw_duel_rounds_played) {
                    var swRounds = 0;
                  } else {
                    var swRounds = du.sw_duel_rounds_played;
                  }

                  if (!du.sw_duel_deaths) {
                    var swDeaths = 0;
                  } else {
                    var swDeaths = du.sw_duel_deaths;
                  }

                  if (!du.sw_duel_melee_hits) {
                    var swMelee = 0;
                  } else {
                    var swMelee = du.sw_duel_melee_hits;
                  }

                  if (!du.sw_duel_melee_swings) {
                    var swMeleeHits = 0;
                  } else {
                    var swMeleeHits = du.sw_duel_melee_swings;
                  }

                  if (!du.sw_duel_wins) {
                    var swWins = 0;
                  } else {
                    var swWins = du.sw_duel_wins;
                  }

                  if (!du.sw_duel_kills) {
                    var swKills = 0;
                  } else {
                    var swKills = du.sw_duel_kills;
                  }

                  if (!du.sw_doubles_bow_shots) {
                    var swBow = 0;
                  } else {
                    var swBow = du.sw_doubles_bow_shots;
                  }

                  if (!du.sw_doubles_bow_hits) {
                    var swBowHits = 0;
                  } else {
                    var swBiwHits = du.sw_doubles_bow_hits;
                  }

                  var swWlr = Math.round((swWins / swLosses) * 100) / 100;
                  var swKdr = Math.round((swKills / swDeaths) * 100) / 100;

                  const EmbedSw = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Skywars**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", swRounds)
                    .addField("Wins", swWins, true)
                    .addField("Losses", swLosses, true)
                    .addField(
                      "WLR",
                      swWlr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Kills", swKills, true)
                    .addField("Deaths", swDeaths, true)
                    .addField(
                      "KDR",
                      swKdr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Melee Swings", swMelee, true)
                    .addField("Melee Hits", swMeleeHits, true)
                    .addField("Damage Dealt", swDamage, true)
                    .addField("Bow Shots", swBow, true)
                    .addField("Bow Hits", swBowHits, true)
                    .addField("HP Regenerated", swRegen, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //Mega Walls

                  if (!du.mw_duel_bow_shots) {
                    var mwBow = 0;
                  } else {
                    var mwBow = du.mw_duel_bow_shots;
                  }

                  if (!du.mw_duel_melee_hits) {
                    var mwMeleeHits = 0;
                  } else {
                    var mwMeleeHits = du.mw_duel_melee_hits;
                  }

                  if (!du.mw_duel_rounds_played) {
                    var mwRounds = 0;
                  } else {
                    var mwRounds = du.mw_duel_rounds_played;
                  }

                  if (!du.mw_duel_damage_dealt) {
                    var mwDamage = 0;
                  } else {
                    var mwDamage = du.mw_duel_damage_dealt;
                  }

                  if (!du.mw_duel_melee_swings) {
                    var mwMelee = 0;
                  } else {
                    var mwMelee = du.mw_duel_melee_swings;
                  }

                  if (!du.mw_duel_kills) {
                    var mwKills = 0;
                  } else {
                    var mwKills = du.mw_duel_kills;
                  }

                  if (!du.mw_duel_health_regenerated) {
                    var mwRegen = 0;
                  } else {
                    var mwRegen = du.mw_duel_health_regenerated;
                  }

                  if (!du.mw_duel_wins) {
                    var mwWins = 0;
                  } else {
                    var mwWins = du.mw_duel_wins;
                  }

                  if (!du.mw_duel_bow_hits) {
                    var mwBowHits = 0;
                  } else {
                    var mwBowHits = du.mw_duel_bow_hits;
                  }

                  if (!du.mw_duel_losses) {
                    var mwLosses = 0;
                  } else {
                    var mwLosses = du.mw_duel_losses;
                  }

                  if (!du.mw_duel_deaths) {
                    var mwDeaths = 0;
                  } else {
                    var mwDeaths = du.mw_duel_deaths;
                  }

                  var mwWlr = Math.round((mwWins / mwLosses) * 100) / 100;
                  var mwKdr = Math.round((mwKills / mwDeaths) * 100) / 100;

                  const EmbedMw = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Mega Walls**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", mwRounds)
                    .addField("Wins", mwWins, true)
                    .addField("Losses", mwLosses, true)
                    .addField(
                      "WLR",
                      mwWlr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Kills", mwKills, true)
                    .addField("Deaths", mwDeaths, true)
                    .addField(
                      "KDR",
                      mwKdr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Melee Swings", mwMelee, true)
                    .addField("Melee Hits", mwMeleeHits, true)
                    .addField("Damage Dealt", mwDamage, true)
                    .addField("Bow Shots", mwBow, true)
                    .addField("Bow Hits", mwBowHits, true)
                    .addField("HP Regenerated", mwRegen, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //Classic

                  if (!du.classic_duel_rounds_played) {
                    var clsRounds = 0;
                  } else {
                    var clsRounds = du.classic_duel_rounds_played;
                  }

                  if (!du.classic_duel_melee_hits) {
                    var clsMeleeHits = 0;
                  } else {
                    var clsMeleeHits = du.classic_duel_melee_hits;
                  }

                  if (!du.classic_duel_health_regenerated) {
                    var clsRegen = 0;
                  } else {
                    var clsRegen = du.classic_duel_health_regenerated;
                  }

                  if (!du.classic_duel_damage_dealt) {
                    var clsDamage = 0;
                  } else {
                    var clsDamage = du.classic_duel_damage_dealt;
                  }

                  if (!du.classic_duel_bow_hits) {
                    var clsBowHits = 0;
                  } else {
                    var clsBowHits = du.classic_duel_bow_hits;
                  }

                  if (!du.classic_duel_bow_shots) {
                    var clsBow = 0;
                  } else {
                    var clsBow = du.classic_duel_bow_shots;
                  }

                  if (!du.classic_duel_melee_swings) {
                    var clsMelee = 0;
                  } else {
                    var clsMelee = du.classic_duel_melee_swings;
                  }

                  if (!du.classic_duel_kills) {
                    var clsKills = 0;
                  } else {
                    var clsKills = du.classic_duel_kills;
                  }

                  if (!du.classic_duel_wins) {
                    var clsWins = 0;
                  } else {
                    var clsWins = du.classic_duel_wins;
                  }

                  if (!du.classic_duel_losses) {
                    var clsLosses = 0;
                  } else {
                    var clsLosses = du.classic_duel_losses;
                  }

                  if (!du.classic_duel_deaths) {
                    var clsDeaths = 0;
                  } else {
                    var clsDeaths = du.classic_duel_deaths;
                  }

                  var clsWlr = Math.round((clsWins / clsLosses) * 100) / 100;
                  var clsKdr = Math.round((clsKills / clsDeaths) * 100) / 100;

                  const EmbedCls = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Classic**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", clsRounds)
                    .addField("Wins", clsWins, true)
                    .addField("Losses", clsLosses, true)
                    .addField(
                      "WLR",
                      clsWlr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Kills", clsKills, true)
                    .addField("Deaths", clsDeaths, true)
                    .addField(
                      "KDR",
                      clsKdr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Melee Swings", clsMelee, true)
                    .addField("Melee Hits", clsMeleeHits, true)
                    .addField("Damage Dealt", clsDamage, true)
                    .addField("Bow Shots", clsBow, true)
                    .addField("Bow Hits", clsBowHits, true)
                    .addField("HP Regenerated", clsRegen, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //Bow

                  if (!du.bow_duel_bow_hits) {
                    var bowBowHits = 0;
                  } else {
                    var bowBowHits = du.bow_duel_bow_hits;
                  }

                  if (!du.bow_duel_deaths) {
                    var bowDeaths = 0;
                  } else {
                    var bowDeaths = du.bow_duel_deaths;
                  }

                  if (!du.bow_duel_losses) {
                    var bowLosses = 0;
                  } else {
                    var bowLosses = du.bow_duel_losses;
                  }

                  if (!du.bow_duel_bow_shots) {
                    var bowBow = 0;
                  } else {
                    var bowBow = du.bow_duel_bow_shots;
                  }

                  if (!du.bow_duel_health_regenerated) {
                    var bowRegen = 0;
                  } else {
                    var bowRegen = du.bow_duel_health_regenerated;
                  }

                  if (!du.bow_duel_damage_dealt) {
                    var bowDamage = 0;
                  } else {
                    var bowDamage = du.bow_duel_damage_dealt;
                  }

                  if (!du.bow_duel_rounds_played) {
                    var bowRounds = 0;
                  } else {
                    var bowRounds = du.bow_duel_rounds_played;
                  }

                  if (!du.bow_duel_wins) {
                    var bowWins = 0;
                  } else {
                    var bowWinds = du.bow_duel_wins;
                  }

                  if (!du.bow_duel_kills) {
                    var bowKills = 0;
                  } else {
                    var bowKills = du.bow_duel_kills;
                  }

                  if (!du.bow_duel_melee_swings) {
                    var bowMelee = 0;
                  } else {
                    var bowMelee = du.bow_duel_melee_swings;
                  }

                  if (!du.bow_duel_melee_hits) {
                    var bowMeleeHits = 0;
                  } else {
                    var bowMeleeHits = du.bow_duel_melee_hits;
                  }

                  var bowWlr = Math.round((bowWins / bowLosses) * 100) / 100;
                  var bowKdr = Math.round((bowKills / bowDeaths) * 100) / 100;

                  const EmbedBow = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Bow**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", bowRounds)
                    .addField("Wins", bowWins, true)
                    .addField("Losses", bowLosses, true)
                    .addField(
                      "WLR",
                      bowWlr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Kills", bowKills, true)
                    .addField("Deaths", bowDeaths, true)
                    .addField(
                      "KDR",
                      bowKdr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Melee Swings", bowMelee, true)
                    .addField("Melee Hits", bowMeleeHits, true)
                    .addField("Damage Dealt", bowDamage, true)
                    .addField("Bow Shots", bowBow, true)
                    .addField("Bow Hits", bowBowHits, true)
                    .addField("HP Regenerated", bowRegen, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //Blitz

                  if (!du.blitz_duel_melee_swings) {
                    var bliMelee = 0;
                  } else {
                    var bliMelee = du.blitz_duel_melee_swings;
                  }

                  if (!du.blitz_duel_damage_dealt) {
                    var bliDamage = 0;
                  } else {
                    var bliDamage = du.blitz_duel_damage_dealt;
                  }

                  if (!du.blitz_duel_melee_hits) {
                    var bliMeleeHits = 0;
                  } else {
                    var bliMeleeHits = du.blitz_duel_melee_hits;
                  }

                  if (!du.blitz_duel_rounds_played) {
                    var bliRounds = 0;
                  } else {
                    var bliRounds = du.blitz_duel_rounds_played;
                  }

                  if (!du.blitz_duel_wins) {
                    var bliWins = 0;
                  } else {
                    var bliWins = du.blitz_duel_wins;
                  }

                  if (!du.blitz_duel_health_regenerated) {
                    var bliRegen = 0;
                  } else {
                    var bliRegen = du.blitz_duel_health_regenerated;
                  }

                  if (!du.blitz_duel_kills) {
                    var bliKills = 0;
                  } else {
                    var bliKills = du.blitz_duel_kills;
                  }

                  if (!du.blitz_duel_losses) {
                    var bliLosses = 0;
                  } else {
                    var bliLosses = du.blitz_duel_losses;
                  }

                  if (!du.blitz_duel_deaths) {
                    var bliDeaths = 0;
                  } else {
                    var bliDeaths = du.blitz_duel_deaths;
                  }

                  if (!du.blitz_duel_bow_shots) {
                    var bliBow = 0;
                  } else {
                    var bliBow = du.blitz_duel_bow_shots;
                  }

                  if (!du.blitz_duel_bow_hits) {
                    var bliBowHits = 0;
                  } else {
                    var bliBowHits = du.blitz_duel_bow_hits;
                  }

                  var bliWlr = Math.round((bliWins / bliLosses) * 100) / 100;
                  var bliKdr = Math.round((bliKills / bliDeaths) * 100) / 100;

                  const EmbedBli = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Blitz**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", bliRounds)
                    .addField("Wins", bliWins, true)
                    .addField("Losses", bliLosses, true)
                    .addField(
                      "WLR",
                      bliWlr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Kills", bliKills, true)
                    .addField("Deaths", bliDeaths, true)
                    .addField(
                      "KDR",
                      bliKdr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Melee Swings", bliMelee, true)
                    .addField("Melee Hits", bliMeleeHits, true)
                    .addField("Damage Dealt", bliDamage, true)
                    .addField("Bow Shots", bliBow, true)
                    .addField("Bow Hits", bliBowHits, true)
                    .addField("HP Regenerated", bliRegen, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //op

                  if (!du.op_duel_damage_dealt) {
                    var opDamage = 0;
                  } else {
                    var opDamage = du.op_duel_damage_dealt;
                  }

                  if (!du.op_duel_kills) {
                    var opKills = 0;
                  } else {
                    var opKills = du.op_duel_kills;
                  }

                  if (!du.op_duel_melee_swings) {
                    var opMelee = 0;
                  } else {
                    var opMelee = du.op_duel_melee_swings;
                  }

                  if (!du.op_duel_melee_hits) {
                    var opMeleeHits = 0;
                  } else {
                    var opMeleeHits = du.op_duel_melee_hits;
                  }

                  if (!du.op_duel_health_regenerated) {
                    var opRegen = 0;
                  } else {
                    var opRegen = du.op_duel_health_regenerated;
                  }

                  if (!du.op_duel_wins) {
                    var opWins = 0;
                  } else {
                    var opWins = du.op_duel_wins;
                  }

                  if (!du.op_duel_rounds_played) {
                    var opRounds = 0;
                  } else {
                    var opRounds = du.op_duel_rounds_played;
                  }

                  if (!du.op_duel_bow_shots) {
                    var opBow = 0;
                  } else {
                    var opBow = du.op_duel_bow_shots;
                  }

                  if (!du.op_duel_bow_hits) {
                    var opBowHits = 0;
                  } else {
                    var opBowHits = du.op_duel_bow_hits;
                  }

                  if (!du.op_duel_deaths) {
                    var opDeaths = 0;
                  } else {
                    var opDeaths = du.op_duel_deaths;
                  }

                  if (!du.op_duel_losses) {
                    var opLosses = 0;
                  } else {
                    var opLosses = du.op_duel_losses;
                  }

                  var opWlr = Math.round((opWins / opLosses) * 100) / 100;
                  var opKdr = Math.round((opKills / opDeaths) * 100) / 100;

                  const EmbedOp = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **OP**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", opRounds)
                    .addField("Wins", opWins, true)
                    .addField("Losses", opLosses, true)
                    .addField(
                      "WLR",
                      opWlr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Kills", opKills, true)
                    .addField("Deaths", opDeaths, true)
                    .addField(
                      "KDR",
                      opKdr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Melee Swings", opMelee, true)
                    .addField("Melee Hits", opMeleeHits, true)
                    .addField("Damage Dealt", opDamage, true)
                    .addField("Bow Shots", opBow, true)
                    .addField("Bow Hits", opBowHits, true)
                    .addField("HP Regenerated", opRegen, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //No Debuff

                  if (!du.potion_duel_deaths) {
                    var poDeaths = 0;
                  } else {
                    var poDeaths = du.potion_duel_deaths;
                  }

                  if (!du.potion_duel_rounds_played) {
                    var poRounds = 0;
                  } else {
                    var poRounds = du.potion_duel_rounds_played;
                  }

                  if (!du.potion_duel_melee_hits) {
                    var poMeleeHits = 0;
                  } else {
                    var poMeleeHits = du.potion_duel_melee_hits;
                  }

                  if (!du.potion_duel_health_regenerated) {
                    var poRegen = 0;
                  } else {
                    var poRegen = du.potion_duel_health_regenerated;
                  }

                  if (!du.potion_duel_melee_swings) {
                    var poMelee = 0;
                  } else {
                    var poMelee = du.potion_duel_melee_swings;
                  }

                  if (!du.potion_duel_losses) {
                    var poLosses = 0;
                  } else {
                    var poLosses = du.potion_duel_losses;
                  }

                  if (!du.potion_duel_damage_dealt) {
                    var poDamage = 0;
                  } else {
                    var poDamage = du.potion_duel_damage_dealt;
                  }

                  if (!du.potion_duel_bow_hits) {
                    var poBowHits = 0;
                  } else {
                    var poBowHits = du.potion_duel_bow_hits;
                  }

                  if (!du.potion_duel_kills) {
                    var poKills = 0;
                  } else {
                    var poKills = du.potion_duel_kills;
                  }

                  if (!du.potion_duel_wins) {
                    var poWins = 0;
                  } else {
                    var poWins = du.potion_duel_wins;
                  }

                  if (!du.potion_duel_heal_pots_used) {
                    var poHeal = 0;
                  } else {
                    var poHeal = du.potion_duel_heal_pots_used;
                  }

                  var poWlr = Math.round((poWins / poLosses) * 100) / 100;
                  var poKdr = Math.round((poKills / poDeaths) * 100) / 100;

                  const EmbedPo = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **No Debuff**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", poRounds)
                    .addField("Wins", poWins, true)
                    .addField("Losses", poLosses, true)
                    .addField(
                      "WLR",
                      poWlr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Kills", poKills, true)
                    .addField("Deaths", poDeaths, true)
                    .addField(
                      "KDR",
                      poKdr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Melee Swings", poMelee, true)
                    .addField("Melee Hits", poMeleeHits, true)
                    .addField("Damage Dealt", poDamage, true)
                    .addField("Heal Potion Used", poHeal, true)
                    .addField("Bow Hits", poBowHits, true)
                    .addField("HP Regenerated", poRegen, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //combo

                  if (!du.combo_duel_melee_hits) {
                    var comMeleeHits = 0;
                  } else {
                    var comMeleeHits = du.combo_duel_melee_hits;
                  }

                  if (!du.combo_duel_melee_swings) {
                    var comMelee = 0;
                  } else {
                    var comMelee = du.combo_duel_melee_swings;
                  }

                  if (!du.combo_duel_rounds_played) {
                    var comRounds = 0;
                  } else {
                    var comRounds = du.combo_duel_rounds_played;
                  }

                  if (!du.combo_duel_health_regenerated) {
                    var comRegen = 0;
                  } else {
                    var comRegen = du.combo_duel_health_regenerated;
                  }

                  if (!du.combo_duel_deaths) {
                    var comDeaths = 0;
                  } else {
                    var comDeaths = du.combo_duel_deaths;
                  }

                  if (!du.combo_duel_losses) {
                    var comLosses = 0;
                  } else {
                    var comLosses = du.combo_duel_losses;
                  }

                  if (!du.combo_duel_wins) {
                    var comWins = 0;
                  } else {
                    var comWins = du.combo_duel_wins;
                  }

                  if (!du.combo_duel_kills) {
                    var comKills = 0;
                  } else {
                    var comKills = du.combo_duel_kills;
                  }

                  if (!du.combo_duel_damage_dealt) {
                    var comDamage = 0;
                  } else {
                    var comDamage = du.combo_duel_damage_dealt;
                  }

                  var comBow = 0;
                  var comBowHits = 0;

                  var comWlr = Math.round((comWins / comLosses) * 100) / 100;
                  var comKdr = Math.round((comKills / comDeaths) * 100) / 100;

                  const EmbedCom = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Combo**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", comRounds)
                    .addField("Wins", comWins, true)
                    .addField("Losses", comLosses, true)
                    .addField(
                      "WLR",
                      comWlr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Kills", comKills, true)
                    .addField("Deaths", comDeaths, true)
                    .addField(
                      "KDR",
                      comKdr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Melee Swings", comMelee, true)
                    .addField("Melee Hits", comMeleeHits, true)
                    .addField("Damage Dealt", comDamage, true)
                    .addField("Bow Shots", comBow, true)
                    .addField("Bow Hits", comBowHits, true)
                    .addField("HP Regenerated", comRegen, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //bridge

                  if (!du.bridge_duel_health_regenerated) {
                    var briRegen = 0;
                  } else {
                    var briRegen = du.bridge_duel_health_regenerated;
                  }

                  if (!du.bridge_duel_goals) {
                    var briGoal = 0;
                  } else {
                    var briGoal = du.bridge_duel_goals;
                  }

                  if (!du.bridge_duel_damage_dealt) {
                    var briDamage = 0;
                  } else {
                    var briDamage = du.bridge_duel_damage_dealt;
                  }

                  if (!du.bridge_duel_melee_hits) {
                    var briMeleeHits = 0;
                  } else {
                    var briMeleeHits = du.bridge_duel_melee_hits;
                  }

                  if (!du.bridge_duel_blocks_placed) {
                    var briBlock = 0;
                  } else {
                    var briBlock = du.bridge_duel_blocks_placed;
                  }

                  if (!du.bridge_duel_melee_swings) {
                    var briMelee = 0;
                  } else {
                    var briMelee = du.bridge_duel_melee_swings;
                  }

                  if (!du.bridge_duel_deaths) {
                    var briDeaths = 0;
                  } else {
                    var briDeaths = du.bridge_duel_deaths;
                  }

                  if (!du.bridge_duel_kills) {
                    var briKills = 0;
                  } else {
                    var briKills = du.bridge_duel_kills;
                  }

                  if (!du.bridge_duel_rounds_played) {
                    var briRounds = 0;
                  } else {
                    var briRounds = du.bridge_duel_rounds_played;
                  }

                  if (!du.bridge_duel_wins) {
                    var briWins = 0;
                  } else {
                    var briWins = du.bridge_duel_wins;
                  }

                  if (!du.bridge_duel_bow_shots) {
                    var briBow = 0;
                  } else {
                    var briBow = du.bridge_duel_bow_shots;
                  }

                  if (!du.bridge_duel_losses) {
                    var briLosses = 0;
                  } else {
                    var briLosses = du.bridge_duel_losses;
                  }

                  if (!du.bridge_duel_bow_hits) {
                    var briBowHits = 0;
                  } else {
                    var briBowHits = du.bridge_duel_bow_hits;
                  }

                  var briWlr = Math.round((briWins / briLosses) * 100) / 100;
                  var briKdr = Math.round((briKills / briDeaths) * 100) / 100;

                  const EmbedBri = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Bridge**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", briRounds, true)
                    .addField("Goal", briGoal, true)
                    .addField("Block Placed", briBlock, true)
                    .addField("Wins", briWins, true)
                    .addField("Losses", briLosses, true)
                    .addField(
                      "WLR",
                      briWlr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Kills", briKills, true)
                    .addField("Deaths", briDeaths, true)
                    .addField(
                      "KDR",
                      briKdr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Melee Swings", briMelee, true)
                    .addField("Melee Hits", briMeleeHits, true)
                    .addField("Damage Dealt", briDamage, true)
                    .addField("Bow Shots", briBow, true)
                    .addField("Bow Hits", briBowHits, true)
                    .addField("HP Regenerated", briRegen, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //sumo

                  if (!du.sumo_duel_melee_swings) {
                    var sumMelee = 0;
                  } else {
                    var sumMelee = du.sumo_duel_melee_swings;
                  }

                  if (!du.sumo_duel_wins) {
                    var sumWins = 0;
                  } else {
                    var sumWins = du.sumo_duel_wins;
                  }

                  if (!du.sumo_duel_rounds_played) {
                    var sumRounds = 0;
                  } else {
                    var sumRounds = du.sumo_duel_rounds_played;
                  }

                  if (!du.sumo_duel_melee_hits) {
                    var sumMeleeHits = 0;
                  } else {
                    var sumMeleeHits = du.sumo_duel_melee_hits;
                  }

                  if (!du.sumo_duel_losses) {
                    var sumLosses = 0;
                  } else {
                    var sumLosses = du.sumo_duel_losses;
                  }

                  if (!du.sumo_duel_deaths) {
                    var sumDeaths = 0;
                  } else {
                    var sumDeaths = du.sumo_duel_deaths;
                  }

                  if (!du.sumo_duel_kills) {
                    var sumKills = 0;
                  } else {
                    var sumKills = du.sumo_duel_kills;
                  }

                  var sumRegen = 0;
                  var sumDamage = 0;
                  var sumBow = 0;
                  var sumBowHits = 0;

                  var sumWlr = Math.round((sumWins / sumLosses) * 100) / 100;
                  var sumKdr = Math.round((sumKills / sumDeaths) * 100) / 100;

                  const EmbedSum = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Sumo**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", sumRounds)
                    .addField("Wins", sumWins, true)
                    .addField("Losses", sumLosses, true)
                    .addField(
                      "WLR",
                      sumWlr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Kills", sumKills, true)
                    .addField("Deaths", sumDeaths, true)
                    .addField(
                      "KDR",
                      sumKdr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Melee Swings", sumMelee, true)
                    .addField("Melee Hits", sumMeleeHits, true)
                    .addField("Damage Dealt", sumDamage, true)
                    .addField("Bow Shots", sumBow, true)
                    .addField("Bow Hits", sumBowHits, true)
                    .addField("HP Regenerated", sumRegen, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  //Overall

                  if (!du.melee_swings) {
                    var melee = 0;
                  } else {
                    var melee = du.melee_swings;
                  }

                  if (!du.melee_hits) {
                    var meleeHits = 0;
                  } else {
                    var meleeHits = du.melee_hits;
                  }

                  if (!du.wins) {
                    var wins = 0;
                  } else {
                    var wins = du.wins;
                  }

                  if (!du.rounds_played) {
                    var rounds = 0;
                  } else {
                    var rounds = du.rounds_played;
                  }

                  if (!du.kills) {
                    var kills = 0;
                  } else {
                    var kills = du.kills;
                  }

                  if (!du.health_regenerated) {
                    var regen = 0;
                  } else {
                    var regen = du.health_regenerated;
                  }

                  if (!du.damage_dealt) {
                    var damage = 0;
                  } else {
                    var damage = du.damage_dealt;
                  }

                  if (!du.bow_shots) {
                    var bow = 0;
                  } else {
                    var bow = du.bow_shots;
                  }

                  if (!du.bow_hits) {
                    var bowHits = 0;
                  } else {
                    var bowHits = du.bow_hits;
                  }

                  if (!du.losses) {
                    var losses = 0;
                  } else {
                    var losses = du.losses;
                  }

                  if (!du.deaths) {
                    var deaths = 0;
                  } else {
                    var deaths = du.deaths;
                  }

                  var wlr = Math.round((wins / losses) * 100) / 100;
                  var kdr = Math.round((kills / deaths) * 100) / 100;

                  const Embed = new Discord.RichEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", rounds)
                    .addField("Wins", wins, true)
                    .addField("Losses", losses, true)
                    .addField(
                      "WLR",
                      wlr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Kills", kills, true)
                    .addField("Deaths", deaths, true)
                    .addField(
                      "KDR",
                      kdr.toString().replace("NaN", "0.00"),
                      true
                    )
                    .addField("Melee Swings", melee, true)
                    .addField("Melee Hits", meleeHits, true)
                    .addField("Damage Dealt", damage, true)
                    .addField("Bow Shots", bow, true)
                    .addField("Bow Hits", bowHits, true)
                    .addField("HP Regenerated", regen, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL
                    );

                  var allEmbeds = [
                    Embed,
                    EmbedUhc,
                    EmbedSw,
                    EmbedSum,
                    EmbedMw,
                    EmbedBli,
                    EmbedBow,
                    EmbedOp,
                    EmbedCls,
                    EmbedPo,
                    EmbedCom,
                    EmbedBri
                  ];
                  var s = 0;
                  const filter = (reaction, user) => {
                    return (
                      ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
                      user.id === message.author.id
                    );
                  };
                  const userReactions = message.reactions.filter(reaction =>
                    reaction.users.has(message.author.id)
                  );

                  var s = 0;
                  function wait(s) {
                    message.channel.send(allEmbeds[s]).then(async msg => {
                      try {
                        await msg.react("⏮");
                        await msg.react("◀");
                        await msg.react("▶");
                        await msg.react("⏭");
                        await msg.react("⏹");
                        await msg
                          .awaitReactions(filter, {
                            max: 1,
                            time: 60000,
                            errors: ["time"]
                          })
                          .then(async collected => {
                            const reaction = collected.first();

                            if (reaction.emoji.name === "◀") {
                              s -= 1;
                              if (s < 0) {
                                s = 11;
                              }
                              try {
                                await reaction.remove(message.author.id);
                                await edit(msg, s);
                              } catch {
                                err => console.log(err);
                              }
                            } else if (reaction.emoji.name === "▶") {
                              s += 1;
                              if (s > 11) {
                                s = 0;
                              }
                              try {
                                await reaction.remove(message.author.id);
                                await edit(msg, s);
                              } catch {
                                err => console.log(err);
                              }
                            } else if (reaction.emoji.name === "⏮") {
                              s = 0;
                              try {
                                await reaction.remove(message.author.id);
                                await edit(msg, s);
                              } catch {
                                err => console.log(err);
                              }
                            } else if (reaction.emoji.name === "⏭") {
                              s = 11;
                              try {
                                await reaction.remove(message.author.id);
                                await edit(msg, s);
                              } catch {
                                err => console.log(err);
                              }
                            } else {
                              msg.clearReactions().catch(err => {
                                console.log(err);
                              });
                            }
                          })
                          .catch(collected => {
                            msg.clearReactions().catch(err => {
                              console.log(err);
                            });
                          });
                      } catch {
                        err => {
                          console.log(err);
                        };
                      }
                    });
                  }

                  function edit(mesg, s) {
                    mesg.edit(allEmbeds[s]).then(async msg => {
                      try {
                        await msg.react("⏮");
                        await msg.react("◀");
                        await msg.react("▶");
                        await msg.react("⏭");
                        await msg.react("⏹");
                        await msg
                          .awaitReactions(filter, {
                            max: 1,
                            time: 60000,
                            errors: ["time"]
                          })
                          .then(async collected => {
                            const reaction = collected.first();

                            if (reaction.emoji.name === "◀") {
                              s -= 1;
                              if (s < 0) {
                                s = 11;
                              }
                              try {
                                await reaction.remove(message.author.id);
                                await edit(msg, s);
                              } catch {
                                err => console.log(err);
                              }
                            } else if (reaction.emoji.name === "▶") {
                              s += 1;
                              if (s > 11) {
                                s = 0;
                              }
                              try {
                                await reaction.remove(message.author.id);
                                await edit(msg, s);
                              } catch {
                                err => console.log(err);
                              }
                            } else if (reaction.emoji.name === "⏮") {
                              s = 0;
                              try {
                                await reaction.remove(message.author.id);
                                await edit(msg, s);
                              } catch {
                                err => console.log(err);
                              }
                            } else if (reaction.emoji.name === "⏭") {
                              s = 11;
                              try {
                                await reaction.remove(message.author.id);
                                await edit(msg, s);
                              } catch {
                                err => console.log(err);
                              }
                            } else {
                              msg.clearReactions().catch(err => {
                                console.log(err);
                              });
                            }
                          })
                          .catch(collected => {
                            msg.clearReactions().catch(err => {
                              console.log(err);
                            });
                          });
                      } catch {
                        err => {
                          console.log(err);
                        };
                      }
                    });
                  }

                  wait(s);
                } else if (args[0] === "skywars" || args[0] === "sw") {
                  const sw = body.player.stats.SkyWars;

                  //sw level calculator
                }
              }
            }
          );
        }
      });
    }
  }
};
