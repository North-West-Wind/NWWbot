const Discord = require("discord.js");
var embedColor = Math.floor(Math.random() * 16777214) + 1;
const { findUser } = require("../function.js");
const { prefix } = require("../config.json");

module.exports = {
  name: "warn",
  description: "Warn a member of the server. 3 warnings will lead to a ban.",
  args: true,
  usage: "<user | user ID> [reason]",
  execute(message, args, pool) {
    pool.getConnection(async function(err, con) {
      if (err) {
        console.error(err);
        return message.reply(
          "there was an error trying to execute that command!"
        );
      }
      if (!args[0]) {
        return message.channel.send(
          "Tell me who you are warning." +
            ` Usage: \`${prefix}${this.name} ${this.usage}\``
        );
      }

      if (args[0] === "me") {
        return message.channel.send("Fuck you " + message.author);
      } else if (args[0] === "@everyone") {
        return message.channel.send("I cannot warn everyone lol.");
      }

      // Assuming we mention someone in the message, this will return the user
      // Read more about mentions over at https://discord.js.org/#/docs/main/master/class/MessageMentions

      const user = await findUser(message, args[0]);

      if (!user) return;
      if (!message.member.permissions.has("BAN_MEMBERS"))
        return message.channel.send(
          "You don't have the permission to use this command!"
        ); // Checks if the user has the permission
      if (!message.guild.me.permissions.has("BAN_MEMBERS"))
        return message.channel.send(
          "I don't have the permission to warn user!"
        ); // Checks if the bot has the permission

      var reason = "";
      var warningEmbed = new Discord.MessageEmbed() // Creates the embed that's DM'ed to the user when their warned!
        .setColor(embedColor)
        .setTitle(`You've been warned`)
        .setDescription(`In **${message.guild.name}**`)
        .setTimestamp()
        .setFooter(
          "Warned by " + message.author.tag,
          message.author.displayAvatarURL()
        );

      if (!args[1]) {
        user.send(warningEmbed); // DMs the user the above embed!
      } else {
        // Triggers if the user dosn't provide a reason for the warning
        reason = args.slice(1).join(" ");
        warningEmbed.addField("Reason", reason);
        user.send(warningEmbed); // DMs the user the above embed!
      }
      var warnSuccessfulEmbed = new Discord.MessageEmbed() // Creates the embed thats returned to the person warning if its sent.
        .setColor(embedColor)
        .setTitle("User Successfully Warned!")
        .setDescription(
          "Warned **" +
            user.username +
            "** in server **" +
            message.guild.name +
            "**."
        );
      message.author.send(warnSuccessfulEmbed); // Sends the warn successful embed
      message.delete();

      con.query(
        "INSERT INTO warn (guild, user, reason) VALUES (" +
          message.guild.id +
          ", " +
          user.id +
          ", '" +
          reason.replace(/'/g, /\\'/).replace(/"/g, /\\"/) +
          "')",
        function(err, result) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to execute that command!"
            );
          }
          console.log("Inserted warning record successfully.");
        }
      );
      con.query(
        "SELECT * FROM warn WHERE guild = " +
          message.guild.id +
          " AND user = " +
          user.id,
        async function(err, results, fields) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to execute that command!"
            );
          }
          if (results.length >= 3) {
            message.guild.ban(user);
            var banEmbed = new Discord.MessageEmbed() // Creates the embed that's DM'ed to the user when their warned!
              .setColor(embedColor)
              .setTitle(`You've been banned`)
              .setDescription(`In **${message.guild.name}**`)
              .addField("Reason", "Received 3 warnings.")
              .setTimestamp()
              .setFooter(
                "Banned by " + message.author.tag,
                message.author.displayAvatarURL()
              );
            user.kicked = new Discord.Collection();
            await user.kicked.set(message.guild.id, true);
            var banSuccessfulEmbed = new Discord.MessageEmbed() // Creates the embed thats returned to the person warning if its sent.
              .setColor(embedColor)
              .setTitle("User Banned!")
              .setDescription(
                "Banned **" +
                  user.username +
                  "** in server **" +
                  message.guild.name +
                  "**."
              );
            user.send(banEmbed);
            message.author.send(banSuccessfulEmbed);
            con.query(
              "DELETE FROM warn WHERE guild = " +
                message.guild.id +
                " AND user = " +
                user.id,
              function(err, result) {
                if (err) {
                  console.error(err);
                  return message.reply(
                    "there was an error trying to execute that command!"
                  );
                }
                console.log(
                  "Deleted all warnings for " +
                    user.username +
                    " in server " +
                    message.guild.name
                );
              }
            );
          }
        }
      );
      con.release();
    });
  }
};
