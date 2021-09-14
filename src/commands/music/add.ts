import { Message } from "discord.js";

import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { validYTPlaylistURL, validYTURL, validSPURL, validSCURL, validGDFolderURL, validGDURL, validGDDLURL, validMSURL, validURL, msgOrRes, wait } from "../../function";
import { addYTPlaylist, addYTURL, addSPURL, addSCURL, addGDFolderURL, addGDURL, addMSURL, addURL, addAttachment, search } from "../../helpers/addTrack";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";
import { createEmbed } from "./play";

class AddCommand implements SlashCommand {
    name = "add"
    description = "Add soundtracks to the queue without playing it."
    usage = "[link | keywords]"
    category = 8
    args = 1
    options = [{
        name: "link",
        description: "The link of the soundtrack.",
        required: true,
        type: "STRING"
    }]

    async execute(interaction: NorthInteraction) {
        await interaction.deferReply();
        await this.add(interaction, interaction.options.getString("link"));
    }

    async run(message: NorthMessage, args: string[]) {
        await this.add(message, args.join(" "));
    }

    async add(message: Message | NorthInteraction, str: string) {
        var serverQueue = getQueues().get(message.guild.id);
        try {
            var songs = [];
            var result = { error: true, message: "Unknown Error", songs: [], msg: null };
            if (validYTPlaylistURL(str)) result = await addYTPlaylist(str);
            else if (validYTURL(str)) result = await addYTURL(str);
            else if (validSPURL(str)) result = await addSPURL(message, str);
            else if (validSCURL(str)) result = await addSCURL(str);
            else if (validGDFolderURL(str)) {
                const msg = message instanceof Message ? await message.channel.send("Processing track: (Initializing)") : <Message> await message.reply({ content: "Processing track: (Initializing)", fetchReply: true });
                result = await addGDFolderURL(str, async(i, l) => await msg.edit(`Processing track: **${i}/${l}**`));
                result.msg = msg;
            } else if (validGDURL(str) || validGDDLURL(str)) result = await addGDURL(str);
            else if (validMSURL(str)) result = await addMSURL(str);
            else if (validURL(str)) result = await addURL(str);
            else if (message instanceof Message && message.attachments.size > 0) result = await addAttachment(message);
            else result = await search(message, str);
            if (result.error) return await msgOrRes(message, result.message || "Failed to add soundtrack");
            songs = result.songs;
            if (!songs || songs.length < 1) return await msgOrRes(message, "There was an error trying to add the soundtrack!");
            const Embed = createEmbed(songs);
            if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, songs, false, false);
            else serverQueue.songs = serverQueue.songs.concat(songs);
            updateQueue(message.guild.id, serverQueue);
            var msg: Message;
            if (result.msg) msg = await result.msg.edit({ content: null, embed: Embed });
            else msg = await msgOrRes(message, Embed);
            await wait(30000);
            await msg.edit({ embeds: [], content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` });
        } catch(err) {
            await msgOrRes(message, "There was an error trying to add the soundtrack to the queue!");
            console.error(err);
        }
    }
}

const cmd = new AddCommand();
export default cmd;