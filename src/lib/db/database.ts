import Dexie, { type EntityTable } from "dexie";
import type {
    MarkedChannel,
    SavedVideo,
    WatchedVideo,
    LocalPlaylist,
    ChannelPreference,
} from "@/types/library";

class RawTubeDatabase extends Dexie {
    channels!: EntityTable<MarkedChannel, "channelId">;
    savedVideos!: EntityTable<SavedVideo, "videoId">;
    watchedVideos!: EntityTable<WatchedVideo, "videoId">;
    playlists!: EntityTable<LocalPlaylist, "id">;
    preferences!: EntityTable<ChannelPreference, "channelId">;

    constructor() {
        super("RawTubeDB");

        this.version(1).stores({
            channels: "channelId, markedAt",
            savedVideos: "videoId, savedAt",
            watchedVideos: "videoId, watchedAt",
            playlists: "id, createdAt",
        });

        this.version(2).stores({
            preferences: "channelId, preference, updatedAt",
        });
    }
}

export const db = new RawTubeDatabase();

export async function saveVideo(video: SavedVideo): Promise<void> {
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

export async function recordWatchProgress(
    videoId: string,
    progressSeconds: number,
    durationSeconds?: number,
    channelTitle?: string,
    channelId?: string,
    title?: string
): Promise<void> {
    const existing = await db.watchedVideos.get(videoId);
    await db.watchedVideos.put({
        videoId,
        watchedAt: Date.now(),
        progressSeconds,
        durationSeconds: durationSeconds ?? existing?.durationSeconds,
        channelTitle: channelTitle ?? existing?.channelTitle,
        channelId: channelId ?? existing?.channelId,
        title: title ?? existing?.title,
    });
}

export async function removeWatchedVideo(videoId: string): Promise<void> {
    await db.watchedVideos.delete(videoId);
}

export async function clearWatchedHistory(): Promise<void> {
    await db.watchedVideos.clear();
}

export async function setChannelPreference(
    channelId: string,
    channelTitle: string,
    preference: "interested" | "not_interested"
): Promise<void> {
    await db.preferences.put({
        channelId,
        channelTitle,
        preference,
        updatedAt: Date.now(),
    });
}

export async function removeChannelPreference(channelId: string): Promise<void> {
    await db.preferences.delete(channelId);
}

export async function getChannelPreference(channelId: string): Promise<"interested" | "not_interested" | null> {
    const item = await db.preferences.get(channelId);
    return item ? item.preference : null;
}

export async function clearAllLocalData(): Promise<void> {
    await Promise.all([
        db.channels.clear(),
        db.savedVideos.clear(),
        db.watchedVideos.clear(),
        db.playlists.clear(),
        db.preferences.clear(),
    ]);
}
