const { MessageEmbed } = require("discord.js");
const { readableDateTime, createEmbedScrolling } = require("../function.js");
const fetch = require("fetch-retry")(require("node-fetch"), { retries: 5, retryDelay: attempt => Math.pow(2, attempt) * 1000 });
const { emotes } = require("../config.json");
const createModeEmbed = (mode) => {
    const em = new MessageEmbed()
        .setColor(console.color())
        .setTitle(`${stats.username} - ${mode.teamMode == 1 ? "Solo" : (mode.teamMode == 2 ? "Duo" : "Squad")} Statistics`)
        .setImage(stats.player_icon)
        .addField("Wins", mode.wins, true)
        .addField("Kills", mode.kills, true)
        .addField("Games", mode.games, true)
        .addField("Kill per Game", mode.kpg, true)
        .addField("Most Kills", mode.mostKills, true)
        .addField("Most Damage", mode.mostDamage, true)
        .addField("Win Percentage", mode.winPct + "%", true)
        .addField("Average Time Alive", mode.avgTimeAlive + " seconds", true)
        .addField("Average Damage", mode.avgDamage, true)
        .setTimestamp()
        .setFooter("Made with Surviv.io API", message.client.user.displayAvatarURL());
    return em;
}
module.exports = {
    name: "surviv",
    description: "Display the user's stats from Surviv.io.",
    usage: "<username>",
    args: 1,
    async execute(message, args) {
        try {
            const stats = await fetch("https://surviv.io/api/user_stats", { method: "POST", body: JSON.stringify({ slug: args.join(" "), interval: "all", mapIdFilter: "-1" }) }).then(res => res.json());
            const history = await fetch("https://surviv.io/api/match_history", { method: "POST", body: JSON.stringify({ slug: args.join(" "), offset: 0, count: 1, teamModeFilter: 7 }) }).then(res => res.json());
            if (!stats.player_icon) stats.player_icon = "https://surviv.io/stats/img/ui/player.svg";
            else for (const emote of emotes) if (emote.replace(/-/g, "") === stats.player_icon.split("_")[1]) {
                stats.player_icon = `https://surviv.io/img/emotes/${emote}.svg`;
                break;
            }
            stats.modes.sort((a, b) => {
                if (a.teamMode < b.teamMode) return -1;
                if (a.teamMode > b.teamMode) return 1;
                return 0;
            });
            const allEmbeds = [];
            const overall = new MessageEmbed()
                .setColor(console.color())
                .setTitle(`${stats.username} - Overall Statistics`)
                .setImage(stats.player_icon)
                .addField("Wins", stats.wins, true)
                .addField("Kills", stats.kills, true)
                .addField("Games", stats.games, true)
                .addField("Kill per Game", stats.kpg, true)
                .addField("Banned", stats.banned ? "Yes" : "No", true)
                .setTimestamp()
                .setFooter("Made with Surviv.io API", message.client.user.displayAvatarURL());
            allEmbeds.push(overall);
            if(stats.modes[0]) allEmbeds.push(createModeEmbed(stats.modes[0]));
            if(stats.modes[1]) allEmbeds.push(createModeEmbed(stats.modes[1]));
            if(stats.modes[2]) allEmbeds.push(createModeEmbed(stats.modes[2]));
            if(history[0]) {
                const last = new MessageEmbed()
                    .setColor(console.color())
                    .setTitle(`${stats.username} - Last Played Game`)
                    .setImage(stats.player_icon)
                    .addField("Mode", history[0].team_mode == 1 ? "Solo" : (history[0].team_mode == 2 ? "Duo" : "Squad"), true)
                    .addField("Number of Teammates", history[0].team_count, true)
                    .addField("Total Teams", history[0].team_total, true)
                    .addField("Rank", history[0].rank, true)
                    .addField("Kills", history[0].kills, true)
                    .addField("Team Kills", history[0].team_kills, true)
                    .addField("End Time", readableDateTime(new Date(history[0].end_time)), true)
                    .addField("Damage Dealt", history[0].damage_dealt, true)
                    .addField("Damage Taken", history[0].damage_taken, true)
                    .setTimestamp()
                    .setFooter("Made with Surviv.io API", message.client.user.displayAvatarURL());
                allEmbeds.push(last);
            }
            if(allEmbeds.length == 1) await message.channel.send(allEmbeds[0]);
            else await createEmbedScrolling(message, allEmbeds);
        } catch (err) {
            return await message.channel.send("Cannot find that user!");
        }
    }
}