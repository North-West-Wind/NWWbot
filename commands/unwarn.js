const Discord = require("discord.js");
var embedColor = Math.floor(Math.random() * 16777214) + 1;
const { findUser } = require("../function.js")

module.exports = {
  name: "unwarn",
  description: "Remove all warnings of a member of the server.",
  usage: "<user | user ID>",
  execute(message, args, pool) {
    pool.getConnection(async function(err, con) {
      
      
      if(!args[0]) {
        return message.channel.send("Tell me who you are unwarning.");
      }
      
      if (args[0] === "@everyone") {
        return message.channel.send(
          "I cannot unwarn everyone lol."
        );
      }
      
     

    // Assuming we mention someone in the message, this will return the user
    // Read more about mentions over at https://discord.js.org/#/docs/main/master/class/MessageMentions

    const user = await findUser(message, args[0]);
      
      if(!user) return;

    con.query("SELECT * FROM warn WHERE user = " + user.id + " AND guild = " + message.guild.id, function(err, results, fields) {
      if(err) throw err;
      if(results.length == 0) {
        message.channel.send("This user haven't been warned before.")
      } else {
        if (!message.member.permissions.has("BAN_MEMBERS"))
      return message.channel.send(
        "You don't have the permission to use this command!"
      ); // Checks if the user has the permission

    var warningEmbed = new Discord.MessageEmbed() // Creates the embed that's DM'ed to the user when their warned!
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
        })
        con.query("DELETE FROM warn WHERE user = " + user.id + " AND guild = " + message.guild.id, function(err, result) {
          if(err) throw err;
          console.log("Removed all warnings of " + user.username);
        })

    
    var warnSuccessfulEmbed = new Discord.MessageEmbed() // Creates the embed thats returned to the person warning if its sent.
      .setColor(embedColor)
      .setTitle("User Successfully Unwarned!")
      .setDescription(
        "Unwarned **" +
          user.username +
          "** in server **" +
          message.guild.name +
          "**."
      );
    message.author.send(warnSuccessfulEmbed); // Sends the warn successful embed
    message.delete();
      }
    });

    
    
      
          
      con.release();
    });
  }
}