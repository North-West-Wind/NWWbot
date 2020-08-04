const Discord = require("discord.js");
var Buffer = require("buffer").Buffer;
const http = require("http");
var color = Math.floor(Math.random() * 16777214) + 1;
const { twoDigits, numberWithCommas } = require("../function.js");
const nodefetch = require("node-fetch");
const fetch = require("fetch-retry")(nodefetch, { retries: 5, retryDelay: 1000 });
const contains = (string, content) => {
  return !!~(string || "").indexOf(content);
};

module.exports = {
  name: "hypixel",
  description:
    "Shows Hypixel related stuff.",
  args: true,
  aliases: ["hy"],
  usage: "[subcommand] <username>",
  subcommands: [
    "guild",
    "achievements",
    "tntgames",
    "bedwars",
    "duels",
    "skywars",
    "blitz",
    "arcade",
    "murdermystery",
    "buildbattle",
    "copsandcrims",
    "vampirez",
    "paintball",
    "quake",
    "uhc",
    "walls",
    "megawalls",
    "crazywalls",
    "smashhero",
    "speeduhc",
    "arena",
    "pit",
    "skyblock",
    "auctionhouse",
    "bazaar"
  ],
  subaliases: ["g", "ach", "tnt", "bw", "du", "sw", "sg", "ar", "mm", "bb", "mcgo", "vz", "pb", "q", "uhc", "wa", "mw", "cw", "sh", "suhc", "are", "p", "sb", "ah", "ba"],
  async execute(message, args, pool, yeet, hypixelQueries) {
    const prefix = message.client.prefix;
    if (hypixelQueries > 90) return message.channel.send("Hey! Slow down!");
    if (!args[0]) {
      return message.channel.send(
        "Please use one of the subcommands or enter an username for profile!" + ` Usage: \`${prefix}${this.name} ${this.usage}\``
      );
    }

    args[0] = args[0].toLowerCase();

    if (args[0] === "auctionhouse" || args[0] === "ah") {
      if (!args[1]) return message.channel.send("Please enter an item!");
      var itemIDs = await fetch(
        `https://api.slothpixel.me/api/skyblock/items`
      ).then(res => res.json());
      var items = new Discord.Collection(Object.entries(itemIDs));
      var firstPrior = items.filter(item => {
        return item.name.toLowerCase().search(args.slice(1).join(" ").toLowerCase()) === 0 ? true : false
      });
      var search = items.filter(item => {
        var searched = item.name.toLowerCase().search(
          args
            .slice(1)
            .join(" ")
            .toLowerCase()
        );
        if (searched !== -1) return true;
        else return false;
      });
      if(search.size == 0) {
        if(firstPrior.size == 0)
        return message.channel.send(
          "No item found for `" + args.slice(1).join(" ") + "`"
        );
      }
      
      var id = firstPrior.size !== 0 ? firstPrior.keys().next().value : search.keys().next().value;
      
      var auctionsAPI = await fetch(
        `https://api.slothpixel.me/api/skyblock/auctions?id=${id}&limit=1000`
      ).then(response => response.json());
      
      if(auctionsAPI.error) {
        console.error(auctionsAPI.error);
        return message.reply("there was an error trying to get auctions from the API!");
      }
      
      var auctions = auctionsAPI;
      
      if (auctions.length == 0)
        return message.channel.send(
          "No item found for `" + args.slice(1).join(" ") + "`"
        );

      function compare(a, b) {
        if (
          (a.highest_bid_amount > 0 ? a.highest_bid_amount : a.starting_bid) / a.item.count <
          (b.highest_bid_amount > 0 ? b.highest_bid_amount : b.starting_bid) / b.item.count
        )
          return -1;
        if (
          (a.highest_bid_amount > 0 ? a.highest_bid_amount : a.starting_bid) / a.item.count >
          (b.highest_bid_amount > 0 ? b.highest_bid_amount : b.starting_bid) / b.item.count
        )
          return 1;
        return 0;
      }

      auctions.sort(compare);
      var lowest =
        (auctions[0].highest_bid_amount > 0
          ? auctions[0].highest_bid_amount
          : auctions[0].starting_bid) / auctions[0].item.count;
      var highest =
        (auctions[auctions.length - 1].highest_bid_amount > 0
          ? auctions[auctions.length - 1].highest_bid_amount
          : auctions[auctions.length - 1].starting_bid) /
        auctions[auctions.length - 1].item.count;
      var average = 0;
      for (const i of auctions) {
        average +=
          (i.highest_bid_amount > 0 ? i.highest_bid_amount : i.starting_bid) /
          i.item.count;
      }
      average = average / auctions.length;
      var median =
        (auctions[Math.ceil(auctions.length / 2)].highest_bid_amount > 0
          ? auctions[Math.ceil(auctions.length / 2)].highest_bid_amount
          : auctions[Math.ceil(auctions.length / 2)].starting_bid) / auctions[Math.ceil(auctions.length / 2)].item.count;

      const Embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(
          'Price deatails of "' +
            id.replace(/_/g, " ") +
            '" from ' +
            auctions.length +
            " auctions"
        )
        .setDescription(
          `Highest: \$${numberWithCommas(Math.round(highest))} - **${
            auctions[auctions.length - 1].item_name
          }**\nLowest: \$${numberWithCommas(Math.round(lowest))} - **${
            auctions[0].item_name
          }**\nAverage: \$${numberWithCommas(
            Math.round(average)
          )}\nMedian: \$${numberWithCommas(Math.round(median))}`
        )
        .setTimestamp()
        .setFooter(
          "Have a nice day! :)",
          message.client.user.displayAvatarURL()
        );

      message.channel.send(Embed);

      return;
    } else if(args[0] === "bazaar" || args[0] === "ba") {
      if (!args[1]) return message.channel.send("Please enter an item!");
      var productIdsAPI = await fetch(`https://api.hypixel.net/skyblock/bazaar/products?key=${process.env.API}`).then(resp => resp.json());
      var productIds = productIdsAPI.productIds;
      var list = ["OAK_LOG", "BIRCH_LOG", "SPRUCE_LOG", "DARK_OAK_LOG", "ACACIA_LOG", "JUNGLE_LOG", "COCOA_BEANS", "LAPIS_LAZULI", "RAW_SALMON", "PUFFERFISH"];
      list.forEach(stuff => productIds.push(stuff));
      var firstPrior = productIds.filter(item => {
        return item.toLowerCase().replace(/_/g, " ").search(args.slice(1).join(" ").toLowerCase()) === 0 ? true : false
      });
      var search = productIds.filter(item => {
        var searched = item.toLowerCase().replace(/_/g, " ").search(
          args
            .slice(1)
            .join(" ")
            .toLowerCase()
        );
        if (searched !== -1) return true;
        else return false;
      });
      
      if(search.length == 0) {
        if(firstPrior.length == 0)
        return message.channel.send(
          "No item found for `" + args.slice(1).join(" ") + "`"
        );
      }
      
      var id = firstPrior.length > 0 ? firstPrior : search;
      var searchedID = id[0];
      switch(id[0]) {
        case "OAK_LOG":
          id[0] = "LOG";
          break;
        case "BIRCH_LOG":
          id[0] = "LOG:2";
          break;
        case "SPRUCE_LOG":
          id[0] = "LOG:1";
          break;
        case "JUNGLE_LOG":
          id[0] = "LOG:3";
          break;
        case "DARK_OAK_LOG":
          id[0] = "LOG_2:1";
          break;
        case "ACACIA_LOG":
          id[0] = "LOG_2";
          break;
        case "COCOA_BEANS":
          id[0] = "INK_SACK:3";
          break;
        case "LAPIS_LAZULI":
          id[0] = "INK_SACK:4";
          break;
        case "RAW_SALMON":
          id[0] = "RAW_FISH:1";
          break;
        case "PUFFERFISH":
          id[0] = "RAW_FISH:3";
          break;
        default:
          id = id;
      }
      var product = await fetch(`https://api.hypixel.net/skyblock/bazaar/product?key=${process.env.API}&productId=${id[0]}`).then(resp => resp.json());
      var stats = product.product_info.quick_status;
      var buyPrice = stats.buyPrice;
      var buyVol = stats.buyVolume;
      var buyOrder = stats.buyOrders;
      var sellPrice = stats.sellPrice;
      var sellVol = stats.sellVolume;
      var sellOrder = stats.sellOrders;
      
      const Embed = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle("Price details of \"" + searchedID.replace(/_/g, " ") + "\" from Bazaar")
      .addField("Buy Price", numberWithCommas(Math.round(buyPrice * 100) / 100), true)
      .addField("Buy Volume", numberWithCommas(buyVol), true)
      .addField("Buy Orders", numberWithCommas(buyOrder), true)
      .addField("Sell Price", numberWithCommas(Math.round(sellPrice * 100) / 100), true)
      .addField("Sell Volume", numberWithCommas(sellVol), true)
      .addField("Sell Orders", numberWithCommas(sellOrder), true)
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
      
      message.channel.send(Embed);
      
      return;
    }

    const filter = (reaction, user) => {
      return (
        ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
        user.id === message.author.id
      );
    };
    const MojangAPI = require("mojang-api");
    if (!args[1]) {
      if (!args[0]) {
        return message.channel.send(
          "Please provide a Minecraft username or use the subcommands."
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
              hypixelQueries++;
              if (!error && response.statusCode === 200) {
                console.log(`${res[0].name}'s Hypixel API`); // Print the json response
                if(!body.player) return message.reply("there was an error trying to read the player data! (It's not found!) (What???)")
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
                    hypixelQueries++;
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
                          var Embed = new Discord.MessageEmbed()
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
                            .addField("Karma", numberWithCommas(karma), true)
                            .addField(
                              "First/Last login",
                              "`" + firstlogin + " | " + lastlogin + "`",
                              true
                            )
                            .setImage(skin)
                            .setTimestamp()
                            .setFooter(
                              "Have a nice day! :)",
                              message.client.user.displayAvatarURL()
                            );
                        } else {
                          var Embed = new Discord.MessageEmbed()
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
                            .addField("Karma", numberWithCommas(karma), true)
                            .addField(
                              "First/Last login",
                              "`" + firstlogin + " | " + lastlogin + "`",
                              true
                            )
                            .setImage(skin)
                            .setTimestamp()
                            .setFooter(
                              "Have a nice day! :)",
                              message.client.user.displayAvatarURL()
                            );
                        }
                        message.channel.send(Embed);
                      } else {
                        console.log(`${res[0].name}'s Hypixel Guild API`); // Print the json response
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
                            hypixelQueries++;
                            if (!error && response.statusCode === 200) {
                              console.log(`${res[0].name}'s Hypixel Guild Stuff`); // Print the json response

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
                                var Embed = new Discord.MessageEmbed()
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
                                  .addField(
                                    "Karma",
                                    numberWithCommas(karma),
                                    true
                                  )
                                  .addField(
                                    "First/Last login",
                                    "`" + firstlogin + " | " + lastlogin + "`",
                                    true
                                  )
                                  .setImage(skin)
                                  .setTimestamp()
                                  .setFooter(
                                    "Have a nice day! :)",
                                    message.client.user.displayAvatarURL()
                                  );
                              } else {
                                var Embed = new Discord.MessageEmbed()
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
                                  .addField(
                                    "Karma",
                                    numberWithCommas(karma),
                                    true
                                  )
                                  .addField(
                                    "First/Last login",
                                    "`" + firstlogin + " | " + lastlogin + "`",
                                    true
                                  )
                                  .setImage(skin)
                                  .setTimestamp()
                                  .setFooter(
                                    "Have a nice day! :)",
                                    message.client.user.displayAvatarURL()
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
      args[1] = args[1].toLowerCase();
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

            async function(error, response, body) {
              hypixelQueries++;
              if (!error && response.statusCode === 200) {
                console.log(`${res[0].name}'s Hypixel API`); // Print the json response
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
                      hypixelQueries++;
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
                            hypixelQueries++;
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

                              var hypixelDate = new Date(Date.now() - 18000000);
                              var guildDate =
                                hypixelDate.getFullYear() +
                                "-" +
                                twoDigits(hypixelDate.getMonth() + 1) +
                                "-" +
                                twoDigits(hypixelDate.getDate());
                              var member = guBody.guild.members;
                              function compare(a, b) {
                                var first = a.expHistory[Object.keys(a.expHistory)[0]];
                                var second = b.expHistory[Object.keys(b.expHistory)[0]];
                                if (first < second) {
                                  return 1;
                                }
                                if (first > second) {
                                  return -1;
                                }
                                return 0;
                              }
                              var members = member.sort(compare).map(x => {
                                return {
                                  uuid: x.uuid,
                                  name: null,
                                  exp: x.expHistory[Object.keys(x.expHistory)[0]]
                                };
                              });

                              for (var i = 0; i < 10; i++) {
                                var result = await fetch(`https://api.minetools.eu/uuid/${members[i].uuid}`).then(res => res.json());
                                var username = result.name;
                                members[i].name = username;
                              }

                              const Embed = new Discord.MessageEmbed()
                                .setColor(color)
                                .setTitle(guildName)
                                .setDescription("Guild of " + res[0].name)
                                .addField("Guild ID", "`" + guildId + "`", true)
                                .addField("Guild Name", guildName, true)
                                .addField(
                                  "Guild coins",
                                  numberWithCommas(guildCoins),
                                  true
                                )
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
                                  message.client.user.displayAvatarURL()
                                );
                              const topPlayer = new Discord.MessageEmbed()
                                .setColor(color)
                                .setTitle(guildName)
                                .setDescription("Top 10 GEXP gatherer")
                                .setTimestamp()
                                .setFooter(
                                  "Have a nice day! :)",
                                  message.client.user.displayAvatarURL()
                                );
                                for (var i = 0; i < 10; i++) {
                                  topPlayer.addField(members[i].name, members[i].exp);
                                }

                              const filter = (reaction, user) => {
                                return (
                                  ["◀", "▶", "⏮", "⏭", "⏹"].includes(
                                    reaction.emoji.name
                                  ) && user.id === message.author.id
                                );
                              };

                              var allEmbeds = [Embed, topPlayer];

                              var s = 0;
                              var msg = await message.channel.send(
                                allEmbeds[0]
                              );

                              await msg.react("⏮");
                              await msg.react("◀");
                              await msg.react("▶");
                              await msg.react("⏭");
                              await msg.react("⏹");
                              var collector = await msg.createReactionCollector(
                                filter,
                                { idle: 60000, errors: ["time"] }
                              );

                              collector.on("collect", function(reaction, user) {
                                reaction.users.remove(user.id);
                                switch (reaction.emoji.name) {
                                  case "⏮":
                                    s = 0;
                                    msg.edit(allEmbeds[s]);
                                    break;
                                  case "◀":
                                    s -= 1;
                                    if (s < 0) {
                                      s = allEmbeds.length - 1;
                                    }
                                    msg.edit(allEmbeds[s]);
                                    break;
                                  case "▶":
                                    s += 1;
                                    if (s > allEmbeds.length - 1) {
                                      s = 0;
                                    }
                                    msg.edit(allEmbeds[s]);
                                    break;
                                  case "⏭":
                                    s = allEmbeds.length - 1;
                                    msg.edit(allEmbeds[s]);
                                    break;
                                  case "⏹":
                                    collector.emit("end");
                                    break;
                                }
                              });
                              collector.on("end", function() {
                                msg.reactions.removeAll().catch(console.error);
                              });
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

                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("TNT Games - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FTNT.png?v=1579257361129"
                    )
                    .addField("Coins", numberWithCommas(coins))
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
                      message.client.user.displayAvatarURL()
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

                  const Embed = new Discord.MessageEmbed()
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
                    .addField("Coins", numberWithCommas(coins), true)
                    .addField("Game played", numberWithCommas(played), true)
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedSolo = new Discord.MessageEmbed()
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
                    .addField("Game played", numberWithCommas(playedSolo), true)
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedTwo = new Discord.MessageEmbed()
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
                    .addField("Game played", numberWithCommas(playedTwo), true)
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedTri = new Discord.MessageEmbed()
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
                    .addField("Game played", numberWithCommas(playedTri), true)
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
                      message.client.user.displayAvatarURL()
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

                  const Embed4 = new Discord.MessageEmbed()
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
                    .addField("Game played", numberWithCommas(played4), true)
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
                      message.client.user.displayAvatarURL()
                    );

                  var allEmbeds = [
                    Embed,
                    EmbedSolo,
                    EmbedTwo,
                    EmbedTri,
                    Embed4
                  ];
                  var s = 0;

                  var msg = await message.channel.send(allEmbeds[0]);

                  await msg.react("⏮");
                  await msg.react("◀");
                  await msg.react("▶");
                  await msg.react("⏭");
                  await msg.react("⏹");
                  var collector = await msg.createReactionCollector(filter, {
                    idle: 60000,
                    errors: ["time"]
                  });

                  collector.on("collect", function(reaction, user) {
                    reaction.users.remove(user.id);
                    switch (reaction.emoji.name) {
                      case "⏮":
                        s = 0;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "◀":
                        s -= 1;
                        if (s < 0) {
                          s = allEmbeds.length - 1;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "▶":
                        s += 1;
                        if (s > allEmbeds.length - 1) {
                          s = 0;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏭":
                        s = allEmbeds.length - 1;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏹":
                        collector.emit("end");
                        break;
                    }
                  });
                  collector.on("end", function() {
                    msg.reactions.removeAll().catch(console.error);
                  });
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

                  const EmbedUhc = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **UHC**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", numberWithCommas(uhcRounds))
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedSw = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Skywars**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", numberWithCommas(swRounds))
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedMw = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Mega Walls**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", numberWithCommas(mwRounds))
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedCls = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Classic**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", numberWithCommas(clsRounds))
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedBow = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Bow**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", numberWithCommas(bowRounds))
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedBli = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Blitz**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", numberWithCommas(bliRounds))
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedOp = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **OP**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", numberWithCommas(opRounds))
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedPo = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **No Debuff**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", numberWithCommas(poRounds))
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedCom = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Combo**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", numberWithCommas(comRounds))
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedBri = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Bridge**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField(
                      "Rounds Played",
                      numberWithCommas(briRounds),
                      true
                    )
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
                      message.client.user.displayAvatarURL()
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

                  const EmbedSum = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Sumo**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", numberWithCommas(sumRounds))
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
                      message.client.user.displayAvatarURL()
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

                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Duels - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FDuels.png?v=1579257359447"
                    )
                    .addField("Rounds Played", numberWithCommas(rounds))
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
                      message.client.user.displayAvatarURL()
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
                  var msg = await message.channel.send(allEmbeds[0]);

                  await msg.react("⏮");
                  await msg.react("◀");
                  await msg.react("▶");
                  await msg.react("⏭");
                  await msg.react("⏹");
                  var collector = await msg.createReactionCollector(filter, {
                    idle: 60000,
                    errors: ["time"]
                  });

                  collector.on("collect", function(reaction, user) {
                    reaction.users.remove(user.id);
                    switch (reaction.emoji.name) {
                      case "⏮":
                        s = 0;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "◀":
                        s -= 1;
                        if (s < 0) {
                          s = allEmbeds.length - 1;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "▶":
                        s += 1;
                        if (s > allEmbeds.length - 1) {
                          s = 0;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏭":
                        s = allEmbeds.length - 1;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏹":
                        collector.emit("end");
                        break;
                    }
                  });
                  collector.on("end", function() {
                    msg.reactions.removeAll().catch(console.error);
                  });
                } else if (args[0] === "skywars" || args[0] === "sw") {
                  const sw = body.player.stats.SkyWars;

                  //sw level calculator

                  const EASY_LEVEL_EXP = [
                    0, // Level 1
                    20, //20
                    50, //70
                    80, //150
                    100, //250
                    250, //500
                    500, //1000
                    1000, //2000
                    1500, //3500
                    2500, //6000
                    4000, //10000
                    5000 //15000
                  ];
                  const EXP_PER_LEVEL = 10000;

                  function getLevelForExp(exp) {
                    var easyLevelsCount = EASY_LEVEL_EXP.length;

                    var easyLevelExp = 0;
                    for (var i = 1; i <= easyLevelsCount; i++) {
                      var expPerLevel = getExpForLevel(i);
                      easyLevelExp += expPerLevel;
                      if (exp < easyLevelExp) {
                        return i - 1; //57965
                      }
                    }
                    var extraLevels = (exp - easyLevelExp) / EXP_PER_LEVEL;
                    return easyLevelsCount + extraLevels;
                  }

                  function getExpForLevel(level) {
                    if (level <= EASY_LEVEL_EXP.length) {
                      return EASY_LEVEL_EXP[level - 1];
                    }

                    return EXP_PER_LEVEL;
                  }
                  if (!sw.skywars_experience) {
                    var level = 0;
                  } else {
                    var level = Math.floor(
                      getLevelForExp(sw.skywars_experience)
                    );
                  }

                  if (!sw.coins) {
                    var coins = 0;
                  } else {
                    var coins = numberWithCommas(sw.coins);
                  }

                  if (!sw.winstreak) {
                    var winstreak = 0;
                  } else {
                    var winstreak = sw.winstreak;
                  }

                  if (!sw.kills) {
                    var kills = 0;
                  } else {
                    var kills = sw.kills;
                  }

                  if (!sw.deaths) {
                    var deaths = 0;
                  } else {
                    var deaths = sw.deaths;
                  }

                  if (!sw.wins) {
                    var wins = 0;
                  } else {
                    var wins = sw.wins;
                  }

                  if (!sw.losses) {
                    var losses = 0;
                  } else {
                    var losses = sw.losses;
                  }

                  if (!sw.souls) {
                    var souls = 0;
                  } else {
                    var souls = sw.souls;
                  }

                  var wlr = Math.round((wins / losses) * 100) / 100;
                  var kdr = Math.round((kills / deaths) * 100) / 100;

                  if (isNaN(wlr)) {
                    wlr = "0.00";
                  }
                  if (isNaN(kdr)) {
                    kdr = "0.00";
                  }

                  const overallEmbed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("SkyWars - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSkywars.png?v=1579257360320"
                    )
                    .addField("Coins", numberWithCommas(coins), true)
                    .addField("Level", level, true)
                    .addField("Winstreak", winstreak, true)
                    .addField("Kills", kills, true)
                    .addField("Deaths", deaths, true)
                    .addField("KDR", kdr, true)
                    .addField("Wins", wins, true)
                    .addField("Losses", losses, true)
                    .addField("WLR", wlr, true)
                    .addField("Souls", souls, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  //solo

                  if (!sw.kills_solo_normal) {
                    var soloNormalKills = 0;
                  } else {
                    var soloNormalKills = sw.kills_solo_normal;
                  }

                  if (!sw.deaths_solo_normal) {
                    var soloNormalDeaths = 0;
                  } else {
                    var soloNormalDeaths = sw.deaths_solo_normal;
                  }

                  if (!sw.wins_solo_normal) {
                    var soloNormalWins = 0;
                  } else {
                    var soloNormalWins = sw.wins_solo_normal;
                  }

                  if (!sw.losses_solo_normal) {
                    var soloNormalLosses = 0;
                  } else {
                    var soloNormalLosses = sw.losses_solo_normal;
                  }

                  var soloNormalWlr =
                    Math.round((soloNormalWins / soloNormalLosses) * 100) / 100;
                  var soloNormalKdr =
                    Math.round((soloNormalKills / soloNormalDeaths) * 100) /
                    100;

                  if (!sw.kills_solo_insane) {
                    var soloinsaneKills = 0;
                  } else {
                    var soloinsaneKills = sw.kills_solo_insane;
                  }

                  if (!sw.deaths_solo_insane) {
                    var soloinsaneDeaths = 0;
                  } else {
                    var soloinsaneDeaths = sw.deaths_solo_insane;
                  }

                  if (!sw.wins_solo_insane) {
                    var soloinsaneWins = 0;
                  } else {
                    var soloinsaneWins = sw.wins_solo_insane;
                  }

                  if (!sw.losses_solo_insane) {
                    var soloinsaneLosses = 0;
                  } else {
                    var soloinsaneLosses = sw.losses_solo_insane;
                  }

                  var soloinsaneWlr =
                    Math.round((soloinsaneWins / soloinsaneLosses) * 100) / 100;
                  var soloinsaneKdr =
                    Math.round((soloinsaneKills / soloinsaneDeaths) * 100) /
                    100;

                  if (isNaN(soloNormalWlr)) {
                    wlr = "0.00";
                  }
                  if (isNaN(soloNormalKdr)) {
                    kdr = "0.00";
                  }
                  if (isNaN(soloinsaneWlr)) {
                    wlr = "0.00";
                  }
                  if (isNaN(soloinsaneKdr)) {
                    kdr = "0.00";
                  }

                  const soloEmbed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("SkyWars - **Solo**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSkywars.png?v=1579257360320"
                    )
                    .addField("Normal Kills", soloNormalKills, true)
                    .addField("Normal Deaths", soloNormalDeaths, true)
                    .addField("Normal KDR", soloNormalKdr, true)
                    .addField("Normal Wins", soloNormalWins, true)
                    .addField("Normal Losses", soloNormalLosses, true)
                    .addField("Normal WLR", soloNormalWlr, true)
                    .addField("Insane Kills", soloinsaneKills, true)
                    .addField("Insane Deaths", soloinsaneDeaths, true)
                    .addField("Insane KDR", soloinsaneKdr, true)
                    .addField("Insane Wins", soloinsaneWins, true)
                    .addField("Insane Losses", soloinsaneLosses, true)
                    .addField("Insane WLR", soloinsaneWlr, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  //team

                  if (!sw.kills_team_normal) {
                    var teamNormalKills = 0;
                  } else {
                    var teamNormalKills = sw.kills_team_normal;
                  }

                  if (!sw.deaths_team_normal) {
                    var teamNormalDeaths = 0;
                  } else {
                    var teamNormalDeaths = sw.deaths_team_normal;
                  }

                  if (!sw.wins_team_normal) {
                    var teamNormalWins = 0;
                  } else {
                    var teamNormalWins = sw.wins_team_normal;
                  }

                  if (!sw.losses_team_normal) {
                    var teamNormalLosses = 0;
                  } else {
                    var teamNormalLosses = sw.losses_team_normal;
                  }

                  var teamNormalWlr =
                    Math.round((teamNormalWins / teamNormalLosses) * 100) / 100;
                  var teamNormalKdr =
                    Math.round((teamNormalKills / teamNormalDeaths) * 100) /
                    100;

                  if (!sw.kills_team_insane) {
                    var teaminsaneKills = 0;
                  } else {
                    var teaminsaneKills = sw.kills_team_insane;
                  }

                  if (!sw.deaths_team_insane) {
                    var teaminsaneDeaths = 0;
                  } else {
                    var teaminsaneDeaths = sw.deaths_team_insane;
                  }

                  if (!sw.wins_team_insane) {
                    var teaminsaneWins = 0;
                  } else {
                    var teaminsaneWins = sw.wins_team_insane;
                  }

                  if (!sw.losses_team_insane) {
                    var teaminsaneLosses = 0;
                  } else {
                    var teaminsaneLosses = sw.losses_team_insane;
                  }

                  var teaminsaneWlr =
                    Math.round((teaminsaneWins / teaminsaneLosses) * 100) / 100;
                  var teaminsaneKdr =
                    Math.round((teaminsaneKills / teaminsaneDeaths) * 100) /
                    100;

                  if (isNaN(teamNormalWlr)) {
                    wlr = "0.00";
                  }
                  if (isNaN(teamNormalKdr)) {
                    kdr = "0.00";
                  }
                  if (isNaN(teaminsaneWlr)) {
                    wlr = "0.00";
                  }
                  if (isNaN(teaminsaneKdr)) {
                    kdr = "0.00";
                  }

                  const teamEmbed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("SkyWars - **Team**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSkywars.png?v=1579257360320"
                    )
                    .addField("Normal Kills", teamNormalKills, true)
                    .addField("Normal Deaths", teamNormalDeaths, true)
                    .addField("Normal KDR", teamNormalKdr, true)
                    .addField("Normal Wins", teamNormalWins, true)
                    .addField("Normal Losses", teamNormalLosses, true)
                    .addField("Normal WLR", teamNormalWlr, true)
                    .addField("Insane Kills", teaminsaneKills, true)
                    .addField("Insane Deaths", teaminsaneDeaths, true)
                    .addField("Insane KDR", teaminsaneKdr, true)
                    .addField("Insane Wins", teaminsaneWins, true)
                    .addField("Insane Losses", teaminsaneLosses, true)
                    .addField("Insane WLR", teaminsaneWlr, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  //ranked

                  if (!sw.kills_ranked_normal) {
                    var rankedNormalKills = 0;
                  } else {
                    var rankedNormalKills = sw.kills_ranked_normal;
                  }

                  if (!sw.deaths_ranked_normal) {
                    var rankedNormalDeaths = 0;
                  } else {
                    var rankedNormalDeaths = sw.deaths_ranked_normal;
                  }

                  if (!sw.wins_ranked_normal) {
                    var rankedNormalWins = 0;
                  } else {
                    var rankedNormalWins = sw.wins_ranked_normal;
                  }

                  if (!sw.losses_ranked_normal) {
                    var rankedNormalLosses = 0;
                  } else {
                    var rankedNormalLosses = sw.losses_ranked_normal;
                  }

                  var rankedNormalWlr =
                    Math.round((rankedNormalWins / rankedNormalLosses) * 100) /
                    100;
                  var rankedNormalKdr =
                    Math.round((rankedNormalKills / rankedNormalDeaths) * 100) /
                    100;

                  if (isNaN(rankedNormalWlr)) {
                    wlr = "0.00";
                  }
                  if (isNaN(rankedNormalKdr)) {
                    kdr = "0.00";
                  }

                  const rankedEmbed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("SkyWars - **Ranked**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSkywars.png?v=1579257360320"
                    )
                    .addField("Ranked Kills", rankedNormalKills, true)
                    .addField("Ranked Deaths", rankedNormalDeaths, true)
                    .addField("Ranked KDR", rankedNormalKdr, true)
                    .addField("Ranked Wins", rankedNormalWins, true)
                    .addField("Ranked Losses", rankedNormalLosses, true)
                    .addField("Ranked WLR", rankedNormalWlr, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  var allEmbeds = [
                    overallEmbed,
                    soloEmbed,
                    teamEmbed,
                    rankedEmbed
                  ];

                  var s = 0;
                  var msg = await message.channel.send(allEmbeds[0]);

                  await msg.react("⏮");
                  await msg.react("◀");
                  await msg.react("▶");
                  await msg.react("⏭");
                  await msg.react("⏹");
                  var collector = await msg.createReactionCollector(filter, {
                    idle: 60000,
                    errors: ["time"]
                  });

                  collector.on("collect", function(reaction, user) {
                    reaction.users.remove(user.id);
                    switch (reaction.emoji.name) {
                      case "⏮":
                        s = 0;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "◀":
                        s -= 1;
                        if (s < 0) {
                          s = allEmbeds.length - 1;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "▶":
                        s += 1;
                        if (s > allEmbeds.length - 1) {
                          s = 0;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏭":
                        s = allEmbeds.length - 1;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏹":
                        collector.emit("end");
                        break;
                    }
                  });
                  collector.on("end", function() {
                    msg.reactions.removeAll().catch(console.error);
                  });
                } else if (args[0] === "blitz" || args[0] === "sg") {
                  var hg = body.player.stats.HungerGames;

                  var deaths = hg.deaths ? hg.deaths : 0;
                  var damageTaken = hg.damage_taken ? hg.damage_taken : 0;
                  var played = hg.games_played ? hg.games_played : 0;
                  var time = hg.time_played ? hg.time_played : 0;
                  var wins = hg.wins ? hg.wins : 0;
                  var coins = hg.coins ? hg.coins : 0;
                  var kills = hg.kills ? hg.kills : 0;
                  var damage = hg.damage ? hg.damage : 0;
                  var arrows = hg.arrows_hit ? hg.arrows_hit : 0;
                  var fired = hg.arrows_fired ? hg.arrows_fired : 0;
                  var losses = played - wins;
                  var wlr = isNaN(Math.round((wins / losses) * 100) / 100)
                    ? "0.00"
                    : Math.round((wins / losses) * 100) / 100;
                  var kdr = isNaN(Math.round((kills / deaths) * 100) / 100)
                    ? "0.00"
                    : Math.round((kills / deaths) * 100) / 100;

                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Blitz Survival - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSG.png?v=1579257360066"
                    )
                    .addField("Coins", numberWithCommas(coins))
                    .addField("Games Played", played, true)
                    .addField("Damage Dealt", damage, true)
                    .addField("Damage Taken", damageTaken, true)
                    .addField("Time Played", time, true)
                    .addField("Arrows Fired", fired, true)
                    .addField("Arrows Hit", arrows, true)
                    .addField("Kills", kills, true)
                    .addField("Deaths", deaths, true)
                    .addField("KDR", kdr, true)
                    .addField("Wins", wins, true)
                    .addField("Losses", losses, true)
                    .addField("WLR", wlr, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  message.channel.send(Embed);
                } else if (args[0] === "arcade" || args[0] === "ar") {
                  var ar = body.player.stats.Arcade;

                  var coins = ar.coins ? ar.coins : 0;

                  var blockingKills = ar.kills_dayone ? ar.kills_dayone : 0;
                  var blockingWins = ar.wins_dayone ? ar.wins_dayone : 0;
                  var blockingHeadshots = ar.headshots_dayone
                    ? ar.headshots_dayone
                    : 0;

                  var bountyKills = ar.kills_oneinthequiver
                    ? ar.kills_oneinthequiver
                    : 0;
                  var bountyDeaths = ar.deaths_oneinthequiver
                    ? ar.deaths_oneinthequiver
                    : 0;
                  var bountyWins = ar.wins_oneinthequiver
                    ? ar.wins_oneinthequiver
                    : 0;

                  var dragonKills = ar.kills_dragonwars2
                    ? ar.kills_dragonwars2
                    : 0;
                  var dragonWins = ar.wins_dragonwars2
                    ? ar.wins_dragonwars2
                    : 0;

                  var enderWins = ar.wins_ender ? ar.wins_ender : 0;

                  var farmWins = ar.wins_farm_hunt ? ar.wins_farm_hunt : 0;

                  var soccerPowerkicks = ar.powerkicks_soccer
                    ? ar.powerkicks_soccer
                    : 0;
                  var soccerGoals = ar.goals_soccer ? ar.goals_soccer : 0;
                  var soccerWins = ar.wins_soccer ? ar.wins_soccer : 0;
                  var soccerKicks = ar.kicks_soccer ? ar.kicks_soccer : 0;

                  var hiderWins = ar.hider_wins_hide_and_seek
                    ? ar.hider_wins_hide_and_seek
                    : 0;
                  var seekerWins = ar.seeker_wins_hide_and_seek
                    ? ar.seeker_wins_hide_and_seek
                    : 0;

                  var holeRounds = ar.rounds_hole_in_the_wall
                    ? ar.rounds_hole_in_the_wall
                    : 0;

                  var saysRounds = ar.rounds_simon_says
                    ? ar.rounds_simon_says
                    : 0;
                  var saysWins = ar.wins_simon_says ? ar.wins_simon_says : 0;

                  var miniKills = ar.kills_mini_walls ? ar.kills_mini_walls : 0;
                  var miniDeaths = ar.deaths_mini_walls
                    ? ar.deaths_mini_walls
                    : 0;
                  var miniWithers = ar.wither_kills_mini_walls
                    ? ar.wither_kills_mini_walls
                    : 0;
                  var miniFinal = ar.final_kills_mini_walls
                    ? ar.final_kills_mini_walls
                    : 0;
                  var miniArrows = ar.arrows_hit_mini_walls
                    ? ar.arrows_hit_mini_walls
                    : 0;
                  var miniWins = ar.wins_mini_walls ? ar.wins_mini_walls : 0;
                  var miniShots = ar.arrows_shot_mini_walls
                    ? ar.arrows_shot_mini_walls
                    : 0;
                  var miniWitherDmg = ar.wither_damage_mini_walls
                    ? ar.wither_damage_mini_walls
                    : 0;

                  var party1Wins = ar.wins_party ? ar.wins_party : 0;
                  var party2Wins = ar.wins_party_2 ? ar.wins_party_2 : 0;
                  var party3Wins = ar.wins_party_3 ? ar.wins_party_3 : 0;

                  var throwDeaths = ar.deaths_throw_out
                    ? ar.deaths_throw_out
                    : 0;
                  var throwKills = ar.kills_throw_out ? ar.kills_throw_out : 0;
                  var throwWins = ar.wins_throw_out ? ar.wins_throw_out : 0;

                  var zombFast20 = ar.fastest_time_20_zombies
                    ? ar.fastest_time_20_zombies
                    : 0;
                  var zombBest = ar.best_round_zombies
                    ? ar.best_round_zombies
                    : 0;
                  var zombFast10 = ar.fastest_time_10_zombies
                    ? ar.fastest_time_10_zombies
                    : 0;
                  var zombBullets = ar.bullets_shot_zombies
                    ? ar.bullets_shot_zombies
                    : 0;
                  var zombBulletHits = ar.bullets_hit_zombies
                    ? ar.bullets_hit_zombies
                    : 0;
                  var zombHeadshot = ar.headshots_zombies
                    ? ar.headshots_zombies
                    : 0;
                  var zombRevived = ar.players_revived_zombies
                    ? ar.players_revived_zombies
                    : 0;
                  var zombDeaths = ar.deaths_zombies ? ar.deaths_zombies : 0;
                  var zombWindows = ar.windows_repaired_zombies
                    ? ar.windows_repaired_zombies
                    : 0;
                  var zombRounds = ar.total_rounds_survived_zombies
                    ? ar.total_rounds_survived_zombies
                    : 0;
                  var zombKills = ar.zombie_kills_zombies
                    ? ar.zombie_kills_zombies
                    : 0;

                  var creeperMax = ar.max_wave ? ar.max_wave : 0;

                  var gwDeaths = ar.sw_deaths ? ar.sw_deaths : 0;
                  var gwWins = ar.sw_game_wins ? ar.sw_game_wins : 0;
                  var gwKills = ar.sw_kills ? ar.sw_kills : 0;
                  var gwRebelKills = ar.sw_rebel_kills ? ar.sw_rebel_kills : 0;
                  var gwShots = ar.sw_shots_fired ? ar.sw_shots_fired : 0;

                  const Embed1 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription(
                      "Arcade - **Overall/Blocking Dead/Bounty Hunters/Dragon Wars/Ender Spleef**"
                    )
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FArcade.png?v=1579257357849"
                    )
                    .addField("Coins", numberWithCommas(coins))
                    .addField("Blocking Dead Kills", blockingKills, true)
                    .addField("Blocking Dead Wins", blockingWins, true)
                    .addField(
                      "Blocking Dead Headshots",
                      blockingHeadshots,
                      true
                    )
                    .addField("Bounty Hunters Kills", bountyKills, true)
                    .addField("Bounty Hunters Deaths", bountyDeaths, true)
                    .addField("Bounty Hunters Wins", bountyWins, true)
                    .addField("Dragon Wars Kills", dragonKills, true)
                    .addField("Dragon Wars Wins", dragonWins, true)
                    .addField("Ender Spleef Wins", enderWins, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  const Embed2 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription(
                      "Arcade - **Football/Hide and Seek/Farm Hunt/Hypixel Says**"
                    )
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FArcade.png?v=1579257357849"
                    )
                    .addField("Football Powerkicks", soccerPowerkicks, true)
                    .addField("Football Kicks", soccerKicks, true)
                    .addField("Football Goals", soccerGoals, true)
                    .addField("Football Wins", soccerWins, true)
                    .addField("Hide and Seek Hider Wins", hiderWins, true)
                    .addField("Hide and Seek Seeker Wins", seekerWins, true)
                    .addField("Farm Hunt Wins", farmWins, true)
                    .addField("Hypixel Says Rounds Played", saysRounds, true)
                    .addField("Hypixel Says Wins", saysWins, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  const Embed3 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Arcade - **Hole in the Wall/Mini Walls**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FArcade.png?v=1579257357849"
                    )
                    .addField(
                      "Hole in the Wall Rounds Played",
                      holeRounds,
                      true
                    )
                    .addField("Mini Walls Kills", miniKills, true)
                    .addField("Mini Walls Deaths", miniDeaths, true)
                    .addField("Mini Walls Wither Kills", miniWithers, true)
                    .addField("Mini Walls Wither Damage", miniWitherDmg, true)
                    .addField("Mini Walls Wins", miniWins, true)
                    .addField("Mini Walls Arrow Shots", miniShots, true)
                    .addField("Mini Walls Arrow Hits", miniArrows, true)
                    .addField("Mini Walls Final Kills", miniFinal, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  const Embed4 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Arcade - **Party Games/Throw Out**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FArcade.png?v=1579257357849"
                    )
                    .addField("Party Games 1 Wins", party1Wins, true)
                    .addField("Party Games 2 Wins", party2Wins, true)
                    .addField("Party Games 3 Wins", party3Wins, true)
                    .addField("Throw Out Kills", throwKills, true)
                    .addField("Throw Out Deaths", throwDeaths, true)
                    .addField("Throw Out Wins", throwWins, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  const Embed5 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Arcade - **Zombies**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FArcade.png?v=1579257357849"
                    )
                    .addField("Zombies Best Rounds", zombBest, true)
                    .addField("Zombies Fastest 10 Rounds", zombFast10, true)
                    .addField("Zombies Fastest 20 Rounds", zombFast20, true)
                    .addField("Zombies Bullet Shots", zombBullets, true)
                    .addField("Zombies Bullet Hits", zombBulletHits, true)
                    .addField("Zombies Headshots", zombHeadshot, true)
                    .addField("Zombies Kills", zombKills, true)
                    .addField("Zombies Deaths", zombDeaths, true)
                    .addField("Zombies Players Revived", zombRevived, true)
                    .addField("Zombies Windows Repaired", zombWindows, true)
                    .addField("Zombies Rounds Survived", zombRounds, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  const Embed6 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Arcade - **Galaxy Wars/Creeper Attack**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FArcade.png?v=1579257357849"
                    )
                    .addField("Galaxy Wars Kills", gwKills, true)
                    .addField("Galaxy Wars Deaths", gwDeaths, true)
                    .addField("Galaxy Wars Wins", gwWins, true)
                    .addField("Galaxy Wars Fired Shots", gwShots, true)
                    .addField("Galaxy Wars Rebel Kills", gwRebelKills, true)
                    .addField("Creeper Attack Max Wave", creeperMax, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  var allEmbeds = [
                    Embed1,
                    Embed2,
                    Embed3,
                    Embed4,
                    Embed5,
                    Embed6
                  ];
                  var s = 0;
                  var msg = await message.channel.send(allEmbeds[0]);

                  await msg.react("⏮");
                  await msg.react("◀");
                  await msg.react("▶");
                  await msg.react("⏭");
                  await msg.react("⏹");
                  var collector = await msg.createReactionCollector(filter, {
                    idle: 60000,
                    errors: ["time"]
                  });

                  collector.on("collect", function(reaction, user) {
                    reaction.users.remove(user.id);
                    switch (reaction.emoji.name) {
                      case "⏮":
                        s = 0;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "◀":
                        s -= 1;
                        if (s < 0) {
                          s = allEmbeds.length - 1;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "▶":
                        s += 1;
                        if (s > allEmbeds.length - 1) {
                          s = 0;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏭":
                        s = allEmbeds.length - 1;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏹":
                        collector.emit("end");
                        break;
                    }
                  });
                  collector.on("end", function() {
                    msg.reactions.removeAll().catch(console.error);
                  });
                } else if (args[0] === "murdermystery" || args[0] === "mm") {
                  var mm = body.player.stats.MurderMystery;

                  var wins = mm.wins ? mm.wins : 0;
                  var coins = mm.coins ? mm.coins : 0;
                  var played = mm.games ? mm.games : 0;
                  var quickDetect = mm.quickest_detective_win_time_seconds
                    ? mm.quickest_detective_win_time_seconds
                    : 0;
                  var hero = mm.was_hero ? mm.was_hero : 0;
                  var bow = mm.bow_kills ? mm.bow_kills : 0;
                  var detectWins = mm.detective_wins ? mm.detective_wins : 0;
                  var kills = mm.kills ? mm.kills : 0;
                  var pickedCoin = mm.coins_pickedup ? mm.coins_pickedup : 0;
                  var murderKills = mm.kills_as_murderer
                    ? mm.kills_as_murderer
                    : 0;
                  var knifeKills = mm.knife_kills ? mm.knife_kills : 0;
                  var deaths = mm.deaths ? mm.deaths : 0;
                  var trapKills = mm.trap_kills ? mm.trap_kills : 0;
                  var thrownKnifeKills = mm.thrown_knife_kills
                    ? mm.thrown_knife_kills
                    : 0;
                  var survived = mm.total_time_survived_seconds
                    ? mm.total_time_survived_seconds
                    : 0;
                  var longestSurvived = mm.longest_time_as_survivor_seconds
                    ? mm.longest_time_as_survivor_seconds
                    : 0;
                  var quickDown = mm.quickest_showdown_win_time_seconds
                    ? mm.quickest_showdown_win_time_seconds
                    : 0;
                  var quickMurderWin = mm.quickest_murderer_win_time_seconds
                    ? mm.quickest_murderer_win_time_seconds
                    : 0;
                  var murderWins = mm.murderer_wins ? mm.murderer_wins : 0;
                  var survivorWins = mm.survivor_wins ? mm.survivor_wins : 0;
                  var survivorKills = mm.kills_as_survivor
                    ? mm.kills_as_survivor
                    : 0;

                  //classic
                  var classicPlayed = mm.games_MURDER_CLASSIC
                    ? mm.games_MURDER_CLASSIC
                    : 0;
                  var classicWins = mm.wins_MURDER_CLASSIC
                    ? mm.wins_MURDER_CLASSIC
                    : 0;
                  var classicQuickDetect = mm.quickest_detective_win_time_seconds_MURDER_CLASSIC
                    ? mm.quickest_detective_win_time_seconds_MURDER_CLASSIC
                    : 0;
                  var classicBow = mm.bow_kills_MURDER_CLASSIC
                    ? mm.bow_kills_MURDER_CLASSIC
                    : 0;
                  var classicHero = mm.was_hero_MURDER_CLASSIC
                    ? mm.was_hero_MURDER_CLASSIC
                    : 0;
                  var classicKills = mm.kills_MURDER_CLASSIC
                    ? mm.kills_MURDER_CLASSIC
                    : 0;
                  var classicPickedCoin = mm.coins_pickedup_MURDER_CLASSIC
                    ? mm.coins_pickedup_MURDER_CLASSIC
                    : 0;
                  var classicDetectWins = mm.detective_wins_MURDER_CLASSIC
                    ? mm.detective_wins_MURDER_CLASSIC
                    : 0;
                  var classicKnifeKills = mm.knife_kills_MURDER_CLASSIC
                    ? mm.knife_kills_MURDER_CLASSIC
                    : 0;
                  var classicMurderKills = mm.kills_as_murderer_MURDER_CLASSIC
                    ? mm.kills_as_murderer_MURDER_CLASSIC
                    : 0;
                  var classicDeaths = mm.deaths_MURDER_CLASSIC
                    ? mm.deaths_MURDER_CLASSIC
                    : 0;
                  var classicTrapKills = mm.trap_kills_MURDER_CLASSIC
                    ? mm.trap_kills_MURDER_CLASSIC
                    : 0;
                  var classicThrownKnifeKills = mm.thrown_knife_kills_MURDER_CLASSIC
                    ? mm.thrown_knife_kills_MURDER_CLASSIC
                    : 0;
                  var classicQuickMurderWin = mm.quickest_murderer_win_time_seconds_MURDER_CLASSIC
                    ? mm.quickest_murderer_win_time_seconds_MURDER_CLASSIC
                    : 0;
                  var classicMurderWins = mm.murderer_wins_MURDER_CLASSIC
                    ? mm.murderer_wins_MURDER_CLASSIC
                    : 0;

                  //infection
                  var infectLongestSurvived = mm.longest_time_as_survivor_seconds_MURDER_INFECTION
                    ? mm.longest_time_as_survivor_seconds_MURDER_INFECTION
                    : 0;
                  var infectSurvived = mm.total_time_survived_seconds_MURDER_INFECTION
                    ? mm.total_time_survived_seconds_MURDER_INFECTION
                    : 0;
                  var infectPlayed = mm.games_MURDER_INFECTION
                    ? mm.games_MURDER_INFECTION
                    : 0;
                  var infectSurvivorWins = mm.survivor_wins_MURDER_INFECTION
                    ? mm.survivor_wins_MURDER_INFECTION
                    : 0;
                  var infectSurvivorKills = mm.kills_as_survivor_MURDER_INFECTION
                    ? mm.kills_as_survivor_MURDER_INFECTION
                    : 0;
                  var infectLast = mm.last_one_alive_MURDER_INFECTION
                    ? mm.last_one_alive_MURDER_INFECTION
                    : 0;

                  //showdown
                  var showQuickDown = mm.quickest_showdown_win_time_seconds_MURDER_SHOWDOWN
                    ? mm.quickest_showdown_win_time_seconds_MURDER_SHOWDOWN
                    : 0;
                  var showKills = mm.kills_MURDER_SHOWDOWN
                    ? mm.kills_MURDER_SHOWDOWN
                    : 0;
                  var showPlayed = mm.games_MURDER_SHOWDOWN
                    ? mm.games_MURDER_SHOWDOWN
                    : 0;
                  var showWins = mm.wins_MURDER_SHOWDOWN
                    ? mm.wins_MURDER_SHOWDOWN
                    : 0;
                  var showDeaths = mm.deaths_MURDER_SHOWDOWN
                    ? mm.deaths_MURDER_SHOWDOWN
                    : 0;
                  var showPickedCoin = mm.coins_pickedup_MURDER_SHOWDOWN
                    ? mm.coins_pickedup_MURDER_SHOWDOWN
                    : 0;
                  var showBow = mm.bow_kills_MURDER_SHOWDOWN
                    ? mm.bow_kills_MURDER_SHOWDOWN
                    : 0;

                  //assassin
                  var assPlayed = mm.games_MURDER_ASSASSINS
                    ? mm.games_MURDER_ASSASSINS
                    : 0;
                  var assDeaths = mm.deaths_MURDER_ASSASSINS
                    ? mm.deaths_MURDER_ASSASSINS
                    : 0;
                  var assPickedCoin = mm.coins_pickedup_MURDER_ASSASSINS
                    ? mm.coins_pickedup_MURDER_ASSASSINS
                    : 0;
                  var assWins = mm.wins_MURDER_ASSASSINS
                    ? mm.wins_MURDER_ASSASSINS
                    : 0;
                  var assKnifeKills = mm.knife_kills_MURDER_ASSASSINS
                    ? mm.knife_kills_MURDER_ASSASSINS
                    : 0;
                  var assKills = mm.kills_MURDER_ASSASSINS
                    ? mm.kills_MURDER_ASSASSINS
                    : 0;
                  var assThrownKnifeKills = mm.thrown_knife_kills_MURDER_ASSASSINS
                    ? mm.thrown_knife_kills_MURDER_ASSASSINS
                    : 0;

                  //double
                  var doublePlayed = mm.games_MURDER_DOUBLE_UP
                    ? mm.games_MURDER_DOUBLE_UP
                    : 0;
                  var doublePickedCoin = mm.coins_pickedup_MURDER_DOUBLE_UP
                    ? mm.coins_pickedup_MURDER_DOUBLE_UP
                    : 0;
                  var doubleWins = mm.wins_MURDER_DOUBLE_UP
                    ? mm.wins_MURDER_DOUBLE_UP
                    : 0;
                  var doubleDeaths = mm.deaths_MURDER_DOUBLE_UP
                    ? mm.deaths_MURDER_DOUBLE_UP
                    : 0;
                  var doubleKnifeKills = mm.knife_kills_MURDER_DOUBLE_UP
                    ? mm.knife_kills_MURDER_DOUBLE_UP
                    : 0;
                  var doubleKills = mm.kills_MURDER_DOUBLE_UP
                    ? mm.kills_MURDER_DOUBLE_UP
                    : 0;
                  var doubleMurderKills = mm.kills_as_murderer_MURDER_DOUBLE_UP
                    ? mm.kills_as_murderer_MURDER_DOUBLE_UP
                    : 0;
                  var doubleHero = mm.was_hero_MURDER_DOUBLE_UP
                    ? mm.was_hero_MURDER_DOUBLE_UP
                    : 0;
                  var doubleBow = mm.bow_kills_MURDER_DOUBLE_UP
                    ? mm.bow_kills_MURDER_DOUBLE_UP
                    : 0;
                  var doubleDetectWins = mm.detective_wins_MURDER_DOUBLE_UP
                    ? mm.detective_wins_MURDER_DOUBLE_UP
                    : 0;
                  var doubleMurderWins = mm.murderer_wins_MURDER_DOUBLE_UP
                    ? mm.murderer_wins_MURDER_DOUBLE_UP
                    : 0;
                  var doubleTrapKills = mm.trap_kills_MURDER_DOUBLE_UP
                    ? mm.trap_kills_MURDER_DOUBLE_UP
                    : 0;
                  var doubleQuickMurderWin = mm.quickest_murderer_win_time_seconds_MURDER_DOUBLE_UP
                    ? mm.quickest_murderer_win_time_seconds_MURDER_DOUBLE_UP
                    : 0;
                  var doubleThrownKnifeKills = mm.thrown_knife_kills_MURDER_DOUBLE_UP
                    ? mm.thrown_knife_kills_MURDER_DOUBLE_UP
                    : 0;

                  const overall = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Murder Mystery - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FMurderMystery.png?v=1579257356991"
                    )
                    .addField("Coins", numberWithCommas(coins))
                    .addField("Games Played", played, true)
                    .addField("Coins Picked", pickedCoin, true)
                    .addField("Hero", hero, true)
                    .addField("Wins", wins, true)
                    .addField("Deaths", deaths, true)
                    .addField("Kills", kills, true)
                    .addField("Win as Survivor", survivorWins, true)
                    .addField("Win as Detective", detectWins, true)
                    .addField("Win as Murderer", murderWins, true)
                    .addField("Kill as Survivor", survivorKills, true)
                    .addField("Bow Kills", bow, true)
                    .addField("Trap Kills", trapKills, true)
                    .addField("Kill as Murderer", murderKills, true)
                    .addField("Knife Kills", knifeKills, true)
                    .addField("Thrown Knife Kills", thrownKnifeKills, true)
                    .addField("Quickest Showdown Win Time", quickDown, true)
                    .addField("Quickest Detective Win Time", quickDetect, true)
                    .addField(
                      "Quickest Murderer Win Time",
                      quickMurderWin,
                      true
                    )
                  .addField("KDR", isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  const classic = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Murder Mystery - **Classic**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FMurderMystery.png?v=1579257356991"
                    )
                    .addField("Games Played", classicPlayed, true)
                    .addField("Coins Picked", classicPickedCoin, true)
                    .addField("Hero", classicHero, true)
                    .addField("Wins", classicWins, true)
                    .addField("Deaths", classicDeaths, true)
                    .addField("Kills", classicKills, true)
                    .addField("Win as Detective", classicDetectWins, true)
                    .addField("Win as Murderer", classicMurderWins, true)
                  .addField("KDR", isNaN(Math.round((classicKills / classicDeaths) * 100) / 100) ? "0.00" : Math.round((classicKills / classicDeaths) * 100) / 100, true)
                    .addField("Bow Kills", classicBow, true)
                    .addField("Trap Kills", classicTrapKills, true)
                    .addField("\u200b", "\u200b", true)
                  
                    .addField("Kill as Murderer", classicMurderKills, true)
                    .addField("Knife Kills", classicKnifeKills, true)
                    .addField(
                      "Thrown Knife Kills",
                      classicThrownKnifeKills,
                      true
                    )
                    .addField(
                      "Quickest Murderer Win Time",
                      classicQuickMurderWin,
                      true
                    )
                    .addField(
                      "Quickest Detective Win Time",
                      classicQuickDetect,
                      true
                    )
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  const double = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Murder Mystery - **Double Up**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FMurderMystery.png?v=1579257356991"
                    )
                    .addField("Games Played", doublePlayed, true)
                    .addField("Coins Picked", doublePickedCoin, true)
                    .addField("Hero", doubleHero, true)
                    .addField("Wins", doubleWins, true)
                    .addField("Deaths", doubleDeaths, true)
                    .addField("Kills", doubleKills, true)
                    .addField("Win as Detective", doubleDetectWins, true)
                    .addField("Win as Murderer", doubleMurderWins, true)
                  .addField("KDR", isNaN(Math.round((doubleKills / doubleDeaths) * 100) / 100) ? "0.00" : Math.round((doubleKills / doubleDeaths) * 100) / 100, true)
                    .addField("Bow Kills", doubleBow, true)
                    .addField("Trap Kills", doubleTrapKills, true)
                    .addField(
                      "Quickest Murderer Win Time",
                      doubleQuickMurderWin,
                      true
                    )
                    .addField("Kill as Murderer", doubleMurderKills, true)
                    .addField("Knife Kills", doubleKnifeKills, true)
                    .addField(
                      "Thrown Knife Kills",
                      doubleThrownKnifeKills,
                      true
                    )
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  const assassin = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Murder Mystery - **Assassins**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FMurderMystery.png?v=1579257356991"
                    )
                    .addField("Games Played", assPlayed, true)
                    .addField("Coins Picked", assPickedCoin, true)
                    .addField("\u200b", "\u200b", true)
                    .addField("Wins", assWins, true)
                    .addField("Deaths", assDeaths, true)
                    
                  .addField("KDR", isNaN(Math.round((assKills / assDeaths) * 100) / 100) ? "0.00" : Math.round((assKills / assDeaths) * 100) / 100, true)
                    .addField("Kills", assKills, true)
                    .addField("Knife Kills", assKnifeKills, true)
                    .addField("Thrown Knife Kills", assThrownKnifeKills, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  const infection = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Murder Mystery - **Infection**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FMurderMystery.png?v=1579257356991"
                    )
                    .addField("Games Played", infectPlayed, true)
                    .addField("Win as Survivor", infectSurvivorWins, true)
                    .addField("Kill as Survivor", infectSurvivorKills, true)
                    .addField("Total Survived Time", infectSurvived, true)
                    .addField(
                      "Longest Survived Time",
                      infectLongestSurvived,
                      true
                    )
                    .addField("Last One Alive", infectLast, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  const showdown = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Murder Mystery - **Showdown**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FMurderMystery.png?v=1579257356991"
                    )
                    .addField("Games Played", showPlayed, true)
                    .addField("Coins Picked", showPickedCoin, true)
                    .addField("Bow Kills", showBow, true)
                    .addField("Wins", showWins, true)
                    .addField("Deaths", showDeaths, true)
                    .addField("Kills", showKills, true)
                  .addField("KDR", isNaN(Math.round((showKills / showDeaths) * 100) / 100) ? "0.00" : Math.round((showKills / showDeaths) * 100) / 100, true)
                    .addField("Quickest Showdown Win Time", showQuickDown, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  var allEmbeds = [
                    overall,
                    classic,
                    double,
                    assassin,
                    infection,
                    showdown
                  ];

                  var s = 0;
                  var msg = await message.channel.send(allEmbeds[0]);

                  await msg.react("⏮");
                  await msg.react("◀");
                  await msg.react("▶");
                  await msg.react("⏭");
                  await msg.react("⏹");
                  var collector = await msg.createReactionCollector(filter, {
                    idle: 60000,
                    errors: ["time"]
                  });

                  collector.on("collect", function(reaction, user) {
                    reaction.users.remove(user.id);
                    switch (reaction.emoji.name) {
                      case "⏮":
                        s = 0;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "◀":
                        s -= 1;
                        if (s < 0) {
                          s = allEmbeds.length - 1;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "▶":
                        s += 1;
                        if (s > allEmbeds.length - 1) {
                          s = 0;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏭":
                        s = allEmbeds.length - 1;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏹":
                        collector.emit("end");
                        break;
                    }
                  });
                  collector.on("end", function() {
                    msg.reactions.removeAll().catch(console.error);
                  });
                } else if (args[0] === "buildbattle" || args[0] === "bb") {
                  var bb = body.player.stats.BuildBattle;

                  var normalSoloWins = bb.wins_solo_normal
                    ? bb.wins_solo_normal
                    : 0;
                  var normalTeamWins = bb.wins_teams_normal
                    ? bb.wins_teams_normal
                    : 0;
                  var wins = bb.wins ? bb.wins : 0;
                  var played = bb.games_played ? bb.games_played : 0;
                  var score = bb.score ? bb.score : 0;
                  var coins = bb.coins ? bb.coins : 0;
                  var correct = bb.correct_guesses ? bb.correct_guesses : 0;
                  var proSoloWins = bb.wins_solo_pro ? bb.wins_solo_pro : 0;
                  var soloMostPoints = bb.solo_most_points
                    ? bb.solo_most_points
                    : 0;
                  var guessWins = bb.wins_guess_the_build
                    ? bb.wins_guess_the_build
                    : 0;

                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Build Battle - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FBuildBattle.png?v=1579257358660"
                    )
                    .addField("Coins", numberWithCommas(coins))
                    .addField("Games Played", played, true)
                    .addField("Score", score, true)
                    .addField("Wins", wins, true)
                    .addField("Normal Solo Wins", normalSoloWins, true)
                    .addField("Normal Teams Wins", normalTeamWins, true)
                    .addField("Pro Solo Wins", proSoloWins, true)
                    .addField("Solo Most Points", soloMostPoints, true)
                    .addField("Guess the Build Wins", guessWins, true)
                    .addField("Correct Guesses", correct, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  message.channel.send(Embed);
                } else if (args[0] === "copsandcrims" || args[0] === "mcgo") {
                  var cc = body.player.stats.MCGO;

                  var grenKills = cc.grenade_kills ? cc.grenade_kills : 0;
                  var deathmatchKills = cc.kills_deathmatch
                    ? cc.kills_deathmatch
                    : 0;
                  var gameWins = cc.game_wins ? cc.game_wins : 0;
                  var headshotKills = cc.headshot_kills ? cc.headshot_kills : 0;
                  var deathmatchWins = cc.game_wins_deathmatch
                    ? cc.game_wins_deathmatch
                    : 0;
                  var defused = cc.bombs_defused ? cc.bombs_defused : 0;
                  var planted = cc.bombs_planted ? cc.bombs_planted : 0;
                  var kills = cc.kills ? cc.kills : 0;
                  var deathmatchDeaths = cc.deaths_deathmatch
                    ? cc.deaths_deathmatch
                    : 0;
                  var deathmatchCrimKills = cc.criminal_kills_deathmatch
                    ? cc.criminal_kills_deathmatch
                    : 0;
                  var coins = cc.coins ? cc.coins : 0;
                  var fired = cc.shots_fired ? cc.shots_fired : 0;
                  var roundWins = cc.round_wins ? cc.round_wins : 0;

                  var deathmatchCopKills = cc.cop_kills_deathmatch
                    ? cc.cop_kills_deathmatch
                    : 0;

                  var copKills = cc.cop_kills ? cc.cop_kills : 0;
                  var crimKills = cc.criminal_kills ? cc.criminal_kills : 0;

                  var deaths = cc.deaths ? cc.deaths : deathmatchDeaths;

                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Cops and Crims - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FCVC.png?v=1579257359319"
                    )
                    .addField("Coins", numberWithCommas(coins))
                    .addField("Games Wins", gameWins, true)
                    .addField("Round Wins", roundWins, true)
                    .addField("Shots Fired", fired, true)

                    .addField("Kills", kills, true)
                    .addField("Cop Kills", copKills, true)
                    .addField("Criminal Kills", crimKills, true)

                    .addField("Deathmatch Kills", deathmatchKills, true)
                    .addField("Deathmatch Cop Kills", deathmatchCopKills, true)
                    .addField(
                      "Deathmatch Criminal Kills",
                      deathmatchCrimKills,
                      true
                    )

                    .addField("Grenade Kills", grenKills, true)
                    .addField("Headshot Kills", headshotKills, true)
                  .addField("KDR", isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100, true)

                    .addField("Deaths", deaths, true)
                    .addField("Deathmatch Deaths", deathmatchDeaths, true)
                  .addField("Deathmatch KDR", isNaN(Math.round((deathmatchKills / deathmatchDeaths) * 100) / 100) ? "0.00" : Math.round((deathmatchKills / deathmatchDeaths) * 100) / 100, true)
                  
                    .addField("Bombs Planted", planted, true)
                    .addField("Bombs Defused", defused, true)
                  .addField("Planted / Defused", isNaN(Math.round((planted / defused) * 100) / 100) ? "0.00" : Math.round((planted / defused) * 100) / 100, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );

                  message.channel.send(Embed);
                } else if (args[0] === "vampirez" || args[0] === "vz") {
                  var vz = body.player.stats.VampireZ;
                  
                  var coins = vz.coins ? vz.coins : 0;
                  var humanDeaths = vz.human_deaths ? vz.human_deaths : 0;
                  var humanKills = vz.human_kills ? vz.human_kills : 0;
                  var humanWins = vz.human_wins ? vz.human_wins : 0;
                  var zombKills = vz.zombie_kills ? vz.zombie_kills : 0;
                  var vampKills = vz.vampire_kills ? vz.vampire_kills : 0;
                  var vampWins = vz.vampire_wins ? vz.vampire_wins : 0;
                  var vampDeaths = vz.vampire_deaths ? vz.vampire_deaths : 0;
                  
                  var humanKdr = Math.round((humanKills / humanDeaths) * 100) / 100;
                  var vampKdr = Math.round((vampKills / vampDeaths) * 100) / 100;
                  
                  humanKdr = isNaN(humanKdr) ? "0.00" : humanKdr;
                  vampKdr = isNaN(vampKdr) ? "0.00" : vampKdr;
                  
                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("VampireZ - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FVampireZ.png?v=1579257357094"
                    )
                    .addField("Coins", numberWithCommas(coins))
                  .addField("Human Kills", humanKills, true)
                  .addField("Human Deaths", humanDeaths, true)
                  .addField("Human KDR", humanKdr, true)
                  .addField("Vampire Kills", vampKills, true)
                  .addField("Vampire Deaths", vampDeaths, true)
                  .addField("Vampire KDR", vampKdr, true)
                  .addField("Human Wins", humanWins, true)
                  .addField("Vamper Wins", vampWins, true)
                  .addField("Zombie Kills", zombKills, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  message.channel.send(Embed);
                } else if(args[0] === "paintball" || args[0] === "pb") {
                  var pb = body.player.stats.Paintball;
                  
                  var coins = pb.coins ? pb.coins : 0;
                  var deaths = pb.deaths ? pb.deaths : 0;
                  var fired = pb.shots_fired ? pb.shots_fired : 0;
                  var wins = pb.wins ? pb.wins : 0;
                  var killstreak = pb.killstreaks ? pb.killstreaks : 0;
                  var kills = pb.kills ? pb.kills : 0;
                  
                  
                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Paintball - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FPaintball.png?v=1579257356701"
                    )
                    .addField("Coins", numberWithCommas(coins))
                  .addField("Kills", kills , true)
                  .addField("Deaths", deaths, true)
                  .addField("KDR", isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100, true)
                  .addField("Wins", wins, true)
                  .addField("Winstreak", winstreak, true)
                  .addField("Shots Fired", fired, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  message.channel.send(Embed);
                } else if(args[0] === "quake" || args[0] === "q") {
                  var q = body.player.stats.Quake;
                  
                  var coins = q.coins ? q.coins : 0;
                  var deaths = q.deaths ? q.deaths : 0;
                  var kills = q.kills ? q.kills : 0;
                  var killstreak = q.killstreaks ? q.killstreaks : 0;
                  var wins = q.wins ? q.wins : 0;
                  var teamKills = q.kills_teams ? q.kills_teams : 0;
                  var teamKillstreak = q.killstreaks_teams ? q.killstreaks_teams : 0;
                  var teamDeaths = q.deaths_teams ? q.deaths_teams : 0;
                  var teamWins = q.wins_teams ? q.wins_teams : 0;
                  var highestKillstreak = q.highest_killstreak ? q.highest_killstreak : 0;
                  var teamFired = q.shots_fired_teams ? q.shots_fired_teams : 0;
                  var teamHeadshots = q.headshots_teams ? q.headshots_teams : 0;
                  var headshots = q.headshots ?q.headshots : 0;
                  var fired = q.shots_fired ? q.shots_fired :0;
                  var kdr = isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100;
                  var teamKdr = isNaN(Math.round((teamKills / teamDeaths) * 100) / 100) ? "0.00" : Math.round((teamKills / teamDeaths) * 100) / 100;
                  
                  
                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("QuakeCraft - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FQuakecraft.png?v=1579257356670"
                    )
                    .addField("Coins", numberWithCommas(coins))
                  .addField("Kills", kills , true)
                  .addField("Deaths", deaths, true)
                  .addField("KDR", kdr, true)
                  .addField("Wins", wins, true)
                  .addField("Shots Fired", fired, true)
                  .addField("Headshots", headshots, true)
                  .addField("Team Kills", teamKills, true)
                  .addField("Team Deaths", teamDeaths, true)
                  .addField("Team KDR", teamKdr, true)
                  .addField("Team Wins", teamWins, true)
                  .addField("Team Shots Fired", teamFired, true)
                  .addField("Team Headshots", teamHeadshots, true)
                  .addField("Killstreak", killstreak, true)
                  .addField("Team Killstreak", teamKillstreak, true)
                  .addField("Highest Killstreak", highestKillstreak, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  message.channel.send(Embed);
                } else if(args[0] === "uhc") {
                  var uhc = body.player.stats.UHC;
                  
                  var coins = uhc.coins ? uhc.coins : 0;
                  var deaths = uhc.deaths ? uhc.deaths : 0;
                  var kills = uhc.kills ? uhc.kills : 0;
                  var score = uhc.score ? uhc.score : 0;
                  var wins = uhc.wins ? uhc.wins : 0;
                  var heads = uhc.heads_eaten ? uhc.heads_eaten : 0;
                  var kdr = isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100;
                  
                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("UHC - **Overall**")
                    .setThumbnail(
                      "https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FUHC.png?v=1579257356947"
                    )
                    .addField("Coins", numberWithCommas(coins))
                  .addField("Kills", kills , true)
                  .addField("Deaths", deaths, true)
                  .addField("KDR", kdr, true)
                  .addField("Wins", wins, true)
                  .addField("Score", score, true)
                  .addField("Heads Eaten", heads, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  message.channel.send(Embed);
                } /* else if(args[0] === "battleground" || args[0] === "bg") {
                  var bg = body.player.stats.Battleground;
                  
                  var assists = bg.assists ? bg.assists : 0;
                  var coins = bg.coins ? bg.coins : 0;
                  var damage = bg.damage ? bg.damage : 0;
                  var dmgTaken = bg.damage_taken ? bg.damage_taken : 0;
                  var deaths = bg.deaths ? bg.deaths : 0;
                  var heal = bg.heal ? bg.heal : 0;
                  var kills = bg.kills ? bg.kills : 0;
                  var losses = bg.losses ? bg.losses : 0;
                  var winstreak = bg.win_streak ? bg.win_streak : 0;
                  var wins = bg.wins ? bg.wins : 0;
                  var kdr = isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100;
                  var wlr = isNaN(Math.round((wins / losses) * 100) / 100) ? "0.00" : Math.round((wins / losses) * 100) / 100;
                  
                  
                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Battleground - **Overall**")
                    .addField("Coins", numberWithCommas(coins))
                  .addField("Kills", kills , true)
                  .addField("Deaths", deaths, true)
                  .addField("KDR", kdr, true)
                  .addField("Wins", wins, true)
                  .addField("Losses", losses, true)
                  .addField("WLR", wlr, true)
                  .addField("Winstreak", winstreak, true)
                  .addField("Heal", heal, true)
                  .addField("Assists", assists, true)
                  .addField("Damage", damage, true)
                  .addField("Damage Taken", dmgTaken, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  message.channel.send(Embed);
                }*/ else if(args[0] === "walls" || args[0] === "wa") {
                  var w = body.player.stats.Walls;
                  
                  var coins = w.coins ? w.coins : 0;
                  var deaths = w.deaths ? w.deaths : 0;
                  var kills = w.kills ? w.kills : 0;
                  var losses = w.losses ? w.losses : 0;
                  var wins = w.wins ? w.wins : 0;
                  var kdr = isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100;
                  var wlr = isNaN(Math.round((wins / losses) * 100) / 100) ? "0.00" : Math.round((wins / losses) * 100) / 100;
                  
                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Walls - **Overall**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FWalls.png?v=1579257357338")
                    .addField("Coins", numberWithCommas(coins))
                  .addField("Kills", kills , true)
                  .addField("Deaths", deaths, true)
                  .addField("KDR", kdr, true)
                  .addField("Wins", wins, true)
                  .addField("Losses", losses, true)
                  .addField("WLR", wlr, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  message.channel.send(Embed);
                } else if(args[0] === "megawalls" || args[0] === "mw") {
                  var mw = body.player.stats.Walls3;
                  
                  var assists = mw.assists ? mw.assists : 0;
                  var coins = mw.coins ? mw.coins : 0;
                  var deaths = mw.deaths ? mw.deaths : 0;
                  var finalDeaths = mw.finalDeaths ? mw.finalDeaths : 0;
                  var finalKills = mw.finalKills ? mw.finalKills : 0;
                  var kills = mw.kills ? mw.kills : 0;
                  var losses = mw.losses ? mw.losses : 0;
                  var wins = mw.wins ? mw.wins : 0;
                  var gamePlayed = mw.games_played ? mw.games_played: 0;
                  var damageDealt = mw.damage_dealt ? mw.damage_dealt : 0;
                  var kdr = isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100;
                  var wlr = isNaN(Math.round((wins / losses) * 100) / 100) ? "0.00" : Math.round((wins / losses) * 100) / 100;
                  var finalKdr = isNaN(Math.round((finalKills / finalDeaths) * 100) / 100) ? "0.00" : Math.round((finalKills / finalDeaths) * 100) / 100;
                  
                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Mega Walls - **Overall**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FMegaWalls.png?v=1579257359756")
                    .addField("Coins", numberWithCommas(coins))
                  .addField("Games Played", played, true)
                  .addField("Assists", assists, true)
                  .addField("Damage Dealt", damageDealt, true)
                  .addField("Kills", kills , true)
                  .addField("Deaths", deaths, true)
                  .addField("KDR", kdr, true)
                  .addField("Wins", wins, true)
                  .addField("Losses", losses, true)
                  .addField("WLR", wlr, true)
                  .addField("Final Kills", finalKills , true)
                  .addField("Final Deaths", finalDeaths, true)
                  .addField("Final KDR", finalKdr, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  message.channel.send(Embed);
                }  else if(args[0] === "crazywalls" || args[0] === "cw") {
                  var cw = body.player.stats.TrueCombat;
                  
                  var arrows = cw.arrows_shot ?cw.arrows_shot : 0;
                  var coins = cw.coins ? cw.coins : 0;
                  var kills = cw.kills ? cw.kills : 0;
                  var wins = cw.wins ? cw.wins : 0;
                  var winstreak = cw.win_streak ? cw.win_streak : 0;
                  var games = cw.games ? cw.games :0;
                  var deaths = cw.deaths ? cw.deaths : 0;
                  var losses = cw.losses ? cw.losses : 0;
                  var kdr = isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100;
                  var wlr = isNaN(Math.round((wins / losses) * 100) / 100) ? "0.00" : Math.round((wins / losses) * 100) / 100;
                  
                  var soloLuckyWins = cw.crazywalls_wins_solo_chaos ? cw.crazywalls_wins_solo_chaos : 0;
                  var soloLuckyKills = cw.crazywalls_kills_solo_chaos ? cw.crazywalls_kills_solo_chaos : 0;
                  var soloLuckyLosses = cw.crazywalls_losses_solo_chaos ? cw.crazywalls_losses_solo_chaos : 0;
                  var soloLuckyGames = cw.crazywalls_games_solo_chaos ? cw.crazywalls_games_solo_chaos : 0;
                  var soloLuckyDeaths = cw.crazywalls_deaths_solo_chaos ? cw.crazywalls_deaths_solo_chaos  :0;
                  var soloLuckyKdr = isNaN(Math.round((soloLuckyKills / soloLuckyDeaths) * 100) / 100) ? "0.00" : Math.round((soloLuckyKills / soloLuckyDeaths) * 100) / 100;
                  var soloLuckyWlr = isNaN(Math.round((soloLuckyWins / soloLuckyLosses) * 100) / 100) ? "0.00" : Math.round((soloLuckyWins / soloLuckyLosses) * 100) / 100;
                  
                  var soloDeaths = cw.crazywalls_deaths_solo ? cw.crazywalls_deaths_solo : 0;
                  var soloGames = cw.crazywalls_games_solo ? cw.crazywalls_games_solo  :0;
                  var soloLosses = cw.crazywalls_losses_solo ? cw.crazywalls_losses_solo : 0;
                  var soloKills = cw.crazywalls_kills_solo ? cw.crazywalls_kills_solo : 0;
                  var soloWins = cw.crazywalls_wins_solo ? cw.crazywalls_wins_solo : 0;
                  var soloKdr = isNaN(Math.round((soloKills / soloDeaths) * 100) / 100) ? "0.00" : Math.round((soloKills / soloDeaths) * 100) / 100;
                  var soloWlr = isNaN(Math.round((soloWins / soloLosses) * 100) / 100) ? "0.00" : Math.round((soloWins / soloLosses) * 100) / 100;
                  
                  var teamLuckyWins = cw.crazywalls_wins_team_chaos ? cw.crazywalls_wins_team_chaos : 0;
                  var teamLuckyKills = cw.crazywalls_kills_team_chaos ? cw.crazywalls_kills_team_chaos : 0;
                  var teamLuckyLosses = cw.crazywalls_losses_team_chaos ? cw.crazywalls_losses_team_chaos : 0;
                  var teamLuckyGames = cw.crazywalls_games_team_chaos ? cw.crazywalls_games_team_chaos : 0;
                  var teamLuckyDeaths = cw.crazywalls_deaths_team_chaos ? cw.crazywalls_deaths_team_chaos  :0;
                  var teamLuckyKdr = isNaN(Math.round((teamLuckyKills / teamLuckyDeaths) * 100) / 100) ? "0.00" : Math.round((teamLuckyKills / teamLuckyDeaths) * 100) / 100;
                  var teamLuckyWlr = isNaN(Math.round((teamLuckyWins / teamLuckyLosses) * 100) / 100) ? "0.00" : Math.round((teamLuckyWins / teamLuckyLosses) * 100) / 100;
                  
                  var teamDeaths = cw.crazywalls_deaths_team ? cw.crazywalls_deaths_team : 0;
                  var teamGames = cw.crazywalls_games_team ? cw.crazywalls_games_team  :0;
                  var teamLosses = cw.crazywalls_losses_team ? cw.crazywalls_losses_team : 0;
                  var teamKills = cw.crazywalls_kills_team ? cw.crazywalls_kills_team : 0;
                  var teamWins = cw.crazywalls_wins_team ? cw.crazywalls_wins_team : 0;
                  var teamKdr = isNaN(Math.round((teamKills / teamDeaths) * 100) / 100) ? "0.00" : Math.round((teamKills / teamDeaths) * 100) / 100;
                  var teamWlr = isNaN(Math.round((teamWins / teamLosses) * 100) / 100) ? "0.00" : Math.round((teamWins / teamLosses) * 100) / 100;
                  
                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Crazy Walls - **Overall**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FCrazyWalls.png?v=1579257358927")
                    .addField("Coins", numberWithCommas(coins))
                  .addField("Games Played", games, true)
                  .addField("Arrows Shot", arrows, true)
                  .addField("Winstreak", winstreak, true)
                  .addField("Kills", kills, true)
                  .addField("Deaths", deaths, true)
                  .addField("KDR", kdr, true)
                  .addField("Wins", wins, true)
                  .addField("Losses", losses, true)
                  .addField("WLR", wlr, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed2 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Crazy Walls - **Solo Normal**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FCrazyWalls.png?v=1579257358927")
                  .addField("Games Played", soloGames)
                  .addField("Kills", soloKills, true)
                  .addField("Deaths", soloDeaths, true)
                  .addField("KDR", soloKdr, true)
                  .addField("Wins", soloWins, true)
                  .addField("Losses", soloLosses, true)
                  .addField("WLR", soloWlr, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed3 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Crazy Walls - **Solo Lucky**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FCrazyWalls.png?v=1579257358927")
                  .addField("Games Played", soloLuckyGames)
                  .addField("Kills", soloLuckyKills, true)
                  .addField("Deaths", soloLuckyDeaths, true)
                  .addField("KDR", soloLuckyKdr, true)
                  .addField("Wins", soloLuckyWins, true)
                  .addField("Losses", soloLuckyLosses, true)
                  .addField("WLR", soloLuckyWlr, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed4 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Crazy Walls - **Team Normal**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FCrazyWalls.png?v=1579257358927")
                  .addField("Games Played", teamGames)
                  .addField("Kills", teamKills, true)
                  .addField("Deaths", teamDeaths, true)
                  .addField("KDR", teamKdr, true)
                  .addField("Wins", teamWins, true)
                  .addField("Losses", teamLosses, true)
                  .addField("WLR", teamWlr, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed5 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Crazy Walls - **Team Lucky**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FCrazyWalls.png?v=1579257358927")
                  .addField("Games Played", teamLuckyGames)
                  .addField("Kills", teamLuckyKills, true)
                  .addField("Deaths", teamLuckyDeaths, true)
                  .addField("KDR", teamLuckyKdr, true)
                  .addField("Wins", teamLuckyWins, true)
                  .addField("Losses", teamLuckyLosses, true)
                  .addField("WLR", teamLuckyWlr, true)
                    .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  var allEmbeds = [Embed, Embed2, Embed3, Embed4, Embed5];
                  var s = 0;
                  var msg = await message.channel.send(allEmbeds[0]);

                  await msg.react("⏮");
                  await msg.react("◀");
                  await msg.react("▶");
                  await msg.react("⏭");
                  await msg.react("⏹");
                  var collector = await msg.createReactionCollector(filter, {
                    idle: 60000,
                    errors: ["time"]
                  });

                  collector.on("collect", function(reaction, user) {
                    reaction.users.remove(user.id);
                    switch (reaction.emoji.name) {
                      case "⏮":
                        s = 0;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "◀":
                        s -= 1;
                        if (s < 0) {
                          s = allEmbeds.length - 1;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "▶":
                        s += 1;
                        if (s > allEmbeds.length - 1) {
                          s = 0;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏭":
                        s = allEmbeds.length - 1;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏹":
                        collector.emit("end");
                        break;
                    }
                  });
                  collector.on("end", function() {
                    msg.reactions.removeAll().catch(console.error);
                  });
                } else if(args[0] === "smashhero" || args[0] === "sh") {
                  var sh = body.player.stats.SuperSmash;
                  
                  var level = sh.smashLevel ? sh.smashLevel : 0;
                  var coins = sh.coins ? sh.coins : 0;
                  var winstreak = sh.win_streak ? sh.win_streak : 0;
                  var kills = sh.kills ? sh.kills : 0;
                  var wins = sh.wins ? sh.wins : 0;
                  var damageDealt = sh.damage_dealt ? sh.damage_dealt : 0;
                  var smasher = sh.smasher ? sh.smasher : 0;
                  var smashed = sh.smashed ? sh.smashed : 0;
                  var deaths = sh.deaths ? sh.deaths : 0;
                  var games = sh.games ? sh.games : 0;
                  var losses = sh.losses? sh.losses:0;
                  var quits = sh.quits? sh.quits : 0;
                  var kdr = isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100;
                  var wlr = isNaN(Math.round((wins / losses) * 100) / 100) ? "0.00" : Math.round((wins / losses) * 100) / 100;
                  
                  var teamWins = sh.wins_teams ? sh.wins_teams :0;
                  var teamSmashed = sh.smashed_teams ?sh.smashed_teams : 0;
                  var teamKills = sh.kills_teams ? sh.kills_teams : 0;
                  var teamSmasher = sh.smasher_teams ? sh.smasher_teams : 0;
                  var teamDeaths = sh.deaths_teams ? sh.deaths_teams : 0;
                  var teamGames = sh.games_teams ? sh.games_teams : 0;
                  var teamLosses = sh.losses_teams ? sh.losses_teams : 0;
                  var teamDamageDealt = sh.damage_dealt_teams ? sh.damage_dealt_teams : 0;
                  var teamKdr = isNaN(Math.round((teamKills / teamDeaths) * 100) / 100) ? "0.00" : Math.round((teamKills / teamDeaths) * 100) / 100;
                  var teamWlr = isNaN(Math.round((teamWins / teamLosses) * 100) / 100) ? "0.00" : Math.round((teamWins / teamLosses) * 100) / 100;
                  
                  var normalSmasher = sh.smasher_normal ? sh.smasher_normal : 0;
                  var normalLosses = sh.losses_normal ? sh.losses_normal : 0;
                  var normalSmashed = sh.smashed_normal? sh.smashed_normal :0;
                  var normalDeaths = sh.deaths_normal ? sh.deaths_normal : 0;
                  var normalGames = sh.games_normal ? sh.games_normal : 0;
                  var normalKills = sh.kills_normal ? sh.kills_normal : 0;
                  var normalDamageDealt = sh.damage_dealt_normal ? sh.damage_dealt_normal : 0;
                  var normalWins = sh.wins_normal ? sh.wins_normal : 0;
                  var normalKdr = isNaN(Math.round((normalKills / normalDeaths) * 100) / 100) ? "0.00" : Math.round((normalKills / normalDeaths) * 100) / 100;
                  var normalWlr = isNaN(Math.round((normalWins / normalLosses) * 100) / 100) ? "0.00" : Math.round((normalWins / normalLosses) * 100) / 100;
                  
                  var triSmasher = sh.smasher_3v3 ? sh.smasher_3v3: 0;
                  var triDamageDealt = sh.damage_dealt_3v3 ? sh.damage_dealt_3v3 : 0;
                  var triKills = sh.kills_3v3 ? sh.kills_3v3 : 0;
                  var triDeaths = sh.deaths_3v3 ? sh.deaths_3v3 : 0;
                  var triGames = sh.games_3v3 ? sh.games_3v3 : 0;
                  var triSmashed = sh.smashed_3v3 ? sh.smashed_3v3 : 0;
                  var triLosses = sh.losses_3v3 ? sh.losses_3v3 : 0;
                  var triWins = sh.wins_3v3 ? sh.wins_3v3 : 0;
                  var triKdr = isNaN(Math.round((triKills / triDeaths) * 100) / 100) ? "0.00" : Math.round((triKills / triDeaths) * 100) / 100;
                  var triWlr = isNaN(Math.round((triWins / triLosses) * 100) / 100) ? "0.00" : Math.round((triWins / triLosses) * 100) / 100;
                  
                  var doubleDeaths = sh.deaths_2v2 ? sh.deaths_2v2 : 0;
                  var doubleKills = sh.kills_2v2 ? sh.kills_2v2 : 0;
                  var doubleGames = sh.games_2v2 ? sh.games_2v2 : 0;
                  var doubleSmashed = sh.smashed_2v2 ? sh.smashed_2v2 : 0;
                  var doubleSmasher = sh.smasher_2v2 ? sh.smasher_2v2 : 0;
                  var doubleLosses = sh.losses_2v2 ? sh.losses_2v2 : 0;
                  var doubleDamageDealt = sh.damage_dealt_2v2 ? sh.damage_dealt_2v2 : 0;
                  var doubleWins = sh.wins_2v2 ? sh.wins_2v2 : 0;
                  var doubleKdr = isNaN(Math.round((doubleKills / doubleDeaths) * 100) / 100) ? "0.00" : Math.round((doubleKills / doubleDeaths) * 100) / 100;
                  var doubleWlr = isNaN(Math.round((doubleWins / doubleLosses) * 100) / 100) ? "0.00" : Math.round((doubleWins / doubleLosses) * 100) / 100;
                  
                  
                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Smash Hero - **Overall**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSmashHeroes.png?v=1579257360564")
                    .addField("Coins", numberWithCommas(coins), true)
                  .addField("Smash Level", level, true)
                    .addField("\u200b", "\u200b", true)
                  
                  .addField("Games Played", games, true)
                  .addField("Damage Dealt", damageDealt, true)
                  .addField("Winstreak", winstreak, true)
                  
                  .addField("Smasher", smasher, true)
                  .addField("Smashed", smashed, true)
                  .addField("Quits", quits, true)
                  
                   .addField("Kills", kills, true)
                  .addField("Deaths", deaths, true)
                  .addField("KDR", kdr, true)
                  
                  .addField("Wins", wins, true)
                  .addField("Losses", losses, true)
                  .addField("WLR", wlr, true)
                  
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed1 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Smash Hero - **Team**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSmashHeroes.png?v=1579257360564")
                  
                  .addField("Games Played", teamGames, true)
                  
                  .addField("Smasher", teamSmasher, true)
                  .addField("Smashed", teamSmashed, true)
                  .addField("Damage Dealt", teamDamageDealt, true)
                  
                  .addField("Kills", teamKills, true)
                  .addField("Deaths", teamDeaths, true)
                  .addField("KDR", teamKdr, true)
                  
                  .addField("Wins", teamWins, true)
                  .addField("Losses", teamLosses, true)
                  .addField("WLR", teamWlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed2 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Smash Hero - **Normal**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSmashHeroes.png?v=1579257360564")
                  
                  .addField("Games Played", normalGames, true)
                  
                  .addField("Smasher", normalSmasher, true)
                  .addField("Smashed", normalSmashed, true)
                  .addField("Damage Dealt", normalDamageDealt, true)
                  
                  .addField("Kills", normalKills, true)
                  .addField("Deaths", normalDeaths, true)
                  .addField("KDR", normalKdr, true)
                  
                  .addField("Wins", normalWins, true)
                  .addField("Losses", normalLosses, true)
                  .addField("WLR", normalWlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed3 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Smash Hero - **2v2**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSmashHeroes.png?v=1579257360564")
                  
                  .addField("Games Played", doubleGames, true)
                  
                  .addField("Smasher", doubleSmasher, true)
                  .addField("Smashed", doubleSmashed, true)
                  .addField("Damage Dealt", doubleDamageDealt, true)
                  
                  .addField("Kills", doubleKills, true)
                  .addField("Deaths", doubleDeaths, true)
                  .addField("KDR", doubleKdr, true)
                  
                  .addField("Wins", doubleWins, true)
                  .addField("Losses", doubleLosses, true)
                  .addField("WLR", doubleWlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed4 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Smash Hero - **3v3**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSmashHeroes.png?v=1579257360564")
                  
                  .addField("Games Played", triGames, true)
                  
                  .addField("Smasher", triSmasher, true)
                  .addField("Smashed", triSmashed, true)
                  .addField("Damage Dealt", triDamageDealt, true)
                  
                  .addField("Kills", triKills, true)
                  .addField("Deaths", triDeaths, true)
                  .addField("KDR", triKdr, true)
                  
                  .addField("Wins", triWins, true)
                  .addField("Losses", triLosses, true)
                  .addField("WLR", triWlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  var allEmbeds = [Embed, Embed2, Embed1, Embed3, Embed4];
                  var s = 0;
                  var msg = await message.channel.send(allEmbeds[0]);

                  await msg.react("⏮");
                  await msg.react("◀");
                  await msg.react("▶");
                  await msg.react("⏭");
                  await msg.react("⏹");
                  var collector = await msg.createReactionCollector(filter, {
                    idle: 60000,
                    errors: ["time"]
                  });

                  collector.on("collect", function(reaction, user) {
                    reaction.users.remove(user.id);
                    switch (reaction.emoji.name) {
                      case "⏮":
                        s = 0;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "◀":
                        s -= 1;
                        if (s < 0) {
                          s = allEmbeds.length - 1;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "▶":
                        s += 1;
                        if (s > allEmbeds.length - 1) {
                          s = 0;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏭":
                        s = allEmbeds.length - 1;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏹":
                        collector.emit("end");
                        break;
                    }
                  });
                  collector.on("end", function() {
                    msg.reactions.removeAll().catch(console.error);
                  });
                } else if(args[0] === "speeduhc" || args[0] === "suhc") {
                  var uhc = body.player.stats.SpeedUHC;
                  
                  var coins = uhc.coins ? uhc.coins : 0;
                  var wins = uhc.wins ? uhc.wins : 0;
                  var kills = uhc.kills ? uhc.kills : 0;
                  var killstreak = uhc.killstreak ? uhc.killstreak : 0;
                  var winstreak = uhc.winstreak ? uhc.winstreak : 0;
                  var games = uhc.games? uhc.games : 0;
                  var highestWinstreak = uhc.kills_normal ? uhc.kills_normal : 0;
                  var highestKillstreak = uhc.highestKillstreak ? uhc.highestKillstreak : 0;
                  var losses = uhc.losses ? uhc.losses : 0;
                  var quits = uhc.quits ? uhc.quits : 0;
                  var deaths = uhc.deaths ? uhc.deaths : 0;
                  var arrows = uhc.arrows_shot ? uhc.arrows_shot: 0;
                  var arrowHits = uhc.arrows_hit? uhc.arrows_hit : 0;
                  var assists = uhc.assists ? uhc.assists : 0;
                  var kdr = isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100;
                  var wlr = isNaN(Math.round((wins / losses) * 100) / 100) ? "0.00" : Math.round((wins / losses) * 100) / 100;
                  
                  var normalWins = uhc.wins_normal ? uhc.wins_normal : 0;
                  var normalGames = uhc.games_normal? uhc.games_normal : 0;
                  var normalWinstreak = uhc.winstreak_normal ? uhc.winstreak_normal: 0;
                  var normalKillstreak = uhc.killstreak_normal ? uhc.killstreak_normal : 0;
                  var normalKills = uhc.kills_normal ? uhc.kills_normal : 0;
                  var normalDeaths = uhc.deaths_normal ? uhc.deaths_normal : 0;
                  var normalLosses = uhc.losses_normal ? uhc.losses_normal: 0;
                  var normalAssists = uhc.assists_normal ? uhc.assists_normal : 0;
                  var normalKdr = isNaN(Math.round((normalKills / normalDeaths) * 100) / 100) ? "0.00" : Math.round((normalKills / normalDeaths) * 100) / 100;
                  var normalWlr = isNaN(Math.round((normalWins / normalLosses) * 100) / 100) ? "0.00" : Math.round((normalWins / normalLosses) * 100) / 100;
                  
                  var insaneWinstreak = uhc.winstreak_insane ? uhc.winstreak_insane :0;
                  var insaneKillstreak = uhc.killstreak_insane ? uhc.killstreak_insane : 0;
                  var insaneWins = uhc.wins_insane ? uhc.wins_insane : 0;
                  var insaneKills = uhc.kills_insane ? uhc.kills_insane : 0;
                  var insaneGames = uhc.games_insane ? uhc.games_insane : 0;
                  var insaneLosses = uhc.losses_insane ? uhc.losses_insane : 0;
                  var insaneDeaths = uhc.deaths_insane ? uhc.deaths_insane : 0;
                  var insaneAssists = uhc.assists_insane ? uhc.assists_insane :0;
                  var insaneKdr = isNaN(Math.round((insaneKills / insaneDeaths) * 100) / 100) ? "0.00" : Math.round((insaneKills / insaneDeaths) * 100) / 100;
                  var insaneWlr = isNaN(Math.round((insaneWins / insaneLosses) * 100) / 100) ? "0.00" : Math.round((insaneWins / insaneLosses) * 100) / 100;
                  
                  var soloKillstreak = uhc.killstreak_solo ? uhc.killstreak_solo : 0;
                  var soloWinstreak = uhc.winstreak_solo ? uhc.winstreak_solo: 0;
                  var soloKills = uhc.kills_solo ? uhc.kills_solo : 0;
                  var soloWins = uhc.wins_solo ? uhc.wins_solo : 0;
                  var soloDeaths = uhc.deaths_solo ? uhc.deaths_solo : 0;
                  var soloLosses = uhc.losses_solo ? uhc.losses_solo : 0;
                  var soloAssists = uhc.assists_solo ? uhc.assists_solo : 0;
                  var soloGames = uhc.games_solo ? uhc.games_solo : 0;
                  var soloKdr = isNaN(Math.round((soloKills / soloDeaths) * 100) / 100) ? "0.00" : Math.round((soloKills / soloDeaths) * 100) / 100;
                  var soloWlr = isNaN(Math.round((soloWins / soloLosses) * 100) / 100) ? "0.00" : Math.round((soloWins / soloLosses) * 100) / 100;
                  
                  var teamDeaths = uhc.deaths_team ? uhc.deaths_team : 0;
                  var teamKills = uhc.kills_team ? uhc.kills_team : 0;
                  var teamLosses = uhc.losses_team ? uhc.losses_team : 0;
                  var teamGames = uhc.games_team ? uhc.games_team : 0;
                  var teamWinstreak = uhc.winstreak_team ? uhc.winstreak_team : 0;
                  var teamWins = uhc.wins_team ? uhc.wins_team : 0;
                  var teamKillstreak = uhc.killstreak_team ? uhc.killstreak_team : 0;
                  var teamAssists = uhc.assists_team ? uhc.assists_team : 0;
                  var teamKdr = isNaN(Math.round((teamKills / teamDeaths) * 100) / 100) ? "0.00" : Math.round((teamKills / teamDeaths) * 100) / 100;
                  var teamWlr = isNaN(Math.round((teamWins / teamLosses) * 100) / 100) ? "0.00" : Math.round((teamWins / teamLosses) * 100) / 100;
                  
                  var soloNormalKills = uhc.kills_solo_normal ? uhc.kills_solo_normal : 0;
                  var soloNormalWins = uhc.wins_solo_normal ? uhc.wins_solo_normal : 0;
                  var soloNormalLosses = uhc.losses_solo_normal ? uhc.losses_solo_normal : 0;
                  var soloNormalDeaths = uhc.deaths_solo_normal ? uhc.deaths_solo_normal : 0;
                  var soloNormalKdr = isNaN(Math.round((soloNormalKills / soloNormalDeaths) * 100) / 100) ? "0.00" : Math.round((soloNormalKills / soloNormalDeaths) * 100) / 100;
                  var soloNormalWlr = isNaN(Math.round((soloNormalWins / soloNormalLosses) * 100) / 100) ? "0.00" : Math.round((soloNormalWins / soloNormalLosses) * 100) / 100;
                  
                  var soloInsaneKills = uhc.kills_solo_insane ? uhc.kills_solo_insane : 0;
                  var soloInsaneWins = uhc.wins_solo_insane ? uhc.wins_solo_insane : 0;
                  var soloInsaneDeaths = uhc.deaths_solo_insane ? uhc.deaths_solo_insane : 0;
                  var soloInsaneLosses = uhc.losses_solo_insane ? uhc.losses_solo_insane : 0;
                  var soloInsaneKdr = isNaN(Math.round((soloInsaneKills / soloInsaneDeaths) * 100) / 100) ? "0.00" : Math.round((soloInsaneKills / soloInsaneDeaths) * 100) / 100;
                  var soloInsaneWlr = isNaN(Math.round((soloInsaneWins / soloInsaneLosses) * 100) / 100) ? "0.00" : Math.round((soloInsaneWins / soloInsaneLosses) * 100) / 100;
                  
                  var teamNormalDeaths = uhc.deaths_team_normal ? uhc.deaths_team_normal : 0;
                  var teamNormalKills = uhc.kills_team_normal ? uhc.kills_team_normal : 0;
                  var teamNormalLosses = uhc.losses_team_normal ? uhc.losses_team_normal : 0;
                  var teamNormalWins = uhc.wins_team_normal ? uhc.wins_team_normal : 0;
                  var teamNormalKdr = isNaN(Math.round((teamNormalKills / teamNormalDeaths) * 100) / 100) ? "0.00" : Math.round((teamNormalKills / teamNormalDeaths) * 100) / 100;
                  var teamNormalWlr = isNaN(Math.round((teamNormalWins / teamNormalLosses) * 100) / 100) ? "0.00" : Math.round((teamNormalWins / teamNormalLosses) * 100) / 100;
                  
                  var teamInsaneDeaths = uhc.deaths_team_insane ? uhc.deaths_team_insane : 0;
                  var teamInsaneWins = uhc.wins_team_insane ? uhc.wins_team_insane : 0;
                  var teamInsaneKills = uhc.kills_team_insane ? uhc.kills_team_insane : 0;
                  var teamInsaneLosses = uhc.losses_team_insane ? uhc.losses_team_insane : 0;
                  var teamInsaneKdr = isNaN(Math.round((teamInsaneKills / teamInsaneDeaths) * 100) / 100) ? "0.00" : Math.round((teamInsaneKills / teamInsaneDeaths) * 100) / 100;
                  var teamInsaneWlr = isNaN(Math.round((teamInsaneWins / teamInsaneLosses) * 100) / 100) ? "0.00" : Math.round((teamInsaneWins / teamInsaneLosses) * 100) / 100;
                  
                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Speed UHC - **Overall**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSpeedUHC.png?v=1579257360894")
                  .addField("Coins", numberWithCommas(coins))
                  
                  .addField("Games Played", games, true)
                  .addField("Highest Winstreak", highestWinstreak, true)
                  .addField("Highest Killstreak", highestKillstreak, true)
                  
                  .addField("Quits", quits, true)
                  .addField("Winstreak", winstreak, true)
                  .addField("Killstreak", killstreak, true)
                  
                  .addField("Assists", assists, true)
                  .addField("Arrows Shot", arrows, true)
                  .addField("Arrow Hits", arrowHits, true)
                  
                  .addField("Kills", kills, true)
                  .addField("Deaths", deaths, true)
                  .addField("KDR", kdr, true)
                  
                  .addField("Wins", wins, true)
                  .addField("Losses", losses, true)
                  .addField("WLR", wlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed1 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Speed UHC - **Normal**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSpeedUHC.png?v=1579257360894")
                  .addField("Games Played", normalGames)
                  
                  .addField("Assists", normalAssists, true)
                  .addField("Winstreak", normalWinstreak, true)
                  .addField("Killstreak", normalKillstreak, true)
                  
                  .addField("Kills", normalKills, true)
                  .addField("Deaths", normalDeaths, true)
                  .addField("KDR", normalKdr, true)
                  
                  .addField("Wins", normalWins, true)
                  .addField("Losses", normalLosses, true)
                  .addField("WLR", normalWlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed2 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Speed UHC - **Insane**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSpeedUHC.png?v=1579257360894")
                  .addField("Games Played", insaneGames)
                  
                  .addField("Assists", insaneAssists, true)
                  .addField("Winstreak", insaneWinstreak, true)
                  .addField("Killstreak", insaneKillstreak, true)
                  
                  .addField("Kills", insaneKills, true)
                  .addField("Deaths", insaneDeaths, true)
                  .addField("KDR", insaneKdr, true)
                  
                  .addField("Wins", insaneWins, true)
                  .addField("Losses", insaneLosses, true)
                  .addField("WLR", insaneWlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed3 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Speed UHC - **Solo**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSpeedUHC.png?v=1579257360894")
                  .addField("Games Played", soloGames)
                  
                  .addField("Assists", soloAssists, true)
                  .addField("Winstreak", soloWinstreak, true)
                  .addField("Killstreak", soloKillstreak, true)
                  
                  .addField("Kills", soloKills, true)
                  .addField("Deaths", soloDeaths, true)
                  .addField("KDR", soloKdr, true)
                  
                  .addField("Wins", soloWins, true)
                  .addField("Losses", soloLosses, true)
                  .addField("WLR", soloWlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed4 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Speed UHC - **Team**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSpeedUHC.png?v=1579257360894")
                  .addField("Games Played", teamGames)
                  
                  .addField("Assists", teamAssists, true)
                  .addField("Winstreak", teamWinstreak, true)
                  .addField("Killstreak", teamKillstreak, true)
                  
                  .addField("Kills", teamKills, true)
                  .addField("Deaths", teamDeaths, true)
                  .addField("KDR", teamKdr, true)
                  
                  .addField("Wins", teamWins, true)
                  .addField("Losses", teamLosses, true)
                  .addField("WLR", teamWlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed5 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Speed UHC - **Solo Normal**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSpeedUHC.png?v=1579257360894")
                  .addField("Kills", soloNormalKills, true)
                  .addField("Deaths", soloNormalDeaths, true)
                  .addField("KDR", soloNormalKdr, true)
                  
                  .addField("Wins", soloNormalWins, true)
                  .addField("Losses", soloNormalLosses, true)
                  .addField("WLR", soloNormalWlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed6 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Speed UHC - **Solo Insane**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSpeedUHC.png?v=1579257360894")
                  .addField("Kills", soloInsaneKills, true)
                  .addField("Deaths", soloInsaneDeaths, true)
                  .addField("KDR", soloInsaneKdr, true)
                  
                  .addField("Wins", soloInsaneWins, true)
                  .addField("Losses", soloInsaneLosses, true)
                  .addField("WLR", soloInsaneWlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed7 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Speed UHC - **Team Normal**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSpeedUHC.png?v=1579257360894")
                  .addField("Kills", teamNormalKills, true)
                  .addField("Deaths", teamNormalDeaths, true)
                  .addField("KDR", teamNormalKdr, true)
                  
                  .addField("Wins", teamNormalWins, true)
                  .addField("Losses", teamNormalLosses, true)
                  .addField("WLR", teamNormalWlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed8 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Speed UHC - **Team Insane**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FSpeedUHC.png?v=1579257360894")
                  .addField("Kills", teamInsaneKills, true)
                  .addField("Deaths", teamInsaneDeaths, true)
                  .addField("KDR", teamInsaneKdr, true)
                  
                  .addField("Wins", teamInsaneWins, true)
                  .addField("Losses", teamInsaneLosses, true)
                  .addField("WLR", teamInsaneWlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  var allEmbeds = [Embed, Embed1, Embed2, Embed3, Embed4, Embed5, Embed6, Embed7, Embed8];
                  var s = 0;
                  var msg = await message.channel.send(allEmbeds[0]);

                  await msg.react("⏮");
                  await msg.react("◀");
                  await msg.react("▶");
                  await msg.react("⏭");
                  await msg.react("⏹");
                  var collector = await msg.createReactionCollector(filter, {
                    idle: 60000,
                    errors: ["time"]
                  });

                  collector.on("collect", function(reaction, user) {
                    reaction.users.remove(user.id);
                    switch (reaction.emoji.name) {
                      case "⏮":
                        s = 0;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "◀":
                        s -= 1;
                        if (s < 0) {
                          s = allEmbeds.length - 1;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "▶":
                        s += 1;
                        if (s > allEmbeds.length - 1) {
                          s = 0;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏭":
                        s = allEmbeds.length - 1;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏹":
                        collector.emit("end");
                        break;
                    }
                  });
                  collector.on("end", function() {
                    msg.reactions.removeAll().catch(console.error);
                  });
                } else if(args[0] === "arena" || args[0] === "are") {
                  var ar = body.player.stats.Arena;
                  
                  var coins = ar.coins ? ar.coins : 0;
                  var dmg2 = ar.damage_2v2 ? ar.damage_2v2 : 0;
                  var dmg4 = ar.damage_4v4 ? ar.damage_4v4 : 0;
                  var dmg1 = ar.damage_ffa ? ar.damage_ffa: 0;
                  var deaths2 = ar.deaths_2v2? ar.deaths_2v2 : 0;
                  var deaths4 = ar.deaths_4v4 ? ar.deaths_4v4 :0;
                  var deaths1 = ar.deaths_ffa ?ar.deaths_ffa : 0;
                  var games2 = ar.games_2v2 ? ar.games_2v2 : 0;
                  var games4 = ar.games_4v4 ? ar.games_4v4 : 0;
                  var games1 = ar.games_ffa ? ar.games_ffa  :0;
                  var heal2 = ar.healed_2v2 ? ar.healed_2v2 : 0;
                  var heal4 = ar.healed_4v4 ? ar.healed_4v4 : 0;
                  var heal1 = ar.healed_ffa ? ar.healed_ffa : 0;
                  var kills2 = ar.kills_2v2 ? ar.kills_2v2 : 0;
                  var kills4 = ar.kills_4v4 ? ar.kills_4v4  :0;
                  var kills1 = ar.kills_ffa ? ar.kills_ffa : 0;
                  var losses2 = ar.losses_2v2 ? ar.losses_2v2 : 0;
                  var losses4 = ar.losses_4v4 ? ar.losses_4v4 : 0;
                  var losses1 = ar.losses_ffa ? ar.losses_ffa : 0;
                  var winstreak2 = ar.win_streaks_2v2 ? ar.win_streaks_2v2 : 0;
                  var winstreak4 = ar.win_streaks_4v4 ? ar.win_streaks_4v4 : 0;
                  var winstreak1 = ar.win_streaks_ffa ? ar.win_streaks_ffa : 0;
                  var wins2 = ar.wins_2v2 ? ar.wins_2v2: 0;
                  var wins4 = ar.wins_4v4 ? ar.wins_4v4 : 0;
                  var wins1 = ar.wins_ffa ? ar.wins_ffa : 0;
                  
                  
                  var kdr1 = isNaN(Math.round((kills1 / deaths1) * 100) / 100) ? "0.00" : Math.round((kills1 / deaths1) * 100) / 100;
                  var wlr1 = isNaN(Math.round((wins1 / losses1) * 100) / 100) ? "0.00" : Math.round((wins1 / losses1) * 100) / 100;
                  var kdr2 = isNaN(Math.round((kills2 / deaths2) * 100) / 100) ? "0.00" : Math.round((kills2 / deaths2) * 100) / 100;
                  var wlr2 = isNaN(Math.round((wins2 / losses2) * 100) / 100) ? "0.00" : Math.round((wins2 / losses2) * 100) / 100;
                  var kdr4 = isNaN(Math.round((kills4 / deaths4) * 100) / 100) ? "0.00" : Math.round((kills4 / deaths4) * 100) / 100;
                  var wlr4 = isNaN(Math.round((wins4 / losses4) * 100) / 100) ? "0.00" : Math.round((wins4 / losses4) * 100) / 100;
                  
                  var wins = ar.wins? ar.wins : 0;
                  var dmg = dmg1 + dmg2 + dmg4;
                  var deaths = deaths1 + deaths2 + deaths4;
                  var games = games1 + games2 + games4;
                  var heal = heal1 + heal2 + heal4;
                  var kills = kills1 + kills2 + kills4;
                  var losses = losses1 + losses2 + losses4;
                  var kdr = isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100;
                  var wlr = isNaN(Math.round((wins / losses) * 100) / 100) ? "0.00" : Math.round((wins / losses) * 100) / 100;
                  
                  
                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Arena - **Overall**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FArena.png?v=1579257358097")
                  .addField("Coins", numberWithCommas(coins))
                  
                  .addField("Games Played", games, true)
                  .addField("Damage", dmg, true)
                  .addField("Healed", heal, true)
                  
                  .addField("Kills", kills, true)
                  .addField("Deaths", deaths, true)
                  .addField("KDR", kdr, true)
                  
                  .addField("Wins", wins, true)
                  .addField("Losses", losses, true)
                  .addField("WLR", wlr, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed1 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Arena - **1v1**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FArena.png?v=1579257358097")
                  .addField("Winstreak", winstreak1)
                  
                  .addField("Games Played", games1, true)
                  .addField("Damage", dmg1, true)
                  .addField("Healed", heal1, true)
                  
                  .addField("Kills", kills1, true)
                  .addField("Deaths", deaths1, true)
                  .addField("KDR", kdr1, true)
                  
                  .addField("Wins", wins1, true)
                  .addField("Losses", losses1, true)
                  .addField("WLR", wlr1, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  const Embed2 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Arena - **2v2**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FArena.png?v=1579257358097")
                  .addField("Winstreak", winstreak2)
                  
                  .addField("Games Played", games2, true)
                  .addField("Damage", dmg2, true)
                  .addField("Healed", heal2, true)
                  
                  .addField("Kills", kills2, true)
                  .addField("Deaths", deaths2, true)
                  .addField("KDR", kdr2, true)
                  
                  .addField("Wins", wins2, true)
                  .addField("Losses", losses2, true)
                  .addField("WLR", wlr2, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  const Embed4 = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Arena - **4v4**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FArena.png?v=1579257358097")
                  .addField("Winstreak", winstreak4)
                  
                  .addField("Games Played", games4, true)
                  .addField("Damage", dmg4, true)
                  .addField("Healed", heal4, true)
                  
                  .addField("Kills", kills4, true)
                  .addField("Deaths", deaths4, true)
                  .addField("KDR", kdr4, true)
                  
                  .addField("Wins", wins4, true)
                  .addField("Losses", losses4, true)
                  .addField("WLR", wlr4, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  var allEmbeds = [Embed, Embed1, Embed2, Embed4];
                  var s = 0;
                  var msg = await message.channel.send(allEmbeds[0]);

                  await msg.react("⏮");
                  await msg.react("◀");
                  await msg.react("▶");
                  await msg.react("⏭");
                  await msg.react("⏹");
                  var collector = await msg.createReactionCollector(filter, {
                    idle: 60000,
                    errors: ["time"]
                  });

                  collector.on("collect", function(reaction, user) {
                    reaction.users.remove(user.id);
                    switch (reaction.emoji.name) {
                      case "⏮":
                        s = 0;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "◀":
                        s -= 1;
                        if (s < 0) {
                          s = allEmbeds.length - 1;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "▶":
                        s += 1;
                        if (s > allEmbeds.length - 1) {
                          s = 0;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏭":
                        s = allEmbeds.length - 1;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏹":
                        collector.emit("end");
                        break;
                    }
                  });
                  collector.on("end", function() {
                    msg.reactions.removeAll().catch(console.error);
                  });
                } else if(args[0] === "pit" || args[0] === "p") {
                  var pit = body.player.stats.Pit.pit_stats_ptl;
                  
                  var deaths = pit.deaths ? pit.deaths : 0;
                  var melee = pit.melee_damage_dealt? pit.melee_damage_dealt : 0;
                  var earned = pit.cash_earned ? pit.cash_earned : 0;
                  var joins = pit.joins ? pit.joins : 0;
                  var playtime = pit.playtime_minutes ? pit.playtime_minutes: 0;
                  var bowDmgTaken = pit.bow_damage_received ? pit.bow_damage_received : 0;
                  var kills = pit.kills ? pit.kills : 0;
                  var dmgTaken = pit.damage_received ? pit.damage_received : 0;
                  var jumped = pit.jumped_into_pit ? pit.jumped_into_pit : 0;
                  var meleeDmgTaken = pit.melee_damage_received ? pit.melee_damage_received : 0;
                  var leftClicks = pit.left_clicks ? pit.left_clicks : 0;
                  var dmg = pit.damage_dealt ? pit.damage_dealt : 0;
                  var assists = pit.assists ? pit.assists : 0;
                  var arrows = pit.arrows_fired ? pit.arrows_fired : 0;
                  var bow = pit.bow_damage_dealt ? pit.bow_damage_dealt : 0;
                  var arrowHits = pit.arrow_hits ? pit.arrow_hits : 0;
                  var maxStreak = pit.max_streak ? pit.max_streak : 0;
                  var kdr = isNaN(Math.round((kills / deaths) * 100) / 100) ? "0.00" : Math.round((kills / deaths) * 100) / 100;
                  
                  const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://hypixel.net/player/" + res[0].name)
                    .setDescription("Pit - **Overall**")
                  .setThumbnail("https://cdn.glitch.com/0ee8e202-4c9f-43f0-b5eb-2c1dacae0079%2FPrototype-64.png?v=1584789055700")
                  .addField("Left Clicks", leftClicks)
                  
                  .addField("Joins", joins, true)
                  .addField("Jumped into Pit", jumped, true)
                  .addField("Playtime (Minutes)", playtime, true)
                  
                  .addField("Kills", kills, true)
                  .addField("Deaths", deaths, true)
                  .addField("KDR", kdr, true)
                  
                  .addField("Damage Dealt", dmg , true)
                  .addField("Melee Damage Dealt", melee, true)
                  .addField("Bow Damage Dealt", bow, true)
                  
                  .addField("Damage Taken", dmgTaken, true)
                  .addField("Melee Damage Taken", meleeDmgTaken, true)
                  .addField("Bow Damage Taken", bowDmgTaken, true)
                  
                  .addField("Cash Earned", earned, true)
                  .addField("Max Streak", maxStreak, true)
                  .addField("Assists", assists, true)
                  
                  .addField("Arrows Fired", arrows, true)
                  .addField("Arrow Hits", arrowHits, true)
                  
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                  
                  message.channel.send(Embed);
                  
                } else if (args[0] === "skyblock" || args[0] === "sb") {
                  var sb = body.player.stats.SkyBlock;
                  let error = false;
                  var allEmbeds = [];
                  
                  var magmaBoss = await fetch("https://hypixel-api.inventivetalent.org/api/skyblock/bosstimer/magma/estimatedSpawn").then(resp => resp.json().catch(err => {
                      console.error("Fetching failed.");
                      error = true;
                      }));
                  var darkAuction = await fetch("https://hypixel-api.inventivetalent.org/api/skyblock/darkauction/estimate").then(resp => resp.json().catch(err => {
                      console.error("Fetching failed.");
                      error = true;
                      }));
                  var bankInterest = await fetch("https://hypixel-api.inventivetalent.org/api/skyblock/bank/interest/estimate").then(resp => resp.json().catch(err => {
                      console.error("Fetching failed.");
                      error = true;
                      }));
                  var newYear = await fetch("https://hypixel-api.inventivetalent.org/api/skyblock/newyear/estimate").then(resp => resp.json().catch(err => {
                      console.error("Fetching failed.");
                      error = true;
                      }));
                  var travelZoo = await fetch("https://hypixel-api.inventivetalent.org/api/skyblock/zoo/estimate").then(resp => resp.json().catch(err => {
                      console.error("Fetching failed.");
                      error = true;
                      }));
                  var spookyFest = await fetch("https://hypixel-api.inventivetalent.org/api/skyblock/spookyFestival/estimate").then(resp => resp.json().catch(err => {
                      console.error("Fetching failed.");
                      error = true;
                      }));
                  var winterEvent = await fetch("https://hypixel-api.inventivetalent.org/api/skyblock/winter/estimate").then(resp => resp.json().catch(err => {
                      console.error("Fetching failed.");
                      error = true;
                      }));
                  var jerryWorkshop = await fetch("https://hypixel-api.inventivetalent.org/api/skyblock/jerryWorkshop/estimate").then(resp => resp.json().catch(err => {
                      console.error("Fetching failed.");
                      error = true;
                      }));
                  
                  function estimateStringify(estimateObj) {
                    var estimate = ((estimateObj ? estimateObj.estimate : 0) - Date.now());
                    var sec = estimate / 1000;
                    var dh = Math.floor((sec % 86400) / 3600);
                    var dm = Math.floor(((sec % 86400) % 3600) / 60);
                    var ds = Math.floor(((sec % 86400) % 3600) % 60);
                    var h = "";
                    var m = "";
                    var s = "";
                    if (dh !== 0) {
                      h = " " + dh + " hours";
                    }
                    if (dm !== 0) {
                      m = " " + dm + " minutes";
                    }
                    if (ds !== 0) {
                      s = " " + ds + " seconds";
                    }
                    var str = h + m + s;
                    return str;
                  }
                  
                  var magmaStr = estimateStringify(magmaBoss);
                  var darkStr = estimateStringify(darkAuction);
                  var bankStr = estimateStringify(bankInterest);
                  var yearStr = estimateStringify(newYear);
                  var zooStr = estimateStringify(travelZoo);
                  var spookStr = estimateStringify(spookyFest);
                  var winterStr = estimateStringify(winterEvent);
                  var jerryStr = estimateStringify(jerryWorkshop);
                  
                  var profiles = Object.values(sb.profiles);
                  for(const profile of profiles) {
                    var skyblock = await fetch(`https://api.slothpixel.me/api/skyblock/profile/${res[0].id}/${profile.profile_id}`).then(resp => resp.json().catch(err => {
                      console.error("Fetching failed.");
                      error = true;
                      }));

                      if(error) {
                        return message.channel.send("https://sky.lea.moe/stats/" + res[0].name);
                      }
                    
                    var memberCount = Object.keys(skyblock.members).length;
                    var members = Object.values(skyblock.members);
                    var memberName = [];
                    for(const member of members) {
                      memberName.push(member.player.username);
                    }
                    
                    var user = skyblock.members[res[0].id];
                    var armors = user.armor;
                    var armorName = [];
                    
                    if(!armors) {
                      armorName = ["None", "None", "None", "None"]
                    } else {
                      for(var i = 3; i > -1; i--) {
                        var armor = armors[i];
                        if(armor && armor.name)
                        armorName.push(armor.name.slice(2));
                        else armorName.push("None");
                      }
                    }
                    var purse = user.coin_purse;
                    var kills = user.stats.total_kills;
                    var deaths = user.stats.total_deaths;
                    var auction = user.stats.auctions;
                    var sold = auction.sold;
                    var bought = auction.bought;
                    var skills = user.skills;
                    var slayer = user.slayer;
                    var skillArr = [];
                    
                    for(let i = 0; i < Object.keys(skills).length; i++) {
                      let skillName = Object.keys(skills)[i].slice(0, 1).toUpperCase() + Object.keys(skills)[i].slice(1);
                      let xp = Object.values(skills)[i].xpCurrent;
                      let xpNext = Object.values(skills)[i].xpForNext;
                      let level = Object.values(skills)[i].level;
                      let str = `**${skillName}**: Level: **${level}** | Next Level: **${xp}/${xpNext}**`;
                      skillArr.push(str)
                    }
                    
                    const Embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(rank + res[0].name)
                    .setURL("https://sky.lea.moe/stats/" + res[0].name)
                    .setDescription("SkyBlock - **" + profile.cute_name + "**\n" + `Members [${memberCount}]: ${memberName.join(", ")}\n\n**Magma Boss** in **${magmaStr}**\n**Dark Auction** in **${darkStr}**\n**Bank Interest** in **${bankStr}**\n**New Year** in **${yearStr}**\n**Travelling Zoo** in **${zooStr}**\n**Spooky Festival** in **${spookStr}**\n**Winter Event** in **${winterStr}**\n**Jerry Workshop** in **${jerryStr}**`)
                    .addField("Purse", numberWithCommas(purse), true)
                    .addField("Total Kills", numberWithCommas(kills), true)
                    .addField("Total Deaths", numberWithCommas(deaths), true)
                    .addField("Armors", `\`${armorName.join("`\n`")}\``)
                    .addField("Auctions", `Created: ${numberWithCommas(auction.created)}\nCompleted: ${numberWithCommas(auction.completed)}\nNo Bids: ${numberWithCommas(auction.no_bids)}\nWon: ${numberWithCommas(auction.won)}\nBids: ${numberWithCommas(auction.bids)}\nHighest Bid: ${numberWithCommas(auction.highest_bid)}\nTotal Fee: ${numberWithCommas(auction.total_fees)}\nGold Earned: ${numberWithCommas(auction.gold_earned)}\nGold Spent: ${numberWithCommas(auction.gold_spent)}`)
                    .addField("Sold", `Common: ${isNaN(sold.common) ? 0 : sold.common}\nUncommon: ${isNaN(sold.uncommon) ? 0 : sold.uncommon}\nRare: ${isNaN(sold.rare) ? 0 : sold.rare}\nEpic: ${isNaN(sold.epic) ? 0 : sold.epic}\nLegendary: ${isNaN(sold.legendary) ? 0 : sold.legendary}`, true)
                    .addField("Bought", `Common: ${isNaN(bought.common) ? 0 : bought.common}\nUncommon: ${isNaN(bought.uncommon) ? 0 : bought.uncommon}\nRare: ${isNaN(bought.rare) ? 0 : bought.rare}\nEpic: ${isNaN(bought.epic) ? 0 : bought.epic}\nLegendary: ${isNaN(bought.legendary) ? 0 : bought.legendary}`, true)
                    .addField("Skills", skillArr.join("\n"))
                  .setTimestamp()
                    .setFooter(
                      "Have a nice day! :)",
                      message.client.user.displayAvatarURL()
                    );
                    
                    for(let i = 0; i < Object.keys(slayer).length; i++) {
                      let slayerName = Object.keys(slayer)[i].slice(0, 1).toUpperCase() + Object.keys(slayer)[i].slice(1);
                      let level = Object.values(slayer)[i].claimed_levels;
                      let xp = Object.values(slayer)[i].xp;
                      let killsTier = Object.values(slayer)[i].kills_tier;
                      let bossKills = [];
                      for(let s = 0; s < Object.keys(killsTier).length; s++) {
                        let bossLevel = Object.keys(killsTier)[s];
                        let levelKills = Object.values(killsTier)[s];
                        let str = `**Level ${bossLevel}**: ${levelKills}`;
                        bossKills.push(str);
                      }
                      let str = `**Claimed Level:** ${level}\n**XP:** ${xp}\n**Boss Killed:**\n${bossKills.join("\n")}\n`;
                      Embed.addField(`${slayerName} Slayer`, str, true)
                    }
                    
                    allEmbeds.push(Embed);
                  }
                  
                  
                  var s = 0;
                  var msg = await message.channel.send(allEmbeds[0]);

                  await msg.react("⏮");
                  await msg.react("◀");
                  await msg.react("▶");
                  await msg.react("⏭");
                  await msg.react("⏹");
                  var collector = await msg.createReactionCollector(filter, {
                    idle: 60000,
                    errors: ["time"]
                  });

                  collector.on("collect", function(reaction, user) {
                    reaction.users.remove(user.id);
                    switch (reaction.emoji.name) {
                      case "⏮":
                        s = 0;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "◀":
                        s -= 1;
                        if (s < 0) {
                          s = allEmbeds.length - 1;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "▶":
                        s += 1;
                        if (s > allEmbeds.length - 1) {
                          s = 0;
                        }
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏭":
                        s = allEmbeds.length - 1;
                        msg.edit(allEmbeds[s]);
                        break;
                      case "⏹":
                        collector.emit("end");
                        break;
                    }
                  });
                  collector.on("end", async function() {
                    msg.reactions.removeAll().catch(console.error);
                    await msg.edit({ content: "Loading simplier version...", embed: null });
                    await msg.edit("https://sky.lea.moe/stats/" + res[0].name);
                  });
                }
              }
            }
          );
        }
      });
    }
  }
};
