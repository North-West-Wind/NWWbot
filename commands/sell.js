const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { twoDigits } = require("../function.js");

module.exports = {
  name: "sell",
  description: "Put something to the cross-server shop and sell it!",
  usage: "<price> <item>",
  args: true,
  category: 9,
  async execute(message, args, pool) {
    if (!args[0]) return message.channel.send("Please state the price!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);
    if (!args[1]) return message.channel.send("Please provide the item!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);

    if (isNaN(Number(args[0])))
      return message.channel.send(args[0] + " is not a valid price!");

    var price = Math.round((Number(args[0]) + Number.EPSILON) * 100) / 100;

    const confirmationEmbed = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle("Confirm?")
      .setDescription(
        "This will cost 5% of the price to put it at the shop! The item will be up for 7 days.\n\n✅ Confirm\n❌ Cancel"
      )
      .addField("Price", price)
      .addField("Item", args.slice(1).join(" "))
      .setFooter(
        "Please answer within 30 seconds.",
        message.client.user.displayAvatarURL()
      );

    var msg = await message.channel.send(confirmationEmbed);
    await msg.react("✅");
    await msg.react("❌");

    const filter = (reaction, user) =>
      ["✅", "❌"].includes(reaction.emoji.name) &&
      user.id === message.author.id &&
      !user.bot;

    var collected = await msg
      .awaitReactions(filter, { time: 30000, max: 1, error: ["time"] })
      .catch(err => {
        confirmationEmbed
          .setTitle("Cancelled")
          .setDescription("Timed out.")
          .setFooter(
            "Please try again.",
            message.client.user.displayAvatarURL()
          );
        msg.edit(confirmationEmbed);
        msg.reactions.removeAll().catch(console.error);
      });

    var reaction = collected.first();

    if (reaction.emoji.name === "✅") {
      var currentDate = new Date();

      var newDate = new Date(currentDate.getTime() + 604800000);

      var date = newDate.getDate();
      var month = newDate.getMonth();
      var year = newDate.getFullYear();
      var hour = newDate.getHours();
      var minute = newDate.getMinutes();
      var second = newDate.getSeconds();

      var newDateSql =
        year +
        "-" +
        twoDigits(month + 1) +
        "-" +
        twoDigits(date) +
        " " +
        twoDigits(hour) +
        ":" +
        twoDigits(minute) +
        ":" +
        twoDigits(second);
      pool.getConnection(function(err, con) {
        con.query(
          "SELECT currency FROM currency WHERE user_id = " +
            message.author.id +
            " AND guild = " +
            message.guild.id,
          function(err, result, fields) {
            if (err) return message.reply("there was an error trying to execute that command!");
            if (result.length == 0)
              return message.channel.send("You don't have any money!");
            if (result[0].currency < price * 0.05)
              return message.channel.send("You don't have enough money!");
            con.query(
              "INSERT INTO shop(item, price, endAt) VALUES('" +
                args
                  .slice(1)
                  .join(" ")
                  .replace(/"/g, '\\"')
                  .replace(/'/g, "\\'") +
                "', " +
                price +
                ", '" +
                newDateSql +
                "')",
              function(err) {
                if (err) return message.reply("there was an error trying to execute that command!");
                con.query(
                  "UPDATE currency SET currency = " +
                    (result[0].currency - price * 0.05) +
                    " WHERE user_id = " +
                    message.author.id +
                    " AND guild = " +
                    message.guild.id,
                  function(err) {
                    if (err) return message.reply("there was an error trying to execute that command!");
                    confirmationEmbed
                      .setTitle("Confirmed!")
                      .setDescription("Your item is now at the shop!")
                      .setFooter(
                        "Have a nice day! :)",
                        message.client.user.displayAvatarURL()
                      );
                    msg.edit(confirmationEmbed);
                    msg.reactions.removeAll().catch(console.error);
                  }
                );
              }
            );
          }
        );
        if (err) return message.reply("there was an error trying to execute that command!");

        con.release();
      });
    } else {
      confirmationEmbed
        .setTitle("Cancelled")
        .setDescription("Your choice is to cancel it.")
        .setFooter(
          "Have a nice day! :)",
          message.client.user.displayAvatarURL()
        );
      msg.edit(confirmationEmbed);
    }
  }
};
