
import { NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { readableDateTime, color, createEmbedScrolling } from "../../function.js";
import smm from "smm-api";
import * as Discord from "discord.js";
import { globalClient as client } from "../../common.js";

const themes = ["Ground", "Underground", "Castle", "Airship", "Underwater", "Ghost House"];
const difficulties = ["Easy", "Normal", "Expert", "Super Expert"];
const styles = ["Super Mario Bros.", "Super Mario Bros. 3", "Super Mario World", "New Super Mario Bros. U"];

class SMMCommand implements FullCommand {
    name = "smm"
    description = "Searches courses of Super Mario Maker from smmdb.net. API by Tarnadas."
    aliases = ["supermariomaker"]
    usage = "<keywords>"
    category = 7
    args = 1
    options = [{
        name: "keywords",
        description: "The course to search for.",
        required: true,
        type: "STRING"
    }];

    async execute(interaction: NorthInteraction) {
        await interaction.deferReply();
        await createEmbedScrolling({ interaction: interaction, useEdit: true }, await this.getCourseEmbed(interaction.options.getString("keywords")));
    }

    async run(message: NorthMessage, args: string[]) {
        await createEmbedScrolling(message, await this.getCourseEmbed(args.join(" ")));
    }

    async getCourseEmbed(title: string) {
        const courses = <Discord.EmbedBuilder[]>await new Promise((resolve, reject) => {
            smm.searchCourses({ title }, async (error: Error, courses) => {
                if (error) reject(error);
                const allEmbeds = [];
                for (let i = 0; i < courses.length; i++) {
                    const uploadedTime = readableDateTime(new Date(courses[i].uploaded));
                    const modifiedTime = readableDateTime(new Date(courses[i].lastModified || courses[i].uploaded));
                    const difficultyID = courses[i].difficulty;
                    const creator = courses[i].maker;
                    const gameStyleID = courses[i].gameStyle;
                    const courseThemeID = courses[i].courseTheme;
                    const courseThemeSubID = courses[i].courseThemeSub;
                    const time = courses[i].time;
                    const uploader = courses[i].uploader;
                    const difficulty = difficulties[difficultyID];
                    const gameStyle = styles[gameStyleID];
                    const courseTheme = themes[courseThemeID];
                    const courseThemeSub = themes[courseThemeSubID];
                    let description = "No description";
                    if (courses[i].description) description = courses[i].description;
                    const Embed = new Discord.EmbedBuilder()
                        .setColor(color())
                        .setTitle(courses[i].title)
                        .setDescription(description)
                        .addFields([
                            { name: "Uploaded", value: uploadedTime.toString(), inline: true },
                            { name: "Last Modified", value: modifiedTime.toString(), inline: true },
                            { name: "Difficulty", value: difficulty, inline: true },
                            { name: "Game Style", value: gameStyle, inline: true },
                            { name: "Course Theme", value: courseTheme, inline: true },
                            { name: "Subcourse Theme", value: courseThemeSub, inline: true },
                            { name: "Time", value: time.toString(), inline: true },
                            { name: "Maker", value: creator, inline: true },
                            { name: "Uploader", value: uploader, inline: true }
                        ])
                        .setTimestamp()
                        .setFooter({ text: "Have a nice day :)", iconURL: client.user.displayAvatarURL() });
                    allEmbeds.push(Embed);
                }
                resolve(allEmbeds);
            });
        });
        return courses;
    }
}

const cmd = new SMMCommand();
export default cmd;