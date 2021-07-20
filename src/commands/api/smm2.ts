import { Interaction } from "slashcord";
import { NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { color, createEmbedScrolling, getFetch, readableDateTime } from "../../function";
import * as Discord from "discord.js";

const fetch = getFetch();
const styles = {
    M3: "Super Mario Bros. 3",
    W3: "Super Mario 3D World",
    WU: "New Super Mario Bros. U",
    MW: "Super Mario World",
    M1: "Super Mario Bros."
}

class SMM2Command implements SlashCommand {
    name = "smm2"
    description = "Search courses of Super Mario Maker from smmdb.net. API by Tarnadas."
    aliases = ["supermariomaker2"]
    usage = "<keywords>"
    category = 7
    args = 1
    options = [{
        name: "keywords",
        description: "The course to search for.",
        required: true,
        type: 3
    }];

    async execute(obj: { args: any[], interaction: Interaction }) {
        const args = obj.args?.map(x => x?.value).filter(x => !!x);
        const allEmbeds = await this.getCourseEmbed(args.join(" "));
        if(allEmbeds.length < 1) return await obj.interaction.reply("Cannot find any courses!");
        await createEmbedScrolling(obj.interaction, allEmbeds);
    }
    
    async run(message: NorthMessage, args: string[]) {
        const allEmbeds = await this.getCourseEmbed(args.join(" "));
        if(allEmbeds.length < 1) return await message.channel.send("Cannot find any courses!");
        await createEmbedScrolling(message, allEmbeds);
    }

    async getCourseEmbed(keywords) {
        const courses = await fetch(`https://api.smmdb.net/courses2?limit=100&title=${encodeURIComponent(keywords)}`).then(res => res.json());
        const allEmbeds = [];
        for (const course of courses) {
            const uploader = course.uploader;
            const difficulty = course.difficulty ? course.difficulty.substr(0, 1).toUpperCase() + course.difficulty.substr(1, course.difficulty.length - 1) : "No description.";
            const uploaded = readableDateTime(new Date(course.uploaded));
            const lastModified = readableDateTime(new Date(course.lastModified));
            const votes = course.votes;
            const title = course.course.header.title;
            const description = course.course.header.description;
            const time = course.course.header.time;
            const style = styles[course.course.header.game_style];
            const thumbnail = `https://api.smmdb.net/courses2/thumbnail/${course.id}?size=l`;

            const main = {
                theme: course.course.course_area.course_theme === "GHOUST_HOUSE" ? "Ghost House" : course.course.course_area.course_theme.substr(0, 1) + course.course.course_area.course_theme.substr(1, course.course.course_area.course_theme.length - 1).toLowerCase().split(/_/g).join(" "),
                autoscroll: course.course.course_area.auto_scroll.substr(0, 1) + course.course.course_area.auto_scroll.substr(1, course.course.course_area.auto_scroll.length - 1).toLowerCase().split(/_/g).join(" "),
                orientation: course.course.course_area.orientation.substr(0, 1) + course.course.course_area.orientation.substr(1, course.course.course_area.orientation.length - 1).toLowerCase().split(/_/g).join(" "),
                day: course.course.course_area.day_time.substr(0, 1) + course.course.course_area.day_time.substr(1, course.course.course_area.day_time.length - 1).toLowerCase().split(/_/g).join(" ")
            };
            
            if(course.course.course_sub_area)
                var sub = {
                    theme: course.course.course_sub_area.course_theme === "GHOUST_HOUSE" ? "Ghost House" : course.course.course_sub_area.course_theme.substr(0, 1) + course.course.course_sub_area.course_theme.substr(1, course.course.course_sub_area.course_theme.length - 1).toLowerCase().split(/_/g).join(" "),
                    autoscroll: course.course.course_sub_area.auto_scroll.substr(0, 1) + course.course.course_sub_area.auto_scroll.substr(1, course.course.course_sub_area.auto_scroll.length - 1).toLowerCase().split(/_/g).join(" "),
                    orientation: course.course.course_sub_area.orientation.substr(0, 1) + course.course.course_sub_area.orientation.substr(1, course.course.course_sub_area.orientation.length - 1).toLowerCase().split(/_/g).join(" "),
                    day: course.course.course_sub_area.day_time.substr(0, 1) + course.course.course_sub_area.day_time.substr(1, course.course.course_sub_area.day_time.length - 1).toLowerCase().split(/_/g).join(" ")
                };

            const em = new Discord.MessageEmbed()
                .setColor(color())
                .setTitle(title)
                .setThumbnail(thumbnail)
                .setDescription(description.length > 2048 ? description.substr(0, 2045) + "..." : description)
                .addField("Uploader", uploader, true)
                .addField("Upload Date", uploaded, true)
                .addField("Last Modified", lastModified, true)
                .addField("Difficulty", difficulty, true)
                .addField("Time", time, true)
                .addField("Style", style, true)
                .addField("Main Area", `Theme: **${main.theme}**\nAuto-scroll: **${main.autoscroll}**\nOrientation: **${main.orientation}**\nDay/Night: **${main.day}**`)
                .addField("Sub Area", sub ? `Theme: **${sub.theme}**\nAuto-scroll: **${sub.autoscroll}**\nOrientation: **${sub.orientation}**\nDay/Night: **${sub.day}**` : "No Sub Area")
                .setTimestamp()
                .setFooter(`Votes: ${votes}`);
            allEmbeds.push(em);
        }
        return allEmbeds;
    }
}

const cmd = new SMM2Command();
export default cmd;