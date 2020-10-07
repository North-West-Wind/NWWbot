const Discord = require("discord.js");
const fetch = require("node-fetch");
const { readableDateTime } = require("../function.js");
const styles = {
    M3: "Super Mario Bros. 3",
    W3: "Super Mario 3D World",
    WU: "New Super Mario Bros. U",
    MW: "Super Mario World",
    M1: "Super Mario Bros."
}

module.exports = {
    name: "smm2",
    description: "Connect to SMMDB's Course 2 API.",
    aliases: ["supermariomaker2"],
    usage: "<keywords>",
    category: 7,
    async execute(message, args) {
        if (!args[0]) return message.channel.send("Please provide a query for searching!" + ` Usage: \`${message.client.prefix}${this.name} ${this.usage}\``);
        const courses = await fetch(`https://api.smmdb.net/courses2?limit=100&title=${encodeURIComponent(args.join(" "))}`).then(res => res.json());
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
                .setColor(Math.floor(Math.random() * Math.pow(256, 3)))
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

        const filter = (reaction, user) => {
          return (
            ["◀", "▶", "⏮", "⏭", "⏹"].includes(reaction.emoji.name) &&
            user.id === message.author.id
          );
        };
        var msg = await message.channel.send(allEmbeds[0]);
        var s = 0;
        await msg.react("⏮");
        await msg.react("◀");
        await msg.react("▶");
        await msg.react("⏭");
        await msg.react("⏹");
        var collector = await msg.createReactionCollector(filter, {
          idle: 60000,
          errors: ["time"]
        });

        collector.on("collect", function(reaction, user) {
          reaction.users.remove(user.id);
          switch (reaction.emoji.name) {
            case "⏮":
              s = 0;
              msg.edit(allEmbeds[s]);
              break;
            case "◀":
              s -= 1;
              if (s < 0) {
                s = allEmbeds.length - 1;
              }
              msg.edit(allEmbeds[s]);
              break;
            case "▶":
              s += 1;
              if (s > allEmbeds.length - 1) {
                s = 0;
              }
              msg.edit(allEmbeds[s]);
              break;
            case "⏭":
              s = allEmbeds.length - 1;
              msg.edit(allEmbeds[s]);
              break;
            case "⏹":
              collector.emit("end");
              break;
          }
        });
        collector.on("end", function() {
          msg.reactions.removeAll().catch(console.error);
        });
    }
}
