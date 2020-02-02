const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { prefix } = require("../config.json");

module.exports = {
  name: "bank",
  description: "Deposit/Withdraw cash in Discord.",
  usage: "[subcommand]",
  subcommands: ["deposit", "withdraw"],
  execute(message, args, pool) {
    if (!args[0]) {
        pool.getConnection(function(err, con) {
          if (err) throw err;
          con.query(
            "SELECT * FROM currency WHERE user_id = " +
              message.author.id +
              " AND guild = " +
              message.guild.id,
            function(err, results, fields) {
              if (err) throw err;
              if (results.length == 0) {
                return message.channel.send(
                  "You don't have any bank account registered. Use `" +
                    prefix +
                    "econ work` to work and have an account registered!"
                );
              } else {
                var cash = results[0].currency;
                var bank = results[0].bank;
                const Embed = new Discord.RichEmbed()
                  .setColor(color)
                  .setTitle(message.author.tag)
                  .setDescription("Economic status")
                  .addField("Bank", "$" + bank)
                  .addField("Cash", "$" + cash)
                  .setTimestamp()
                  .setFooter(
                    'You can try to "deposit" or "withdraw"!',
                    "https://i.imgur.com/hxbaDUY.png"
                  );
                return message.channel.send(Embed);
              }
            }
          );
          con.release();
        });
      }
      if (args[0] === "deposit") {
        if (!args[1]) {
          return message.channel.send(
            "Please tell me the amount to deposit. (Can be a number, `quarter`, `half`, `all`)"
          );
        }
        if (isNaN(parseInt(args[1]))) {
          pool.getConnection(function(err, con) {
            if (err) throw err;
            con.query(
              "SELECT * FROM currency WHERE user_id = " +
                message.author.id +
                " AND guild = " +
                message.guild.id,
              function(err, results, fields) {
                if (results.length == 0) {
                  return message.channel.send(
                    "You don't have any bank account registered. Use `" +
                      prefix +
                      "econ work` to work and have an account registered!"
                  );
                }
                if (args[1] === "quarter") {
                  var deposits =
                    Math.round(
                      (Number(results[0].currency) / 4 + Number.EPSILON) * 100
                    ) / 100;
                  var newCurrency = Number(results[0].currency) - deposits;
                  var newBank = Number(results[0].bank) + deposits;
                  con.query(
                    "UPDATE currency SET `currency` = '" +
                      newCurrency +
                      "', `bank` = '" +
                      newBank +
                      "' WHERE user_id = " +
                      message.author.id +
                      " AND guild = " +
                      message.guild.id,
                    function(err, result) {
                      if (err) throw err;
                      message.channel.send(
                        "Deposited **$" + deposits + "** into bank!"
                      );
                    }
                  );
                } else if (args[1] === "half") {
                  var deposits =
                    Math.round(
                      (Number(results[0].currency) / 2 + Number.EPSILON) * 100
                    ) / 100;
                  var newCurrency = Number(results[0].currency) - deposits;
                  var newBank = Number(results[0].bank) + deposits;
                  con.query(
                    "UPDATE currency SET `currency` = '" +
                      newCurrency +
                      "', `bank` = '" +
                      newBank +
                      "' WHERE user_id = " +
                      message.author.id +
                      " AND guild = " +
                      message.guild.id,
                    function(err, result) {
                      if (err) throw err;
                      message.channel.send(
                        "Deposited **$" + deposits + "** into bank!"
                      );
                    }
                  );
                } else if (args[1] === "all") {
                  var deposits =
                    Math.round(
                      (Number(results[0].currency) + Number.EPSILON) * 100
                    ) / 100;
                  var newCurrency = Number(results[0].currency) - deposits;
                  var newBank = Number(results[0].bank) + deposits;
                  con.query(
                    "UPDATE currency SET `currency` = '" +
                      newCurrency +
                      "', `bank` = '" +
                      newBank +
                      "' WHERE user_id = " +
                      message.author.id +
                      " AND guild = " +
                      message.guild.id,
                    function(err, result) {
                      if (err) throw err;
                      message.channel.send(
                        "Deposited **$" + deposits + "** into bank!"
                      );
                    }
                  );
                } else {
                  message.channel.send("That amount is not valid!");
                }
              }
            );
            con.release();
          });
        } else {
          pool.getConnection(function(err, con) {
            if (err) throw err;
            con.query(
              "SELECT * FROM currency WHERE user_id = " +
                message.author.id +
                " AND guild = " +
                message.guild.id,
              function(err, results, fields) {
                if (results.length == 0) {
                  return message.channel.send(
                    "You don't have any bank account registered. Use `" +
                      prefix +
                      "econ work` to work and have an account registered!"
                  );
                }
                var deposits = Number(args[1]);
                var newCurrency = Number(results[0].currency) - deposits;
                  var newBank = Number(results[0].bank) + deposits;
                con.query(
                  "UPDATE currency SET `currency` = '" +
                    newCurrency +
                    "', `bank` = '" +
                    newBank +
                    "' WHERE user_id = " +
                    message.author.id +
                    " AND guild = " +
                    message.guild.id,
                  function(err, result) {
                    if (err) throw err;
                    message.channel.send(
                      "Deposited **$" + deposits + "** into bank!"
                    );
                  }
                );
              }
            );
            con.release();
          });
        }
      } else if (args[0] === "withdraw") {
        if (!args[1]) {
          return message.channel.send(
            "Please tell me the amount to withdraw. (Can be a number, `quarter`, `half`, `all`)"
          );
        }
        if (isNaN(parseInt(args[1]))) {
          pool.getConnection(function(err, con) {
            if (err) throw err;
            con.query(
              "SELECT * FROM currency WHERE user_id = " +
                message.author.id +
                " AND guild = " +
                message.guild.id,
              function(err, results, fields) {
                if (results.length == 0) {
                  return message.channel.send(
                    "You don't have any bank account registered. Use `" +
                      prefix +
                      "econ work` to work and have an account registered!"
                  );
                }
                if (args[1] === "quarter") {
                  var deposits =
                    Math.round(
                      (Number(results[0].bank) / 4 + Number.EPSILON) * 100
                    ) / 100;
                  var newCurrency = Number(results[0].currency) + deposits;
                  var newBank = Number(results[0].bank) - deposits;
                  con.query(
                    "UPDATE currency SET `currency` = '" +
                      newCurrency +
                      "', `bank` = '" +
                      newBank +
                      "' WHERE user_id = " +
                      message.author.id +
                      " AND guild = " +
                      message.guild.id,
                    function(err, result) {
                      if (err) throw err;
                      message.channel.send(
                        "Withdrawed **$" + deposits + "** from bank!"
                      );
                    }
                  );
                } else if (args[1] === "half") {
                  var deposits =
                    Math.round(
                      (Number(results[0].bank) / 2 + Number.EPSILON) * 100
                    ) / 100;
                  var newCurrency = Number(results[0].currency) + deposits;
                  var newBank = Number(results[0].bank) - deposits;
                  con.query(
                    "UPDATE currency SET `currency` = '" +
                      newCurrency +
                      "', `bank` = '" +
                      newBank +
                      "' WHERE user_id = " +
                      message.author.id +
                      " AND guild = " +
                      message.guild.id,
                    function(err, result) {
                      if (err) throw err;
                      message.channel.send(
                        "Withdrawed **$" + deposits + "** from bank!"
                      );
                    }
                  );
                } else if (args[1] === "all") {
                  var deposits =
                    Math.round(
                      (Number(results[0].bank) + Number.EPSILON) * 100
                    ) / 100;
                  var newCurrency = Number(results[0].currency) + deposits;
                  var newBank = Number(results[0].bank) - deposits;
                  con.query(
                    "UPDATE currency SET `currency` = '" +
                      newCurrency +
                      "', `bank` = '" +
                      newBank +
                      "' WHERE user_id = " +
                      message.author.id +
                      " AND guild = " +
                      message.guild.id,
                    function(err, result) {
                      if (err) throw err;
                      message.channel.send(
                        "Withdrawed **$" + deposits + "** from bank!"
                      );
                    }
                  );
                } else {
                  message.channel.send("That amount is not valid!");
                }
              }
            );
            con.release();
          });
        } else {
          pool.getConnection(function(err, con) {
            if (err) throw err;
            con.query(
              "SELECT * FROM currency WHERE user_id = " +
                message.author.id +
                " AND guild = " +
                message.guild.id,
              function(err, results, fields) {
                if (results.length == 0) {
                  return message.channel.send(
                    "You don't have any bank account registered. Use `" +
                      prefix +
                      "econ work` to work and have an account registered!"
                  );
                }
                var deposits = Number(args[1]);
                var newCurrency = Number(results[0].currency) + deposits;
                  var newBank = Number(results[0].bank) - deposits;
                con.query(
                  "UPDATE currency SET `currency` = '" +
                    newCurrency +
                    "', `bank` = '" +
                    newBank +
                    "' WHERE user_id = " +
                    message.author.id +
                    " AND guild = " +
                    message.guild.id,
                  function(err, result) {
                    if (err) throw err;
                    message.channel.send(
                      "Withdrawed **$" + deposits + "** from bank!"
                    );
                  }
                );
              }
            );
            con.release();
          });
        }
      }
  }
}