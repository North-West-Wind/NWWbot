var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "delrole",
  description: "Remove a role from the server.",
  args: true,
  usage: "<role | role ID | role name>",
  async execute(message, args) {
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
      return message.channel.send("You didn't tell me the role to delete!" + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``)
    }
    
    var roleID = args[0].replace(/<@&/g, "").replace(/>/g, "");
    if (isNaN(parseInt(roleID))) {
      var role = await message.guild.roles.cache.find(
        x => x.name.toLowerCase() === `${args[0].toLowerCase()}`
      );
      if (role === null) {
        return message.channel.send(
          "No role was found with the name " + args[0]
        );
      }
    } else {
      var role = await message.guild.roles.cache.get(roleID);
      if (role === null) {
        return message.channel.send("No role was found!");
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
