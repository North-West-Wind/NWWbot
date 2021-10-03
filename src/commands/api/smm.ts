
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { readableDateTime, color, createEmbedScrolling } from "../../function";
import smm from "smm-api";
import * as Discord from "discord.js";
import { globalClient as client } from "../../common";

const themes = ["Ground", "Underground", "Castle", "Airship", "Underwater", "Ghost House"];
const difficulties = ["Easy", "Normal", "Expert", "Super Expert"];
const styles = ["Super Mario Bros.", "Super Mario Bros. 3", "Super Mario World", "New Super Mario Bros. U"];

class SMMCommand implements SlashCommand {
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
        const courses = <Discord.MessageEmbed[]> await new Promise((resolve, reject) => {
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
                    var description = "No description";
                    if (courses[i].description) description = courses[i].description;
                    const Embed = new Discord.MessageEmbed()
                        .setColor(color())
                        .setTitle(courses[i].title)
                        .setDescription(description)
                        .addField("Uploaded", uploadedTime.toString(), true)
                        .addField("Last Modified", modifiedTime.toString(), true)
                        .addField("Difficulty", difficulty, true)
                        .addField("Game Style", gameStyle, true)
                        .addField("Course Theme", courseTheme, true)
                        .addField("Subcourse Theme", courseThemeSub, true)
                        .addField("Time", time.toString(), true)
                        .addField("Maker", creator, true)
                        .addField("Uploader", uploader, true)
                        .setTimestamp()
                        .setFooter("Have a nice day :)", client.user.displayAvatarURL());
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