import { DiscordGatewayAdapterCreator, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { GuildMember, Message, TextChannel } from "discord.js";

import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { moveArray, msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";
import { play } from "./play";

export async function migrate(message: Message | NorthInteraction) {
    var serverQueue = getQueues().get(message.guild.id);
    const member = <GuildMember> message.member;
    const exit = NorthClient.storage.guilds[message.guild.id].exit;
    const migrating = NorthClient.storage.migrating;
    if (migrating.find(x => x === message.guild.id)) return await  msgOrRes(message, "I'm on my way!").then(msg => setTimeout(msg.delete, 10000));
    if (!member.voice.channel) return await msgOrRes(message, "You are not in any voice channel!");
    if (!message.guild.me.voice.channel) return await msgOrRes(message, "I am not in any voice channel!");
    if (member.voice.channelId === message.guild.me.voice.channelId) return await msgOrRes(message, "I'm already in the same channel with you!");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
    if (serverQueue.songs.length < 1) return await msgOrRes(message, "There is nothing in the queue.");
    if (!serverQueue.playing) return await msgOrRes(message, "I'm not playing anything.");
    if (!member.voice.channel.permissionsFor(message.guild.me).has(BigInt(3145728))) return await msgOrRes(message, "I don't have the required permissions to play music here!");
    migrating.push(message.guild.id);
    if (exit) NorthClient.storage.guilds[message.guild.id].exit = false;
    const oldChannel = serverQueue.voiceChannel;
    var seek = 0;
    if (serverQueue.connection) {
        seek = Math.floor((serverQueue.streamTime - serverQueue.startTime) / 1000);
        serverQueue.destroy();
    }
    serverQueue.playing = false;
    serverQueue.connection = null;
    serverQueue.voiceChannel = null;
    serverQueue.textChannel = null;
    const voiceChannel = (<GuildMember> message.member).voice.channel;
    const msg = <Message>await msgOrRes(message, "Migrating in 3 seconds...");
    setTimeout(async () => {
        if (!message.guild.me.voice.channel || message.guild.me.voice.channelId !== voiceChannel.id) serverQueue.connection = joinVoiceChannel({ channelId: voiceChannel.id, guildId: message.guild.id, adapterCreator: <DiscordGatewayAdapterCreator> <unknown> message.guild.voiceAdapterCreator });
        else serverQueue.connection = getVoiceConnection(message.guild.id);
        serverQueue.voiceChannel = voiceChannel;
        serverQueue.playing = true;
        serverQueue.textChannel = <TextChannel>message.channel;
        migrating.splice(migrating.indexOf(message.guild.id));
        await msg.edit(`Moved from **${oldChannel.name}** to **${voiceChannel.name}**`).catch(() => { });
        await updateQueue(message.guild.id, serverQueue, false);
        if (!serverQueue.random) await play(message.guild, serverQueue.songs[0], seek);
        else {
            const int = Math.floor(Math.random() * serverQueue.songs.length);
            const pending = serverQueue.songs[int];
            serverQueue.songs = moveArray(serverQueue.songs, int);
            await updateQueue(message.guild.id, serverQueue);
            play(message.guild, pending);
        }
    }, 3000);
}

class MigrateCommand implements SlashCommand {
    name = "migrate"
    description = "Move the bot to the channel you are in. Use when changing voice channel."
    category = 8

    async execute(interaction: NorthInteraction) {
        await migrate(interaction);
    }

    async run(message: NorthMessage) {
        await migrate(message);
    }
}

const cmd = new MigrateCommand();
export default cmd;