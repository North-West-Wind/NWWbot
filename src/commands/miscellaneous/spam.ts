
import { Collection, Message, User } from "discord.js";
import { NorthClient, NorthInteraction, NorthMessage, FullCommand } from "../../classes/NorthClient.js";
import { findUser, getOwner } from "../../function.js";

class SpamCommand implements FullCommand {
    name = "spam"
    description = "Spams a user with the message provided."
    aliases = ["sp"]
    args = 3
    usage = "<user | user ID> <amount> <message>"
    category = 4
    options = [
        { name: "user", description: "The user to spam.", required: true, type: "USER" },
        { name: "amount", description: "The number of time to spam the user.", required: true, type: "INTEGER" },
        { name: "message", description: "The message to send.", required: true, type: "STRING" }
    ]

    async execute(interaction: NorthInteraction) {
        const author = interaction.user;
        const taggedUser = interaction.options.getUser("user");
        if (taggedUser.id === author.id) return await interaction.reply("Don't try to spam youself.");
        await interaction.deferReply();
        const m = await taggedUser.send(`**${author.tag}** is spamming you! You now have 10 seconds to catch it. Type anything here!`);
        const collected: Collection<string, Message> = await m.channel.awaitMessages({ filter: ms => ms.author.id === taggedUser.id, max: 1, time: 10000 }).catch(() => null);
        if (collected?.first().content) return await interaction.editReply(`**${taggedUser.tag}** caught you spamming!`);
        const time = interaction.options.getInteger("amount");
        if (time > 120) return await interaction.reply("Please don't spam more than 120 times. That would be annoying.")
        const msg = interaction.options.getString("message");
        var i = 0;
        var spam = setInterval(async function () {
            if (i == time) return clearInterval(spam);
            const owner = await getOwner();
            if (taggedUser.id === owner) await author.send("Admin power forbids this >:)").catch(() => i = time);
            else await taggedUser.send(`\`[${interaction.guild.name} : ${author.tag}]\` ${msg}`).catch(async err => {
                if (author.id !== owner) author.send(`Failed to spam ${taggedUser.tag} for ${i + 1} time(s) due to \`${err.message}\`.`).catch(() => i = time);
            });
            i++;
        }, 500);
        await interaction.reply("Spamming started >:)");
    }

    async run(message: NorthMessage, args: string[]) {
        var taggedUser: User;
        try {
            taggedUser = await findUser(args[0]);
        } catch (err: any) {
            return await message.channel.send(err.message);
        }
        if (taggedUser.id === message.author.id) return message.channel.send("Don't try to spam youself.");
        const m = await taggedUser.send(`**${message.author.tag}** is spamming you! You now have 10 seconds to catch it. Type anything here!`);
        const collected: Collection<string, Message> = await m.channel.awaitMessages({ filter: ms => ms.author.id === taggedUser.id, max: 1, time: 10000 }).catch(() => null);
        if (collected?.first().content) return await message.reply(`**${taggedUser.tag}** caught you spamming!`);

        const time = parseInt(args[1]);
        if (isNaN(time)) {
            return message.channel.send("The time you want to spam this user is not a number.")
        }
        if (time > 120) return message.channel.send("Please don't spam more than 120 times. That would be annoying.")

        const msg = args.slice(2).join(" ");
        message.delete().catch(() => { });
        var i = 0;
        var spam = setInterval(async function () {
            if (i == time) return clearInterval(spam);
            const owner = await getOwner();
            if (taggedUser.id === owner) await message.author.send("Admin power forbids this >:)").catch(() => i = time);
            else await taggedUser.send(`\`[${message.guild.name} : ${message.author.tag}]\` ${msg}`).catch(err => {
                if (message.author.id !== owner) message.author.send(`Failed to spam ${taggedUser.tag} for ${i + 1} time(s) due to \`${err.message}\`.`).catch(() => i = time);
            });
            i++;
        }, 500);
    }
}

const cmd = new SpamCommand();
export default cmd;