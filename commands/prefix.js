module.exports = {
    name: "prefix",
    description: "Change the prefix of the server.",
    usage: "[prefix]",
    category: 1,
    aliases: ["pre"],
    execute(message, args, pool) {
        if(!args[0]) return message.channel.send(`The prefix of this server is \`${message.prefix}\`. Use \`${message.prefix}prefix [prefix]\` to change the prefix.`);
        if(!message.guild) return message.channel.send("You are not in a server!");
        if(!message.member.hasPermission(32)) return message.channel.send("You don't have the permission to change the prefix of the server!");
        console.prefixes[message.guild.id] = args.join(" ");
        message.channel.send(`The prefix of this server has benn changed to \`${console.prefixes[message.guild.id]}\`.`);
        pool.getConnection((err, con) => {
            if(err) return message.reply("there was an error trying to connect to the database! The change of the prefix will be temporary!");
            const query = `UPDATE servers SET prefix = ${console.prefixes[message.guild.id] === message.client.prefix ? "NULL" : `'${console.prefixes[message.guild.id]}'`} WHERE id = '${message.guild.id}'`
            con.query(query, (err) => {
                if(err) return message.reply("there was an error trying to save the changes! The change of the prefix will be temporary!");
                message.channel.send("Changes have been saved properly!");
                console.log(`Changed prefix of ${message.guild.name} to ${console.prefixes[message.guild.id]}`);
            });
            con.release();
        });
    }
}