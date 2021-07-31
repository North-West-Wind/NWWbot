import { Interaction } from "slashcord/dist/Index";
import { NorthClient, NorthMessage, SlashCommand } from "../../classes/NorthClient";
import { color, createEmbedScrolling, getFetch } from "../../function";
import * as Discord from "discord.js";
import { globalClient as client } from "../../common";

const fetch = getFetch();

class SpeedrunCommand implements SlashCommand {
    name = "speedrun"
    description = "Display speedrun attempts of a game from Speedrun.com."
    aliases = ["sr"]
    usage = "<game>"
    category = 7
    args = 1
    options = [{
        name: "game",
        description: "The game of the speedrun.",
        required: true,
        type: 3
    }];

    async execute(obj: { args: any[], interaction: Interaction, client: NorthClient }) {
        const args = obj.args?.map(x => x?.value).filter(x => !!x);
        const gameFetch = await fetch(`https://www.speedrun.com/api/v1/games/${escape(args.join(" "))}`).then(res => res.json());
        var data, msg;
        if (!gameFetch) {
            ({ data, msg } = await this.chooseGame(obj.interaction, args.join(" ")));
            if (!data) return;
        } else {
            var em = new Discord.MessageEmbed()
                .setColor(color())
                .setTitle("Loading...")
                .setDescription("This will take a while.")
                .setTimestamp()
                .setFooter("Please be patient.", client.user.displayAvatarURL());
            msg = await obj.interaction.reply(em);
            data = gameFetch.data;
        }
        const allEmbeds = await this.getEmbedsByID(data);
        if (allEmbeds.length == 1) await msg.edit(allEmbeds[0]);
        else if (allEmbeds.length < 1) {
            em.setTitle(data.names.international).setDescription("No record was found for this game!").setFooter("Have a nice day! :)", obj.client.user.displayAvatarURL());
            await msg.edit(em);
        } else {
            await msg.delete();
            await createEmbedScrolling(obj.interaction, allEmbeds);
        }
    }

    async run(message: NorthMessage, args: string[]) {
        const gameFetch = await fetch(`https://www.speedrun.com/api/v1/games/${escape(args.join(" "))}`).then(res => res.json());
        var data, msg;
        if (!gameFetch) {
            ({ data, msg } = await this.chooseGame(message, args.join(" ")));
            if (!data) return;
        } else {
            var em = new Discord.MessageEmbed()
                .setColor(color())
                .setTitle("Loading...")
                .setDescription("This will take a while.")
                .setTimestamp()
                .setFooter("Please be patient.", client.user.displayAvatarURL());
            msg = await message.channel.send(em);
            data = gameFetch.data;
        }
        const allEmbeds = await this.getEmbedsByID(data);
        if (allEmbeds.length == 1) await msg.edit(allEmbeds[0]);
        else if (allEmbeds.length < 1) {
            em.setTitle(data.names.international).setDescription("No record was found for this game!").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
            await msg.edit(em);
        } else {
            await msg.delete();
            await createEmbedScrolling(message, allEmbeds);
        }
    }

    async chooseGame(message: Discord.Message | Interaction, name: string) {
        const games = [];
        const author = message instanceof Discord.Message ? message.author.id : (message.member?.id ?? message.channelID);
        var result = await fetch(`https://www.speedrun.com/api/v1/games?name=${escape(name)}&_bulk=1`).then(res => res.json());
        for (var i = 0; i < (result.data.length > 10 ? 10 : result.data.length); i++) games.push(`${i + 1}. **${result.data[i].names.international}** : **${result.data[i].abbreviation}**`);
        const em = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("Which game are you looking for?")
            .setDescription(games.join("\n"))
            .setTimestamp()
            .setFooter("Cannot find your game? Try to be more specified.", message.client.user.displayAvatarURL());
        if (result.data.length == 0) {
            if (message instanceof Discord.Message) await message.channel.send("No game was found!");
            else await message.reply("No game was found!");
            return { data: null, msg };
        }
        var msg: Discord.Message, index: number;
        if (message instanceof Discord.Message) msg = await message.channel.send(em);
        else {
            await message.reply(em);
            msg = await message.fetchReply();
        }
        if (result.data.length > 1) {
            var choices = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "⏹"];
            for (var i = 0; i < games.length; i++) await msg.react(choices[i]);
            await msg.react(choices[10]);
            const collected = await msg.awaitReactions((reaction, user) => choices.includes(reaction.emoji.name) && user.id === author, { max: 1, time: 30000 });
            await msg.reactions.removeAll().catch(NorthClient.storage.error);
            if (!collected) {
                em.setTitle("Timed Out").setDescription("Please try again.").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
                await msg.edit(em);
                return { data: null, msg };
            }
            em.setTitle("Loading...").setDescription("This will take a while.").setTimestamp().setFooter("Please be patient.", message.client.user.displayAvatarURL());
            await msg.edit(em);
            const reaction = collected.first();
            if (reaction.emoji.name === choices[10]) {
                em.setTitle("Action Cancelled.").setDescription("").setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
                await msg.edit(em);
                return { data: null, msg };
            }
            index = choices.indexOf(reaction.emoji.name);
        } else index = 0;
        return { data: result.data[index], msg };
    }

    async getEmbedsByID(data) {
        const allEmbeds = [];
        const results = await fetch(`https://www.speedrun.com/api/v1/games/${data.id}/records`).then(res => res.json());
        for (const record of results.data) {
            if (record.level) var levelFetch = await fetch(`https://www.speedrun.com/api/v1/levels/${record.level}`).then(res => res.json());
            if (record.category) var categoryFetch = await fetch(`https://www.speedrun.com/api/v1/categories/${record.category}`).then(res => res.json());
            const level = levelFetch && levelFetch.data ? levelFetch.data.name : "N/A";
            const category = categoryFetch && categoryFetch.data ? categoryFetch.data.name : "N/A";
            const embed = new Discord.MessageEmbed()
                .setColor(color())
                .setTitle(data.names.international)
                .setDescription(`Category: **${category}**\nLevel: **${level}**`)
                .setURL(record.weblink ? record.weblink : undefined)
                .setTimestamp()
                .setFooter("Have a nice day! :)", client.user.displayAvatarURL());
            for (const run of record.runs) {
                if (run.run.system.platform) var platformFetch = await fetch(`https://www.speedrun.com/api/v1/platforms/${run.run.system.platform}`).then(res => res.json());
                if (run.run.system.region) var regionFetch = await fetch(`https://www.speedrun.com/api/v1/regions/${run.run.system.region}`).then(res => res.json());
                const platform = platformFetch && platformFetch.data ? platformFetch.data.name : "N/A";
                const region = regionFetch && regionFetch.data ? regionFetch.data.name : "N/A"
                if (run.run.players[0].rel === "guest") var player = run.run.players[0].name;
                var time = run.run.times.primary_t;
                var date = run.run.date;
                var place = run.place;
                embed.addField(`Rank #${place}`, `Player: **${player}**\nTime: **${time}s**\nDate: **${date}**\nPlatform: **${platform}**\nRegion: **${region}**`);
            }
            allEmbeds.push(embed);
        }
        return allEmbeds;
    }
};

const cmd = new SpeedrunCommand();
export default cmd;