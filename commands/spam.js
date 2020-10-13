const Discord = require("discord.js");
const client = new Discord.Client();
const {findUser} = require("../function.js")

module.exports = {
  name: "spam",
  description: "Spam a user with the message provided.",
  aliases: ["sp"],
  args: true,
  usage: "<user | user ID> <amount> <message>",
  category: 4,
  async execute(message, args) {
    
    if(!args[0]) {
      return message.channel.send("Please tell me the user!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);
    }
    if(!args[1]) {
      return message.channel.send("Please tell me the time you want to spam this user!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);
    }
    if(!args[2]) {
      return message.channel.send("Please enter the message to spam!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``)
    }
    
    const taggedUser = await findUser(message, args[0]);
    if(!taggedUser) return;
    if(taggedUser.id === message.author.id) return message.channel.send("Don't try to spam youself.");
    
    const time = parseInt(args[1]);
    if(isNaN(time)) {
      return message.channel.send("The time you want to spam this user is not a number.")
    }
    if(time > 120) return message.channel.send("Please don't spam more than 120 times. That would be annoying.")
    
    const msg = args.slice(2).join(" ");
    
    
     console.log("Will spam user " + taggedUser.username + " for " + time + " times with the message " + msg);
    message.delete().catch(() => {});
    var i = 0;
    var spam = setInterval(function() {
      if(i == time) {
        clearInterval(spam);
        return;
      }
      console.log("Spamming " + taggedUser.username + " for " + Math.floor(i + 1) + " time(s).");
      if(taggedUser.id === process.env.DC) {
        message.author.send("Admin power forbids this >:)").catch(err => i = time);
      } else {
        taggedUser.send(`\`[${message.guild.name} : ${message.author.tag}]\` ${msg}`).catch(err => {
          if(message.author.id !== process.env.DC) message.author.send(`Failed to spam ${taggedUser.tag} for ${i + 1} time(s) due to \`${err.message}\`.`).catch(err => i = time);
        });
      }
      i++;
    }, 1000)

    
  }
}