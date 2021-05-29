const Discord = require("discord.js");
const queue = new Discord.Collection();
const { NorthClient } = require("../classes/NorthClient.js");

module.exports = {
    getQueues() { return queue; },
    getQueue(id) {
        return queue.get(id);
    },
    async updateQueue(id, serverQueue, pool) {
        if (!serverQueue) queue.delete(id);
        else queue.set(id, serverQueue);
        if (!pool) return;
        try {
            await pool.query(`UPDATE servers SET looping = ${serverQueue?.looping ? 1 : "NULL"}, repeating = ${serverQueue?.repeating ? 1 : "NULL"}, random = ${serverQueue?.random ? 1 : "NULL"}, queue = ${!serverQueue?.songs?.length || !Array.isArray(serverQueue.songs) ? "NULL" : `'${escape(JSON.stringify(serverQueue.songs))}'`} WHERE id = '${id}'`);
        } catch (err) {
            NorthClient.storage.error(err);
        }
    },
    stop(guild) {
        const serverQueue = queue.get(guild.id);
        if (!serverQueue) return;
        serverQueue.connection?.dispatcher?.destroy();
        serverQueue.playing = false;
        serverQueue.connection = null;
        serverQueue.voiceChannel = null;
        serverQueue.textChannel = null;
        guild.me.voice?.channel?.leave();
    },
    setQueue(guild, songs, loopStatus, repeatStatus, pool) {
        const queueContruct = {
            textChannel: null,
            voiceChannel: null,
            connection: null,
            songs: songs,
            volume: 1,
            playing: false,
            paused: false,
            looping: loopStatus,
            repeating: repeatStatus,
            random: false,
            pool: pool
        };
        queue.set(guild, queueContruct);
        return queueContruct;
    },
    checkQueue() {
        return queue.size > 0;
    }
}