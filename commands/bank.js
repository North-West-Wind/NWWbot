const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { prefix } = require("../config.json");

module.exports = {
  name: "bank",
  description:
    "Display your Discord Economy status. You can also deposit or withdraw money with this command.",
  usage: " ",
  async execute(message, args, pool) {
    pool.getConnection(async function(err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to execute that command!"
        );
      }
      con.query(
        "SELECT * FROM currency WHERE user_id = " +
          message.author.id +
          " AND guild = " +
          message.guild.id,
        async function(err, results, fields) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to execute that command!"
            );
          }
          if (results.length == 0) {
            return message.channel.send(
              "You don't have any bank account registered. Use `" +
                prefix +
                "work` to work and have an account registered!"
            );
          } else {
            var cash = results[0].currency;
            var bank = results[0].bank;
            const Embed = new Discord.MessageEmbed()
              .setColor(color)
              .setTitle(message.author.tag)
              .setDescription("Economic status\n\n1️⃣Deposit\n2️⃣Withdraw")
              .addField("Bank", "$" + bank)
              .addField("Cash", "$" + cash)
              .setTimestamp()
              .setFooter(
                'You can try to "deposit" or "withdraw"!',
                message.client.user.displayAvatarURL()
              );
            var msg = await message.channel.send(Embed);
            await msg.react("1️⃣");
            await msg.react("2️⃣");

            MainPage();

            async function MainPage() {
              con.query(
                "SELECT * FROM currency WHERE user_id = " +
                  message.author.id +
                  " AND guild = " +
                  message.guild.id,
                async function(err, newResults, fields) {
                  cash = newResults[0].currency;
                  bank = newResults[0].bank;
                  const embed = new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(message.author.tag)
                    .setDescription("Economic status\n\n1️⃣Deposit\n2️⃣Withdraw")
                    .addField("Bank", "$" + bank)
                    .addField("Cash", "$" + cash)
                    .setTimestamp()
                    .setFooter(
                      'You can try to "deposit" or "withdraw"!',
                      message.client.user.displayAvatarURL()
                    );
                  msg.edit(embed);
                  await msg.react("1️⃣");
                  await msg.react("2️⃣");
                  const filter = (reaction, user) => {
                    return (
                      ["1️⃣", "2️⃣"].includes(reaction.emoji.name) &&
                      user.id === message.author.id
                    );
                  };

                  var collected = await msg
                    .awaitReactions(filter, {
                      max: 1,
                      time: 30000,
                      errors: ["time"]
                    })
                    .catch(() => msg.reactions.removeAll());
                  try {
                    var reaction = collected.first();
                  } catch (err) {
                    return;
                  }
                  msg.reactions.removeAll().catch(console.error);

                  if (reaction.emoji.name === "1️⃣") {
                    var depositEmbed = new Discord.MessageEmbed()
                      .setColor(color)
                      .setTitle("Deposit")
                      .setDescription(
                        "Please enter the amount you want to deposit.\n(Can also enter `all`, `half` or `quarter`)"
                      )
                      .setTimestamp()
                      .setFooter(
                        "Please enter within 60 seconds.",
                        message.client.user.displayAvatarURL()
                      );
                    await msg.edit(depositEmbed);

                    var amount = await msg.channel
                      .awaitMessages(x => x.author.id === message.author.id, {
                        max: 1,
                        time: 60000,
                        errors: ["times"]
                      })
                      .catch(() => {});
                    amount.first().delete();

                    if (isNaN(parseInt(amount.first().content))) {
                      con.query(
                        "SELECT * FROM currency WHERE user_id = " +
                          message.author.id +
                          " AND guild = " +
                          message.guild.id,
                        async function(err, results, fields) {
                          if (amount.first().content === "quarter") {
                            var deposits =
                              Math.round(
                                (Number(newResults[0].currency) / 4 +
                                  Number.EPSILON) *
                                  100
                              ) / 100;
                            var newCurrency =
                              Number(newResults[0].currency) - deposits;
                            var newBank = Number(newResults[0].bank) + deposits;
                            con.query(
                              "UPDATE currency SET `currency` = '" +
                                newCurrency +
                                "', `bank` = '" +
                                newBank +
                                "' WHERE user_id = " +
                                message.author.id +
                                " AND guild = " +
                                message.guild.id,
                              async function(err, result) {
                                if (err) {
                                  console.error(err);
                                  return message.reply(
                                    "there was an error trying to execute that command!"
                                  );
                                }
                                var depositedEmbed = new Discord.MessageEmbed()
                                  .setColor(color)
                                  .setTitle("Deposition Successful")
                                  .setDescription(
                                    "Deposited **$" + deposits + "** into bank!"
                                  )
                                  .setTimestamp()
                                  .setFooter(
                                    "Returning to main page in 3 seconds...",
                                    message.client.user.displayAvatarURL()
                                  );

                                await msg.edit(depositedEmbed);

                                setTimeout(() => MainPage(), 3000);
                              }
                            );
                          } else if (amount.first().content === "half") {
                            var deposits =
                              Math.round(
                                (Number(newResults[0].currency) / 2 +
                                  Number.EPSILON) *
                                  100
                              ) / 100;
                            var newCurrency =
                              Number(newResults[0].currency) - deposits;
                            var newBank = Number(newResults[0].bank) + deposits;
                            con.query(
                              "UPDATE currency SET `currency` = '" +
                                newCurrency +
                                "', `bank` = '" +
                                newBank +
                                "' WHERE user_id = " +
                                message.author.id +
                                " AND guild = " +
                                message.guild.id,
                              async function(err, result) {
                                if (err) {
                                  console.error(err);
                                  return message.reply(
                                    "there was an error trying to execute that command!"
                                  );
                                }
                                var depositedEmbed = new Discord.MessageEmbed()
                                  .setColor(color)
                                  .setTitle("Deposition Successful")
                                  .setDescription(
                                    "Deposited **$" + deposits + "** into bank!"
                                  )
                                  .setTimestamp()
                                  .setFooter(
                                    "Returning to main page in 3 seconds...",
                                    message.client.user.displayAvatarURL()
                                  );

                                await msg.edit(depositedEmbed);

                                setTimeout(() => MainPage(), 3000);
                              }
                            );
                          } else if (amount.first().content === "all") {
                            var deposits =
                              Math.round(
                                (Number(newResults[0].currency) +
                                  Number.EPSILON) *
                                  100
                              ) / 100;
                            var newCurrency =
                              Number(newResults[0].currency) - deposits;
                            var newBank = Number(newResults[0].bank) + deposits;
                            con.query(
                              "UPDATE currency SET `currency` = '" +
                                newCurrency +
                                "', `bank` = '" +
                                newBank +
                                "' WHERE user_id = " +
                                message.author.id +
                                " AND guild = " +
                                message.guild.id,
                              async function(err, result) {
                                if (err) {
                                  console.error(err);
                                  return message.reply(
                                    "there was an error trying to execute that command!"
                                  );
                                }
                                var depositedEmbed = new Discord.MessageEmbed()
                                  .setColor(color)
                                  .setTitle("Deposition Successful")
                                  .setDescription(
                                    "Deposited **$" + deposits + "** into bank!"
                                  )
                                  .setTimestamp()
                                  .setFooter(
                                    "Returning to main page in 3 seconds...",
                                    message.client.user.displayAvatarURL()
                                  );

                                await msg.edit(depositedEmbed);

                                setTimeout(() => MainPage(), 3000);
                              }
                            );
                          } else {
                            var depositedEmbed = new Discord.MessageEmbed()
                              .setColor(color)
                              .setTitle("Deposition Failed")
                              .setDescription("That is not a valid amount!")
                              .setTimestamp()
                              .setFooter(
                                "Returning to main page in 3 seconds...",
                                message.client.user.displayAvatarURL()
                              );

                            await msg.edit(depositedEmbed);

                            setTimeout(() => MainPage(), 3000);
                          }
                        }
                      );
                    } else {
                      con.query(
                        "SELECT * FROM currency WHERE user_id = " +
                          message.author.id +
                          " AND guild = " +
                          message.guild.id,
                        function(err, results, fields) {
                          var deposits =
                            Number(amount.first().content) >
                            Number(newResults[0].currency)
                              ? Number(newResults[0].currency)
                              : Number(amount.first().content);
                          var newCurrency =
                            Number(newResults[0].currency) - deposits;
                          var newBank = Number(newResults[0].bank) + deposits;
                          con.query(
                            "UPDATE currency SET `currency` = '" +
                              newCurrency +
                              "', `bank` = '" +
                              newBank +
                              "' WHERE user_id = " +
                              message.author.id +
                              " AND guild = " +
                              message.guild.id,
                            async function(err, result) {
                              if (err) {
                                console.error(err);
                                return message.reply(
                                  "there was an error trying to execute that command!"
                                );
                              }
                              var depositedEmbed = new Discord.MessageEmbed()
                                .setColor(color)
                                .setTitle("Deposition Successful")
                                .setDescription(
                                  "Deposited **$" + deposits + "** into bank!"
                                )
                                .setTimestamp()
                                .setFooter(
                                  "Returning to main page in 3 seconds...",
                                  message.client.user.displayAvatarURL()
                                );

                              await msg.edit(depositedEmbed);

                              setTimeout(() => MainPage(), 3000);
                            }
                          );
                        }
                      );
                    }
                  } else {
                    var withdrawEmbed = new Discord.MessageEmbed()
                      .setColor(color)
                      .setTitle("Withdrawal")
                      .setDescription(
                        "Please enter the amount you want to withdraw.\n(Can also enter `all`, `half` or `quarter`)"
                      )
                      .setTimestamp()
                      .setFooter(
                        "Please enter within 60 seconds.",
                        message.client.user.displayAvatarURL()
                      );
                    await msg.edit(withdrawEmbed);

                    var amount = await msg.channel
                      .awaitMessages(x => x.author.id === message.author.id, {
                        max: 1,
                        time: 60000,
                        errors: ["times"]
                      })
                      .catch(() => {});

                    amount.first().delete();

                    if (isNaN(parseInt(amount.first().content))) {
                      con.query(
                        "SELECT * FROM currency WHERE user_id = " +
                          message.author.id +
                          " AND guild = " +
                          message.guild.id,
                        async function(err, results, fields) {
                          if (amount.first().content === "quarter") {
                            var deposits =
                              Math.round(
                                (Number(newResults[0].bank) / 4 +
                                  Number.EPSILON) *
                                  100
                              ) / 100;
                            var newCurrency =
                              Number(newResults[0].currency) + deposits;
                            var newBank = Number(newResults[0].bank) - deposits;
                            con.query(
                              "UPDATE currency SET `currency` = '" +
                                newCurrency +
                                "', `bank` = '" +
                                newBank +
                                "' WHERE user_id = " +
                                message.author.id +
                                " AND guild = " +
                                message.guild.id,
                              async function(err, result) {
                                if (err) {
                                  console.error(err);
                                  return message.reply(
                                    "there was an error trying to execute that command!"
                                  );
                                }
                                var withdrawedEmbed = new Discord.MessageEmbed()
                                  .setColor(color)
                                  .setTitle("Withdrawal Successful")
                                  .setDescription(
                                    "Withdrawed **$" +
                                      deposits +
                                      "** from bank!"
                                  )
                                  .setTimestamp()
                                  .setFooter(
                                    "Returning to main page in 3 seconds...",
                                    message.client.user.displayAvatarURL()
                                  );

                                await msg.edit(withdrawedEmbed);

                                setTimeout(() => MainPage(), 3000);
                              }
                            );
                          } else if (amount.first().content === "half") {
                            var deposits =
                              Math.round(
                                (Number(newResults[0].bank) / 2 +
                                  Number.EPSILON) *
                                  100
                              ) / 100;
                            var newCurrency =
                              Number(newResults[0].currency) + deposits;
                            var newBank = Number(newResults[0].bank) - deposits;
                            con.query(
                              "UPDATE currency SET `currency` = '" +
                                newCurrency +
                                "', `bank` = '" +
                                newBank +
                                "' WHERE user_id = " +
                                message.author.id +
                                " AND guild = " +
                                message.guild.id,
                              async function(err, result) {
                                if (err) {
                                  console.error(err);
                                  return message.reply(
                                    "there was an error trying to execute that command!"
                                  );
                                }
                                var withdrawedEmbed = new Discord.MessageEmbed()
                                  .setColor(color)
                                  .setTitle("Withdrawal Successful")
                                  .setDescription(
                                    "Withdrawed **$" +
                                      deposits +
                                      "** from bank!"
                                  )
                                  .setTimestamp()
                                  .setFooter(
                                    "Returning to main page in 3 seconds...",
                                    message.client.user.displayAvatarURL()
                                  );

                                await msg.edit(withdrawedEmbed);

                                setTimeout(() => MainPage(), 3000);
                              }
                            );
                          } else if (amount.first().content === "all") {
                            var deposits =
                              Math.round(
                                (Number(newResults[0].bank) + Number.EPSILON) *
                                  100
                              ) / 100;
                            var newCurrency =
                              Number(newResults[0].currency) + deposits;
                            var newBank = Number(newResults[0].bank) - deposits;
                            con.query(
                              "UPDATE currency SET `currency` = '" +
                                newCurrency +
                                "', `bank` = '" +
                                newBank +
                                "' WHERE user_id = " +
                                message.author.id +
                                " AND guild = " +
                                message.guild.id,
                              async function(err, result) {
                                if (err) {
                                  console.error(err);
                                  return message.reply(
                                    "there was an error trying to execute that command!"
                                  );
                                }
                                var withdrawedEmbed = new Discord.MessageEmbed()
                                  .setColor(color)
                                  .setTitle("Withdrawal Successful")
                                  .setDescription(
                                    "Withdrawed **$" +
                                      deposits +
                                      "** from bank!"
                                  )
                                  .setTimestamp()
                                  .setFooter(
                                    "Returning to main page in 3 seconds...",
                                    message.client.user.displayAvatarURL()
                                  );

                                await msg.edit(withdrawedEmbed);

                                setTimeout(() => MainPage(), 3000);
                              }
                            );
                          } else {
                            var depositedEmbed = new Discord.MessageEmbed()
                              .setColor(color)
                              .setTitle("Withdrawal Failed")
                              .setDescription("That is not a valid amount!")
                              .setTimestamp()
                              .setFooter(
                                "Returning to main page in 3 seconds...",
                                message.client.user.displayAvatarURL()
                              );

                            await msg.edit(depositedEmbed);

                            setTimeout(() => MainPage(), 3000);
                          }
                        }
                      );
                    } else {
                      con.query(
                        "SELECT * FROM currency WHERE user_id = " +
                          message.author.id +
                          " AND guild = " +
                          message.guild.id,
                        function(err, results, fields) {
                          var deposits =
                            Number(amount.first().content) >
                            Number(newResults[0].bank)
                              ? Number(newResults[0].bank)
                              : Number(amount.first().content);
                          var newCurrency =
                            Number(newResults[0].currency) + deposits;
                          var newBank = Number(newResults[0].bank) - deposits;
                          con.query(
                            "UPDATE currency SET `currency` = '" +
                              newCurrency +
                              "', `bank` = '" +
                              newBank +
                              "' WHERE user_id = " +
                              message.author.id +
                              " AND guild = " +
                              message.guild.id,
                            async function(err, result) {
                              if (err) {
                                console.error(err);
                                return message.reply(
                                  "there was an error trying to execute that command!"
                                );
                              }
                              var withdrawedEmbed = new Discord.MessageEmbed()
                                .setColor(color)
                                .setTitle("Withdrawal Successful")
                                .setDescription(
                                  "Withdrawed **$" + deposits + "** from bank!"
                                )
                                .setTimestamp()
                                .setFooter(
                                  "Returning to main page in 3 seconds...",
                                  message.client.user.displayAvatarURL()
                                );

                              await msg.edit(withdrawedEmbed);

                              setTimeout(() => MainPage(), 3000);
                            }
                          );
                        }
                      );
                    }
                  }
                }
              );
            }
          }
        }
      );
      con.release();
    });
  }
};
