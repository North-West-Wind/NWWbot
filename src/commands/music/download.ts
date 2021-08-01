import { Interaction } from "slashcord/dist/Index";
import { NorthClient, NorthMessage, ServerQueue, SlashCommand, SoundTrack } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import sanitize from "sanitize-filename";
import scdl from "soundcloud-downloader";
import ytdl, { downloadOptions } from "ytdl-core";
import { isEquivalent, requestStream, validYTPlaylistURL, validYTURL, validSPURL, validSCURL, validGDURL, validMSURL, validURL, msgOrRes } from "../../function";
import { addYTURL, addYTPlaylist, addSPURL, addSCURL, addMSURL, search } from "../../helpers/addTrack";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";
import { getMP3 } from "../api/musescore";
const requestYTDLStream = (url: string, opts: downloadOptions & { timeout?: number }) => {
    const timeout = new Promise((_resolve, reject) => setTimeout(() => reject(new Error(`YTDL video download timeout after ${opts.timeout || 30000}ms`)), opts.timeout || 30000));
    const getStream = new Promise((resolve, reject) => {
        const stream = ytdl(url, opts);
        stream.on("finish", () => resolve(stream)).on("error", err => reject(err));
    });
    return Promise.race([timeout, getStream]);
};

class DownloadCommand implements SlashCommand {
    name = "download"
    description = "Download the soundtrack from the server queue or online."
    usage = "[index | link | keywords]"
    aliases = ["dl"]
    category = 8
    options = [{
        name: "keywords",
        description: "Index/Link/Keywords of soundtrack.",
        required: false,
        type: 3
    }]

    async execute(obj: { interaction: Interaction, args: any[] }) {
        if (!obj.interaction.guild) return await obj.interaction.reply("This command only works on server.");
        var serverQueue = getQueues().get(obj.interaction.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(obj.interaction.guild.id, [], false, false);
        if (obj.args && isNaN(parseInt(obj.args[0]?.value))) return await this.downloadFromArgs(obj.interaction, serverQueue, obj.args[0].value);
        if (serverQueue.songs.length < 1) return await obj.interaction.reply("There is nothing in the queue.");
        var song = serverQueue.songs[0];
        const parsed = obj.args && obj.args[0]?.value ? parseInt(obj.args[0]?.value) : -1;
        if (parsed <= serverQueue.songs.length && parsed > 0) song = serverQueue.songs[parsed - 1];
        await this.download(obj.interaction, serverQueue, song);
        
    }
    
    async run(message: NorthMessage, args: string[]) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        const parsed = parseInt(args[0]);
        if (args[0] && isNaN(parsed)) return await this.downloadFromArgs(message, serverQueue, args.join(" "));
        if (serverQueue.songs.length < 1) return await message.channel.send("There is nothing in the queue.");
        var song = serverQueue.songs[0];
        if (parsed <= serverQueue.songs.length && parsed > 0) song = serverQueue.songs[parsed - 1];
        await this.download(message, serverQueue, song);
    }

    async download(message: Discord.Message | Interaction, serverQueue: ServerQueue, song: SoundTrack) {
        try {
            if (song?.isLive) {
                const result = await addYTURL(song.url, song.type);
                if (result.error) throw "Failed to find video";
                if (!isEquivalent(result.songs[0], song)) {
                    song = result.songs[0];
                    serverQueue.songs[0] = song;
                    await updateQueue(message.guild.id, serverQueue);
                    if (song?.isLive) return await msgOrRes(message, "Livestream downloading is not supported and recommended! Come back later when the livestream is over.");
                }
            }
        } catch (err) {
            NorthClient.storage.error(err);
            return await msgOrRes(message, `There was an error trying to download the soundtrack!`);
        }
        const msg = <Discord.Message> await msgOrRes(message, `Downloading... (Soundtrack Type: **Type ${song.type}**)`);
        let stream;
        try {
            switch (song.type) {
                case 2:
                case 4:
                    stream = await requestStream(song.url);
                    break;
                case 3:
                    stream = await scdl.download(song.url);
                    break;
                case 5:
                    const mp3 = await getMP3(song.url);
                    if (mp3.error) throw new Error(mp3.message);
                    if (mp3.url.startsWith("https://www.youtube.com/embed/")) stream = await requestYTDLStream(mp3.url, { highWaterMark: 1 << 25, filter: "audioonly", dlChunkSize: 0 });
                    else stream = await requestStream(mp3.url);
                    break;
                default:
                    stream = await requestYTDLStream(song.url, { highWaterMark: 1 << 25, filter: "audioonly", dlChunkSize: 0 });
                    break;
            }
            if (stream.status && stream.status != 200) throw new Error("Received HTTP Status Code " + stream.status);
        } catch (err) {
            NorthClient.storage.error(err);
            return await msg.edit(`There was an error trying to download the soundtrack!`);
        }
        try {
            await msg.delete();
            await message.channel.send("The file may not appear just yet. Please be patient!");
            let attachment = new Discord.MessageAttachment(stream, sanitize(`${song.title}.mp3`));
            await message.channel.send(attachment).catch((err) => message.reply(`there was an error trying to send the soundtrack! (${err.message})`));
        } catch (err) {
            await (message instanceof Discord.Message ? message.channel.send : message.followUp.send)(`There was an error trying to send the soundtrack! (${err.message})`);
            NorthClient.storage.error(err);
        }
    }

    async downloadFromArgs(message: Discord.Message | Interaction, serverQueue: ServerQueue, link: string) {
        var result = { error: true, songs: [], msg: null };
        try {
            if (validYTPlaylistURL(link)) result = await addYTPlaylist(link);
            else if (validYTURL(link)) result = await addYTURL(link);
            else if (validSPURL(link)) result = await addSPURL(message, link);
            else if (validSCURL(link)) result = await addSCURL(link);
            else if (validGDURL(link)) return await msgOrRes(message, "Wait, you should be able to access this file?");
            else if (validMSURL(link)) result = await addMSURL(link);
            else if (validURL(link)) return await msgOrRes(message, "Wait, you should be able to access this file?");
            else result = await search(message, link);
            if (result.error) return;
            if (result.msg) result.msg.delete({ timeout: 10000 });
            for (const song of result.songs) await this.download(message, serverQueue, song);
        } catch (err) {
            await msgOrRes(message, "There was an error trying to download the soundtack!");
            NorthClient.storage.error(err);
        }
    }
}

const cmd = new DownloadCommand();
export default cmd;