import { MessageEmbed } from "discord.js";

import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";
import { color, createEmbedScrolling, readableDateTime } from "../../function.js";
import { globalClient as client } from "../../common.js";
import { getHistory, getStats, Stats, StatsMode } from "survivio-api";
const createModeEmbed = (mode: StatsMode, stats: Stats) => {
    const em = new MessageEmbed()
        .setColor(color())
        .setTitle(`${stats.username} - ${mode.teamMode == 1 ? "Solo" : (mode.teamMode == 2 ? "Duo" : "Squad")} Statistics`)
        .setImage(stats.player_icon)
        .addField("Wins", mode.wins.toString(), true)
        .addField("Kills", mode.kills.toString(), true)
        .addField("Games", mode.games.toString(), true)
        .addField("Kill per Game", mode.kpg.toString(), true)
        .addField("Most Kills", mode.mostKills.toString(), true)
        .addField("Most Damage", mode.mostDamage.toString(), true)
        .addField("Win Percentage", mode.winPercent + "%", true)
        .addField("Average Time Alive", mode.avgTimeAlive + " seconds", true)
        .addField("Average Damage", mode.avgDamage.toString(), true)
        .setTimestamp()
        .setFooter({ text: "Made with Surviv.io API", iconURL: client.user.displayAvatarURL() });
    return em;
}

class SurvivCommand implements SlashCommand {
    name = "surviv"
    description = "Displays the user's stats from Surviv.io."
    usage = "<user>"
    args = 1
    aliases = ["survivio"]
    category = 7
    options = [{
        name: "user",
        description: "The username of the Survivr.",
        required: true,
        type: "STRING"
    }];

    async execute(interaction: NorthInteraction) {
        await interaction.deferReply();
        try {
            const allEmbeds = await this.getPlayerEmbed(interaction.options.getString("user"));
            if (allEmbeds.length == 1) await interaction.editReply({embeds: [allEmbeds[0]]});
            else await createEmbedScrolling({ interaction, useEdit: true }, allEmbeds);
        } catch (err: any) {
            await interaction.editReply("Cannot find that user!");
        }
    }

    async run(message: NorthMessage, args: string[]) {
        try {
            const allEmbeds = await this.getPlayerEmbed(args.join(" "));
            if (allEmbeds.length == 1) await message.channel.send({embeds: [allEmbeds[0]]});
            else await createEmbedScrolling(message, allEmbeds);
        } catch (err: any) {
            await message.channel.send("Cannot find that user!");
        }
    }

    async getPlayerEmbed(player: string) {
        const stats = await getStats(player);
        const history = await getHistory(player);
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
            .addField("Wins", stats.wins.toString(), true)
            .addField("Kills", stats.kills.toString(), true)
            .addField("Games", stats.games.toString(), true)
            .addField("Kill per Game", stats.kpg.toString(), true)
            .addField("Banned", stats.banned ? "Yes" : "No", true)
            .setTimestamp()
            .setFooter({ text: "Made with Surviv.io API", iconURL: client.user.displayAvatarURL() });
        allEmbeds.push(overall);
        for (const mode of stats.modes) allEmbeds.push(createModeEmbed(mode, stats));
        if (history[0]) {
            const last = new MessageEmbed()
                .setColor(color())
                .setTitle(`${stats.username} - Last Played Game`)
                .setImage(stats.player_icon)
                .addField("Mode", history[0].team_mode == 1 ? "Solo" : (history[0].team_mode == 2 ? "Duo" : "Squad"), true)
                .addField("Number of Teammates", history[0].team_count.toString(), true)
                .addField("Total Teams", history[0].team_total.toString(), true)
                .addField("Rank", history[0].rank.toString(), true)
                .addField("Kills", history[0].kills.toString(), true)
                .addField("Team Kills", history[0].team_kills.toString(), true)
                .addField("End Time", readableDateTime(new Date(history[0].end_time)), true)
                .addField("Damage Dealt", history[0].damage_dealt.toString(), true)
                .addField("Damage Taken", history[0].damage_taken.toString(), true)
                .setTimestamp()
                .setFooter({ text: "Made with Surviv.io API", iconURL: client.user.displayAvatarURL() });
            allEmbeds.push(last);
        }
        return allEmbeds;
    }
}

