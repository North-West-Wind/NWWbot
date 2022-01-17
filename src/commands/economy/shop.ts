
import { NorthClient, NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient"
import * as Discord from "discord.js";
import { color, wait, genPermMsg, ID, msgOrRes } from "../../function";
import { globalClient as client } from "../../common";
import { RowDataPacket } from "mysql2";


class ShopCommand implements SlashCommand {
    name = "shop"
    description = "Displays the server shop."
    usage = "[subcommand]"
    category = 2
    subcommands = ["add"]
    subdesc = ["Adds a new item to the server shop."]
    options = [
        {
            name: "menu",
            description: "View the shop menu.",
            type: "SUB_COMMAND"
        },
        {
            name: "add",
            description: "Adds a new item to the server shop.",
            type: "SUB_COMMAND"
        }
    ];
    async execute(interaction: NorthInteraction) {
        if (interaction.options.getSubcommand() == "add") return await this.add(interaction);
        this.handleMenu(interaction);
    }
    
    async run(message: NorthMessage, args: string[]) {
        if (args[0] && args[0] == "add") return await this.add(message);
        this.handleMenu(message);
    }

    async handleMenu(message: NorthMessage | NorthInteraction) {
        const pool = client.pool;
        const c = color();
        const author = message instanceof Discord.Message ? message.author : message.user;
        mainMenu();
        async function mainMenu(msg = undefined) {
            var mesg = msg;
            var [results] = <RowDataPacket[][]> await pool.query(`SELECT * FROM users WHERE id = '${author.id}'`);
            var cash = 0;
            if (results.length == 1) cash = results[0].currency;
            const shop = new Discord.MessageEmbed()
                .setTimestamp()
                .setColor(c)
                .setTitle("Welcome to the shop!")
                .setDescription("Choose an action:\n\n1️⃣ Shop\n2️⃣ Leave")
                .setFooter({ text: "You have $" + cash, iconURL: author.displayAvatarURL() });

            const leave = new Discord.MessageEmbed()
                .setTimestamp()
                .setColor(c)
                .setTitle("You were told to leave.")
                .setDescription("The staff waited too long and told you to leave.")
                .setFooter({ text: "You have $" + cash, iconURL: author.displayAvatarURL() });
            if (!mesg) msg = await msgOrRes(message, shop);
            else msg = await mesg.edit(shop);

            await msg.react("1️⃣");
            await msg.react("2️⃣");

            const filter = (reaction, user) => ["1️⃣", "2️⃣"].includes(reaction.emoji.name) && user.id === author.id;
            const collected = await msg.awaitReactions(filter, { max: 1, idle: 60000, error: ["time"] });
            const reaction = collected.first();
            msg.reactions.removeAll().catch(() => {});
            if (!reaction) return await msg.edit(leave);

            async function shopMenu() {
                const allItems = [];
                var [results] = <RowDataPacket[][]> await pool.query(`SELECT * FROM shop WHERE guild = '${message.guild.id}' OR guild = ''`);
                for (let i = 0; i < results.length; i++) allItems.push(`**${i + 1}.** ${results[i].name} - **\$${results[i].buy_price}** : **${results[i].stock_limit > -1 ? results[i].stock_limit : "∞"}**`);

                const menu = new Discord.MessageEmbed()
                    .setColor(c)
                    .setTitle("Shop Menu")
                    .setDescription("Type the ID to buy or `0` to cancel.\n\n" + allItems.join("\n"))
                    .setTimestamp()
                    .setFooter({ text: "You have $" + cash, iconURL: author.displayAvatarURL() });
                await msg.edit(menu);
                var collected = await msg.channel.awaitMessages(x => x.author.id === author.id, { max: 1, time: 30000 });
                if (!collected.first()) {
                    menu.setDescription("30 seconds passed. Returning to main menu in 3 seconds...")
                        .setFooter({ text: "Please be patient.", iconURL: message.client.user.displayAvatarURL() });
                    await msg.edit(menu);
                    await wait(3000);
                    return await mainMenu(msg);
                }
                await collected.first().delete();
                const index = parseInt(collected.first().content);
                if (isNaN(index)) {
                    menu.setDescription("Invalid number. Returning to main menu in 3 seconds...")
                        .setFooter({ text: "Please be patient.", iconURL: message.client.user.displayAvatarURL() });
                    await msg.edit(menu);
                    await wait(3000);
                    return await mainMenu(msg);
                }
                if (index === 0) {
                    menu.setDescription("Cancelled action. Returning to main menu in 3 seconds...")
                        .setFooter({ text: "Please be patient.", iconURL: message.client.user.displayAvatarURL() });
                    await msg.edit(menu);
                    await wait(3000);
                    return await mainMenu(msg);
                }
                viewItem(msg, results[index - 1]?.id);
            }

            async function viewItem(msg, id) {
                var [result] = <RowDataPacket[][]> await pool.query("SELECT * FROM shop WHERE id = '" + id + "'");
                if (result.length == 0) {
                    var itemEmbed = new Discord.MessageEmbed()
                        .setTimestamp()
                        .setColor(c)
                        .setTitle("No item found!")
                        .setDescription("Returning to main menu in 3 seconds...")
                        .setFooter({ text: "Please be patient.", iconURL: message.client.user.displayAvatarURL() });
                    await msg.edit(itemEmbed);
                    await wait(3000);
                    return await mainMenu(msg);
                } else {
                    var itemEmbed = new Discord.MessageEmbed()
                        .setTimestamp()
                        .setColor(c)
                        .setTitle(result[0].name)
                        .setDescription(`Buy Price: **$${result[0].buy_price}**\n${result[0].description}\nStock: **${result[0].stock_limit > -1 ? result[0].stock_limit : "∞"}**\n\n1️⃣ Buy\n2️⃣ Return`)
                        .setFooter({ text: "Please answer within 30 seconds.", iconURL: message.client.user.displayAvatarURL() });

                    await msg.edit(itemEmbed);
                    await msg.react("1️⃣");
                    await msg.react("2️⃣");

                    var collected = await msg.awaitReactions(filter, { max: 1, idle: 30000 });
                    const reaction = collected.first();
                    if (!reaction) {
                        itemEmbed.setTitle("Please leave if you are not buying stuff!")
                            .setDescription("Returning to main menu in 3 seconds...")
                            .setFooter({ text: "Please be patient.", iconURL: message.client.user.displayAvatarURL() });
                        await msg.edit(itemEmbed);
                        await wait(3000);
                        return await mainMenu(msg);
                    }
                    msg.reactions.removeAll().catch(() => {});

                    if (reaction.emoji.name === "1️⃣") {
                        if (result[0].stock_limit == 0) {
                            itemEmbed.setTitle(`${result[0].name} is out of stock!`)
                                .setDescription("Returning to main menu in 3 seconds...")
                                .setFooter({ text: "Please be patient.", iconURL: message.client.user.displayAvatarURL() });
                            await msg.edit(itemEmbed);
                            await wait(3000);
                            return await mainMenu(msg);
                        }
                        if (Number(cash) < Number(result[0].buy_price)) {
                            itemEmbed.setTitle("You don't have enough money to buy " + result[0].name + "!")
                                .setDescription("Returning to main menu in 3 seconds...")
                                .setFooter({ text: "Please be patient.", iconURL: message.client.user.displayAvatarURL() });
                            await msg.edit(itemEmbed);
                            await wait(3000);
                            return await mainMenu(msg);
                        } else {
                            itemEmbed.setTitle("You bought " + result[0].name + "!")
                                .setDescription("Returning to main menu in 3 seconds...")
                                .setFooter({ text: "Please be patient.", iconURL: message.client.user.displayAvatarURL() });
                            const [IResult] = <RowDataPacket[][]> await pool.query(`SELECT items FROM users WHERE id = '${author.id}'`);
                            if (IResult.length == 1 && result[0].buy_limit > 0) {
                                const items = JSON.parse(unescape(IResult[0].items));
                                if (!items[result[0].id]) items[result[0].id] = 0;
                                items[result[0].id] += 1;
                                if (items[result[0].id] > result[0].buy_limit) {
                                    itemEmbed.setTitle(`You can only get ${result[0].buy_limit} of this item!`)
                                        .setDescription("Returning to main menu in 3 seconds...")
                                        .setFooter({ text: "Please be patient.", iconURL: message.client.user.displayAvatarURL() });
                                    await msg.edit(itemEmbed);
                                    await wait(3000);
                                    return await mainMenu(msg);
                                }
                            }
                            if (result[0].must_use) {
                                itemEmbed.setDescription("However, you must use this item immediately.")
                                    .setFooter({ text: "Running in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
                                await msg.edit(itemEmbed);
                                await wait(3000);
                                itemEmbed.setFooter({ text: "Using item...", iconURL: message.client.user.displayAvatarURL() });
                                const requiredArgs = result[0].args.split(/ +/).filter(s => s != "");;
                                var args = [];
                                if (requiredArgs.length > 0) {
                                    itemEmbed.setDescription(`Please input the following arguments and separate them by line breaks:\n**${requiredArgs.join(" ")}**`);
                                    await msg.edit(itemEmbed);
                                    const collected = await message.channel.awaitMessages({ filter: x => x.author.id === author.id,  max: 1, time: 120000 });
                                    if (collected.first()) await collected.first().delete();
                                    if (!collected.first()?.content) {
                                        itemEmbed.setDescription(`You didn't input the arguments in time! Cancelling purchase...`)
                                            .setFooter({ text: "Returning to main menu in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
                                        await msg.edit(itemEmbed);
                                        await wait(3000);
                                        return await mainMenu(msg);
                                    }
                                    args = collected.first().content.split(/ +/);
                                    if (args.length < requiredArgs.length) {
                                        itemEmbed.setDescription(`The input arguments are less than the required arguments! Cancelling purchase...`)
                                            .setFooter({ text: "Returning to main menu in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
                                        await msg.edit(itemEmbed);
                                        await wait(3000);
                                        return await mainMenu(msg);
                                    }
                                }
                                var run = result[0].run;
                                run = run.replace(/{user}/ig, `<@${author.id}>`);
                                run = run.replace(/{channel}/ig, `<#${message.channel.id}>`);
                                run = run.replace(/{args}/ig, args.join(" "));
                                const replaceArgs = run.match(/{( +)?args( +)?\[( +)?\d+( +)?\]( +)?}/ig);
                                if (replaceArgs) for (const replaceArg of replaceArgs) {
                                    const index = parseInt(replaceArg.match(/\d+/)[0]);
                                    const newArg = args[index];
                                    run = run.replace(replaceArg, newArg);
                                }
                                const commands = run.match(/{( +)?command +.+( +)?}/ig);
                                if (commands) for (const command of commands) {
                                    const spliced = command.replace(/({( +)?command( +)|})/ig, "");
                                    const cArgs = spliced.split(/ +/);
                                    const commandName = cArgs.shift().toLowerCase();
                                    const c = NorthClient.storage.commands.get(commandName) || NorthClient.storage.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
                                    if (!c) {
                                        itemEmbed.setDescription(`Failed to use the item! Cancelling purchase...`)
                                            .setFooter({ text: "Returning to main menu in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
                                        await msg.edit(itemEmbed);
                                        await wait(3000);
                                        return await mainMenu(msg);
                                    }
                                    try {
                                        if (message instanceof Discord.Message) await c.run(message, cArgs);
                                        else throw new Error("This is a little too hard for slash.");
                                    } catch (error: any) {
                                        console.error(error);
                                        itemEmbed.setDescription(`Failed to use the item! Cancelling purchase...`)
                                            .setFooter({ text: "Returning to main menu in 3 seconds...", iconURL: message.client.user.displayAvatarURL() });
                                        await msg.edit(itemEmbed);
                                        await wait(3000);
                                        return await mainMenu(msg);
                                    }
                                    run = run.replace(command, "");
                                }
                                if (run.length > 0) await message.channel.send(run);
                            }
                            var paid = cash - result[0].buy_price;
                            const con = await pool.getConnection();
                            try {
                                await con.query(`UPDATE users SET currency = ${paid} WHERE id = '${author.id}'`);
                                if (!result[0].must_use) {
                                    if (IResult.length === 0) {
                                        const items = {};
                                        items[result[0].id] = 0;
                                        items[result[0].id] += 1;
                                        await con.query(`INSERT INTO users(id, items) VALUES('${author.id}', '${escape(JSON.stringify(items))}')`);
                                    } else {
                                        const items = JSON.parse(unescape(IResult[0].items));
                                        if (!items[result[0].id]) items[result[0].id] = 0;
                                        items[result[0].id] += 1;
                                        await con.query(`UPDATE users SET items = '${escape(JSON.stringify(items))}' WHERE id = '${author.id}'`);
                                    }
                                }
                            } catch (err: any) {
                                console.error(err);
                                itemEmbed.setTitle("Failed to purchase!");
                            }
                            await msg.edit(itemEmbed);
                            await wait(3000);
                            await mainMenu(msg);
                            con.release();
                        }
                    } else if (reaction.emoji.name === "2️⃣") {
                        itemEmbed.setTitle("You want to look at the menu again.")
                            .setDescription("Returning to main menu in 3 seconds...")
                            .setFooter({ text: "Please be patient.", iconURL: client.user.displayAvatarURL() });
                        await msg.edit(itemEmbed);
                        await wait(3000);
                        await mainMenu(msg);
                    }
                }
            }

            const manualLeave = new Discord.MessageEmbed()
                .setTimestamp()
                .setColor(c)
                .setTitle("Goodbye!")
                .setDescription("said the staff.")
                .setFooter({ text: "You have $" + cash, iconURL: author.displayAvatarURL() });
            if (!reaction) {
                msg.reactions.removeAll().catch(() => { });
                return await msg.edit(leave);
            }
            if (reaction.emoji.name === "1️⃣") shopMenu();
            else if (reaction.emoji.name === "2️⃣") msg.edit(manualLeave);
        }
    }

    async add(message: NorthMessage | NorthInteraction) {
        if (!message.guild) return await message.channel.send("Please don't use this in Direct Message.");
        const author = message instanceof Discord.Message ? message.author : message.user;
        if (!(<Discord.GuildMember> message.member).permissions.has(BigInt(32))) return await message.channel.send(genPermMsg(32, 0));
        var msg;
        if (message instanceof Discord.Message) await message.channel.send("Please enter the name and the description of the item. (Break a line to separate them) (Description can be multi-line)");
        else {
            await message.reply("Please enter the name and the description of the item. (Break a line to separate them) (Description can be multi-line)");
            msg = await message.fetchReply();
        }
        const collected = await message.channel.awaitMessages({ filter: x => x.author.id === author.id,  max: 1, time: 120000 });
        if (collected.first()) await collected.first().delete();
        if (!collected.first()?.content) return await msg.edit("I cannot read the message!");
        if (collected.first().content.toLowerCase() == "cancel") return await msg.edit("Action cancelled.");
        const name = collected.first().content.split("\n")[0];
        const description = collected.first().content.split("\n").slice(1).join("\n");
        await msg.edit(`Received item with the name **${name}**.\nNow, please enter the buying and selling price of the item. (Use space to separate them) (Both should not have more than 2 decimal places)`);
        const collected1 = await message.channel.awaitMessages({ filter: x => x.author.id === author.id,  max: 1, time: 60000 });
        if (collected1.first()) await collected1.first().delete();
        if (!collected1.first()?.content) return await msg.edit("I cannot read the message!");
        if (collected1.first().content.toLowerCase() == "cancel") return await msg.edit("Action cancelled.");
        const prices = collected1.first().content.split(/ +/);
        const buyPrice = Math.round((Number(prices[0]) + Number.EPSILON) * 100) / 100;
        if (isNaN(buyPrice)) return await msg.edit("The buying price entered is not valid.");
        var sellPrice = buyPrice;
        if (prices.length < 2) await msg.edit("Selling price missing. I'll assume that it equals to the buying price.");
        else sellPrice = Math.round((Number(prices[1]) + Number.EPSILON) * 100) / 100;
        if (isNaN(sellPrice)) return await msg.edit("The selling price entered is not valid.");
        await msg.edit(`**${name}** will be able to be bought with **$${buyPrice}** and sold at **$${sellPrice}**.\nNext, please enter the purchase limit and the stock limit of it. (Use space to separate them) (negative number for infinity)`);
        const collected2 = await message.channel.awaitMessages({ filter: x => x.author.id === author.id,  max: 1, time: 30000 });
        if (collected2.first()) await collected2.first().delete();
        if (!collected2.first()?.content) return await msg.edit("I cannot read the message!");
        if (collected2.first().content.toLowerCase() == "cancel") return await msg.edit("Action cancelled.");
        const limits = collected2.first().content.split(/ +/);
        var limit = 0;
        if (isNaN(parseInt(limits[0]))) await msg.edit("The purchase limit entered is not valid. I'll take that as limitless.").then(() => wait(3000));
        else limit = parseInt(limits[0]);
        var stock = -1;
        if (!limits[1] || isNaN(parseInt(limits[1]))) await msg.edit("The stock limit entered is not valid. I'll take that as limitless.").then(() => wait(3000));
        else stock = parseInt(limits[1]);
        await msg.edit(`All users will be able to purchase **${limit < 1 ? "limitlessly" : `${limit} ${name}${limit > 1 ? "s" : ""}`}** and there will be **${stock < 0 ? "infinite stocks" : `${stock} in stock`}**.\nTo finish up, please enter the arguments required ("nothing" for no arguments) and what to do when the user uses this item. (Use line break to separate them) (The code can be multi-line)`);
        const collected3 = await message.channel.awaitMessages({ filter: x => x.author.id === author.id,  max: 1, time: 300000 });
        if (collected3.first()) await collected3.first().delete();
        if (!collected3.first()?.content) return await msg.edit("I cannot read the message!");
        if (collected3.first().content.toLowerCase() == "cancel") return await msg.edit("Action cancelled.");
        const args = collected3.first().content.split("\n")[0].toLowerCase() === "nothing" ? "" : collected3.first().content.split("\n")[0];
        const command = collected3.first().content.split("\n").slice(1).join("\n");
        await msg.edit(`Code to run has been set.\nFinally, if the user must use the upon purchase, type \`1\` or any larger number.\nIf the user can hold the item in their inventory, type \`0\`.`);
        const collected4 = await message.channel.awaitMessages({ filter: x => x.author.id === author.id,  max: 1, time: 300000 });
        if (collected4.first()) await collected4.first().delete();
        if (!collected4.first()?.content) return await msg.edit("I cannot read the message!");
        if (collected4.first().content.toLowerCase() == "cancel") return await msg.edit("Action cancelled.");
        const mustUse = !!parseInt(collected4.first().content);
        await msg.edit(`Added item **${name}** to the server shop for $${buyPrice}. Each user will be able to own ${limit < 1 ? "as many as they want" : `${limit} of them`}. Customers ${mustUse ? "must" : "will not have to"} use them upon purchase.`);
        try {
            await client.pool.query(`INSERT INTO shop VALUES('${await ID()}', '${message.guild.id}', '${name}', '${description}', ${buyPrice}, ${sellPrice}, ${limit}, ${stock}, ${mustUse ? 1 : 0}, '${command}', '${args}')`);
            if (message instanceof Discord.Message) await message.channel.send("Item added to database!");
            else await message.followUp("Item added to database!");
        } catch (err: any) {
            console.error(err);
            if (message instanceof Discord.Message) await message.reply("there was an error trying to add the item to the database!");
            else await message.followUp("There was an error trying to add the item to the database!");
        }
    }
};

const cmd = new ShopCommand();
export default cmd;