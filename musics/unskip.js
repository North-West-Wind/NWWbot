const { play } = require("./play.js");
const { updateQueue, getQueues } = require("./main.js");
const { moveArray } = require("../function.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../classes/Slash.js");

module.exports = {
    name: "unskip",
    description: "Go to the previous music in the queue.",
    usage: "[amount]",
    aliases: ["us"],
    category: 8,
    slashInit: true,
    register: () => ApplicationCommand.createBasic(module.exports).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.INTEGER.valueOf(), "amount", "The amount of soundtrack to go back.")
    ]),
    slash: async (client, interaction, args) => {
        if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
        const guild = await client.guilds.fetch(interaction.guild_id);
        const author = await guild.members.fetch(interaction.member.user.id);
        var serverQueue = getQueues().get(guild.id);
        var skipped = 1;
        if ((author.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing) return InteractionResponse.sendMessage("You have to be in a voice channel to unskip the music when the bot is playing!");
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, [], false, false, client.pool);
        if (serverQueue.songs.length < 1) return InteractionResponse.sendMessage("There is nothing in the queue!");
        if (serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
        if (serverQueue.repeating) skipped = 0;
        else if (args[0].value) skipped = parseInt(args[0].value);
        for (var i = 0; i < skipped; i++) {
            var song = serverQueue.songs.pop();
            serverQueue.songs.unshift(song);
        }
        updateQueue(guild.id, serverQueue, client.pool);
        if (author.voice.channel && serverQueue.playing) {
            if (!serverQueue.connection) serverQueue.connection = await author.voice.channel.join();
            if (!serverQueue.random) play(guild, serverQueue.songs[0]);
            else {
                const int = Math.floor(Math.random() * serverQueue.songs.length);
                const pending = serverQueue.songs[int];
                serverQueue.songs = moveArray(serverQueue.songs, int);
                updateQueue(guild.id, serverQueue, serverQueue.pool);
                play(guild, pending);
            }
        }
        return InteractionResponse.sendMessage(`Unskipped **${Math.max(1, skipped)}** track${skipped > 1 ? "s" : ""}!`);
    },
    async music(message, serverQueue) {
        const args = message.content.slice(message.prefix.length).split(/ +/);
        var skipped = 1;
        const guild = message.guild;
        if ((message.member.voice.channelID !== guild.me.voice.channelID) && serverQueue.playing) return message.channel.send("You have to be in a voice channel to unskip the music when the bot is playing!");
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
        if (serverQueue.songs.length < 1) return message.channel.send("There is nothing in the queue!");
        if (serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
        if (serverQueue.repeating) skipped = 0;
        else if (args[1] && isNaN(parseInt(args[1]))) message.channel.send(`**${args[1]}** is not a integer. Will skip 1 track instead.`);
        else if (args[1]) skipped = parseInt(args[1]);
        for (var i = 0; i < skipped; i++) {
            var song = serverQueue.songs.pop();
            serverQueue.songs.unshift(song);
        }
        updateQueue(message.guild.id, serverQueue, message.pool);
        message.channel.send(`Unskipped **${Math.max(1, skipped)}** track${skipped > 1 ? "s" : ""}!`);
        if (message.member.voice.channel && serverQueue.playing) {
            if (!serverQueue.connection) serverQueue.connection = await message.member.voice.channel.join();
            if (!serverQueue.random) play(guild, serverQueue.songs[0]);
            else {
                const int = Math.floor(Math.random() * serverQueue.songs.length);
                const pending = serverQueue.songs[int];
                serverQueue.songs = moveArray(serverQueue.songs, int);
                updateQueue(message.guild.id, serverQueue, serverQueue.pool);
                play(message.guild, pending);
            }
        }
    }
}