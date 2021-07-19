const { ms } = require("../../function.js");
const { play } = require("./play.js");
const moment = require("moment");
const formatSetup = require("moment-duration-format");
const { ApplicationCommand, InteractionResponse, ApplicationCommandOption, ApplicationCommandOptionType } = require("../../classes/Slash.js");
const { getQueues, setQueue } = require("../../helpers/music.js");
formatSetup(moment);

module.exports = {
    name: "seek",
    description: "Skip to the time specified for the current playing soundtrack.",
    usage: "<time>",
    aliases: ["skipto"],
    category: 8,
    slashInit: true,
    register: () => ApplicationCommand.createBasic(module.exports).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "time", "The position to skip to.").setRequired(true)
    ]),
    async slash(_client, interaction) {
      if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
      return InteractionResponse.sendMessage("Seeking...");
    },
    async postSlash(client, interaction, args) {
      if (!interaction.guild_id) return;
      InteractionResponse.deleteMessage(client, interaction).catch(() => { });
      const message = await InteractionResponse.createFakeMessage(client, interaction);
      args = args?.map(x => x?.value).filter(x => !!x)|| [];
      await this.execute(message, args);
    },
    async execute(message, args) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
        if(serverQueue.songs.length < 1 || !serverQueue.connection || !serverQueue.connection.dispatcher || !serverQueue.playing) return message.channel.send("There is nothing in the queue.");
        if ((message.member.voice.channelID !== message.guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to change the time of the soundtrack begins when the bot is playing!");
        if(serverQueue.songs[0].time === "∞") return message.channel.send("This command does not work for live videos.");
        if(args.length < 1) return message.channel.send("You didn't provide the time to skip to!");
        var parsed = ms(args.join(" "));
        if(args.join(" ").endsWith("%")) {
            const percentage = Number(args.join(" ").slice(0, -1));
            if(isNaN(percentage) || percentage > 100 || percentage < 0) return await message.channel.send("The given percentage is not valid!");
            parsed = ms(serverQueue.songs[0].time) * (percentage / 100);
        }
        if(!parsed) return message.channel.send("The given time is not valid!");
        if(Math.round(parsed / 1000) > Math.floor(ms(serverQueue.songs[0].time) / 1000)) return message.channel.send("The time specified should not be larger than the maximum length of the soudtrack!");
        serverQueue.connection.dispatcher.destroy();
        play(message.guild, serverQueue.songs[0], 0, Math.round(parsed / 1000));
        message.channel.send(`Seeked to **${parsed == 0 ? "0:00" : moment.duration(Math.round(parsed / 1000), "seconds").format()}**`);
    }
}