const Discord = require("discord.js");
var color = Math.floor(Math.random() * 16777214) + 1;

module.exports = {
  name: "queue",
  description: "Display the current song queue.",
  aliases: ["q"],
  usage: " ",
  async music(message, serverQueue, looping, queue, pool) {
    const args = message.content.split(" ");
    if(args[1] !== undefined && args[1].toLowerCase() === "save") {
      return await this.save(message, serverQueue, pool, args);
    }
    if(args[1] !== undefined && args[1].toLowerCase() === "load") {
      return await this.load(message, serverQueue, pool, args, queue);
    }
    if(args[1] !== undefined && (args[1].toLowerCase() === "delete" || args[1].toLowerCase() === "del")) {
      return await this.delete(message, serverQueue, pool, args);
    }
    if(args[1] !== undefined && args[1].toLowerCase() === "list") {
      return await this.list(message, pool);
    }
    if (!serverQueue) return message.channel.send("There is nothing playing.");
  var index = 0;
  var songArray = serverQueue.songs.map(song => {
    var str;
    if(song.type === 0 || !song.type)
    str = `**${++index} - ** [**${song.title}**](${song.url}) : **${song.time}**`;
    else if(song.type === 1)
      str = `**${++index} - ** [**${song.title}**](${song.spot}) : **${song.time}**`;
    
    return str;
  });
    
    var all;
    
    if(songArray.join("\n").length > 2000) {
      all = songArray.slice(0, 20).join("\n") + "\nToo many songs...";
    } else {
      all = songArray.join("\n");
    }
    
    
  var queueEmbed = new Discord.MessageEmbed()
  .setColor(color)
  .setTitle("Song queue for " + message.guild.name)
  .setDescription("There are " + songArray.length + " songs in total.\n\n" + all)
  .setTimestamp()
  .setFooter("Now playing: " + serverQueue.songs[0].title, message.client.user.displayAvatarURL());
  message.channel.send(queueEmbed);
  },
  save(message, serverQueue, pool, args) {
    if(!serverQueue) return message.channel.send("There is no queue playing in this server right now!");
    pool.getConnection(function(err, con) {
      if(err) return message.reply("there was an error trying to execute that command!");
      con.query("SELECT * FROM queue WHERE user = '" + message.author.id + "'", function(err, results) {
        if(err) return message.reply("there was an error trying to execute that command!")
        if(results.length >= 10) {
          return message.channel.send("You have already stored 10 queues! Delete some of them to save this queue.");
        }
        if(!args[2]) {
          return message.channel.send("Please provide the name of the queue.");
        }
        for(const result of results) {
          if(result.name.toLowerCase() === args.slice(2).join(" ").toLowerCase()) {
            return message.channel.send("There is already a queue named **" + args.slice(2).join(" ") + "** stored.");
          }
        }
        con.query("INSERT INTO queue(user, name, queue) " + `VALUES('${message.author.id}', '${args.slice(2).join(" ")}', '${escape(JSON.stringify(serverQueue.songs))}')`, function(err) {
          if(err) return message.reply("there was an error trying to execute that command!");
          message.channel.send("The song queue has been stored with the name **" + args.slice(2).join(" ") + "**!" + `\nSlots used: **${results.length + 1}/10**`);
        });
      });
      con.release();
    });
  },
  load(message, serverQueue, pool, args, queue) {
    if(!args[2]) {
      return message.channel.send("Please provide the name of the queue.");
    }
    pool.getConnection(function(err, con) {
      if(err) return message.reply("there was an error trying to execute that command!");
      con.query("SELECT * FROM queue WHERE LOWER(name) = '" + args.slice(2).join(" ").toLowerCase() + "' AND user = '" + message.author.id + "'", function(err, results) {
        if(err) return message.reply("there was an error trying to execute that command!");
        if(results.length == 0) {
          return message.channel.send("No queue was found!");
        }
        if(!serverQueue) {
          if(message.member.voice && message.member.voice.channel) {
            var voiceChannel = message.member.voice.channel;
          } else {
            var voiceChannel = null;
          }
          var queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: JSON.parse(unescape(results[0].queue)),
            volume: 5,
            playing: true,
            paused: false
          };
          queue.set(message.guild.id, queueContruct);
        } else
        serverQueue.songs = JSON.parse(unescape(results[0].queue));
        con.query(`UPDATE servers SET queue = '${results[0].queue}' WHERE id = '${message.guild.id}'`, function(err) {
          if(err) return message.reply("there was an error trying to execute that command!");
          message.channel.send(`The queue **${results[0].name}** has been loaded.`);
        });
      });
      con.release();
    });
  },
  delete(message, serverQueue, pool, args) {
    if(!args[2]) {
      return message.channel.send("Please provide the name of the queue.");
    }
    pool.getConnection(function(err, con) {
      if(err) return message.reply("there was an error trying to execute that command!");
      con.query("SELECT * FROM queue WHERE LOWER(name) = '" + args.slice(2).join(" ").toLowerCase() + "' AND user = '" + message.author.id + "'", function(err, results) {
        if(err) return message.reply("there was an error trying to execute that command!");
        if(results.length == 0) {
          return message.channel.send("No queue was found!");
        }
        con.query(`DELETE FROM queue WHERE id = ${results[0].id}`, function(err) {
          if(err) return message.reply("there was an error trying to execute that command!");
          message.channel.send(`The stored queue **${results[0].name}** has been deleted.`);
        })
      });
      con.release();
    });
  },
  list(message, pool) {
    pool.getConnection(function(err, con) {
      if(err) return message.reply("there was an error trying to execute that command!");
      con.query("SELECT * FROM queue WHERE user = '" + message.author.id + "'", function(err, results) {
        if(err) return message.reply("there was an error trying to execute that command!");
        var queues = [];
        var num = 0;
        for(const result of results) {
          var queue = JSON.parse(unescape(result.queue));
          queues.push(`${++num}. **${result.name}** : **${queue.length} musics/songs**`);
        }
        const em = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(`Stored queues of **${message.author.tag}**`)
        .setDescription(`Slots used: **${results.length}**/10\n\n${queues.join("\n")}`)
        .setTimestamp()
        .setFooter("Have a nice day! :)", message.client.user.displayAvatarURL());
        message.channel.send(em);
      });
      con.release();
    });
  }
}