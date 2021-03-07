const { genPermMsg } = require("../function");

module.exports = {
  name: 'announce',
  description: 'Let the bot announce something for you in a specific channel.',
  aliases: ['ann'],
  usage: "<channel | channel ID> <announcement>",
  args: 2,
  category: 0,
  permission: 2048,
  async execute(message, args) {
    var channel = await await message.guild.channels.resolve(args[0].replace(/<#/g, "").replace(/>/g, ""))
    if (!channel || channel == undefined || channel == null) return await message.channel.send("The channel is not valid!");
    if (!channel.permissionsFor(message.guild.me).has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 1));
    if (!channel.permissionsFor(message.member).has(this.permission)) return await message.channel.send(genPermMsg(this.permission, 0));
    await channel.send(args.slice(1).join(" "));
    await message.channel.send("Announcement made.");
  }
}
