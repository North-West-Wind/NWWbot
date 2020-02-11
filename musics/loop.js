module.exports = {
  name: "loop",
  description: "Change the loop status of the server.",
  aliases: ["lp"],
  music(message, serverQueue, looping) {
    if (!message.member.voice.channel)
    return message.channel.send("You are not in a voice channel!");
  if (!serverQueue) return message.channel.send("There is nothing playing.");
  const guildLoopStatus = looping.get(message.guild.id);
  if (guildLoopStatus === undefined || guildLoopStatus === null || !guildLoopStatus) {
    
    looping.set(message.guild.id, true);
    message.channel.send("The song queue is now being looped.");
    
  } else {
    if (guildLoopStatus === false) {
      looping.set(message.guild.id, true)
      message.channel.send("The song queue is now being looped.");

      return;
    } else {
      looping.set(message.guild.id, false);
      message.channel.send("The song queue is no longer being looped.");
      return;
    }
  }
  }
}