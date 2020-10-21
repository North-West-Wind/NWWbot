const Discord = require("discord.js");
var embedColor = Math.floor(Math.random() * 16777214) + 1;
const { findUser } = require("../function.js");

module.exports = {
  name: "unwarn",
  description: "Remove all warnings of a member of the server.",
  usage: "<user | user ID>",
  category: 1,
  args: 1,
  execute(message, args, pool) {
    pool.getConnection(async function(err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to connect to the database!"
        );
      }
      if (args[0] === "@everyone") {
        return message.channel.send("I cannot unwarn everyone lol.");
      }

      const user = await findUser(message, args[0]);

      if (!user) return;

      con.query(
        "SELECT * FROM warn WHERE user = " +
          user.id +
          " AND guild = " +
          message.guild.id,
        function(err, results) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to fetch data from the database!"
            );
          }
          if (results.length == 0) {
            message.channel.send("This user haven't been warned before.");
          } else {
            if (!message.member.permissions.has(4))
              return message.channel.send(
                "You don't have the permission to use this command!"
              );

            var warningEmbed = new Discord.MessageEmbed()
              .setColor(embedColor)
              .setTitle(`Your warnings have been cleared`)
              .setDescription(`In **${message.guild.name}**`)
              .setTimestamp()
              .setFooter(
                "Cleared by " + message.author.tag,
                message.author.displayAvatarURL()
              );
            user.send(warningEmbed).catch(err => {
              console.log("Failed to send DM to " + user.username);
            });
            con.query(
              "DELETE FROM warn WHERE user = " +
                user.id +
                " AND guild = " +
                message.guild.id,
              function(err) {
                if (err) {
                  console.error(err);
                  return message.reply(
                    "there was an error trying to delete the warnings!"
                  );
                }
                console.log("Removed all warnings of " + user.username);
              }
            );

            var warnSuccessfulEmbed = new Discord.MessageEmbed()
              .setColor(embedColor)
              .setTitle("User Successfully Unwarned!")
              .setDescription(
                "Unwarned **" +
                  user.username +
                  "** in server **" +
                  message.guild.name +
                  "**."
              );
            message.author.send(warnSuccessfulEmbed);
            message.delete();
          }
        }
      );

      con.release();
    });
  }
};
