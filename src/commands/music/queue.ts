import { Message } from "discord.js";

import { NorthClient, NorthInteraction, NorthMessage, ServerQueue, SlashCommand } from "../../classes/NorthClient";
import * as Discord from "discord.js";
import { color, createEmbedScrolling, msgOrRes } from "../../function";
import { getQueues, setQueue, updateQueue } from "../../helpers/music";
import { globalClient as client } from "../../common";
import { RowDataPacket } from "mysql2";

class QueueCommand implements SlashCommand {
    name = "queue"
    description = "Display the current song queue."
    aliases = ["q"]
    subcommands = ["save", "load", "delete", "list", "sync"]
    subdesc = ["Save the current queue to the database.", "Load a queue from the database.", "Delete a queue from the database.", "List all the queues of a user.", "Synchronize the queue with another server you are in."]
    subusage = ["<subcommand> <name>", 0, 0]
    subaliases = ["s", "l", "d", "li", "sy"]
    category = 8
    options = [
        {
            name: "current",
            description: "Display the current soundtrack queue.",
            type: "SUB_COMMAND"
        },
        {
            name: "save",
            description: "Save the current queue to the database.",
            type: "SUB_COMMAND",
            options: [{
                name: "name",
                description: "The name of the queue.",
                required: true,
                type: "STRING"
            }]
        },
        {
            name: "load",
            description: "Load a queue from the database.",
            type: "SUB_COMMAND",
            options: [{
                name: "name",
                description: "The name of the queue.",
                required: true,
                type: "STRING"
            }]
        },
        {
            name: "delete",
            description: "Delete a queue from the database.",
            type: "SUB_COMMAND",
            options: [{
                name: "name",
                description: "The name of the queue.",
                required: true,
                type: "STRING"
            }]
        },
        {
            name: "list",
            description: "List all the queue of a user.",
            type: "SUB_COMMAND"
        },
        {
            name: "sync",
            description: "Synchronize the queue with another server you are in.",
            type: "SUB_COMMAND",
            options: [{
                name: "name",
                description: "The name of the server.",
                required: true,
                type: "STRING"
            }]
        },
    ]


    async execute(interaction: NorthInteraction) {
        var serverQueue = getQueues().get(interaction.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(interaction.guild.id, [], false, false);
        const sub = interaction.options.getSubcommand();
        if (sub === "current") return await this.viewQueue(interaction, serverQueue);
        if (sub === "save") return await this.save(interaction, serverQueue, interaction.options.getString("name"));
        if (sub === "load") return await this.load(interaction, serverQueue, interaction.options.getString("name"));
        if (sub === "delete") return await this.delete(interaction, interaction.options.getString("name"));
        if (sub === "list") return await this.list(interaction);
        if (sub === "sync") return await this.sync(interaction, serverQueue, interaction.options.getString("name"));
        await this.viewQueue(interaction, serverQueue);
    }
    
    async run(message: NorthMessage, args: string[]) {
        var serverQueue = getQueues().get(message.guild.id);
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false);
        if (args[0] && (args[0].toLowerCase() === "save" || args[0].toLowerCase() === "s")) return await this.save(message, serverQueue, args.slice(1).join(" "));
        if (args[0] && (args[0].toLowerCase() === "load" || args[0].toLowerCase() === "l")) return await this.load(message, serverQueue, args.slice(1).join(" "));
        if (args[0] && (args[0].toLowerCase() === "delete" || args[0].toLowerCase() === "d")) return await this.delete(message, args.slice(1).join(" "));
        if (args[0] && (args[0].toLowerCase() === "list" || args[0].toLowerCase() === "li")) return await this.list(message);
        if (args[0] && (args[0].toLowerCase() === "sync" || args[0].toLowerCase() === "sy")) return await this.sync(message, serverQueue, args.slice(1).join(" "));
        await this.viewQueue(message, serverQueue);
    }

