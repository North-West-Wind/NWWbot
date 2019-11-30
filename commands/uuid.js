module.exports = {
	name: 'uuid',
	description: 'Get someone\'s Minecraft UUID.',
  args: true,
	execute(message, args) {
    
    if ( `${args[0]}` === 'uuid') {
		if (!message.mentions.users.size) {
            return message.channel.send('Please tell me the Minecraft username of that user.');
        }

MojangAPI.nameToUuid(`${args[1]}`, function(err, res) {
    if (err)
        console.log(err);
    else
        console.log(res[1].name + "? No, they're " + res[1].id + " to me.");
  message.channel.send(`${args[1]}\'s UUID is ` + res.id);
  return;
});
    }
    
    if (args[0] === 'profile') {
      
      if (!message.mentions.users.size) {
            return message.channel.send('Please tell me the Minecraft username of that user.');
        }
      
      MojangAPI.nameToUuid(`${args[1]}`, function(err, res) {
    if (err)
        console.log(err);
    else
      
      MojangAPI.profile(res[1].id, function(err, res) {
    if (err)
        console.log(err);
    else {
        console.log(res.id + " is also known as " + res.name + ".");
    }
});
    });

    }
}
  };