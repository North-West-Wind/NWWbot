const Discord = require("discord.js");
const { updateQueue } = require("./play.js");
const { createEmbedScrolling } = require("../function.js");
const { setQueue } = require("./main.js");
module.exports = {
  name: "queue",
  description: "Display the current song queue.",
  aliases: ["q"],
  subcommands: ["save", "load", "delete", "list"],
  subaliases: ["s", "l", "d", "li"],
  category: 8,
  async music(message, serverQueue, queue) {
    const args = message.content.slice(message.prefix.length).split(/ +/);
    if (args[1] !== undefined && (args[1].toLowerCase() === "save" || args[1].toLowerCase() === "s")) return await this.save(message, serverQueue, args);
    if (args[1] !== undefined && (args[1].toLowerCase() === "load" || args[1].toLowerCase() === "l")) return await this.load(message, serverQueue, args, queue);
    if (args[1] !== undefined && (args[1].toLowerCase() === "delete" || args[1].toLowerCase() === "d")) return await this.delete(message, args);
    if (args[1] !== undefined && (args[1].toLowerCase() === "list" || args[1].toLowerCase() === "li")) return await this.list(message);
    if (args[1] !== undefined && (args[1].toLowerCase() === "sync" || args[1].toLowerCase() === "sy")) return await this.sync(message, serverQueue, args, queue);
    if (!serverQueue) return message.channel.send("There is nothing playing.");
    if (!serverQueue.songs) setQueue(message.guild.id, [], !!serverQueue.looping, !!serverQueue.repeating, message.pool);
    if (!serverQueue.songs.length < 1) return message.channel.send("There is nothing playing.");
    var index = 0;
    const songArray = serverQueue.songs.map(song => (song.type === 1) ? `**${++index} - ** **[${song.title}](${song.spot})** : **${song.time}**` : `**${++index} - ** **[${song.title}](${song.url})** : **${song.time}**`);
    const allEmbeds = [];
    for (let i = 0; i < Math.ceil(songArray.length / 10); i++) {
      const pageArray = songArray.slice(i * 10, i * 10 + 10);
      const queueEmbed = new Discord.MessageEmbed()
        .setColor(console.color())
        .setTitle(`Song queue for ${message.guild.name} [${i + 1}/${Math.ceil(songArray.length / 10)}]`)
        .setDescription(`There are ${songArray.length} tracks in total.\n\n${pageArray.join("\n")}`)
        .setTimestamp()
        .setFooter(`Now playing: ${(serverQueue.songs[0] ? serverQueue.songs[0].title : "Nothing")}`, message.client.user.displayAvatarURL());
      allEmbeds.push(queueEmbed);
    }
    if (allEmbeds.length == 1) message.channel.send(allEmbeds[0]).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Queue: ${songArray.length} tracks in total]**` }), 60000));
    else await createEmbedScrolling(message, allEmbeds, 3, { songArray: songArray });
  },
  async save(message, serverQueue, args) {
    if (!serverQueue) return message.channel.send("There is no queue playing in this server right now!");
    const con = await message.pool.getConnection();
    const [results] = await con.query(`SELECT * FROM queue WHERE user = '${message.author.id}'`);
    if (results.length >= 10) return message.channel.send("You have already stored 10 queues! Delete some of them to save this queue.");
    if (!args[2]) return message.channel.send("Please provide the name of the queue.");
    var query = `INSERT INTO queue(user, name, queue) VALUES('${message.author.id}', '${args.slice(2).join(" ")}', '${escape(JSON.stringify(serverQueue.songs))}')`;
    for (const result of results) {
      if (result.name === args.slice(2).join(" ")) {
        var em = new Discord.MessageEmbed()
          .setColor(console.color())
          .setTitle("Warning")
          .setDescription(`There is already a queue named **${args.slice(2).join(" ")}** stored. Do you want to override it?\n✅ Yes\n❌ No`)
          .setTimestamp()
          .setFooter("Please answer in 30 seconds.", message.client.user.displayAvatarURL());
        var msg = await message.channel.send(em);
        await msg.react("✅");
        await msg.react("❌");
        var collected = await msg.awaitReactions((r, u) => (["✅", "❌"].includes(r.emoji.name) && u.id === message.author.id), { time: 30000, max: 1, errors: ["time"] });
        await msg.reactions.removeAll().catch(console.error);
        if (!collected || !collected.first()) return msg.edit({ content: "I cannot receive your answer! I'll take that as a NO.", embed: null });
        if (collected.first().emoji.name === "✅") {
          await msg.edit({ content: `The queue ${args.slice(2).join(" ")} will be overridden.`, embed: null });
          query = `UPDATE queue SET queue = '${escape(JSON.stringify(serverQueue.songs))}' WHERE id = ${result.id}`;
          break;;
        } else return await msg.edit({ content: `Action cancelled. The queue ${args.slice(2).join(" ")} will not be overrided.`, embed: null });
      }
    }
    await con.query(query);
    con.release();
    message.channel.send(`The song queue has been stored with the name **${args.slice(2).join(" ")}**!\nSlots used: **${query.substring(0, 6) == "INSERT" ? results.length + 1 : results.length}/10**`);
  },
  async load(message, serverQueue, args, queue) {
    if (serverQueue && serverQueue.playing) return message.channel.send("Someone is listening to the music. Don't ruin their day.");
    if (!args[2]) return message.channel.send("Please provide the name of the queue.");
    const [results] = await message.pool.query(`SELECT * FROM queue WHERE name = '${args.slice(2).join(" ")}' AND user = '${message.author.id}'`);
    if (results.length == 0) return message.channel.send("No queue was found!");
    if (!serverQueue) {
      var voiceChannel = null;
      if (message.member.voice && message.member.voice.channel) voiceChannel = message.member.voice.channel;
      serverQueue = setQueue(message.guild.id, JSON.parse(unescape(results[0].queue)), false, false, message.pool);
    } else serverQueue.songs = JSON.parse(unescape(results[0].queue));
    updateQueue(message, serverQueue, queue, message.pool);
    message.channel.send(`The queue **${results[0].name}** has been loaded.`);
  },
  async delete(message, args) {
    if (!args[2]) return message.channel.send("Please provide the name of the queue.");
    const con = await message.pool.getConnection();
    await con.query(`SELECT * FROM queue WHERE name = '${args.slice(2).join(" ")}' AND user = '${message.author.id}'`);
    if (results.length == 0) return message.channel.send("No queue was found!");
    await con.query(`DELETE FROM queue WHERE id = ${results[0].id}`);
    message.channel.send(`The stored queue **${results[0].name}** has been deleted.`);
    con.release();
  },
  async list(message) {
    const [results] = await message.pool.query(`SELECT * FROM queue WHERE user = '${message.author.id}'`);
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
        .setColor(console.color())
        .setTitle(`Queue - ${result.name}`)
        .setDescription(`There are ${queue.length} tracks in total.\n\n${pageArray.join("\n")}`)
        .setTimestamp()
        .setFooter(queue.length > pageArray.length ? "Cannot show all soundtracks here..." : "Here are all the soundtracks in this queue.", message.client.user.displayAvatarURL());
      allEmbeds.push(queueEmbed);
    }
    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    const available = ["⬅", "⏹️"];
    const em = new Discord.MessageEmbed()
      .setColor(console.color())
      .setTitle(`Stored queues of **${message.author.tag}**`)
      .setDescription(`Slots used: **${results.length}/10**\n\n${queues.join("\n")}`)
      .setTimestamp()
      .setFooter("React to the numbers to view your queue.", message.client.user.displayAvatarURL());
    allEmbeds.unshift(em);
    var msg = await message.channel.send(em);
    for (let i = 0; i < Math.min(num, 10); i++) {
      await msg.react(emojis[i]);
      available.push(emojis[i]);
    }
    await msg.react(available[1]);
    const collector = msg.createReactionCollector((r, u) => available.includes(r.emoji.name) && u.id === message.author.id, { idle: 30000 });
    var index = available.indexOf(reaction.emoji.name);
    collector.on("collect", async function (reaction, user) {
      reaction.users.remove(user.id);
      if (index < 0 || index > num + 2 || index == 1) return collector.emit("end");
      else if (index == 0) {
        const back = await msg.reactions.cache.get(available[0]);
        await back.remove().catch(console.error);
        await msg.edit(allEmbeds[0]);
      } else {
        await msg.edit(allEmbeds[index - 1]);
        const back = await msg.reactions.cache.get(available[0]);
        if (!back) {
          const stop = await msg.reactions.cache.get(available[1]);
          if (stop) await stop.remove().catch(console.error);
          await msg.react(available[0]);
          await msg.react(available[1]);
        }
      }
    });
    collector.on("end", function () {
      msg.reactions.removeAll().catch(console.error);
      msg.edit(allEmbeds[0]);
      setTimeout(() => msg.edit({ embed: null, content: `**[Queue: ${JSON.parse(unescape(results.queue)).length} tracks in total]**` }), 60000);
    });
  },
  async sync(message, serverQueue, args, queue) {
    if (serverQueue && serverQueue.playing) return message.channel.send("Someone is listening to the music. Don't ruin their day.");
    if (!args[2]) return message.channel.send("Please provide the name or ID of the server.");
    const guild = await message.client.guilds.cache.find(x => x.name.toLowerCase() === args.slice(2).join(" ").toLowerCase() || x.id == args[2]);
    if (!guild) return message.channel.send("I cannot find that server! Maybe I am not in that server?");
    try {
      await guild.members.fetch(message.author.id);
    } catch (e) {
      return message.channel.send("You are not in that server!");
    }
    const [results] = await message.pool.query(`SELECT queue FROM servers WHERE id = '${guild.id}'`);
    if (results.length == 0) return message.channel.send("No queue was found!");
    if (!serverQueue) serverQueue = setQueue(message.guild.id, JSON.parse(unescape(results[0].queue)), false, false, message.pool);
    else serverQueue.songs = JSON.parse(unescape(results[0].queue));
    updateQueue(message, serverQueue, queue, message.pool);
    message.channel.send(`The queue of this server has been synchronize to the queue of the server **${guild.name}**.`);
  }
};
