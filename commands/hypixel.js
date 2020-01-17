const Discord = require("discord.js");
var Buffer = require("buffer").Buffer;
const http = require("http");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "hypixel",
  description:
    "Connect to Hypixel API.\nSubcommands are: achivevments, tnt, (blank)",
  args: true,
  aliases: ["hy"],
  usage: "<subcommand> <username>",
  subcommands: ["achievements", "tnt", "bedwars"],
  subaliases: ["ach", "bw"],
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
                            .setDescription("General stats")
                            .setThumbnail(
                              "https://image.ibb.co/emhGrV/Hypixel-Thumbnail.png"
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
                              "https://i.imgur.com/hxbaDUY.png"
                            );
                        } else {
                          var Embed = new Discord.RichEmbed()
                            .setColor(color)
                            .setTitle(rank + res[0].name)
                            .setDescription("General stats")
                            .setThumbnail(
                              "https://image.ibb.co/emhGrV/Hypixel-Thumbnail.png"
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
                              "https://i.imgur.com/hxbaDUY.png"
                            );
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
                                  .setDescription("General stats")
                                  .setThumbnail(
                                    "https://image.ibb.co/emhGrV/Hypixel-Thumbnail.png"
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
                                    "https://i.imgur.com/hxbaDUY.png"
                                  );
                              } else {
                                var Embed = new Discord.RichEmbed()
                                  .setColor(color)
                                  .setTitle(rank + res[0].name)
                                  .setDescription("General stats")
                                  .setThumbnail(
                                    "https://image.ibb.co/emhGrV/Hypixel-Thumbnail.png"
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
                                    "https://i.imgur.com/hxbaDUY.png"
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

                if (args[0] === "achievements" || args[0] === "ach") {
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
                    .setDescription("TNT Games Stats")
                    .setThumbnail("https://i.ibb.co/2hvh1x1/TNT-64.png")
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
                      "https://i.imgur.com/hxbaDUY.png"
                    );

                  message.channel.send(Embed);
                } else if (args[0] === "bw" || args[0] === "bedwars") {
                  const bw = body.player.stats.Bedwars;

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
                    .setDescription("Bed Wars Stats")
                    .setThumbnail("https://hypixel.net/styles/hypixel-uix/hypixel/game-icons/BedWars-44.png")
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
                      "https://i.imgur.com/hxbaDUY.png"
                    );

                  message.channel.send(Embed);
                } else if (args[0] === "duels" || args[0] === "du") {
                  message.channel.send(
                    "There are too much stuff and the creator is lazy so he didn't finish this command."
                  );
                }
              }
            }
          );
        }
      });
    }
  }
};
