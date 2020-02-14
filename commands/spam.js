const Discord = require("discord.js");
const client = new Discord.Client();
const {findUser} = require("../function.js")

module.exports = {
  name: "spam",
  description: "Spam a person.",
  aliases: ["sp"],
  args: true,
  usage: "<user> <time> [message]",
  execute(message, args) {
    
    const taggedUser = findUser(message, args[0]);
    if(!taggedUser) return;
    
    const time = parseInt(args[1]);
    if(isNaN(time)) {
      return message.channel.send("The time you want to spam this user is not a number.")
    }
    const msg = args.slice(2).join(" ");
    
    
     console.log("Will spam user " + taggedUser.username + " for " + time + " times with the message " + msg);
    message.delete();
     for (let i = 0; i < time; i++) {
       if(i == time) {
         console.log("Stopped")
         return;
       } else {
         console.log("Spamming " + taggedUser.username + " for " + Math.floor(i + 1) + " time(s).")
         taggedUser.send(msg)
       }
     }

    
  }
}