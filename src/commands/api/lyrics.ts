
import solenolyrics from "solenolyrics";
import * as Discord from "discord.js";
import { createEmbedScrolling, color } from "../../function.js";
import { FullCommand, NorthMessage, NorthInteraction } from "../../classes/NorthClient.js";
import { globalClient as client } from "../../common.js";

class LyricsCommand implements FullCommand {
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
        let lyrics = await solenolyrics.requestLyricsFor(song);
        let title = await solenolyrics.requestTitleFor(song);
        let author = await solenolyrics.requestAuthorFor(song);
        let icon;
        try {
            icon = await solenolyrics.requestIconFor(song);
        } catch (err: any) { }

        if (!author && !title) return await interaction.editReply("Cannot find the song! Try to be more specific?");
        if (!title) title = "Title Not Found";
        if (!author) author = "No Authors Found";
        if (!lyrics) lyrics = "No lyrics were found";
        const allEmbeds = await this.createLyricsEmbeds(lyrics, title, author, icon);
        if (allEmbeds.length == 1) return await interaction.editReply({ embeds: [allEmbeds[0]] });
        await createEmbedScrolling({ interaction: interaction, useEdit: true }, allEmbeds, (msg: Discord.Message) => setTimeout(() => msg.edit({ embeds: [], content: `**[Lyrics of ${title}**]` }).catch(() => { }), 10000));
    }

    async run(message: NorthMessage, args: string[]) {
        let lyrics = await solenolyrics.requestLyricsFor(args.join(" "));
        let title = await solenolyrics.requestTitleFor(args.join(" "));
        let author = await solenolyrics.requestAuthorFor(args.join(" "));
        let icon;
        try {
            icon = await solenolyrics.requestIconFor(args.join(" "));
        } catch (err: any) { }

        if (!author && !title) return message.channel.send("Cannot find the song! Try to be more specific?");
        if (!title) title = "Title Not Found";
        if (!author) author = "No Authors Found";
        if (!lyrics) lyrics = "No lyrics were found";
        const allEmbeds = await this.createLyricsEmbeds(lyrics, title, author, icon);
        if (allEmbeds.length == 1) await message.channel.send({embeds: [allEmbeds[0]]});
        else await createEmbedScrolling(message, allEmbeds, (msg: Discord.Message) => setTimeout(() => msg.edit({ embeds: [], content: `**[Lyrics of ${title}**]` }).catch(() => { }), 10000));
    }

    async createLyricsEmbeds(lyrics: string, title: string, author: string, icon: string) {
        let splitChar = "\n\n";
        let lyricsArr = lyrics.split("\n\n");
        if (lyricsArr.length === 1) lyricsArr = lyrics.split(splitChar = "\n");
        const allEmbeds = [];
        for (let i = 0; i < lyricsArr.length; i++) {
            var str = [];
            if (lyricsArr[i].length >= 2048) {
                var oneLine = lyricsArr[i].split("\n");
                for (let s = 0; s < oneLine.length; s++) {
                    str = [];
                    async function recheck() {
                        const tempLength = str.join("\n").length;
                        if ((isNaN(tempLength) ? 0 : tempLength) + ("\n").length + (oneLine[s] ? oneLine[s].length : 2048) < 2048) {
                            str.push(oneLine[s]);
                            s++;
                            return await recheck();
                        }
                    }
                    recheck();
                    const em = new Discord.EmbedBuilder()
                        .setThumbnail(icon)
                        .setColor(color())
                        .setTitle(title)
                        .setAuthor({ name: author })
                        .setDescription(str.join("\n"))
                        .setTimestamp()
                        .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
                    allEmbeds.push(em);
                }
                continue;
            }
            async function recheck() {
                const tempLength = str.join(splitChar).length;
                if ((isNaN(tempLength) ? 0 : tempLength) + splitChar.length + (lyricsArr[i] ? lyricsArr[i].length : 2048) < 2048) {
                    str.push(lyricsArr[i]);
                    i++;
                    return await recheck();
                } else {
                    i--;
                }
            }
            recheck();
            const em = new Discord.EmbedBuilder()
                .setThumbnail(icon)
                .setColor(color())
                .setTitle(title)
                .setAuthor({ name: author })
                .setDescription(str.join(splitChar))
                .setTimestamp()
                .setFooter({ text: "Have a nice day! :)", iconURL: client.user.displayAvatarURL() });
            allEmbeds.push(em);
        }
        return allEmbeds;
    }
}

const cmd = new LyricsCommand();
export default cmd;