const cmd = new SurvivCommand();
export default cmd;

const emotes = [
    "acorn",
    "face-alien",
    "face-angry",
    "baguette",
    "campfire",
    "candy-corn",
    "cattle",
    "chick",
    "chicken-dinner",
    "coconut",
    "crab",
    "cupcake",
    "face-dab",
    "face-disappoint",
    "donut",
    "egg",
    "eggplant",
    "fish",
    "flag-albania",
    "flag-algeria",
    "flag-argentina",
    "flag-australia",
    "flag-austria",
    "flag-azerbaijan",
    "flag-belarus",
    "flag=belgium",
    "flag-bolivia",
    "flag-brazil",
    "flag-canada",
    "flag-chile",
    "flag-china",
    "flag-colombia",
    "flag-croatia",
    "flag-czech-republic",
    "flag-denmark",
    "flag-dominican-republic",
    "flag-ecudaor",
    "flag-egypt",
    "flag-estonia",
    "flag-finland",
    "flag-france",
    "flag-georgia",
    "flag-germany",
    "flag-greece",
    "flag-guatemala",
    "flag-honduras",
    "flag-hong-kong",
    "flag-hungary",
    "flag-india",
    "flag-indonesia",
    "flag-israel",
    "flag-italy",
    "flag-japan",
    "flag-kazakhstan",
    "flag-latvia",
    "flag-lithuania",
    "flag-malaysia",
    "flag-mexico",
    "flag-morocco",
    "flag-netherlands",
    "flag-new-zealand",
    "flag-norway",
    "flag-peru",
    "flag-philippines",
    "flag-republic-of-poland",
    "flag-portugal",
    "flag-romania",
    "flag-russia",
    "flag-serbia",
    "flag-singapore",
    "flag-slovakia",
    "flag-south-korea",
    "flag-spain",
    "flag-sweden",
    "flag-switzerland",
    "flag-taiwan",
    "flag-thailand",
    "flag-trinidad-and-tobago",
    "flag-turkey",
    "flag-ukraine",
    "flag-united-arab-emirates",
    "flag-united-kingdom",
    "flag-united-stats-of-america",
    "flag-uruguay",
    "flag-venezuela",
    "flag-vietnam",
    "flex",
    "forest",
    "gg",
    "face-happy",
    "face-headshot",
    "heart",
    "face-heart",
    "ice-cream",
    "face-imp",
    "face-joy",
    "leek",
    "face-monocle",
    "logo-surviv",
    "pilgrim-hat",
    "pineapple",
    "police",
    "potato",
    "pumpkin",
    "question",
    "face-sad",
    "salt",
    "santa-hat",
    "snowflake",
    "snowman",
    "face-sob",
    "face-sunglass",
    "surviv",
    "teabag",
    "logo-caduceus",
    "logo-chrysanthemum",
    "logo-cloud",
    "logo-conch",
    "logo-crossing",
    "logo-egg",
    "logo-hatchet",
    "logo-hydra",
    "logo-meteor",
    "logo-storm",
    "logo-swine",
    "logo-twins",
    "face-thinking",
    "thumbs-up",
    "trunk",
    "turkey-animal",
    "face-upsidedown",
    "whale",
    "sleepy",
    "emote-panned",
    "emote-deadface",
    "emote-lies",
    "emote-shroomcloud",
    "emote-sweaty",
    "emote-easy",
    "emote-greedy",
    "emote-flushed",
    "face-shock",
    "emote-trollface",
    "emote-skull",
    "emote-oof",
    "rainbow",
    "face-picasso",
    "ghost-base",
    "face-poo",
    "ok",
    "face-bandaged",
    "tombstone"
];