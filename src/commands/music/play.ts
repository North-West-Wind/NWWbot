import * as Discord from "discord.js";
import { validURL, validYTURL, validSPURL, validGDURL, validGDFolderURL, validYTPlaylistURL, validSCURL, validMSURL, requestStream, moveArray, color, validGDDLURL, msgOrRes, wait } from "../../function.js";
import { getMP3 } from "../api/musescore.js";
import scdl from 'soundcloud-downloader/dist/index';
import * as crypto from "crypto";
import { migrate as music } from "./migrate.js";
import ytdl from "ytdl-core";
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand, SoundTrack } from "../../classes/NorthClient.js";
import { getQueues, updateQueue, setQueue, createDiscordJSAdapter, findCache, cacheTrack, addUsing, removeUsing } from "../../helpers/music.js";
import * as moment from "moment";
import formatSetup from "moment-duration-format";
formatSetup(moment);
import { addYTPlaylist, addYTURL, addSPURL, addSCURL, addGDFolderURL, addGDURL, addMSURL, addURL, addAttachment, search } from "../../helpers/addTrack.js";
import * as Stream from 'stream';
import { globalClient as client } from "../../common.js";
import { AudioPlayerError, AudioPlayerStatus, createAudioPlayer, createAudioResource, demuxProbe, entersState, getVoiceConnection, joinVoiceChannel, NoSubscriberBehavior, VoiceConnectionStatus } from "@discordjs/voice";
const ffmpeg = require('fluent-ffmpeg');

function createPlayer(guild: Discord.Guild) {
  var serverQueue = getQueues().get(guild.id);
  if (!serverQueue.player) {
    serverQueue.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
    updateQueue(guild.id, serverQueue, false);
  }
  var track: SoundTrack;
  var needResource = true, needSetVolume = true;
  async function next() {
    if (!serverQueue.isSkipping) {
      if (serverQueue.looping) serverQueue.songs.push(track);
      if (!serverQueue.repeating) serverQueue.songs.shift();
    } else serverQueue.isSkipping = false;
    updateQueue(guild.id, serverQueue);
    needResource = true;
    needSetVolume = true;
    if (!serverQueue.random) await play(guild, serverQueue.songs[0]);
    else {
      const int = Math.floor(Math.random() * serverQueue.songs.length);
      const pending = serverQueue.songs[int];
      serverQueue.songs = moveArray(serverQueue.songs, int);
      updateQueue(guild.id, serverQueue);
      await play(guild, pending);
    }
  }
  return serverQueue.player.on(AudioPlayerStatus.Playing, async (_oldState, newState) => {
    track = serverQueue.songs[0];
    addUsing(track.id);
    if (needResource) {
      serverQueue.resource = newState.resource;
      needResource = !!serverQueue.resource;
    }
    if (needSetVolume) {
      const volume = serverQueue.resource?.volume;
      if (volume) {
        volume.setVolumeLogarithmic(track?.volume ? serverQueue.volume * track.volume : serverQueue.volume);
        needSetVolume = false;
      }
    }
    if (serverQueue.errorCounter) serverQueue.errorCounter--;
    updateQueue(guild.id, serverQueue, false);
  }).on(AudioPlayerStatus.Idle, async () => {
    removeUsing(track.id);
    serverQueue = getQueues().get(guild.id);
    await next();
  }).on("error", async error => {
    console.error(error.message);
    if (serverQueue) {
      removeUsing(track.id);
      serverQueue.textChannel?.send("There was an error trying to play the soundtrack!");
      if (!serverQueue.errorCounter) serverQueue.errorCounter = 1;
      else serverQueue.errorCounter = 3;
      if (serverQueue.errorCounter >= 3) serverQueue?.destroy();
      else await next();
    }
  });
}

async function probeAndCreateResource(readableStream: Stream.Readable) {
	const { stream, type } = await demuxProbe(readableStream);
	return createAudioResource(stream, { inputType: type, inlineVolume: true });
}

