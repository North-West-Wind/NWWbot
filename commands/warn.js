const Discord = require('discord.js');

module.exports = {
  name: "warn",
  description: "Send a warning to someone.",
  args: true,
  usage: "<user> [reason]",
  execute(message, args) {
  var embedColor = '#ffffff' // Change this to change the color of the embeds!
    
    var missingPermissionsEmbed = new Discord.RichEmbed() // Creates the embed thats sent if the user is missing permissions
        .setColor(embedColor)
        .setAuthor(message.author.username, message.author.avatarURL)
        .setTitle('Don\'t even think about that')
        .setDescription('You do not have the permission to use this command!')
        .setTimestamp()
    .setFooter("Have a nice day! :)", "https://i.imgur.com/hxbaDUY.png");;
    
    const user = message.mentions.users.first();
    
    if (!user) {
      if (args[0] === "me") {
        return message.channel.send("Fuck you " + message.author)
      } else if (args[0] === "@everyone") {
        return message.channel.send("Fuck you " + message.author + ". I cannot warn everyone lol.")
      } else {
      return message.reply( "tell me who you are warning.")
      }
    }
    
    if(!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send(missingPermissionsEmbed); // Checks if the user has the permission
    let mentioned = message.mentions.users.first(); // Gets the user mentioned!
     // .slice(1) removes the user mention, .join(' ') joins all the words in the message, instead of just sending 1 word
    
    
    
    
    
    
    if(!args.slice(1).join(' ')) {
      var warningEmbed = new Discord.RichEmbed() // Creates the embed that's DM'ed to the user when their warned!
        .setColor(embedColor)
        .setAuthor(message.author.username, message.author.avatarURL)
        .setTitle(`You've been warned in ${message.guild.name}`)
        .addField('Warned by', message.author.tag)
        .setTimestamp();
    mentioned.send(warningEmbed); // DMs the user the above embed!
    var warnSuccessfulEmbed = new Discord.RichEmbed() // Creates the embed thats returned to the person warning if its sent.
        .setColor(embedColor)
        .setTitle('User Successfully Warned!');
    message.channel.send(warnSuccessfulEmbed); // Sends the warn successful embed
    message.delete();
      return;
    } else {// Triggers if the user dosn't provide a reason for the warning
let reason = args.slice(1).join(' ')
    var warningEmbed = new Discord.RichEmbed() // Creates the embed that's DM'ed to the user when their warned!
        .setColor(embedColor)
        .setAuthor(message.author.username, message.author.avatarURL)
        .setTitle(`You've been warned in ${message.guild.name}`)
        .addField('Warned by', message.author.tag)
        .addField('Reason', reason)
        .setTimestamp();
    mentioned.send(warningEmbed); // DMs the user the above embed!
    var warnSuccessfulEmbed = new Discord.RichEmbed() // Creates the embed thats returned to the person warning if its sent.
        .setColor(embedColor)
        .setTitle('User Successfully Warned!');
    message.channel.send(warnSuccessfulEmbed); // Sends the warn successful embed
    message.delete(); // Deletes the command
      return;
    }
  }
}