    async viewQueue(message: Message | NorthInteraction, serverQueue: ServerQueue) {
        if (serverQueue.songs.length < 1) return await msgOrRes(message, "Nothing is in the queue now.");
        const filtered = serverQueue.songs.filter(song => !!song);
        if (serverQueue.songs.length !== filtered.length) {
            serverQueue.songs = filtered;
            await updateQueue(message.guild.id, serverQueue);
        }
        var index = 0;
        function getIndex() {
            if (index == 0 || !serverQueue.random) return ++index;
            return "???";
        }
        const songArray = serverQueue.songs.map(song => `**${getIndex()} - ** **[${song.title}](${song.type === 1 ? song.spot : song.url})** : **${song.time}**`);
        const allEmbeds = [];
        for (let i = 0; i < Math.ceil(songArray.length / 10); i++) {
            const pageArray = songArray.slice(i * 10, i * 10 + 10);
            const queueEmbed = new Discord.MessageEmbed()
                .setColor(color())
                .setTitle(`Song queue for ${message.guild.name} [${i + 1}/${Math.ceil(songArray.length / 10)}]`)
                .setDescription(`There are ${songArray.length} tracks in total.\n\n${pageArray.join("\n")}`)
                .setTimestamp()
                .setFooter(`Now playing: ${(serverQueue.songs[0] ? serverQueue.songs[0].title : "Nothing")}`, message.client.user.displayAvatarURL());
            allEmbeds.push(queueEmbed);
        }
        if (allEmbeds.length == 1) await msgOrRes(message, allEmbeds[0]).then(msg => setTimeout(() => msg.edit({ embeds: null, content: `**[Queue: ${songArray.length} tracks in total]**` }), 60000));
        else await createEmbedScrolling(message, allEmbeds, 3, { songArray: songArray });
    }

