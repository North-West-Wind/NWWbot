import * as Discord from "discord.js";
import { NorthClient, ServerQueue, SoundTrack } from "../classes/NorthClient";
import { globalClient as client } from "../common";
const queue = new Discord.Collection<Discord.Snowflake, ServerQueue>();

export function getQueues() { return queue; }
export function getQueue(id: Discord.Snowflake) {
    return queue.get(id);
}
export async function updateQueue(id: Discord.Snowflake, serverQueue: ServerQueue, update: boolean = true) {
    if (!serverQueue) queue.delete(id);
    else queue.set(id, serverQueue);
    if (!update) return;
    try {
        await client.pool.query(`UPDATE servers SET looping = ${serverQueue?.looping ? 1 : "NULL"}, repeating = ${serverQueue?.repeating ? 1 : "NULL"}, random = ${serverQueue?.random ? 1 : "NULL"}, queue = ${!serverQueue?.songs?.length || !Array.isArray(serverQueue.songs) ? "NULL" : `'${escape(JSON.stringify(serverQueue.songs))}'`} WHERE id = '${id}'`);
    } catch (err) {
        NorthClient.storage.error(err);
    }
}
export function stop(guild: Discord.Guild) {
    const serverQueue = queue.get(guild.id);
    if (!serverQueue) return;
    serverQueue.destroy();
    serverQueue.playing = false;
    serverQueue.connection = null;
    serverQueue.voiceChannel = null;
    serverQueue.textChannel = null;
}
export function setQueue(guild: Discord.Snowflake, songs: SoundTrack[], loopStatus: boolean, repeatStatus: boolean) {
    const queueContruct = new ServerQueue(songs, loopStatus, repeatStatus);
    queue.set(guild, queueContruct);
    return queueContruct;
}
export function checkQueue() {
    return queue.size > 0;
}