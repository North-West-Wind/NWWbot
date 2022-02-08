
import { NorthInteraction, NorthMessage, SlashCommand } from "../../classes/NorthClient.js";

class ThxCommand implements SlashCommand {
	name = 'thx'
	description = 'Thanks the bot.'
	category = 3
    
	async execute(interaction: NorthInteraction) {
		await interaction.reply(`You're welcome, <@${interaction.user.id}>`);
	}
	
    async run(message: NorthMessage) {
		await message.channel.send(`You're welcome, <@${message.author.id}>`);
	}
}

const cmd = new ThxCommand();
export default cmd;