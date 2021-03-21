const { MessageEmbed } = require("discord.js");
const { readableDateTime, createEmbedScrolling, color } = require("../../function.js");
const fetch = require("fetch-retry")(require("node-fetch"), { retries: 5, retryDelay: attempt => Math.pow(2, attempt) * 1000 });
const { emotes } = require("../../config.json");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../../classes/Slash.js");
const createModeEmbed = (message, mode, stats) => {
    const em = new MessageEmbed()
        .setColor(color())
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
    aliases: ["survivio"],
    category: 7,
    slashInit: true,
    register: () => ApplicationCommand.createBasic(module.exports).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "user", "The username of the Survivr.").setRequired(true)
    ]),
    async slash() {
        return InteractionResponse.sendMessage("Fetching user stats...");
    },
    async postSlash(client, interaction, args) {
        InteractionResponse.deleteMessage(client, interaction).catch(() => { });
        args = args?.map(x => x?.value).filter(x => !!x);
        const message = await InteractionResponse.createFakeMessage(client, interaction);
        await this.execute(message, args);
    },
    async execute(message, args) {
        try {
            const body = { slug: args.join(" ").toLowerCase(), interval: "all", mapIdFilter: "-1" };
            const hisBody = { slug: args.join(" ").toLowerCase(), offset: 0, count: 1, teamModeFilter: 7 };
            const stats = await fetch("https://surviv.io/api/user_stats", { method: "POST", body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }).then(res => res.json());
            const history = await fetch("https://surviv.io/api/match_history", { method: "POST", body: JSON.stringify(hisBody), headers: { 'Content-Type': 'application/json' } }).then(res => res.json());
            if (!stats.player_icon) stats.player_icon = "https://surviv.io/stats/img/ui/player.svg";
            else for (const emote of emotes) if (emote.replace(/-/g, "") === stats.player_icon.split("_")[1]) {
                stats.player_icon = `https://surviv.io/img/emotes/${emote}.svg`;
                break;
            } else if (emotes.indexOf(emote) + 1 >= emotes.length) stats.player_icon = "https://surviv.io/stats/img/ui/player.svg";
            stats.modes.sort((a, b) => {
                if (a.teamMode < b.teamMode) return -1;
                if (a.teamMode > b.teamMode) return 1;
                return 0;
            });
            const allEmbeds = [];
            const overall = new MessageEmbed()
                .setColor(color())
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
            if (stats.modes[0]) allEmbeds.push(createModeEmbed(message, stats.modes[0], stats));
            if (stats.modes[1]) allEmbeds.push(createModeEmbed(message, stats.modes[1], stats));
            if (stats.modes[2]) allEmbeds.push(createModeEmbed(message, stats.modes[2], stats));
            if (history[0]) {
                const last = new MessageEmbed()
                    .setColor(color())
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
            if (allEmbeds.length == 1) await message.channel.send(allEmbeds[0]);
            else await createEmbedScrolling(message, allEmbeds);
        } catch (err) {
            await message.channel.send("Cannot find that user!");
        }
    }
}