import { Message, MessageEmbed } from "discord.js";

import { Item, NorthInteraction, NorthMessage } from "../classes/NorthClient.js";
import { jsDate2Mysql, mysqlEscape, query } from "../function.js";

export default class EnergyDrinkItem implements Item {
    id = "481b8f8aec3b604db23f205b4ce2f52b447ffe5ab911e3f1"
    name = "EnergyDrink"
    async run(message: NorthMessage | NorthInteraction, msg: Message, em: MessageEmbed, itemObject: any) {
        var newDateSql = jsDate2Mysql(new Date(Date.now() + 86400000));
        const author = message instanceof Message ? message.author.id : message.user.id;
        try {
            var results = await query(`SELECT doubling FROM users WHERE id = '${author}'`);
            if (results[0].doubling) newDateSql = jsDate2Mysql(new Date(results[0].doubling.getTime() + 86400000));
            await query(`UPDATE users SET doubling = '${newDateSql}' WHERE id = '${author}'`);
            itemObject[this.id] -= 1;
            await query(`UPDATE users SET items = '${mysqlEscape(JSON.stringify(itemObject))}' WHERE id = '${author}'`);
            em.setTitle("You drank the Energy Drink!").setDescription("Now you work more efficiently for 24 hours!\nThe amount of money you gain will be doubled during this period!").setFooter({ text: "Have a nice day! :)", iconURL: message.client.user.displayAvatarURL() });
        } catch (err: any) {
            em.setTitle("ERROR!").setDescription("SQL Error! Contact NorthWestWind#1885 for help.").setFooter({ text: "Cancelled.", iconURL: message.client.user.displayAvatarURL() });
            console.error(err);
        }
        await msg.edit({embeds: [em]});
    }
}