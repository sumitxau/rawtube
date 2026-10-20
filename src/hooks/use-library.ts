"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
    db,
    saveVideo,
    removeSavedVideo,
    isVideoSaved,
    markChannel,
    unmarkChannel,
    isChannelMarked,
    recordWatchProgress,
    clearAllLocalData,
} from "@/lib/db/database";
import type { SavedVideo, MarkedChannel, WatchedVideo } from "@/types/library";

/**
 * useLibrary Hook
 * Reactively subscribes components to IndexedDB data.
 * When data changes anywhere in the browser, components update automatically.
 */
export function useLibrary() {
    // 1. Reactive live queries with Dexie (sorted newest first)
    const savedVideos = useLiveQuery(
        () => db.savedVideos.orderBy("savedAt").reverse().toArray(),
        [],
        [] // Default fallback to empty array while IndexedDB initializes
    );

    const markedChannels = useLiveQuery(
        () => db.channels.orderBy("markedAt").reverse().toArray(),
        [],
        []
    );

    const watchedVideos = useLiveQuery(
        () => db.watchedVideos.orderBy("watchedAt").reverse().toArray(),
        [],
        []
    );

    // Ready flag ensures UI doesn't flicker before IndexedDB is mounted
    const isReady = savedVideos !== undefined && markedChannels !== undefined;

    return {
        // Reactive Data Collections
        savedVideos: savedVideos ?? [],
        markedChannels: markedChannels ?? [],
        watchedVideos: watchedVideos ?? [],
        isReady,

        // Mutation Actions
        saveVideo,
        removeSavedVideo,
        isVideoSaved,
        markChannel,
        unmarkChannel,
        isChannelMarked,
        recordWatchProgress,
        clearAllLocalData,
    };
}
