import * as Discord from "discord.js";
import { NorthClient, ServerQueue } from "../classes/NorthClient";
const queue = new Discord.Collection<Discord.Snowflake, ServerQueue>();

export function getQueues() { return queue; }
export function getQueue(id) {
    return queue.get(id);
}
export async function updateQueue(id, serverQueue, pool) {
    if (!serverQueue) queue.delete(id);
    else queue.set(id, serverQueue);
    if (!pool) return;
    try {
        await pool.query(`UPDATE servers SET looping = ${serverQueue?.looping ? 1 : "NULL"}, repeating = ${serverQueue?.repeating ? 1 : "NULL"}, random = ${serverQueue?.random ? 1 : "NULL"}, queue = ${!serverQueue?.songs?.length || !Array.isArray(serverQueue.songs) ? "NULL" : `'${escape(JSON.stringify(serverQueue.songs))}'`} WHERE id = '${id}'`);
    } catch (err) {
        NorthClient.storage.error(err);
    }
}
export function stop(guild) {
    const serverQueue = queue.get(guild.id);
    if (!serverQueue) return;
    serverQueue.connection?.dispatcher?.destroy();
    serverQueue.playing = false;
    serverQueue.connection = null;
    serverQueue.voiceChannel = null;
    serverQueue.textChannel = null;
    guild.me.voice?.channel?.leave();
}
export function setQueue(guild, songs, loopStatus, repeatStatus, pool) {
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
    } as ServerQueue;
    queue.set(guild, queueContruct);
    return queueContruct;
}
export function checkQueue() {
    return queue.size > 0;
}