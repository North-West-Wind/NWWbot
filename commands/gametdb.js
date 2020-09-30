const rp = require("request-promise-native");
var accOpt = {
    method: "POST",
    uri: "https://id.twitch.tv/oauth2/token",
    qs: {
        client_id: process.env.TWITCH_ID,
        client_secret: process.env.TWITCH_SECRET,
        grant_type: "client_credentials"
    },
    json: true
};
const igdb = require('igdb-api-node').default;
const { readableDate } = require("../function.js");
const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;
const filter = (reaction, user) => {
  return (
    ["◀", "▶", "⏮", "⏭", "⏹"].includes(
      reaction.emoji.name
    ) && user.id === message.author.id
  );
};

module.exports = {
    name: "gametdb",
    descipriont: "Fetch games from IGDB.",
    usage: "<keywords>",
    aliases: ["gtdb", "igdb"],
    async execute(message, args) {
        if (!args[0]) return message.channel.send("You need to provide at least 1 keyword!");
        var accTok = await rp(options);
        const client = igdb(process.env.TWITCH_ID, accTok.access_token);
        const response = await client.fields("*").limit(500).sort('rating', 'desc').search(args.join(" ")).request("/games");
        const allEmbeds = [];
        let i = 0;
        for (const result of response) {
            const cover = await client.fields("url").where(`id = ${result.cover}`).request("/covers");
            const em = new Discord.MessageEmbed()
                .setColor(color)
                .setThumbnail("https:" + cover.url)
                .setTitle(result.name)
                .setURL(result.url)
                .setDescription(`Release Date: ${readableDate(new Date(result.first_release_date))}\nRating: ${Math.round(result.rating * 10) / 10}\n\n${result.summary}`)
                .setTimestamp()
                .setFooter(`${++i} out of ${response.length}`, message.client.user.displayAvatarURL());
            allEmbeds.push(em);
        }
        var s = 0;
        var msg = await message.channel.send(
            allEmbeds[0]
        );

        await msg.react("⏮");
        await msg.react("◀");
        await msg.react("▶");
        await msg.react("⏭");
        await msg.react("⏹");
        var collector = await msg.createReactionCollector(
            filter,
            { idle: 60000, errors: ["time"] }
        );

        collector.on("collect", function (reaction, user) {
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
        collector.on("end", function () {
            msg.reactions.removeAll().catch(console.error);
        });

    }
}