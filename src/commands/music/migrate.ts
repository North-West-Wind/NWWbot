import { Message, TextChannel } from "discord.js";
import { Interaction } from "slashcord";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { globalClient as client } from "../../common";
import { moveArray, msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";

export async function migrate(message: Message | Interaction) {
    var serverQueue = getQueues().get(message.guild.id);
    const exit = NorthClient.storage.guilds[message.guild.id].exit;
    const migrating = NorthClient.storage.migrating;
    if (migrating.find(x => x === message.guild.id)) return await msgOrRes(message)("I'm on my way!").then((msg) => (<Message>msg).delete({ timeout: 10000 }));
    if (!message.member.voice.channel) return await msgOrRes(message)("You are not in any voice channel!");
    if (!message.guild.me.voice.channel) return await msgOrRes(message)("I am not in any voice channel!");
    if (message.member.voice.channelID === message.guild.me.voice.channelID) return await msgOrRes(message)("I'm already in the same channel with you!");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, client.pool);
    if (serverQueue.songs.length < 1) return await msgOrRes(message)("There is nothing in the queue.");
    if (!serverQueue.playing) return await msgOrRes(message)("I'm not playing anything.");
    if (!message.member.voice.channel.permissionsFor(message.guild.me).has(3145728)) return await msgOrRes(message)("I don't have the required permissions to play music here!");
    migrating.push(message.guild.id);
    if (exit) NorthClient.storage.guilds[message.guild.id].exit = false;
    const oldChannel = serverQueue.voiceChannel;
    var seek = 0;
    if (serverQueue.connection && serverQueue.connection.dispatcher) {
        seek = Math.floor((serverQueue.connection.dispatcher.streamTime - serverQueue.startTime) / 1000);
        serverQueue.connection.dispatcher.destroy();
    }
    serverQueue.playing = false;
    serverQueue.connection = null;
    serverQueue.voiceChannel = null;
    serverQueue.textChannel = null;
    message.guild.me?.voice?.channel?.leave();
    const voiceChannel = message.member.voice.channel;
    const msg = <Message>await msgOrRes(message)("Migrating in 3 seconds...");
    setTimeout(async () => {
        if (!message.guild.me.voice.channel || message.guild.me.voice.channelID !== voiceChannel.id) serverQueue.connection = await voiceChannel.join();
        else serverQueue.connection = message.guild.me.voice.connection;
        serverQueue.voiceChannel = voiceChannel;
        serverQueue.playing = true;
        serverQueue.textChannel = <TextChannel>message.channel;
        migrating.splice(migrating.indexOf(message.guild.id));
        await msg.edit(`Moved from **${oldChannel.name}** to **${voiceChannel.name}**`).catch(() => { });
        updateQueue(message.guild.id, serverQueue, null);
        const { play } = require("./play.js");
        if (!serverQueue.random) play(message.guild, serverQueue.songs[0], 0, seek);
        else {
            const int = Math.floor(Math.random() * serverQueue.songs.length);
            const pending = serverQueue.songs[int];
            serverQueue.songs = moveArray(serverQueue.songs, int);
            updateQueue(message.guild.id, serverQueue, serverQueue.pool);
            play(message.guild, pending);
        }
    }, 3000);
}

class MigrateCommand implements SlashCommand {
    name = "migrate"
    description = "Move the bot to the channel you are in. Use when changing voice channel."
    category = 8

    async execute(obj: { interaction: Interaction }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        await migrate(obj.interaction);
    }

    async run(message: NorthMessage) {
        await migrate(message);
    }
}

const cmd = new MigrateCommand();
export default cmd;