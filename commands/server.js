const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const { twoDigits } = require("../function.js")

module.exports = {
	name: 'server',
	description: 'Display info about this server.',
	execute(message) {
    const name = message.guild.name;
    const id = message.guild.id;
    const memberCount = message.guild.memberCount;
    const createdAt = message.guild.createdAt
    const owner = message.guild.owner.user.username;
    const icon = message.guild.iconURL();
    
    var date = createdAt.getDate();
        var month = createdAt.getMonth();
        var year = createdAt.getFullYear();
        var hour = createdAt.getHours();
        var minute = createdAt.getMinutes();
        var second = createdAt.getSeconds();
      
      var createdTime =
          twoDigits(date) +
          "/" +
          twoDigits(month + 1) +
          "/" +
          twoDigits(year) +
          " " +
          twoDigits(hour) +
          ":" +
          twoDigits(minute) +
          ":" +
          twoDigits(second) +
          " UTC";
		
    const Embed = new Discord.MessageEmbed()
    .setTitle("Information of server " + name)
    .setColor(color)
    .setThumbnail(icon)
    .addField("ID", id, true)
    .addField("Name", name, true)
    .addField("Member count", memberCount, true)
    .addField("Created", createdTime, true)
    .addField("Owner", owner, true)
    .setTimestamp()
    .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    
    message.channel.send(Embed);
    
	},
};