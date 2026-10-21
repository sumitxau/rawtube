/**
 * RawTube Domain Types
 * Everything here stays inside the user's browser (IndexedDB + localStorage).
 * No remote user accounts, no tracking IDs.
 */

// Videos bookmarked for "Watch Later"
export interface SavedVideo {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnailUrl: string;
    duration?: number; // duration in seconds
    savedAt: number;   // epoch timestamp (Date.now())
}

// Watch history & resume playback tracking
export interface WatchedVideo {
    videoId: string;
    watchedAt: number;        // when it was last played
    progressSeconds: number;  // timestamp to resume playback where you left off
    durationSeconds?: number;
    channelTitle?: string;
    channelId?: string;
}

// User-created custom playlists stored locally
export interface LocalPlaylist {
    id: string;
    name: string;
    videoIds: string[];
    createdAt: number;
}

// Channels you manually subscribe to (no Google login needed)
export interface MarkedChannel {
    channelId: string;        // unique YouTube channel ID (e.g. UC...)
    channelTitle: string;     // display name for fast offline sidebar listing
    avatarUrl?: string;       // cached avatar preview
    markedAt: number;         // sort order by when you added it
}

// Browser preferences stored in localStorage
export interface AppSettings {
    theme: "dark" | "light" | "system";
    focusMode: boolean;       // when true: hides comments, recommendations, distracting sidebars
    pipedInstance: string;    // allows switching mirrors if pipedapi.kavin.rocks is down
    sortOrder: "newest" | "channel";
}

// Normalized video metadata returned by the Piped API
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
