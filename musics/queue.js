const Discord = require("discord.js");
const { updateQueue, setQueue, getQueues } = require("./main.js");
const { createEmbedScrolling, streamToString, requestStream, color, msgOrRes } = require("../function.js");
const sanitize = require("sanitize-filename");
const { NorthClient } = require("../classes/NorthClient.js");
const { InteractionResponse, ApplicationCommand, ApplicationCommandOption, ApplicationCommandOptionType } = require("../classes/Slash.js");

module.exports = {
  name: "queue",
  description: "Display the current song queue.",
  aliases: ["q"],
  subcommands: ["save", "load", "delete", "list", "sync", "export", "import"],
  subdesc: ["Save the current queue to the database.", "Load a queue from the database.", "Delete a queue from the database.", "List all the queues of a user.", "Synchronize the queue with another server you are in.", "Export a queue into a file.", "Import a queue from a file."],
  subusage: ["<subcommand> <name>", 0, 0],
  subaliases: ["s", "l", "d", "li", "sy", "ex", "im"],
  category: 8,
  slashInit: true,
  register: () => ApplicationCommand.createBasic(module.exports).setOptions([
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "current", "Display the current soundtrack queue."),
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "save", "Save the current queue to the database.").setOptions([
      new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "name", "The name of the queue.").setRequired(true)
    ]),
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "load", "Load a queue from the database.").setOptions([
      new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "name", "The name of the queue.").setRequired(true)
    ]),
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "delete", "Delete a queue from the database.").setOptions([
      new ApplicationCommandOption(ApplicationCommandOptionType.STRING.valueOf(), "name", "The name of the queue.").setRequired(true)
    ]),
    new ApplicationCommandOption(ApplicationCommandOptionType.SUB_COMMAND.valueOf(), "sync", "Synchronize the queue with another server you are in.").setOptions([
      new ApplicationCommandOption(ApplicationCommandOption.STRING.valueOf(), "name", "The name of the server.").setRequired(true)
    ])
  ]),
  slash: async(client, interaction, args) => {
    if (!interaction.guild_id) return InteractionResponse.sendMessage("This command only works on server.");
    const guild = await client.guilds.fetch(interaction.guild_id);
    const author = await guild.members.fetch(interaction.member.user.id);
    var serverQueue = getQueues().get(guild.id);

    if (args[0].value === "save") return await this.save(null, client.pool, author.user, guild, serverQueue, args[0].options[0].value);
    if (args[0].value === "load") return await this.load(null, client.pool, author.user, guild, serverQueue, args[0].options[0].value);
    if (args[0].value === "delete") return await this.delete(null, client.pool, author.user, args[0].options[0].value);
    if (args[0].value === "sync") return await this.sync(null, client.pool, author.user, guild, client, serverQueue, args[0].options[0].value);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, [], false, false, client.pool);
    if (serverQueue.songs.length < 1) return InteractionResponse.sendMessage("Nothing is in the queue now.");
    const filtered = serverQueue.songs.filter(song => !!song);
    if (serverQueue.songs.length !== filtered.length) {
      serverQueue.songs = filtered;
      updateQueue(guild.id, serverQueue, client.pool);
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
        .setTitle(`Song queue for ${guild.name} [${i + 1}/${Math.ceil(songArray.length / 10)}]`)
        .setDescription(`There are ${songArray.length} tracks in total.\n\n${pageArray.join("\n")}`)
        .setTimestamp()
        .setFooter(`Now playing: ${(serverQueue.songs[0] ? serverQueue.songs[0].title : "Nothing")}`, message.client.user.displayAvatarURL());
      allEmbeds.push(queueEmbed);
    }
    setTimeout(async() => await client.api.webhooks(client.user.id, interaction.token).messages["@original"].patch({ embed: null, content: `**[Queue: ${songArray.length} tracks in total]**` }), 60000)
    return InteractionResponse.sendEmbeds(allEmbeds);
  },
  async music(message, serverQueue) {
    const args = message.content.slice(message.prefix.length).split(/ +/);
    if (args[1] && (args[1].toLowerCase() === "save" || args[1].toLowerCase() === "s")) return await this.save(message, message.pool, message.author, message.guild, serverQueue, args.slice(2).join(" "));
    if (args[1] && (args[1].toLowerCase() === "load" || args[1].toLowerCase() === "l")) return await this.load(message, message.pool, message.author, message.guild, serverQueue, args.slice(2).join(" "));
    if (args[1] && (args[1].toLowerCase() === "delete" || args[1].toLowerCase() === "d")) return await this.delete(message, message.pool, message.author, args.slice(2).join(" "));
    if (args[1] && (args[1].toLowerCase() === "list" || args[1].toLowerCase() === "li")) return await this.list(message);
    if (args[1] && (args[1].toLowerCase() === "sync" || args[1].toLowerCase() === "sy")) return await this.sync(message, message.pool, message.author, message.guild, message.client, serverQueue, args.slice(2).join(" "));
    if (args[1] && (args[1].toLowerCase() === "export" || args[1].toLowerCase() === "ex")) return await this.export(message, serverQueue);
    if (args[1] && (args[1].toLowerCase() === "import" || args[1].toLowerCase() === "im")) return await this.import(message, serverQueue);
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (serverQueue.songs.length < 1) return message.channel.send("Nothing is in the queue now.");
    const filtered = serverQueue.songs.filter(song => !!song);
    if (serverQueue.songs.length !== filtered.length) {
      serverQueue.songs = filtered;
      updateQueue(message.guild.id, serverQueue, message.pool);
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
    if (allEmbeds.length == 1) message.channel.send(allEmbeds[0]).then(msg => setTimeout(() => msg.edit({ embed: null, content: `**[Queue: ${songArray.length} tracks in total]**` }), 60000));
    else await createEmbedScrolling(message, allEmbeds, 3, { songArray: songArray });
  },
  async save(message, pool, author, guild, serverQueue, name) {
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, [], false, false, pool);
    if (serverQueue.songs.length < 1) return await msgOrRes(message, "There is no queue playing in this server right now!");
    const con = await pool.getConnection();
    const [results] = await con.query(`SELECT * FROM queue WHERE user = '${author.id}'`);
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
  },
  async load(message, pool, author, guild, serverQueue, name) {
    if (serverQueue && serverQueue.playing) return await msgOrRes(message, "Someone is listening to the music. Don't ruin their day.");
    if (!name) return await msgOrRes(message, "Please provide the name of the queue.");
    const [results] = await pool.query(`SELECT * FROM queue WHERE name = '${name}' AND user = '${author.id}'`);
    if (results.length == 0) return await msgOrRes(message, "No queue was found!");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, [], false, false, pool);
    else serverQueue.songs = JSON.parse(unescape(results[0].queue));
    updateQueue(guild.id, serverQueue, pool);
    return await msgOrRes(message, `The queue **${results[0].name}** has been loaded.`);
  },
  async delete(message, pool, author, args) {
    if (!args[2]) return await msgOrRes(message, "Please provide the name of the queue.");
    const con = await pool.getConnection();
    const [results] = await con.query(`SELECT * FROM queue WHERE name = '${args.slice(2).join(" ")}' AND user = '${author.id}'`);
    if (results.length == 0) return await msgOrRes(message, "No queue was found!");
    await con.query(`DELETE FROM queue WHERE id = ${results[0].id}`);
    con.release();
    return await msgOrRes(message, `The stored queue **${results[0].name}** has been deleted.`);
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
    collector.on("collect", async function (reaction, user) {
      var index = available.indexOf(reaction.emoji.name);
      reaction.users.remove(user.id);
      if (index < 0 || index > num + 2 || index == 1) return collector.emit("end");
      else if (index == 0) {
        const back = await msg.reactions.cache.get(available[0]);
        await back.remove().catch(NorthClient.storage.error);
        await msg.edit(allEmbeds[0]);
      } else {
        await msg.edit(allEmbeds[index - 1]);
        const back = await msg.reactions.cache.get(available[0]);
        if (!back) {
          const stop = await msg.reactions.cache.get(available[1]);
          if (stop) await stop.remove().catch(NorthClient.storage.error);
          await msg.react(available[0]);
          await msg.react(available[1]);
        }
      }
    });
    collector.on("end", function () {
      msg.reactions.removeAll().catch(NorthClient.storage.error);
      msg.edit(allEmbeds[0]);
      setTimeout(() => msg.edit({ embed: null, content: `**[Queues: ${results.length}/10 slots used]**` }), 60000);
    });
  },
  async sync(message, pool, author, guild, client, serverQueue, args) {
    if (serverQueue && serverQueue.playing) return await msgOrRes(message, "Someone is listening to the music. Don't ruin their day.");
    if (!args[2]) return await msgOrRes(message, "Please provide the name or ID of the server.");
    const guild = await client.guilds.cache.find(x => x.name.toLowerCase() === args.slice(2).join(" ").toLowerCase() || x.id == args[2]);
    if (!guild) return await msgOrRes(message, "I cannot find that server! Maybe I am not in that server?");
    try {
      await guild.members.fetch(author.id);
    } catch (e) {
      return await msgOrRes(message, "You are not in that server!");
    }
    const [results] = await pool.query(`SELECT queue FROM servers WHERE id = '${guild.id}'`);
    if (results.length == 0) return await msgOrRes(message, "No queue was found!");
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(guild.id, JSON.parse(unescape(results[0].queue)), false, false, pool);
    else serverQueue.songs = JSON.parse(unescape(results[0].queue));
    updateQueue(guild.id, serverQueue, pool);
    return await msgOrRes(message, `The queue of this server has been synchronize to the queue of the server **${guild.name}**.`);
  },
  async export(message, serverQueue) {
    if (!serverQueue || !serverQueue.songs || !Array.isArray(serverQueue.songs)) serverQueue = setQueue(message.guild.id, [], false, false, message.pool);
    if (serverQueue.songs.length < 1) return await message.channel.send("There is nothing in the queue.");
    const str = escape(JSON.stringify(serverQueue.songs));
    const attachment = new Discord.MessageAttachment(Buffer.from(str, 'utf8'), sanitize(`${message.guild.name}.queue`));
    await message.channel.send(`You can use \`${message.prefix}${this.name} import\` to import this queue again.`, attachment);
  },
  async import(message, serverQueue) {
    if (!message.attachments.find(x => x.name && x.name.endsWith(".queue"))) return await message.channel.send("You didn't incldue the queue file!");
    try {
      const songs = JSON.parse(unescape(await streamToString(await requestStream(message.attachments.find(x => x.name && x.name.endsWith(".queue")).url))));
      setQueue(message.guild.id, songs, !!serverQueue.looping, !!serverQueue.repeating, message.pool);
    } catch (err) {
      await message.reply("there was an error trying to read the queue file!");
    }
  }
};
