"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react";
import { useLibrary } from "@/hooks/use-library";
import type { VideoMetadata } from "@/types/library";

interface VideoCardProps {
    video: VideoMetadata;
}

// Utility: Format seconds into mm:ss or hh:mm:ss
function formatDuration(seconds?: number): string {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoCard({ video }: VideoCardProps) {
    const { savedVideos, watchedVideos, saveVideo, removeSavedVideo } = useLibrary();

    // Check if saved in Watch Later or already watched
    const isSaved = savedVideos.some((v) => v.videoId === video.id);
    const isWatched = watchedVideos.some((v) => v.videoId === video.id);

    // Toggle Bookmark without triggering link navigation
    const handleToggleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isSaved) {
            await removeSavedVideo(video.id);
        } else {
            await saveVideo({
                videoId: video.id,
                title: video.title,
                channelTitle: video.channelName,
                thumbnailUrl: video.thumbnailUrl,
                duration: video.duration,
                savedAt: Date.now(),
            });
        }
    };

    const durationStr = formatDuration(video.duration);

    return (
        <Link
            href={`/watch/${video.id}`}
            className="group flex flex-col rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all duration-200"
        >
            {/* Thumbnail Container */}
            <div className="relative aspect-video w-full bg-neutral-950 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />

                {/* Video Duration Badge */}
                {durationStr && (
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        {durationStr}
                    </span>
                )}

                {/* Watched Indicator Pill */}
                {isWatched && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-neutral-900/90 border border-neutral-700 px-2 py-0.5 text-xs text-neutral-300 backdrop-blur-sm">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Watched
                    </span>
                )}

                {/* Quick Watch-Later Bookmark Button */}
                <button
                    onClick={handleToggleBookmark}
                    aria-label={isSaved ? "Remove from Watch Later" : "Save to Watch Later"}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition-colors opacity-90 group-hover:opacity-100"
                >
                    {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                        <Bookmark className="w-4 h-4 text-neutral-300 hover:text-white" />
                    )}
                </button>
            </div>

            {/* Video Details */}
            <div className="flex flex-col p-3.5 gap-1.5">
                <h3
                    className="font-medium text-sm text-neutral-100 line-clamp-2 leading-snug group-hover:text-white transition-colors"
                    title={video.title}
                >
                    {video.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-neutral-300 mt-1 font-medium">
                    <span className="truncate hover:text-white transition-colors">
                        {video.channelName}
                    </span>
                    {video.uploadedDate && (
                        <span className="shrink-0 text-neutral-400 font-normal">{video.uploadedDate}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
