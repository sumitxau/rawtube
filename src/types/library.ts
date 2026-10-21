export interface SavedVideo {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnailUrl: string;
    duration?: number;
    savedAt: number;
}

export interface WatchedVideo {
    videoId: string;
    watchedAt: number;
    progressSeconds: number;
    durationSeconds?: number;
    title?: string;
    channelTitle?: string;
    channelId?: string;
}

export interface LocalPlaylist {
    id: string;
    name: string;
    videoIds: string[];
    createdAt: number;
}

export interface MarkedChannel {
    channelId: string;
    channelTitle: string;
    avatarUrl?: string;
    markedAt: number;
}

export interface ChannelPreference {
    channelId: string;
    channelTitle: string;
    preference: "interested" | "not_interested";
    updatedAt: number;
}

export interface AppSettings {
    theme: "dark" | "light" | "system";
    focusMode: boolean;
    pipedInstance: string;
    sortOrder: "newest" | "channel";
}

export interface VideoMetadata {
    id: string;
    title: string;
    channelName: string;
    channelId: string;
    uploadedDate?: string;
    duration?: number;
    thumbnailUrl: string;
    views?: number;
}
