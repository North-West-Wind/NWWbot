const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "shop",
  description: "Spend the money you gained from work or lottery.",
  usage: " ",
  category: 2,
  execute(message, args, pool) {
    pool.getConnection(function(err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to connect to the database!"
        );
      }
      mainMenu();
      function mainMenu(msg = undefined) {
        var mesg = msg;
        con.query(
          "SELECT * FROM currency WHERE user_id = " + message.author.id,
          async function(err, results) {
            if (err) {
              console.error(err);
              return message.reply(
                "there was an error trying to fetch data from the database!"
              );
            }
            if (results.length == 0) {
              var cash = 0;
            } else {
              var cash = results[0].currency;
            }
            const shop = new Discord.MessageEmbed()
              .setTimestamp()
              .setColor(color)
              .setTitle("Welcome to the shop!")
              .setDescription("Choose an action:\n\n1️⃣ Shop\n2️⃣ Leave")
              .setFooter(
                "You have $" + cash,
                message.author.displayAvatarURL()
              );

            const leave = new Discord.MessageEmbed()
              .setTimestamp()
              .setColor(color)
              .setTitle("You were told to leave.")
              .setDescription(
                "The staff waited too long and told you to leave."
              )
              .setFooter(
                "You have $" + cash,
                message.author.displayAvatarURL()
              );

            if (mesg === undefined) {
              var msg = await message.channel.send(shop);
            } else {
              var msg = await mesg.edit(shop);
            }

            await msg.react("1️⃣");
            await msg.react("2️⃣");

            const filter = (reaction, user) => {
              return (
                ["1️⃣", "2️⃣"].includes(reaction.emoji.name) &&
                user.id === message.author.id
              );
            };
            var collected = await msg
              .awaitReactions(filter, { max: 1, idle: 60000, error: ["time"] })
              .catch(err => {
                msg.edit(leave);
                return msg.reactions.removeAll().catch(console.error);
              });
            var reaction = collected.first();
            msg.reactions.removeAll().catch(console.error);

            function shopMenu() {
              var allItems = [];
              con.query("SELECT * FROM shop", async function(
                err,
                results
              ) {
                if (err) {
                  console.error(err);
                  return message.reply(
                    "there was an error trying to fetch data from the database!"
                  );
                }
                for (var i = 0; i < results.length; i++)
                  allItems.push(
                    `**${results[i].id}.** ${results[i].name} - **\$${results[i].buy_price}**`
                  );

                const menu = new Discord.MessageEmbed()
                  .setColor(color)
                  .setTitle("Shop Menu")
                  .setDescription(
                    "Type the ID to buy or `0` to cancel.\n\n" +
                      allItems.join("\n")
                  )
                  .setTimestamp()
                  .setFooter(
                    "You have $" + cash,
                    message.author.displayAvatarURL()
                  );
                await msg.edit(menu);
                var collected = await msg.channel
                  .awaitMessages(x => x.author.id === message.author.id, {
                    max: 1,
                    time: 30000,
                    errors: ["time"]
                  })
                  .catch(() => {
                    menu
                      .setDescription(
                        "30 seconds passed. Returning to main menu in 3 seconds..."
                      )
                      .setFooter(
                        "Please be patient.",
                        message.client.user.displayAvatarURL()
                      );
                    msg.edit(menu);
                    return setTimeout(() => mainMenu(msg), 3000);
                  });
                collected.first().delete();
                var index = parseInt(collected.first().content);
                if (isNaN(index)) {
                  menu
                    .setDescription(
                      "Invalid number. Returning to main menu in 3 seconds..."
                    )
                    .setFooter(
                      "Please be patient.",
                      message.client.user.displayAvatarURL()
                    );
                  msg.edit(menu);
                  return setTimeout(() => mainMenu(msg), 3000);
                }
                if (index === 0) {
                  menu
                    .setDescription(
                      "Cancelled action. Returning to main menu in 3 seconds..."
                    )
                    .setFooter(
                      "Please be patient.",
                      message.client.user.displayAvatarURL()
                    );
                  msg.edit(menu);
                  return setTimeout(() => mainMenu(msg), 3000);
                }
                viewItem(msg, index);
              });
            }

            async function viewItem(msg, id) {
              con.query(
                "SELECT * FROM shop WHERE id = " + id,
                async (err, result) => {
                  if (err) {
                    console.error(err);
                    return message.reply(
                      "there was an error trying to fetch data from the database!"
                    );
                  }
                  if (result.length == 0) {
                    var itemEmbed = new Discord.MessageEmbed()
                      .setTimestamp()
                      .setColor(color)
                      .setTitle("No item found!")
                      .setDescription("Returning to main menu in 3 seconds...")
                      .setFooter(
                        "Please be patient.",
                        message.client.user.displayAvatarURL()
                      );

                    await msg.edit(itemEmbed);
                    return setTimeout(() => mainMenu(msg), 3000);
                  } else {
                    var itemEmbed = new Discord.MessageEmbed()
                      .setTimestamp()
                      .setColor(color)
                      .setTitle(result[0].name)
                      .setDescription(
                        "Buy Price: **$" +
                          result[0].buy_price +
                          "**\n" +
                          result[0].description +
                          "\n\n1️⃣ Buy\n2️⃣ Return"
                      )
                      .setFooter(
                        "Please answer within 30 seconds.",
                        message.client.user.displayAvatarURL()
                      );

                    await msg.edit(itemEmbed);
                    await msg.react("1️⃣");
                    await msg.react("2️⃣");

                    var collected = await msg
                      .awaitReactions(filter, {
                        max: 1,
                        idle: 30000,
                        errors: ["time"]
                      })
                      .catch(async () => {
                        itemEmbed
                          .setTitle("Please leave if you are not buying stuff!")
                          .setDescription(
                            "Returning to main menu in 3 seconds..."
                          )
                          .setFooter(
                            "Please be patient.",
                            message.client.user.displayAvatarURL()
                          );
                        await msg.edit(itemEmbed);
                        setTimeout(() => mainMenu(msg), 3000);
                      });

                    var reaction = collected.first();
                    msg.reactions.removeAll().catch(console.error);

                    if (reaction.emoji.name === "1️⃣") {
                      if (Number(cash) < Number(result[0].buy_price)) {
                        itemEmbed
                          .setTitle(
                            "You don't have enough money to buy " +
                              result[0].name +
                              "!"
                          )
                          .setDescription(
                            "Returning to main menu in 3 seconds..."
                          )
                          .setFooter(
                            "Please be patient.",
                            message.client.user.displayAvatarURL()
                          );
                        await msg.edit(itemEmbed);
                        setTimeout(() => mainMenu(msg), 3000);
                      } else {
                        itemEmbed
                          .setTitle("You bought " + result[0].name + "!")
                          .setDescription(
                            "Returning to main menu in 3 seconds..."
                          )
                          .setFooter(
                            "Please be patient.",
                            message.client.user.displayAvatarURL()
                          );
                        var paid = cash - result[0].buy_price;
                        con.query(
                          "UPDATE currency SET currency = " +
                            paid +
                            " WHERE user_id = '" +
                            message.author.id +
                            "'",
                          async function(err) {
                            if (err) itemEmbed.setTitle("Failed to purchase!");
                            con.query(
                              "SELECT * FROM inventory WHERE id = '" +
                                message.author.id +
                                "'",
                              function(err, IResult) {
                                if (err)
                                  itemEmbed.setTitle("Failed to purchase!");
                                var itemObject = {
                                  "1": 0,
                                  "2": 0
                                };
                                if (IResult.length === 0) {
                                  itemObject[result[0].id.toString()] += 1;
                                  con.query(
                                    `INSERT INTO inventory VALUES('${
                                      message.author.id
                                    }', '${escape(
                                      JSON.stringify(itemObject)
                                    )}')`,
                                    async function(err) {
                                      if (err)
                                        itemEmbed.setTitle(
                                          "Failed to purchase!"
                                        );
                                      await msg.edit(itemEmbed);
                                      setTimeout(() => mainMenu(msg), 3000);
                                    }
                                  );
                                } else {
                                  var oldItems = JSON.parse(
                                    unescape(IResult[0].items)
                                  );
                                  for (
                                    var i = 1;
                                    i <= Object.values(itemObject).length;
                                    i++
                                  ) {
                                    var id = i.toString();
                                    itemObject[id] =
                                      oldItems[id] === undefined
                                        ? 0
                                        : oldItems[id];
                                  }
                                  itemObject[result[0].id.toString()] += 1;
                                  con.query(
                                    `UPDATE inventory SET items = '${escape(
                                      JSON.stringify(itemObject)
                                    )}' WHERE id = '${message.author.id}'`,
                                    async function(err) {
                                      if (err)
                                        itemEmbed.setTitle(
                                          "Failed to purchase!"
                                        );
                                      await msg.edit(itemEmbed);
                                      setTimeout(() => mainMenu(msg), 3000);
                                    }
                                  );
                                }
                              }
                            );
                          }
                        );
                      }
                    } else if (reaction.emoji.name === "2️⃣") {
                      itemEmbed
                        .setTitle("You want to look at the menu again.")
                        .setDescription(
                          "Returning to main menu in 3 seconds..."
                        )
                        .setFooter(
                          "Please be patient.",
                          message.client.user.displayAvatarURL()
                        );
                      await msg.edit(itemEmbed);
                      setTimeout(() => mainMenu(msg), 3000);
                    }
                  }
                }
              );
            }

            const manualLeave = new Discord.MessageEmbed()
              .setTimestamp()
              .setColor(color)
              .setTitle("Goodbye!")
              .setDescription("said the staff.")
              .setFooter(
                "You have $" + cash,
                message.author.displayAvatarURL()
              );

            if (reaction === undefined) return msg.edit(leave);

            if (reaction.emoji.name === "1️⃣") {
              shopMenu();
            } else if (reaction.emoji.name === "2️⃣") {
              msg.edit(manualLeave);
            }
          }
        );
      }
      con.release();
    });
  }
};
