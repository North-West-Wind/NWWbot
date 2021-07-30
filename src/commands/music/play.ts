import * as Discord from "discord.js";
import { getFetch, validURL, validYTURL, validSPURL, validGDURL, validGDFolderURL, validYTPlaylistURL, validSCURL, validMSURL, validPHURL, isEquivalent, requestStream, moveArray, color, validGDDLURL, bufferToStream } from "../../function.js";
import { getMP3 } from "../api/musescore.js";
import scdl from "soundcloud-downloader";
import * as mm from "music-metadata";
import { migrate as music } from "./migrate.js";
import ytdl from "ytdl-core";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { getQueues, updateQueue, setQueue } from "../../helpers/music.js";
import WebMscore from "webmscore";
import { Interaction } from "slashcord";
import moment from "moment";
import { addYTPlaylist, addYTURL, addSPURL, addSCURL, addGDFolderURL, addGDURL, addMSURL, addURL, addAttachment, search } from "../../helpers/addTrack.js";
import * as Stream from 'stream';
const fetch = getFetch();
const StreamConcat = require('stream-concat');


function createEmbed(client, songs) {
  const Embed = new Discord.MessageEmbed()
    .setColor(color())
    .setTitle("New track added:")
    .setThumbnail(songs[0].thumbnail)
    .setDescription(`**[${songs[0].title}](${songs[0].url})**\nLength: **${songs[0].time}**`)
    .setTimestamp()
    .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
  if (songs.length > 1) Embed.setDescription(`**${songs.length}** tracks were added.`).setThumbnail(undefined);
  return Embed;
}

