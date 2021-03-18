const { color, genPermMsg, commonRoleEmbed } = require('../../function');
const { NorthClient } = require("../../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse, InteractionApplicationCommandCallbackData } = require('../../classes/Slash');
const Discord = require('discord.js');

module.exports = {
  name: "delrole",
  description: "Remove a role from the server.",
  args: 1,
  usage: "<role | role ID | role name>",
  category: 0,
  permissions: 268435456,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.ROLE, "role", "The role to delete.")
  ]),
  async slash(client, interaction, args) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    if (!author.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 0));
    if(!guild.me.permissions.has(this.permissions)) return InteractionResponse.sendMessage(genPermMsg(this.permissions, 1));
    const role = await guild.roles.fetch(args[0].value);
    if (!role) return InteractionResponse.sendMessage("No role was found!");
    const embeds = commonRoleEmbed(message.client, "delete", "Deleted", role.name);
    try {
      await role.delete();
      return InteractionResponse.sendEmbeds(embeds[1]);
    } catch (err) {
      return InteractionResponse.sendEmbeds(embeds[0]);
    }
  },
  async execute(message, args) {
    if (!message.guild) return await message.channel.send("This command only works on server.");
    if (!message.member.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 0));
    if(!message.guild.me.permissions.has(this.permissions)) return await message.channel.send(genPermMsg(this.permissions, 1));
    if(!args[0]) return await message.channel.send("You didn't tell me the role to delete!" + ` Usage: \`${message.prefix}${this.name} ${this.usage}\``);
    
    var roleID = args[0].replace(/<@&/g, "").replace(/>/g, "");
    if (isNaN(parseInt(roleID))) {
      var role = await message.guild.roles.cache.find(x => x.name.toLowerCase() === `${args[0].toLowerCase()}`);
      if (!role) return await message.channel.send("No role was found with the name " + args[0]);
    } else {
      var role = await message.guild.roles.cache.get(roleID);
      if (!role) return await message.channel.send("No role was found!");
    }
    const embeds = commonRoleEmbed(message.client, "delete", "Deleted", role.name);
    try {
      await role.delete();
      return await message.channel.send(embeds[1]);
    } catch (err) {
      return await message.channel.send(embeds[0]);
    }
  }
};
