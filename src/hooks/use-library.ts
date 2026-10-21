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
    removeWatchedVideo,
    clearWatchedHistory,
    setChannelPreference,
    removeChannelPreference,
    getChannelPreference,
    clearAllLocalData,
} from "@/lib/db/database";

export function useLibrary() {
    const savedVideos = useLiveQuery(
        () => db.savedVideos.orderBy("savedAt").reverse().toArray(),
        [],
        []
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

    const preferences = useLiveQuery(
        () => db.preferences.toArray(),
        [],
        []
    );

    const isReady = savedVideos !== undefined && markedChannels !== undefined;

    return {
        savedVideos: savedVideos ?? [],
        markedChannels: markedChannels ?? [],
        watchedVideos: watchedVideos ?? [],
        preferences: preferences ?? [],
        isReady,

        saveVideo,
        removeSavedVideo,
        isVideoSaved,
        markChannel,
        unmarkChannel,
        isChannelMarked,
        recordWatchProgress,
        removeWatchedVideo,
        clearWatchedHistory,
        setChannelPreference,
        removeChannelPreference,
        getChannelPreference,
        clearAllLocalData,
    };
}
