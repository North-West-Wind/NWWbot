var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "delrole",
  description: "Delete a role.",
  args: true,
  usage: "<role>",
  execute(message, args) {
    if (!message.member.permissions.has("MANAGE_ROLES")) {
      message.channel.send(
        `You don\'t have the permission to use this command.`
      );
      return;
    }
    if(!message.guild.me.permissions.has('MANAGE_ROLES')) {
      message.channel.send(`I don\'t have the permission to delete roles.`)
      return;
    }
    
    if(!args[0]) {
      return message.channel.send("You didn't tell me the role to delete!")
    }
    
    var roleID = args[0].replace(/<@&/g, "").replace(/>/g, "");
    if(isNaN(parseInt(roleID))) {
      var role = message.guild.roles.find(x => x.name === `${args[0]}`);
      if(role === null) {
      return message.channel.send("No role was found with the name " + args[0])
    }
    } else {
      var role = message.guild.roles.get(roleID);
      if(role === null) {
      return message.channel.send("No role was found with the id " + roleID)
    }
    }
    
    role.delete().then(role => {
      console.log("Deleted role " + role.name + " in server " + message.guild.name)
    })
    .catch(err => {
      console.log("Failed to delete role.")
    })

    const Discord = require('discord.js');
    const Embed = new Discord.MessageEmbed()
      .setColor(color)
      .setTitle("Role Deleted Successfully")
      .setDescription("Deleted a role **" + role.name + "**")
      .setTimestamp()
      .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
    message.channel.send(Embed);

  }
};
