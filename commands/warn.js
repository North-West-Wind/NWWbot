const Discord = require("discord.js");
var embedColor = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "warn",
  description: "Send a warning to someone. 3 warning will lead to ban.",
  args: true,
  usage: "<user> [reason]",
  execute(message, args, pool) {
    const user = message.mentions.users.first();

    if (!user) {
      if (args[0] === "me") {
        return message.channel.send("Fuck you " + message.author);
      } else if (args[0] === "@everyone") {
        return message.channel.send(
          "Fuck you " + message.author + ". I cannot warn everyone lol."
        );
      } else {
        return message.reply("tell me who you are warning.");
      }
    }

    if (!message.member.hasPermission("BAN_MEMBERS "))
      return message.channel.send(
        "You don't have the permission to use this command!"
      ); // Checks if the user has the permission
    let mentioned = message.mentions.users.first(); // Gets the user mentioned!
    // .slice(1) removes the user mention, .join(' ') joins all the words in the message, instead of just sending 1 word

    var reason = "";
    var warningEmbed = new Discord.RichEmbed() // Creates the embed that's DM'ed to the user when their warned!
      .setColor(embedColor)
      .setTitle(`You've been warned`)
      .setDescription(`In **${message.guild.name}**`)
      .setTimestamp()
      .setFooter(
        "Warned by " + message.author.tag,
        message.author.displayAvatarURL
      );

    if (!args[1]) {
      mentioned.send(warningEmbed); // DMs the user the above embed!
    } else {
      // Triggers if the user dosn't provide a reason for the warning
      reason = args.slice(1).join(" ");
      warningEmbed.addField("Reason", reason);
      mentioned.send(warningEmbed); // DMs the user the above embed!
    }
    var warnSuccessfulEmbed = new Discord.RichEmbed() // Creates the embed thats returned to the person warning if its sent.
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
    pool.getConnection(function(err, con) {
      con.query(
        "INSERT INTO warn (guild, user, reason) VALUES (" +
          message.guild.id +
          ", " +
          mentioned.id +
          ", '" +
          reason.replace(/'/g, /\\'/).replace(/"/g, /\\"/) +
          "')",
        function(err, result) {
          if (err) throw err;
          console.log("Inserted warning record successfully.");
        }
      );
      con.query(
        "SELECT * FROM warn WHERE guild = " +
          message.guild.id +
          " AND user = " +
          mentioned.id,
        function(err, results, fields) {
          if (err) throw err;
          if (results.length >= 3) {
            message.guild.ban(user);
            var banEmbed = new Discord.RichEmbed() // Creates the embed that's DM'ed to the user when their warned!
              .setColor(embedColor)
              .setTitle(`You've been banned`)
              .setDescription(`In **${message.guild.name}**`)
              .addField("Reason", "Received 3 warnings.")
              .setTimestamp()
              .setFooter(
                "Banned by " + message.author.tag,
                message.author.displayAvatarURL
              );
            var banSuccessfulEmbed = new Discord.RichEmbed() // Creates the embed thats returned to the person warning if its sent.
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
            message.author.send(banSuccessfulEmbed)
            con.query(
              "DELETE FROM warn WHERE guild = " +
                message.guild.id +
                " AND user = " +
                mentioned.id,
              function(err, result) {
                if (err) throw err;
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
