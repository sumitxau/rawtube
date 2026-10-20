import Dexie, { type EntityTable } from "dexie";
import type {
    MarkedChannel,
    SavedVideo,
    WatchedVideo,
    LocalPlaylist,
} from "@/types/library";

/**
 * RawTube Database Engine
 * Pure client-side IndexedDB wrapper using Dexie.js.
 * All user data lives strictly in the browser sandbox.
 */
class RawTubeDatabase extends Dexie {
    channels!: EntityTable<MarkedChannel, "channelId">;
    savedVideos!: EntityTable<SavedVideo, "videoId">;
    watchedVideos!: EntityTable<WatchedVideo, "videoId">;
    playlists!: EntityTable<LocalPlaylist, "id">;

    constructor() {
        super("RawTubeDB");

        // Version 1 Schema
        // Keys defined here are indexed for high-speed sorting and queries
        this.version(1).stores({
            channels: "channelId, markedAt",
            savedVideos: "videoId, savedAt",
            watchedVideos: "videoId, watchedAt",
            playlists: "id, createdAt",
        });
    }
}

// Singleton database instance
export const db = new RawTubeDatabase();

// 1. Watch Later (Saved Videos) Operations

export async function saveVideo(video: SavedVideo): Promise<void> {
    // .put() inserts or updates existing, bumping savedAt timestamp to the top
    await db.savedVideos.put({
        ...video,
        savedAt: Date.now(),
    });
}

export async function removeSavedVideo(videoId: string): Promise<void> {
    await db.savedVideos.delete(videoId);
}

export async function isVideoSaved(videoId: string): Promise<boolean> {
    const item = await db.savedVideos.get(videoId);
    return Boolean(item);
}

// 2. Channel Subscription Operations

export async function markChannel(channel: MarkedChannel): Promise<void> {
    await db.channels.put({
        ...channel,
        markedAt: Date.now(),
    });
}

export async function unmarkChannel(channelId: string): Promise<void> {
    await db.channels.delete(channelId);
}

export async function isChannelMarked(channelId: string): Promise<boolean> {
    const item = await db.channels.get(channelId);
    return Boolean(item);
}


// 3. Playback History & Progress Tracking

export async function recordWatchProgress(
    videoId: string,
    progressSeconds: number,
    durationSeconds?: number
): Promise<void> {
    await db.watchedVideos.put({
        videoId,
        watchedAt: Date.now(),
        progressSeconds,
        durationSeconds,
    });
}


// 4. Privacy Control: Burner Wipe


export async function clearAllLocalData(): Promise<void> {
    await Promise.all([
        db.channels.clear(),
        db.savedVideos.clear(),
        db.watchedVideos.clear(),
        db.playlists.clear(),
    ]);
}