    async save(message: Message | NorthInteraction, serverQueue: ServerQueue, name: string) {
        const guild = message.guild;
        const pool = client.pool;
        const author = message.member.user;
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, [], false, false);
        if (serverQueue.songs.length < 1) return await msgOrRes(message, "There is no queue playing in this server right now!");
        const con = await pool.getConnection();
        const [results] = <RowDataPacket[][]> await con.query(`SELECT * FROM queue WHERE user = '${author.id}'`);
        if (results.length >= 10) return await msgOrRes(message, "You have already stored 10 queues! Delete some of them to save this queue.");
        if (!name) return await msgOrRes(message, "Please provide the name of the queue.");
        var query = `INSERT INTO queue(user, name, queue) VALUES('${author.id}', '${name}', '${escape(JSON.stringify(serverQueue.songs))}')`;
        for (const result of results) {
            if (result.name === name) {
                return await msgOrRes(message, `The queue with the name ${name} already exists.`);
            }
        }
        await con.query(query);
        con.release();
        return await msgOrRes(message, `The song queue has been stored with the name **${name}**!\nSlots used: **${query.substring(0, 6) == "INSERT" ? results.length + 1 : results.length}/10**`);
    }

    async load(message: Message | NorthInteraction, serverQueue: ServerQueue, name: string) {
        const guild = message.guild;
        const pool = client.pool;
        const author = message.member.user;
        if (serverQueue && serverQueue.playing) return await msgOrRes(message, "Someone is listening to the music. Don't ruin their day.");
        if (!name) return await msgOrRes(message, "Please provide the name of the queue.");
        const [results] = <RowDataPacket[][]> await pool.query(`SELECT * FROM queue WHERE name = '${name}' AND user = '${author.id}'`);
        if (results.length == 0) return await msgOrRes(message, "No queue was found!");
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, [], false, false);
        else serverQueue.songs = JSON.parse(unescape(results[0].queue));
        await updateQueue(guild.id, serverQueue);
        return await msgOrRes(message, `The queue **${results[0].name}** has been loaded.`);
    }

    async delete(message: Message | NorthInteraction, name: string) {
        const pool = client.pool;
        const author = message.member.user;
        if (!name) return await msgOrRes(message, "Please provide the name of the queue.");
        const con = await pool.getConnection();
        const [results] = <RowDataPacket[][]> await con.query(`SELECT * FROM queue WHERE name = '${name}' AND user = '${author.id}'`);
        if (results.length == 0) return await msgOrRes(message, "No queue was found!");
        await con.query(`DELETE FROM queue WHERE id = ${results[0].id}`);
        con.release();
        return await msgOrRes(message, `The stored queue **${results[0].name}** has been deleted.`);
    }

    async list(message: Message | NorthInteraction) {
        const author = message instanceof Message ? message.author : message.user;
        const [results] = <RowDataPacket[][]> await client.pool.query(`SELECT * FROM queue WHERE user = '${author.id}'`);
        const queues = [];
        var num = 0;
        const allEmbeds = [];
        for (const result of results) {
            const queue = JSON.parse(unescape(result.queue));
            queues.push(`${++num}. **${result.name}** : **${queue.length} tracks**`);
            var queueNum = 0;
            var pageArray = queue.map(song => {
                var str;
                if (song.type === 0 || song.type === 2 || song.type === 3 || !song.type) str = `**${++queueNum} - ** **[${song.title}](${song.url})** : **${song.time}**`;
                else if (song.type === 1) str = `**${++queueNum} - ** **[${song.title}](${song.spot})** : **${song.time}**`;
                return str;
            }).slice(0, 10);
            const queueEmbed = new Discord.MessageEmbed()
                .setColor(color())
                .setTitle(`Queue - ${result.name}`)
                .setDescription(`There are ${queue.length} tracks in total.\n\n${pageArray.join("\n")}`)
                .setTimestamp()
                .setFooter(queue.length > pageArray.length ? "Cannot show all soundtracks here..." : "Here are all the soundtracks in this queue.", message.client.user.displayAvatarURL());
            allEmbeds.push(queueEmbed);
        }
        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
        const available = ["⬅", "⏹️"];
        const em = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle(`Stored queues of **${author.tag}**`)
            .setDescription(`Slots used: **${results.length}/10**\n\n${queues.join("\n")}`)
            .setTimestamp()
            .setFooter("React to the numbers to view your queue.", client.user.displayAvatarURL());
        allEmbeds.unshift(em);
        var msg = await message.channel.send({embeds: [em]});
        for (let i = 0; i < Math.min(num, 10); i++) {
            await msg.react(emojis[i]);
            available.push(emojis[i]);
        }
        await msg.react(available[1]);
        const collector = msg.createReactionCollector({ filter: (r, u) => available.includes(r.emoji.name) && u.id === author.id, idle: 30000 });
        collector.on("collect", async function (reaction, user) {
            var index = available.indexOf(reaction.emoji.name);
            reaction.users.remove(user.id);
            if (index < 0 || index > num + 2 || index == 1) return collector.emit("end");
            else if (index == 0) {
                const back = msg.reactions.cache.get(available[0]);
                await back.remove().catch(NorthClient.storage.error);
                await msg.edit(allEmbeds[0]);
            } else {
                await msg.edit(allEmbeds[index - 1]);
                const back = msg.reactions.cache.get(available[0]);
                if (!back) {
                    const stop = msg.reactions.cache.get(available[1]);
                    if (stop) await stop.remove().catch(NorthClient.storage.error);
                    await msg.react(available[0]);
                    await msg.react(available[1]);
                }
            }
        });
        collector.on("end", function () {
            msg.reactions.removeAll().catch(NorthClient.storage.error);
            msg.edit(allEmbeds[0]);
            setTimeout(() => msg.edit({ embeds: null, content: `**[Queues: ${results.length}/10 slots used]**` }), 60000);
        });
    }

    async sync(message: Message | NorthInteraction, serverQueue: ServerQueue, name: string) {
        const guild = message.guild;
        const pool = client.pool;
        const author = message.member.user;
        if (serverQueue && serverQueue.playing) return await msgOrRes(message, "Someone is listening to the music. Don't ruin their day.");
        if (!name) return await msgOrRes(message, "Please provide the name or ID of the server.");
        const g = await client.guilds.cache.find(x => x.name.toLowerCase() === name.toLowerCase() || x.id == name);
        if (!g) return await msgOrRes(message, "I cannot find that server! Maybe I am not in that server?");
        try {
            await g.members.fetch(author.id);
        } catch (e) {
            return await msgOrRes(message, "You are not in that server!");
        }
        const [results] = <RowDataPacket[][]> await pool.query(`SELECT queue FROM servers WHERE id = '${g.id}'`);
        if (results.length == 0) return await msgOrRes(message, "No queue was found!");
        if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, JSON.parse(unescape(results[0].queue)), false, false);
        else serverQueue.songs = JSON.parse(unescape(results[0].queue));
        await updateQueue(guild.id, serverQueue);
        return await msgOrRes(message, `The queue of this server has been synchronize to the queue of server **${g.name}**.`);
    }
}

const cmd = new QueueCommand();
export default cmd;