const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "shop",
  description: "Spend your money here!",
  usage: " ",
  execute(message, args, pool) {
    if(message.author.id !== process.env.DC) return message.channel.send("This command is not finished. Please be patient...")
    pool.getConnection(function(err, con) {
      if (err)
        return message.reply(
          "there was an error trying to execute that command!"
        );
      mainMenu();
      function mainMenu(msg) {
      con.query(
        "SELECT * FROM currency WHERE user_id = " +
          message.author.id +
          " AND guild = " +
          message.guild.id,
        async function(err, results, fields) {
          if (err)
            return message.reply(
              "there was an error trying to execute that command!"
            );
          if (results.length == 0) {
            var cash = 0;
          } else {
            var cash = results[0].currency;
          }
          const shop = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle("Welcome to the shop!")
            .setDescription("Choose an action:\n\n1️⃣ Shop\n2️⃣ Leave")
            .setFooter("You have $" + cash, message.author.displayAvatarURL());

          const leave = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle("You were told to leave.")
            .setDescription("The staff waited too long and tells you to leave.")
            .setFooter("You have $" + cash, message.author.displayAvatarURL());

          if(msg === undefined)
          var msg = await message.channel.send(shop);
          else
          var msg = await msg.edit(shop);
          
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
            con.query("SELECT * FROM shop", async function(err, results, fields) {
              if (err)
                return message.reply(
                  "there was an error trying to execute that command!"
                );
              for (var i = 0; i < results.length; i++)
                allItems.push(`**${results[i].id}.** ${results[i].name}`);

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
              var collected = await msg.channel.awaitMessages(x => x.author.id === message.author.id, { max: 1, time: 30000, errors: ["time"]}).catch(() => {
                menu.setDescription("30 seconds passed. Returning to main menu in 3 seconds...")
                .setFooter("Please be patient.", message.client.user.displayAvatarURL());
                msg.edit(menu);
                return setTimeout(() => mainMenu(msg), 3000);
              });
              collected.first().delete();
              var index = parseInt(collected.first().content);
              if(isNaN(index)) {
                menu.setDescription("Invalid number. Returning to main menu in 3 seconds...")
                .setFooter("Please be patient.", message.client.user.displayAvatarURL());
                msg.edit(menu); 
                return setTimeout(() => mainMenu(msg), 3000);
              }
              if(index === 0) {
                menu.setDescription("Cancelled action. Returning to main menu in 3 seconds...")
                .setFooter("Please be patient.", message.client.user.displayAvatarURL());
                msg.edit(menu);
                return setTimeout(() => mainMenu(msg), 3000);
               }
            });
          }

          const manualLeave = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle("Goodbye!")
            .setDescription("said the staff.")
            .setFooter("You have $" + cash, message.author.displayAvatarURL());

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
