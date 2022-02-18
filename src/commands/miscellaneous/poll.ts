import { NorthMessage, SlashCommand, NorthClient, NorthInteraction } from "../../classes/NorthClient.js";
import * as Discord from "discord.js";
import { color, findChannel, jsDate2Mysql, ms, msgOrRes, query, readableDateTime, readableDateTimeText } from "../../function.js";
import cfg from "../../../config.json";
const emojis = cfg.poll;

export async function endPoll(msg: Discord.Message, message: Discord.Message | Discord.CommandInteraction = null) {
    var shouldDel = true;
    try {
        if (!msg) throw new Error("Poll is deleted");
        const poll = NorthClient.storage.polls.get(msg.id);
        shouldDel = false;
        const allOptions = poll.options;
        const end = [];
        for (let i = 0; i < allOptions.length; i++) {
            const option = allOptions[i];
            const mesg = `**${poll.votes[i].length}** - ${option}`;
            end.push(mesg);
        }
        const pollMsg = "⬆**Poll**⬇";
        const Ended = msg.embeds[0].setDescription(`Poll ended. Here are the results:\n\n${end.join("\n")}`);
        msg.edit({ content: pollMsg, embeds: [Ended] });
        const link = `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
        await msg.channel.send("A poll has ended!\n" + link);
        msg.reactions.removeAll().catch(() => { });
        await query("DELETE FROM polls WHERE id = " + msg.id);
        if (message) await msgOrRes(message, "Ended a poll!");
    } catch (err: any) {
        console.error(err);
        if (shouldDel) {
            await query("DELETE FROM polls WHERE id = " + msg.id);
            if (message) await msgOrRes(message, "Ended a poll!");
        } else if (message) await message.reply("There was an error trying to end the poll!");
    }
}

class PollCommand implements SlashCommand {
    name = "poll"
    description = "Manage polls on the server."
    usage = "<subcommand>"
    subcommands = ["create", "end", "list"]
    subaliases = ["cr", "en", "li"]
    subdesc = ["Creates a poll on the server.", "Ends a poll on the server.", "Lists all the polls on the server."]
    subusage = ["<subcommand> <channel> <duration> <title>", "<subcommand> <ID>"]
    category = 4
    args = 1
    options = [
        {
            name: "create",
            description: "Creates a poll on the server.",
            type: "SUB_COMMAND",
            options: [
                { name: "channel", description: "The channel of the poll.", required: true, type: "CHANNEL" },
                { name: "duration", description: "The duration of the poll.", required: true, type: "STRING" },
                { name: "title", description: "The title of the poll.", required: true, type: "STRING" }
            ]
        },
        {
            name: "end",
            description: "Ends a poll on the server.",
            type: "SUB_COMMAND",
            options: [{ name: "id", description: "The ID of the poll message.", required: true, type: "STRING" }]
        },
        {
            name: "list",
            description: "Lists all the polls on the server.",
            type: "SUB_COMMAND"
        }
    ]

    async execute(interaction: NorthInteraction) {
        if (!interaction.guildId) return await interaction.reply("You can only use this command on a server!");
        switch (interaction.options.getSubcommand()) {
            case "create": return await this.create(interaction, interaction.options.getChannel("channel").id, interaction.options.getString("duration"), interaction.options.getString("title"));
            case "end": return await this.end(interaction, interaction.options.getString("id"));
            case "list": return await this.list(interaction);
        }
    }

    async run(message: NorthMessage, args: string[]) {
        if (!message.guildId) return await message.channel.send("You can only use this command on a server!");
        switch (args[0]) {
            case "create": return await this.create(message, args[1], args[2], args.slice(3).join(" "));
            case "end": return await this.end(message, args[1]);
            case "list": return await this.list(message);
            default: return await message.channel.send(`Proper usage: ${message.prefix}${this.name} ${this.usage}\nSubcommands: \`${this.subcommands.join("`, `")}\``);
        }
    }

    async create(message: NorthMessage | NorthInteraction, channelID: string, durationStr: string, title: string) {
        if (!channelID) return await msgOrRes(message, "Missing channel!");
        if (!durationStr) return await msgOrRes(message, "Missing duration!");
        if (!title) return await msgOrRes(message, "Missing title!");
        const author = message instanceof Discord.Message ? message.author : message.user;
        const filter = (m: Discord.Message) => m.author.id === author.id;
        const channel = await findChannel(message.guild, channelID);
        if (!channel || !(channel instanceof Discord.TextChannel)) return await msgOrRes(message, channelID + " isn't a valid channel!");
        const duration = ms(durationStr);
        if (isNaN(duration)) return await msgOrRes(message, "**" + durationStr + "** is not a valid duration!");
        const msg = await msgOrRes(message, `Alright! The poll will last for**${readableDateTimeText(duration)}**. \nLast but not least, please enter the options. Please break a line for each options!`);
        const optionString = await message.channel.awaitMessages({ filter, time: 60000, max: 1 });
        if (!optionString.first()) return await msg.edit("Time's up. Cancelled action.");
        await optionString.first().delete();
        if (optionString.first().content === "cancel") return await msg.edit("Cancelled poll.");
        const options = optionString.first().content.replace(/'/g, "#quot;").replace(/"/g, "#dquot;").split("\n");
        if (options.length <= 1) return await msg.edit("Please provide at least 2 options! Cancelled action.");
        else if (options.length > 10) return await msg.edit("Please provide at most 10 options! Cancelled action.");
        await msg.edit(`Nice! **${options.length}** options it is!\nThe poll will be held in channel ${channel} for **${readableDateTimeText(duration)}** with the title **${title}** and the options will be **${optionString.first().content.split("\n").join(", ")}**`);

        var optionArray = [];
        var allOptions = [];
        var num = -1;
        for (let i = 0; i < options.length; i++) try {
            ++num;
            optionArray.push(emojis[num] + " - " + options[i]);
            allOptions.push(options[i]);
        } catch {
            --num;
        }

        const currentDate = new Date();
        const newDate = new Date(currentDate.getTime() + currentDate.getTimezoneOffset() * 60000 + duration);
        const newDateSql = jsDate2Mysql(newDate);
        const readableTime = readableDateTime(newDate);
        const pollMsg = "⬆**Poll**⬇";
        const Embed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle(title)
            .setDescription(`React with the numbers to vote!\nThis poll will end at:\n**${readableTime}**\n\n${optionArray.join("\n")}`)
            .setTimestamp()
            .setFooter({ text: "Hosted by " + author.tag, iconURL: author.displayAvatarURL() });
        const mesg = await channel.send({ content: pollMsg, embeds: [Embed] });
        for (var i = 0; i < optionArray.length; i++) await mesg.react(emojis[i]);
        const collector = mesg.createReactionCollector({ time: duration, filter: (reaction, user) => emojis.includes(reaction.emoji.name) && !user.bot });
        NorthClient.storage.polls.set(mesg.id, { options: allOptions, votes: Array(optionArray.length).fill([]) });
        collector.on("collect", async (reaction, user) => {
            const index = emojis.indexOf(reaction.emoji.name);
            const poll = NorthClient.storage.polls.get(mesg.id);
            for (let i = 0; i < poll.votes.length; i++) {
                const uIndex = poll.votes[i].indexOf(user.id);
                if (i === index) {
                    if (uIndex < 0) poll.votes[i].push(user.id);
                    else poll.votes[i].splice(uIndex, 1);
                    continue;
                }
                if (uIndex > -1) poll.votes[i].splice(uIndex, 1);
            }
            reaction.users.remove(user.id).catch(() => {});
            NorthClient.storage.polls.set(mesg.id, poll);
        });
        collector.on("end", async () => {
            await endPoll(await channel.messages.fetch(mesg.id));
        });
        await query(`INSERT INTO polls VALUES(${mesg.id}, ${message.guild.id}, ${channel.id}, ${author.id}, '${escape(JSON.stringify(options))}', '${newDateSql}', '${escape("[]")}')`);
    }

    async end(message: NorthMessage | NorthInteraction, msgID: string) {
        if (!msgID) return await msgOrRes(message, "Please provide the ID of the message!");
        var result = await query("SELECT * FROM polls WHERE id = '" + msgID + "'");
        if (result.length == 0) return msgOrRes(message, "No poll was found!");
        const author = message instanceof Discord.Message ? message.author : message.user;
        if (result[0].author !== author.id) return msgOrRes(message, "You cannot end a poll that was not created by you!");
        try {
            const channel = <Discord.TextChannel>await message.client.channels.fetch(result[0].channel);
            const msg = await channel.messages.fetch(result[0].id);
            await endPoll(msg, message);
        } catch (err: any) { }
    }

    async list(message: NorthMessage | NorthInteraction) {
        var results = await query("SELECT * FROM polls WHERE guild = " + message.guild.id);
        const Embed = new Discord.MessageEmbed()
            .setColor(color())
            .setTitle("Poll list")
            .setDescription("**" + message.guild.name + "** - " + results.length + " polls")
            .setTimestamp()
            .setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
        for (var i = 0; i < Math.min(25, results.length); i++) {
            const newDate = new Date(results[i].endAt);
            const readableTime = readableDateTime(newDate);
            Embed.addField(readableTime, unescape(results[i].title));
        }
        await msgOrRes(message, { embeds: [Embed] });
    }
};

const cmd = new PollCommand();
export default cmd;