export async function play(guild, song, skipped = 0, seek = 0) {
  const queue = getQueues();
  const serverQueue = queue.get(guild.id);
  if (!serverQueue.voiceChannel && guild.me.voice && guild.me.voice.channel) serverQueue.voiceChannel = guild.me.voice.channel;
  serverQueue.playing = true;
  if (!song && serverQueue.songs.length > 0) {
    const filtered = serverQueue.songs.filter(song => !!song);
    if (serverQueue.songs.length !== filtered.length) {
      serverQueue.songs = filtered;
      await updateQueue(guild.id, serverQueue);
      if (serverQueue.songs[0]) song = serverQueue.songs[0];
    }
  }
  if (!song || !serverQueue.voiceChannel) {
    serverQueue.playing = false;
    if (guild.me.voice && guild.me.voice.channel) await guild.me.voice.channel.leave();
    return await updateQueue(guild.id, serverQueue);
  }
  const args = ["0", song.url];
  var dispatcher;
  async function skip() {
    skipped++;
    if (serverQueue.textChannel) serverQueue.textChannel.send("An error occured while trying to play the track! Skipping the track..." + `${skipped < 2 ? "" : ` (${skipped} times in a row)`}`).then(msg => msg.delete({ timeout: 30000 }));
    if (skipped >= 3) {
      if (serverQueue.textChannel) serverQueue.textChannel.send("The error happened 3 times in a row! Disconnecting the bot...");
      if (serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
      serverQueue.playing = false;
      serverQueue.connection = null;
      serverQueue.voiceChannel = null;
      serverQueue.textChannel = null;
      if (guild.me.voice && guild.me.voice.channel) await guild.me.voice.channel.leave();
      return;
    }
    if (serverQueue.looping) serverQueue.songs.push(song);
    if (!serverQueue.repeating) serverQueue.songs.shift();
    await updateQueue(guild.id, serverQueue);
    await play(guild, serverQueue.songs[0], skipped);
  }
  if (!serverQueue.connection) try {
    serverQueue.connection = await serverQueue.voiceChannel.join();
    if (serverQueue.connection.voice && !serverQueue.connection.voice.selfDeaf) await serverQueue.connection.voice.setSelfDeaf(true);
  } catch (err) {
    if (guild.me.voice.channel) await guild.me.voice.channel.leave();
    if (serverQueue.textChannel) return await serverQueue.textChannel.send("An error occured while trying to connect to the channel! Disconnecting the bot...").then(msg => msg.delete({ timeout: 30000 }));
  }
  if (serverQueue.connection && serverQueue.connection.dispatcher) serverQueue.startTime = serverQueue.connection.dispatcher.streamTime - seek * 1000;
  else serverQueue.startTime = -seek * 1000;
  try {
    const silence = await requestStream("https://raw.githubusercontent.com/anars/blank-audio/master/1-second-of-silence.mp3");
    switch (song.type) {
      case 2:
      case 4:
        const a = <Stream.Readable>(await requestStream(song.url)).data;
        if (!song.time) {
          const metadata = await mm.parseStream(a, {}, { duration: true });
          const i = serverQueue.songs.indexOf(song);
          song.time = moment.duration(metadata.format.duration, "seconds");
          if (i != -1) serverQueue.songs[i] = song;
        }
        dispatcher = serverQueue.connection.play(a, { seek: seek });
        break;
      case 3:
        dispatcher = serverQueue.connection.play(await scdl.download(song.url));
        break;
      case 5:
        const c = await getMP3(song.url);
        if (c.error) throw new Error(c.message);
        var d = <Stream.Readable> (await requestStream(c.url)).data;
        dispatcher = serverQueue.connection.play(d, { seek: seek });
        break;
      case 7:
        const h = await fetch(song.url);
        if (!h.ok) throw new Error("Received HTTP Status Code: " + h.status);
        console.log("Fetched Musescore file");
        await WebMscore.ready;
        console.log("WebMscore ready");
        const i = await WebMscore.load(song.url.split(".").slice(-1)[0], (await h.buffer()));
        console.log("Loaded Musescore file");
        const sf3 = await fetch("https://www.dropbox.com/s/2pphk3a9llfiree/MuseScore_General.sf3?dl=1").then(res => res.arrayBuffer());
        console.log("Fetched Musescore SoundFont");
        await i.setSoundFont(new Uint8Array(sf3));
        console.log("Set SoundFont");
        const j = bufferToStream(Buffer.from((await i.saveAudio("wav")).buffer));
        console.log("Exported to WAV");
        i.destroy();
        console.log("Destroyed WebMscore");
        dispatcher = serverQueue.connection.play(j, { seek: seek });
        break;
      default:
        if (song?.isLive) {
          const k = await module.exports.addYTURL(args, song.type);
          if (k.error) throw "Failed to find video";
          if (!isEquivalent(k.songs[0], song)) {
            song = k.songs[0];
            serverQueue.songs[serverQueue.songs.indexOf(song)] = song;
            await updateQueue(guild.id, serverQueue);
          }
        }
        if (!song?.isLive && !song?.isPastLive) dispatcher = serverQueue.connection.play(ytdl(song.url, { filter: "audioonly", dlChunkSize: 0, highWaterMark: 1 << 25 }), { seek: seek });
        else if (song.isPastLive) dispatcher = serverQueue.connection.play(ytdl(song.url, { highWaterMark: 1 << 25 }), { seek: seek });
        else dispatcher = serverQueue.connection.play(ytdl(song.url, { highWaterMark: 1 << 25 }));
        break;
    }
  } catch (err) {
    NorthClient.storage.error(err);
    return await skip();
  }
  const now = Date.now();
  if (serverQueue.textChannel) {
    const Embed = new Discord.MessageEmbed()
      .setColor(color())
      .setTitle("Now playing:")
      .setThumbnail(song.thumbnail)
      .setDescription(`**[${song.title}](${song.type === 1 ? song.spot : song.url})**\nLength: **${song.time}**${seek > 0 ? ` | Starts From: **${moment.duration(seek, "seconds").format()}**` : ""}`)
      .setTimestamp()
      .setFooter("Have a nice day! :)", guild.client.user.displayAvatarURL());
    serverQueue.textChannel.send(Embed).then(msg => msg.delete({ timeout: 30000 }));
  }
  var oldSkipped = skipped;
  skipped = 0;
  dispatcher.on("finish", async () => {
    if (serverQueue.looping) serverQueue.songs.push(song);
    if (!serverQueue.repeating) serverQueue.songs.shift();
    await updateQueue(guild.id, serverQueue);
    if (Date.now() - now < 1000 && serverQueue.textChannel) {
      serverQueue.textChannel.send(`There was probably an error playing the last track. (It played for less than a second!)\nPlease contact NorthWestWind#1885 if the problem persist. ${oldSkipped < 2 ? "" : `(${oldSkipped} times in a row)`}`).then(msg => msg.delete({ timeout: 30000 }));
      if (++oldSkipped >= 3) {
        serverQueue.textChannel.send("The error happened 3 times in a row! Disconnecting the bot...");
        if (serverQueue.connection != null && serverQueue.connection.dispatcher) serverQueue.connection.dispatcher.destroy();
        serverQueue.playing = false;
        serverQueue.connection = null;
        serverQueue.voiceChannel = null;
        serverQueue.textChannel = null;
        if (guild.me.voice && guild.me.voice.channel) await guild.me.voice.channel.leave();
      }
    } else oldSkipped = 0;
    if (!serverQueue.random) play(guild, serverQueue.songs[0], oldSkipped);
    else {
      const int = Math.floor(Math.random() * serverQueue.songs.length);
      const pending = serverQueue.songs[int];
      serverQueue.songs = moveArray(serverQueue.songs, int);
      await updateQueue(guild.id, serverQueue);
      await play(guild, pending);
    }
  }).on("error", async error => {
    NorthClient.storage.error(error);
    skipped = oldSkipped;
    await skip();
  });
  dispatcher.setVolumeLogarithmic(song && song.volume ? serverQueue.volume * song.volume : serverQueue.volume);
}

class PlayCommand implements SlashCommand {
  name = "play"
  description = "Play music with the link or keywords provided. Only support YouTube videos currently."
  aliases = ["p"]
  usage = "[link | keywords | attachment]"
  category = 8
  permissions = 3145728
  options = [{
    name: "link",
    description: "The link of the soundtrack or keywords to search.",
    required: false,
    type: 3
  }]

  async execute(obj: { interaction: Interaction }) {
    if (!obj.interaction.guild) return obj.interaction.reply("This command only works on server.");
  }

  async run(message: NorthMessage, args: string[]) {
  }

  async logic(message: Discord.Message | Interaction, str: string) {
    var serverQueue = getQueues().get(message.guild.id);
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return await message.channel.send("You need to be in a voice channel to play music!");
    if (!voiceChannel.permissionsFor(message.client.user).has(this.permissions)) return await message.channel.send("I can't play in your voice channel!");
    if (!str && message instanceof Discord.Message && message.attachments.size < 1) {
      if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
      if (serverQueue.songs.length < 1) return await message.channel.send("The queue is empty for this server! Please provide a link or keywords to get a music played!");
      if (serverQueue.playing || NorthClient.storage.migrating.find(x => x === message.guild.id)) return await music(message);
      try {
        if (message.guild.me.voice.channel && message.guild.me.voice.channelID === voiceChannel.id) serverQueue.connection = message.guild.me.voice.connection;
        else {
          message.guild.me.voice?.channel?.leave();
          serverQueue.connection = await voiceChannel.join();
        }
        if (message.guild.me.voice && !message.guild.me.voice.selfDeaf) message.guild.me.voice.setSelfDeaf(true);
      } catch (err) {
        NorthClient.storage.error(err);
        message.guild.me.voice?.channel?.leave();
        return await message.reply("there was an error trying to connect to the voice channel!");
      }
      serverQueue.voiceChannel = voiceChannel;
      serverQueue.playing = true;
      serverQueue.textChannel = <Discord.TextChannel>message.channel;
      await updateQueue(message.guild.id, serverQueue);
      if (!serverQueue.random) play(message.guild, serverQueue.songs[0]);
      else {
        const int = Math.floor(Math.random() * serverQueue.songs.length);
        const pending = serverQueue.songs[int];
        serverQueue.songs = moveArray(serverQueue.songs, int);
        await updateQueue(message.guild.id, serverQueue);
        await play(message.guild, pending);
      }
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
        const msg = await message.channel.send("Processing track: (Initializing)");
        result = await addGDFolderURL(str, async (i, l) => await msg.edit(`Processing track: **${i}/${l}**`));
        await msg.delete();
      } else if (validGDURL(str) || validGDDLURL(str)) result = await addGDURL(str);
      else if (validMSURL(str)) result = await addMSURL(str);
      else if (validURL(str)) result = await addURL(str);
      else if (message instanceof Discord.Message && message.attachments.size > 0) result = await addAttachment(message);
      else result = await search(message, str);
      if (result.error) return await message.channel.send(result.message || "Failed to add soundtracks");
      songs = result.songs;
      if (!songs || songs.length < 1) return await message.reply("there was an error trying to add the soundtrack!");
      const Embed = createEmbed(message.client, songs);
      if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, songs, false, false);
      else serverQueue.songs = ((!message.guild.me.voice.channel || !serverQueue.playing) ? songs : serverQueue.songs).concat((!message.guild.me.voice.channel || !serverQueue.playing) ? serverQueue.songs : songs);
      if (result.msg) await result.msg.edit({ content: "", embed: Embed }).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0]?.title}]**` }).catch(() => { }), 30000)).catch(() => { });
      else await message.channel.send(Embed).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0]?.title}]**` }).catch(() => { }), 30000)).catch(() => { });
      await updateQueue(message.guild.id, serverQueue);
      if (!message.guild.me.voice.channel) {
        serverQueue.voiceChannel = voiceChannel;
        serverQueue.connection = await voiceChannel.join();
        serverQueue.textChannel = <Discord.TextChannel>message.channel;
        if (message.guild.me.voice && !message.guild.me.voice.selfDeaf) message.guild.me.voice.setSelfDeaf(true);
      }
      await updateQueue(message.guild.id, serverQueue, false);
      if (!serverQueue.playing) {
        if (!serverQueue.random) await play(message.guild, serverQueue.songs[0]);
        else {
          const int = Math.floor(Math.random() * serverQueue.songs.length);
          const pending = serverQueue.songs[int];
          serverQueue.songs = moveArray(serverQueue.songs, int);
          await updateQueue(message.guild.id, serverQueue);
          await play(message.guild, pending);
        }
      }
    } catch (err) {
      await message.reply("there was an error trying to connect to the voice channel!");
      if (message.guild.me.voice.channel) await message.guild.me.voice.channel.leave();
      NorthClient.storage.error(err);
    }
  }
}

const cmd = new PlayCommand();
export default cmd;