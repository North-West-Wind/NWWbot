const { validURL, validYTURL, validSPURL, validGDURL, validYTPlaylistURL, validSCURL, validMSURL, validPHURL } = require("../function.js");
const { setQueue, updateQueue, getQueues } = require("./main.js");
const { addAttachment, addYTPlaylist, addYTURL, addSPURL, addSCURL, addGDURL, addMSURL, addPHURL, addURL, search, createEmbed } = require("./play.js");
const { NorthClient } = require("../classes/NorthClient.js");
const { ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType, InteractionResponse } = require("../classes/Slash.js");

module.exports = {
    name: "add",
    description: "Add soundtracks to the queue without playing it.",
    usage: "<link | keywords>",
    category: 8,
    args: 1,
    slashInit: true,
    register: () => ApplicationCommand.createBasic(module.exports).setOptions([
        new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "link", "The link of the soundtrack. (Use /search to search)").setRequired(true)
    ]),
    slash: async(client, interaction, args) => {
        if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
        var serverQueue = getQueues().get(interaction.guild_id);
        try {
            var songs = [];
            var result = { error: true, message: "Unknown Error" };
            if (validYTPlaylistURL(args[0].value)) result = await addYTPlaylist(args[0].value);
            else if (validYTURL(args[0].value)) result = await addYTURL(args[0].value);
            else if (validSCURL(args[0].value)) result = await addSCURL(args[0].value);
            else if (validGDURL(args[0].value)) result = await addGDURL(args[0].value);
            else if (validMSURL(args[0].value)) result = await addMSURL(args[0].value);
            else if (validPHURL(args[0].value)) result = await addPHURL(args[0].value);
            else if (validURL(args[0].value)) result = await addURL(args[0].value);
            else return InteractionResponse.sendMessage("The link is invalid. Note that Spotify feature is trimmed in this slash command.")
            if (result.error) return InteractionResponse.sendMessage(result.message);
            songs = result.songs;
            if (!songs || songs.length < 1) return InteractionResponse.reply(interaction.member.user.id, "there was an error trying to add the soundtrack!");
            const Embed = createEmbed(client, songs);
            if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(interaction.guild_id, songs, false, false, client.pool);
            else serverQueue.songs = serverQueue.songs.concat(songs);
            updateQueue(interaction.guild_id, serverQueue, client.pool);
            setTimeout(async() => {
                await client.api.webhooks(client.user.id, interaction.token).messages["@original"].patch({
                  data: {
                    content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**`,
                    embed: null
                  }
                });
            }, 30000);
            return InteractionResponse.sendEmbeds(Embed);
        } catch(err) {
            NorthClient.storage.error(err);
            return InteractionResponse.reply(interaction.member.user.id, "there was an error trying to add the soundtrack to the queue!");
        }
    },
    async music(message, serverQueue) {
        const args = message.content.slice(message.prefix.length).split(/ +/);
        try {
            var songs = [];
            var result = { error: true, message: "Unknown Error" };
            if (validYTPlaylistURL(args.slice(1).join(" "))) result = await addYTPlaylist(args.slice(1).join(" "));
            else if (validYTURL(args.slice(1).join(" "))) result = await addYTURL(args.slice(1).join(" "));
            else if (validSPURL(args.slice(1).join(" "))) result = await addSPURL(message, args.slice(1).join(" "));
            else if (validSCURL(args.slice(1).join(" "))) result = await addSCURL(args.slice(1).join(" "));
            else if (validGDURL(args.slice(1).join(" "))) result = await addGDURL(args.slice(1).join(" "));
            else if (validMSURL(args.slice(1).join(" "))) result = await addMSURL(args.slice(1).join(" "));
            else if (validPHURL(args.slice(1).join(" "))) result = await addPHURL(args.slice(1).join(" "));
            else if (validURL(args.slice(1).join(" "))) result = await addURL(args.slice(1).join(" "));
            else if (message.attachments.size > 0) result = await addAttachment(message);
            else result = await search(message, args.slice(1).join(" "));
            if (result.error) return await message.channel.send(result.message);
            songs = result.songs;
            if (!songs || songs.length < 1) return await message.reply("there was an error trying to add the soundtrack!");
            const Embed = createEmbed(message.client, songs);
            if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, songs, false, false, message.pool);
            else serverQueue.songs = serverQueue.songs.concat(songs);
            updateQueue(message.guild.id, serverQueue, message.pool);
            if (result.msg) await result.msg.edit({ content: "", embed: Embed }).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => { }), 30000)).catch(() => { });
            else await message.channel.send(Embed).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Added Track: ${songs.length > 1 ? songs.length + " in total" : songs[0].title}]**` }).catch(() => { }), 30000)).catch(() => { });
        } catch(err) {
            await message.reply("there was an error trying to add the soundtrack to the queue!");
            NorthClient.storage.error(err);
        }
    }
}