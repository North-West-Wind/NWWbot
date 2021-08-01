import { Interaction } from "slashcord/dist/Index";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { readableDateTime, color, createEmbedScrolling } from "../../function";
import smm from "smm-api";
import * as Discord from "discord.js";
import { globalClient as client } from "../../common";

const themes = ["Ground", "Underground", "Castle", "Airship", "Underwater", "Ghost House"];
const difficulties = ["Easy", "Normal", "Expert", "Super Expert"];
const styles = ["Super Mario Bros.", "Super Mario Bros. 3", "Super Mario World", "New Super Mario Bros. U"];

class SMMCommand implements SlashCommand {
    name = "smm"
    description = "Search courses of Super Mario Maker from smmdb.net. API by Tarnadas."
    aliases = ["supermariomaker"]
    usage = "<keywords>"
    category = 7
    args = 1
    options = [{
        name: "keywords",
        description: "The course to search for.",
        required: true,
        type: 3
    }];

    async execute(obj: { interaction: Interaction, args: any }) {
        await obj.interaction.thinking();
        await createEmbedScrolling({ interaction: obj.interaction, useEdit: true }, await this.getCourseEmbed(obj.args[0].value));
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
                        .addField("Uploaded", uploadedTime, true)
                        .addField("Last Modified", modifiedTime, true)
                        .addField("Difficulty", difficulty, true)
                        .addField("Game Style", gameStyle, true)
                        .addField("Course Theme", courseTheme, true)
                        .addField("Subcourse Theme", courseThemeSub, true)
                        .addField("Time", time, true)
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