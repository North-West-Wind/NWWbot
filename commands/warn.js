const Discord = require("discord.js");
const { findMember } = require("../function.js");

module.exports = {
  name: "warn",
  description: "Warn a member of the server. 3 warnings will lead to a ban.",
  args: 1,
  usage: "<user | user ID> [reason]",
  category: 1,
  async execute(message, args, pool) {
    if (!message.guild) return message.channel.send("This command only works in a server.");
    if (!message.member.permissions.has(4)) return message.channel.send("You don't have the permission to use this command!");
    if (!message.guild.me.permissions.has(4)) return message.channel.send("I don't have the permission to warn user!");
    if (args[0] === "@everyone") return message.channel.send("Please do not warn everyone.");
    const member = await findMember(message, args[0]);
    if (!member) return;
    var reason = "";
    var warningEmbed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle(`You've been warned`)
      .setDescription(`In **${message.guild.name}**`)
      .setTimestamp()
      .setFooter(
        "Warned by " + message.author.tag,
        message.author.displayAvatarURL()
      );

    if (!args[1]) {
      member.send(warningEmbed);
    } else {
      reason = args.slice(1).join(" ");
      warningEmbed.addField("Reason", reason);
      member.send(warningEmbed);
    }
    var warnSuccessfulEmbed = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle("User Successfully Warned!")
      .setDescription(
        "Warned **" +
        member.user.username +
        "** in server **" +
        message.guild.name +
        "**."
      );
    message.channel.send(warnSuccessfulEmbed);
    message.delete();
    pool.getConnection(async function (err, con) {
      if (err) {
        console.error(err);
        return message.reply("there was an error trying to connect to the database!");
      }
      con.query(
        `INSERT INTO warn VALUES (NULL, '${message.guild.id}', '${member.id}', '${escape(reason)}')`,
        function (err) {
          if (err) {
            console.error(err);
            return message.reply("there was an error trying to record the warnings!");
          }
          console.log("Inserted warning record successfully.");
        });
      con.query(
        `SELECT * FROM warn WHERE guild = '${message.guild.id}' AND user = '${member.id}'`,
        async function (err, results) {
          if (err) {
            console.error(err);
            return message.reply(
              "there was an error trying to fetch data from the database!"
            );
          }
          if (results.length >= 3) {
            member.ban({ reason: "Received 3 warnings." });
            var banEmbed = new Discord.MessageEmbed() // Creates the embed that's DM'ed to the user when their warned!
              .setColor(console.color())
              .setTitle(`You've been banned`)
              .setDescription(`In **${message.guild.name}**`)
              .addField("Reason", "Received 3 warnings.")
              .setTimestamp()
              .setFooter("Banned by " + message.author.tag, message.author.displayAvatarURL());
            var banSuccessfulEmbed = new Discord.MessageEmbed() // Creates the embed thats returned to the person warning if its sent.
              .setColor(console.color())
              .setTitle("User Banned!")
              .setDescription(
                "Banned **" +
                member.user.username +
                "** in server **" +
                message.guild.name +
                "**."
              );
            member.send(banEmbed);
            message.channel.send(banSuccessfulEmbed);
            con.query(
              `DELETE FROM warn WHERE guild = '${message.guild.id}' AND user = '${member.id}'`,
              function (err) {
                if (err) {
                  console.error(err);
                  return message.reply("there was an error trying to delete all warnings!");
                }
                console.log("Deleted all warnings for " + member.user.username + " in server " + message.guild.name);
              }
            );
          }
        }
      );
      con.release();
    });
  }
};
