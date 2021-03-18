const Discord = require("discord.js");
const moment = require("moment");
const formatSetup = require("moment-duration-format");
const { ApplicationCommand, InteractionResponse } = require("../../classes/Slash.js");
formatSetup(moment);
const { ms, color } = require("../../function.js");
const { updateQueue, getQueues } = require("../../helpers/music.js");
const type = [
  "YouTube",
  "Spotify",
  "URL/Attachment",
  "SoundCloud",
  "Google Drive",
  "Musescore",
  "PornHub"
];

module.exports = {
  name: "np",
  description: "Display the music being played.",
  aliases: ["nowplaying"],
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports),
  async slash(client, interaction) {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    var serverQueue = getQueues().get(guild.id);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, [], false, false, client.pool);
    if (serverQueue.songs.length < 1) return InteractionResponse.sendMessage("There is nothing in the queue.");
    const filtered = serverQueue.songs.filter(song => !!song);
    if (serverQueue.songs.length !== filtered.length) {
      serverQueue.songs = filtered;
      updateQueue(guild.id, serverQueue, client.pool);
    }
    var position = 0;
    if (serverQueue.connection && serverQueue.connection.dispatcher) position = (serverQueue.connection.dispatcher.streamTime - serverQueue.startTime);
    var processBar = [];
    for (let i = 0; i < 20; i++) processBar.push("═");
    var progress = 0;
    const isLive = serverQueue.songs[0].isLive;
    const length = isLive ? 0 : ms(serverQueue.songs[0].time);
    if (isLive) {
      processBar.splice(19, 1, "■");
      var positionTime = "∞";
    } else {
      var positionTime = moment.duration(Math.round(position / 1000), "seconds").format();
      if (position === 0 || isNaN(position))
        positionTime = "0:00";
      progress = Math.floor((position / length) * processBar.length);
      processBar.splice(progress, 1, "■");
    }
    var info = [];
    const embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Now playing:" + (serverQueue.playing ? "" : " (Not actually)"))
      .setTimestamp()
      .setFooter(`Looping: ${serverQueue.looping ? "Enabled" : "Disabled"} | Repeating: ${serverQueue.repeating ? "Enabled" : "Disabled"} | Random: ${serverQueue.random ? "Enabled" : "Disabled"}`, client.user.displayAvatarURL());
    if (serverQueue.songs[0].type === 1) info = [`**[${serverQueue.songs[0].title}](${serverQueue.songs[0].spot})**\nLength: **${serverQueue.songs[0].time}**`, serverQueue.songs[0].thumbnail];
    else info = [`**[${serverQueue.songs[0].title}](${serverQueue.songs[0].url})**\nLive: **${isLive ? "Yes" : "No"}**\nVolume: **${serverQueue.songs[0].volume ? (`${serverQueue.volume * serverQueue.songs[0].volume * 100}% (Local) | ${serverQueue.volume * 100}% (Global)`) : `${serverQueue.volume * 100}%`}**\nType: **${type[serverQueue.songs[0].type]}**`, serverQueue.songs[0].thumbnail];
    embed.setDescription(`${info[0]}\n\n${positionTime} \`${processBar.join("")}\` ${serverQueue.songs[0].time}`).setThumbnail(info[1]);
    setTimeout(async () => await client.api.webhooks(client.user.id, interaction.token).messages["@original"].patch({ data: { content: "**[Outdated Now-Playing Information]**", embeds: null } }), 60000);
    return InteractionResponse.sendEmbeds(embed);
  },
  async execute(message) {
    var serverQueue = getQueues().get(message.guild.id);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue.");
    const filtered = serverQueue.songs.filter(song => !!song);
    if (serverQueue.songs.length !== filtered.length) {
      serverQueue.songs = filtered;
      updateQueue(message.guild.id, serverQueue, message.pool);
    }
    var position = 0;
    if (serverQueue.connection && serverQueue.connection.dispatcher) position = (serverQueue.connection.dispatcher.streamTime - serverQueue.startTime);
    var processBar = [];
    for (let i = 0; i < 20; i++) processBar.push("═");
    var progress = 0;
    const isLive = serverQueue.songs[0].isLive;
    const length = isLive ? 0 : ms(serverQueue.songs[0].time);
    if (isLive) {
      processBar.splice(19, 1, "■");
      var positionTime = "∞";
    } else {
      var positionTime = moment.duration(Math.round(position / 1000), "seconds").format();
      if (position === 0 || isNaN(position))
        positionTime = "0:00";
      progress = Math.floor((position / length) * processBar.length);
      processBar.splice(progress, 1, "■");
    }
    var info = [];
    var embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Now playing:" + (serverQueue.playing ? "" : " (Not actually)"))
      .setTimestamp()
      .setFooter(`Looping: ${serverQueue.looping ? "Enabled" : "Disabled"} | Repeating: ${serverQueue.repeating ? "Enabled" : "Disabled"} | Random: ${serverQueue.random ? "Enabled" : "Disabled"}`, message.client.user.displayAvatarURL());
    if (serverQueue.songs[0].type === 1) info = [`**[${serverQueue.songs[0].title}](${serverQueue.songs[0].spot})**\nLength: **${serverQueue.songs[0].time}**`, serverQueue.songs[0].thumbnail];
    else info = [`**[${serverQueue.songs[0].title}](${serverQueue.songs[0].url})**\nLive: **${isLive ? "Yes" : "No"}**\nVolume: **${serverQueue.songs[0].volume ? (`${serverQueue.volume * serverQueue.songs[0].volume * 100}% (Local) | ${serverQueue.volume * 100}% (Global)`) : `${serverQueue.volume * 100}%`}**\nType: **${type[serverQueue.songs[0].type]}**`, serverQueue.songs[0].thumbnail];
    embed.setDescription(`${info[0]}\n\n${positionTime} \`${processBar.join("")}\` ${serverQueue.songs[0].time}`).setThumbnail(info[1]);
    const msg = await message.channel.send(embed);
    setTimeout(() => msg.edit({ content: "**[Outdated Now-Playing Information]**", embed: null }), 60000);
  }
}