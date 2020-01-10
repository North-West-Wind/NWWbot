const giveaways = require("discord-giveaways");
const ms = require("ms"); // npm install ms
const Discord = require("discord.js");
const client = new Discord.Client();
var color = Math.floor(Math.random() * 16777214) + 1;
 
const options ={
  prefix: "?",
  startCmd: "start",
  embedColor: color,
  reactEmote: "🎉"
}

module.exports = {
  name: "giveaway",
  description: "Giveaway something.",
  args:true,
  usage: "<time> <items>",
  execute(message, args) {
    message.delete();
     class Giveaway {
        constructor(client, options = {}) {
          this.botPrefix = (options && options.prefix) || '!';
          this.startCmd = (options && options.startCmd) || 'giveawaystart';
          this.giveawayRole = (options && options.giveawayRole) || null;
          this.embedColor = (options && options.embedColor) || '#7aefe0';
          this.reactEmote = (options && options.reactEmote) || `✅`
        }
      }

      var giveawayBot = new Giveaway(client, options);

      giveawayBot.log = (msg) => {
          const loggableMsg = msg.split("\n").map(function(e) {return '[Giveaway] ' + e}).join("\n")
          console.log(loggableMsg)
      }

      
    

      giveawayBot.help = (message) => {
          
      }

      giveawayBot.rollIt = (randomNumber, values) => {
        for (let i = 0; i < randomNumber; i++) { 
          if(i == randomNumber - 1) {
            return values.next();
          } else {
            values.next()
          }
        }
      }


          giveawayBot.log("Starting a giveaway.")
          const channel = message.channel,
                time = ms(args[0]),
                item = args.slice(1).join(" ");
          if(isNaN(time)) return message.reply("make sure to provide correct time.").then(msg => msg.delete(5000))
          if(item == undefined || item == null || item.length < 1) return message.reply("you didn't specify what do you want to give away.").then(msg => msg.delete(5000))
          giveawayBot.log(`Giveaway details:\n  Channel: ${message.channel.id}\n  Author: ${message.author.id}\n  Time: ${time}\n  Item: ${item}`)
          const embed = new Discord.RichEmbed()
          .setColor(giveawayBot.embedColor)
          .setTitle(item)
          .setDescription(`Ends in: ${ms(time)}`)
          .setAuthor(message.author.tag, message.author.displayAvatarURL)
          .setTimestamp()
          .addField(`React with the ${giveawayBot.reactEmote} emote`, `to take part in this giveaway.`)
          .setFooter(message.author.username, message.author.displayAvatarURL)
          message.channel.send(embed).then(async msg => {
            await msg.react(giveawayBot.reactEmote)
          const timeInterval = setInterval(function() {
            console.log(ms(msg.embeds[0].description.slice(9)))
            if(ms(msg.embeds[0].description.slice(9)) <= 5000) {
              const embed2 = new Discord.RichEmbed()
            .setColor(giveawayBot.embedColor)
          .setTitle(item)
          .setDescription(`Ended.`)
          .setAuthor(message.author.tag, message.author.displayAvatarURL)
          .setTimestamp(msg.embeds[0].timestamp)
          .setFooter(message.author.username, message.author.displayAvatarURL)
            msg.edit(embed2)
              clearInterval(timeInterval)
            } else {
            const embed2 = new Discord.RichEmbed()
            .setColor(giveawayBot.embedColor)
          .setTitle(item)
          .setDescription(`Ends in: ${ms(ms(msg.embeds[0].description.slice(9)) - 5000)}`)
          .setAuthor(message.author.tag, message.author.displayAvatarURL)
          .setTimestamp(msg.embeds[0].timestamp)
          .addField(`React with the ${giveawayBot.reactEmote} emote`, `to take part in this giveaway.`)
          .setFooter(message.author.username, message.author.displayAvatarURL)
            msg.edit(embed2)
            }
          }, 5000)
          setTimeout(function() {
            msg.channel.fetchMessage(msg.id).then(mesg => {
            const reactions = mesg.reactions.find(reaction => reaction.emoji.name == giveawayBot.reactEmote)
            giveawayBot.log(`Reaction count: ${reactions.count}.`)
            const randomNumber = Math.floor(Math.random() * (reactions.count - 1)) + 1;
            let values = reactions.users.filter(user => user !== client.user).values()
            const winner = giveawayBot.rollIt(randomNumber, values).value
            if(winner == undefined) return mesg.channel.send("No one reacted to the message, so no one wins.");
            mesg.channel.send(`The winner of \`${item}\` is... <@${winner.id}>!`)
            })
          }, time)
        })
      

      return giveawayBot;
  }
}