export function createEmbed(songs: SoundTrack[]) {
  const songLength = songs[0].time == 0 ? "∞" : moment.duration(songs[0].time, "seconds").format();
  const Embed = new Discord.MessageEmbed()
    .setColor(color())
    .setTitle("New track added:")
    .setThumbnail(songs[0].thumbnail)
    .setDescription(`**[${songs[0].title}](${songs[0].url})**\nLength: **${songLength}**`)
    .setTimestamp()
    .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
  if (songs.length > 1) Embed.setDescription(`**${songs.length}** tracks were added.`).setThumbnail(undefined);
  return Embed;
}

export async function play(guild: Discord.Guild, song: SoundTrack, seek: number = 0) {
  const queue = getQueues();
  const serverQueue = queue.get(guild.id);
  if (!serverQueue.voiceChannel && guild.me.voice?.channel) serverQueue.voiceChannel = <Discord.VoiceChannel> guild.me.voice.channel;
  serverQueue.playing = true;
  if (!song && serverQueue.songs.length > 0) {
    const filtered = serverQueue.songs.filter(song => !!song);
    if (serverQueue.songs.length !== filtered.length) {
      serverQueue.songs = filtered;
      updateQueue(guild.id, serverQueue);
      if (serverQueue.songs[0]) song = serverQueue.songs[0];
    }
  }
  if (!song || !serverQueue.voiceChannel) {
    serverQueue.playing = false;
    if (guild.me.voice?.channel) serverQueue?.destroy();
    return updateQueue(guild.id, serverQueue);
  }
  if (!serverQueue.player) {
    serverQueue.player = createPlayer(guild);
    serverQueue.connection?.subscribe(serverQueue.player);
  }
  if (!serverQueue.connection) try {
    serverQueue.connection = joinVoiceChannel({ channelId: serverQueue.voiceChannel.id, guildId: guild.id, adapterCreator: createDiscordJSAdapter(serverQueue.voiceChannel) })
    serverQueue.connection.subscribe(serverQueue.player);
    if (!guild.me.voice.selfDeaf) guild.me.voice.setDeaf(true).catch(() => {});
  } catch (err: any) {
    serverQueue?.destroy();
    if (serverQueue?.textChannel) {
      const msg = await serverQueue.textChannel.send("An error occured while trying to connect to the channel! Disconnecting the bot...");
      await wait(30000);
      return msg.delete().catch(() => { });
    }
  }
  const streamTime = serverQueue.getPlaybackDuration();
  if (serverQueue.connection) serverQueue.startTime = streamTime - seek * 1000;
  else serverQueue.startTime = -seek * 1000;
  try {
    if (!song.id) song.id = crypto.createHash("md5").update(`${song.title};${song.url}`).digest("hex");
    var stream: Stream.Readable;
    var cacheFound = true;
    if (!(stream = findCache(song.id))) {
      cacheFound = false;
      switch (song.type) {
        case 2:
        case 4:
          var a: Stream.Readable;
          if (!song.time) {
            const { error, message, songs } = await addGDURL(song.url);
            if (error) throw new Error(message);
            song = songs[0];
            a = <Stream.Readable>(await requestStream(song.url)).data;
            serverQueue.songs[0] = song;
            updateQueue(guild.id, serverQueue);
          } else a = <Stream.Readable>(await requestStream(song.url)).data;
          stream = a;
          break;
        case 3:
          stream = await scdl.download(song.url);
          break;
        case 5:
          const c = await getMP3(song.url);
          if (c.error) throw new Error(c.message);
          if (c.url.startsWith("https://www.youtube.com/embed/")) {
            const ytid = c.url.split("/").slice(-1)[0].split("?")[0];
            const options = <any> { highWaterMark: 1 << 22, filter: "audioonly", dlChunkSize: 0 };
            if (process.env.COOKIE) {
              options.requestOptions = {};
              options.requestOptions.headers = { cookie: process.env.COOKIE };
              if (process.env.YT_TOKEN) options.requestOptions.headers["x-youtube-identity-token"] = process.env.YT_TOKEN;
            }
            stream = <Stream.Readable> ytdl(`https://www.youtube.com/watch?v=${ytid}`, options);
            cacheFound = true;
          } else stream = <Stream.Readable> (await requestStream(c.url)).data;
          break;
        default:
          const options = <any> {};
          if (process.env.COOKIE) {
            options.requestOptions = {};
            options.requestOptions.headers = { cookie: process.env.COOKIE };
            if (process.env.YT_TOKEN) options.requestOptions.headers["x-youtube-identity-token"] = process.env.YT_TOKEN;
          }
          if (!song?.isPastLive) Object.assign(options, { filter: "audioonly", dlChunkSize: 0, highWaterMark: 1 << 25 });
          else Object.assign(options, { highWaterMark: 1 << 22 });
          if (!song.url) throw new Error("This soundtrack is missing URL! Please remove and add this track again to make it function.");
          stream = ytdl(song.url, options);
          if (!stream) throw new Error("Failed to get YouTube video stream.");
          cacheFound = true;
          break;
      }
    }
    if (!cacheFound) stream = await cacheTrack(song.id, stream);
    if (seek) {
      const command = ffmpeg(stream);
      const transform = new Stream.Transform();
      command.seekInput(seek).output(transform, { end: true });
      serverQueue.player?.play(await probeAndCreateResource(transform));
    } else serverQueue.player?.play(await probeAndCreateResource(stream));
    if (!serverQueue.player) return;
    await entersState(serverQueue.player, AudioPlayerStatus.Playing, 5e3);
  } catch (err: any) {
    console.error(err);
    serverQueue.player?.emit("error", new AudioPlayerError(err instanceof Error ? err : new Error(err), serverQueue.resource));
  }
  if (serverQueue.textChannel) {
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Now playing:")
      .setThumbnail(song.thumbnail)
      .setDescription(`**[${song.title}](${song.type === 1 ? song.spot : song.url})**\nLength: **${!song.time ? "∞" : moment.duration(song.time, "seconds").format()}**${seek > 0 ? ` | Starts From: **${moment.duration(seek, "seconds").format()}**` : ""}`)
      .setTimestamp()
      .setFooter("Have a nice day! :)", guild.client.user.displayAvatarURL());
    const msg = await serverQueue.textChannel.send({embeds: [Embed]});
    await wait(30000);
    msg.delete().catch(() => { });
  }
}

