module.exports = {
	name: 'restart',
	description: 'Restart the bot',
  aliases: ['re'],
	execute(message, args) {
    if (message.author.id !== '416227242264363008') return;
  message.channel.send('Restarted.').then(() => {
  process.exit(1);
})
  },
}