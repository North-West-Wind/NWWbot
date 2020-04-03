const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { findUser } = require("../function.js");
const { prefix } = require("../config.json")
module.exports = {
  name: "ban",
  description: "Ban a member of the server.",
  args: true,
  usage: "<user | user ID> [reason]",
  execute(message, args) {
    if (!message.member.permissions.has("BAN_MEMBERS")) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
    if(!message.guild.me.permissions.has('BAN_MEMBERS')) {
      message.channel.send(`I don\'t have the permission to ban members.`)
      return;
    }
    // Let's pretend you mentioned the user you want to add a role to (!addrole @user Role Name):

    if (!message.guild) return;
    
    if(!args[0]) {
      return message.channel.send("You didn't mention any user!" + ` Usage: \`${prefix}${this.name} ${this.usage}\``)
    }
    
    
   
    findUser(message, args[0]).then(async user => {
      
      if(!user) return;
        // Now we get the member from the user
        if(args[1]) {
          var reason = args.slice(1).join(" ");
          var member = message.guild.members.ban(user, { reason: reason });
        } else {
          var member = message.guild.members.ban(user);
        }
        // If the member is in the guild
        if (member) {
          
          user.kicked = new Discord.Collection()
           await user.kicked.set(message.guild.id, true)
          /**
           * Ban the member
           * Make sure you run this on a member, not a user!
           * There are big differences between a user and a member
           * Read more about what ban options there are over at
           * https://discord.js.org/#/docs/main/master/class/GuildMember?scrollTo=ban
           */
          message.delete();
          member
            .then(() => {
              // We let the message author know we were able to ban the person

              var banEmbed = new Discord.MessageEmbed() // Creates the embed that's DM'ed to the user when their warned!
                .setColor(color)
                .setTitle(`You've been banned`)
                .setDescription(`In **${message.guild.name}**`)
                .setTimestamp()
                .setFooter(
                  "Banned by " + message.author.tag,
                  message.author.displayAvatarURL()
                );
              if (args[1]) {
                banEmbed.addField("Reason", reason);
              }
              user.send(banEmbed).catch(err => {
                console.log("Failed to send DM to " + user.username)
              });
            
            

              var banSuccessfulEmbed = new Discord.MessageEmbed() // Creates the embed thats returned to the person warning if its sent.
                .setColor(color)
                .setTitle("User Banned!")
                .setDescription(
                  "Banned **" +
                    user.tag +
                    "** in server **" +
                    message.guild.name +
                    "**."
                );
              return message.author.send(banSuccessfulEmbed);
            })
            .catch(err => {
              // An error happened
              // This is generally due to the bot not being able to ban the member,
              // either due to missing permissions or role hierarchy
              message.channel.send("I failed to ban this member!");
              // Log the error
              console.error(err);
            });
        } else {
          // The mentioned user isn't in this guild
          message.channel.send("That user doesn't exist!");
        }
      
    }).catch(err => {
      return message.channel.send("I cannot find this member!")
    });
    // If we have a user mentioned
  }
};
