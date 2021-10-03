
import * as solenolyrics from "solenolyrics";
import * as Discord from "discord.js";
import { createEmbedScrolling, color } from "../../function";
import { SlashCommand, NorthMessage, NorthInteraction } from "../../classes/NorthClient";
import { globalClient as client } from "../../common";

class LyricsCommand implements SlashCommand {
    name = "lyrics";
    description = "Displays lyrics of songs if they are found.";
    usage = "<song>";
    category = 7;
    args = 1;
    options = [
        {
            type: "STRING",
            name: "song",
            description: "The song to search for.",
            required: true
        }
    ]

    async execute(interaction: NorthInteraction) {
        const song = interaction.options.getString("song");
        await interaction.deferReply();
        var lyrics = await solenolyrics.requestLyricsFor(song);
        var title = await solenolyrics.requestTitleFor(song);
        var author = await solenolyrics.requestAuthorFor(song);
        var icon;
        try {
            icon = await solenolyrics.requestIconFor(song);
        } catch (err: any) { }

        if (!author && !title) return await interaction.editReply("Cannot find the song! Try to be more specific?");
        if (!title) title = "Title Not Found";
        if (!author) author = "No Authors Found";
        if (!lyrics) lyrics = "No lyrics were found";
        const allEmbeds = await this.createLyricsEmbeds(lyrics, title, author, icon);
        if (allEmbeds.length == 1) return await interaction.editReply({ embeds: [allEmbeds[0]] });
        await createEmbedScrolling({ interaction: interaction, useEdit: true }, allEmbeds, 2, { title });
    }

    async run(message: NorthMessage, args: string[]) {
        var lyrics = await solenolyrics.requestLyricsFor(args.join(" "));
        var title = await solenolyrics.requestTitleFor(args.join(" "));
        var author = await solenolyrics.requestAuthorFor(args.join(" "));
        var icon;
        try {
            icon = await solenolyrics.requestIconFor(args.join(" "));
        } catch (err: any) { }

        if (!author && !title) return message.channel.send("Cannot find the song! Try to be more specific?");
        if (!title) title = "Title Not Found";
        if (!author) author = "No Authors Found";
        if (!lyrics) lyrics = "No lyrics were found";
        const allEmbeds = await this.createLyricsEmbeds(lyrics, title, author, icon);
        if (allEmbeds.length == 1) await message.channel.send({embeds: [allEmbeds[0]]});
        else await createEmbedScrolling(message, allEmbeds, 2, { title });
    }

    async createLyricsEmbeds(lyrics: string, title: string, author: string, icon: string) {
        var splitChar = "\n\n";
        var lyricsArr = lyrics.split("\n\n");
        if (lyricsArr.length === 1) lyricsArr = lyrics.split(splitChar = "\n");
        const allEmbeds = [];
        for (let i = 0; i < lyricsArr.length; i++) {
            var str = [];
            if (lyricsArr[i].length >= 2048) {
                var oneLine = lyricsArr[i].split("\n");
                for (let s = 0; s < oneLine.length; s++) {
                    str = [];
                    async function recheck() {
                        var tempLength = str.join("\n").length;
                        if ((isNaN(tempLength) ? 0 : tempLength) + ("\n").length + (oneLine[s] ? oneLine[s].length : 2048) < 2048) {
                            str.push(oneLine[s]);
                            s++;
                            return await recheck();
                        }
                    }
                    recheck();
                    const em = new Discord.MessageEmbed()
                        .setThumbnail(icon)
                        .setColor(color())
                        .setTitle(title)
                        .setAuthor(author)
                        .setDescription(str.join("\n"))
                        .setTimestamp()
                        .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
                    allEmbeds.push(em);
                }
                continue;
            }
            async function recheck() {
                var tempLength = str.join(splitChar).length;
                if ((isNaN(tempLength) ? 0 : tempLength) + splitChar.length + (lyricsArr[i] ? lyricsArr[i].length : 2048) < 2048) {
                    str.push(lyricsArr[i]);
                    i++;
                    return await recheck();
                } else {
                    i--;
                }
            }
            recheck();
            var em = new Discord.MessageEmbed()
                .setThumbnail(icon)
                .setColor(color())
                .setTitle(title)
                .setAuthor(author)
                .setDescription(str.join(splitChar))
                .setTimestamp()
                .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
            allEmbeds.push(em);
        }
        return allEmbeds;
    }
}

const cmd = new LyricsCommand();
export default cmd;