class PlayCommand implements SlashCommand {
  name = "play"
  description = "Plays music with the link or keywords provided."
  aliases = ["p"]
  usage = "[link | keywords]"
  category = 8
  options = [{
    name: "link",
    description: "The link of the soundtrack or keywords to search for.",
    required: false,
    type: "STRING"
  }]

  async execute(interaction: NorthInteraction) {
    await interaction.deferReply();
    await this.logic(interaction, interaction.options.getString("link"));
  }

  async run(message: NorthMessage, args: string[]) {
    await this.logic(message, args.join(" "));
  }

  async logic(message: Discord.Message | NorthInteraction, str: string) {
    var serverQueue = getQueues().get(message.guild.id);
    const voiceChannel = <Discord.VoiceChannel> (<Discord.GuildMember> message.member).voice.channel;
    if (!voiceChannel) return await msgOrRes(message, "You need to be in a voice channel to play music!");
    if (!voiceChannel.permissionsFor(message.guild.me).has(BigInt(3145728))) return await msgOrRes(message, "I can't play in your voice channel!");
    if (!str && ((message instanceof Discord.Message && message.attachments.size < 1) || message instanceof Discord.Interaction)) {
      if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
      if (serverQueue.songs.length < 1) return await msgOrRes(message, "The queue is empty for this server! Please provide a link or keywords to get a music played!");
      if (serverQueue.playing || NorthClient.storage.migrating.find(x => x === message.guild.id)) return await music(message);
      try {
        if (message.guild.me.voice?.channelId === voiceChannel.id) serverQueue.connection = getVoiceConnection(message.guild.id);
        else {
          serverQueue?.destroy();
          serverQueue.connection = joinVoiceChannel({ channelId: voiceChannel.id, guildId: message.guild.id, adapterCreator: createDiscordJSAdapter(voiceChannel) });
        }
        if (message.guild.me.voice?.channelId && !message.guild.me.voice.selfDeaf) message.guild.me.voice.setDeaf(true).catch(() => {});
      } catch (err: any) {
        await msgOrRes(message, "There was an error trying to connect to the voice channel!");
        if (err.message) await message.channel.send(err.message);
        console.error(err);
        return serverQueue?.destroy();
      }
      serverQueue.voiceChannel = voiceChannel;
      serverQueue.playing = true;
      serverQueue.textChannel = <Discord.TextChannel>message.channel;
      if (!serverQueue.player) serverQueue.player = createPlayer(message.guild);
      await entersState(serverQueue.connection, VoiceConnectionStatus.Ready, 30e3);
      serverQueue.connection.subscribe(serverQueue.player);
      updateQueue(message.guild.id, serverQueue);
      if (!serverQueue.random) await play(message.guild, serverQueue.songs[0]);
      else {
        const int = Math.floor(Math.random() * serverQueue.songs.length);
        const pending = serverQueue.songs[int];
        serverQueue.songs = moveArray(serverQueue.songs, int);
        updateQueue(message.guild.id, serverQueue);
        await play(message.guild, pending);
      }
      if (message instanceof Discord.Interaction) await message.deleteReply();
      return;
    }
    try {
      var songs = [];
      var result = { error: true, songs: [], msg: null, message: null };
      if (validYTPlaylistURL(str)) result = await addYTPlaylist(str);
      else if (validYTURL(str)) result = await addYTURL(str);
      else if (validSPURL(str)) result = await addSPURL(message, str);
      else if (validSCURL(str)) result = await addSCURL(str);
      else if (validGDFolderURL(str)) {
        const msg = await msgOrRes(message, "Processing track: (Initializing)");
        result = await addGDFolderURL(str, async (i, l) => await msg.edit(`Processing track: **${i}/${l}**`));
        await msg.delete();
      } else if (validGDURL(str) || validGDDLURL(str)) result = await addGDURL(str);
      else if (validMSURL(str)) result = await addMSURL(str);
      else if (validURL(str)) result = await addURL(str);
      else if (message instanceof Discord.Message && message.attachments.size > 0) result = await addAttachment(message);
      else result = await search(message, str);
      if (result.error) return await msgOrRes(message, result.message || "Failed to add soundtracks");
      songs = result.songs;
      if (!songs || songs.length < 1) return await msgOrRes(message, "There was an error trying to add the soundtrack!");
      const Embed = createEmbed(songs);
      if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, songs, false, false);
      else serverQueue.songs = ((!message.guild.me.voice.channel || !serverQueue.playing) ? songs : serverQueue.songs).concat((!message.guild.me.voice.channel || !serverQueue.playing) ? serverQueue.songs : songs);
      var msg: Discord.Message;
      if (result.msg) await result.msg.edit({ content: null, embeds: [Embed] });
      else await msgOrRes(message, Embed);
      setTimeout(async() => { try { await msg.edit({ embeds: [], content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0]?.title}]**` }) } catch (err: any) { } }, 30000);
      updateQueue(message.guild.id, serverQueue);
      if (!serverQueue.player) serverQueue.player = createPlayer(message.guild);
      serverQueue.voiceChannel = voiceChannel;
      serverQueue.connection = joinVoiceChannel({ channelId: voiceChannel.id, guildId: message.guild.id, adapterCreator: createDiscordJSAdapter(voiceChannel) });
      serverQueue.textChannel = <Discord.TextChannel>message.channel;
      message.guild.me.voice?.setDeaf(true).catch(() => {});
      await entersState(serverQueue.connection, VoiceConnectionStatus.Ready, 30e3);
      serverQueue.connection.subscribe(serverQueue.player);
      updateQueue(message.guild.id, serverQueue, false);
      if (!serverQueue.playing) {
        if (!serverQueue.random) await play(message.guild, serverQueue.songs[0]);
        else {
          const int = Math.floor(Math.random() * serverQueue.songs.length);
          const pending = serverQueue.songs[int];
          serverQueue.songs = moveArray(serverQueue.songs, int);
          updateQueue(message.guild.id, serverQueue);
          await play(message.guild, pending);
        }
      }
    } catch (err: any) {
      await msgOrRes(message, "There was an error trying to connect to the voice channel!");
      if (err.message) await message.channel.send(err.message);
      serverQueue?.destroy();
      console.error(err);
    }
  }
}

const cmd = new PlayCommand();
export default cmd;