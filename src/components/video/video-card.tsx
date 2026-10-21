"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react";
import { useLibrary } from "@/hooks/use-library";
import type { VideoMetadata } from "@/types/library";

interface VideoCardProps {
  video: VideoMetadata;
}

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

function formatViews(views?: number): string {
  if (!views || isNaN(views) || views <= 0) return "";
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1)}M views`;
  }
  if (views >= 1_000) {
    return `${Math.round(views / 1_000)}K views`;
  }
  return `${views} views`;
}

export function VideoCard({ video }: VideoCardProps) {
  const { savedVideos, watchedVideos, saveVideo, removeSavedVideo } = useLibrary();

  const isSaved = savedVideos.some((v) => v.videoId === video.id);
  const isWatched = watchedVideos.some((v) => v.videoId === video.id);

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
  const viewsStr = formatViews(video.views);

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group flex flex-col rounded-xl overflow-hidden bg-[#141519] border border-neutral-800/90 hover:border-neutral-600 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <div className="relative aspect-video w-full bg-neutral-950 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />

        {durationStr && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/85 px-1.5 py-0.5 text-[11px] font-mono text-neutral-200 backdrop-blur-sm border border-neutral-800/60">
            {durationStr}
          </span>
        )}

        {isWatched && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded bg-black/85 border border-neutral-700 px-1.5 py-0.5 text-[10px] font-mono text-neutral-300 backdrop-blur-sm">
            <CheckCircle2 className="w-3 h-3 text-white" />
            Watched
          </span>
        )}

        <button
          onClick={handleToggleBookmark}
          aria-label={isSaved ? "Remove from Watch Later" : "Save to Watch Later"}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-black/75 hover:bg-black text-white backdrop-blur-sm transition-colors opacity-80 group-hover:opacity-100 border border-neutral-800"
          title={isSaved ? "Saved in Watch Later" : "Save to Watch Later"}
        >
          {isSaved ? (
            <BookmarkCheck className="w-3.5 h-3.5 text-white" />
          ) : (
            <Bookmark className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
          )}
        </button>
      </div>

      <div className="flex flex-col p-3.5 gap-2 flex-1 justify-between">
        <h3
          className="font-medium text-xs sm:text-[13px] text-neutral-100 line-clamp-2 leading-snug group-hover:text-white transition-colors"
          title={video.title}
        >
          {video.title}
        </h3>

        <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/40">
          <div className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-300 shrink-0 select-none">
            {video.channelName ? video.channelName[0].toUpperCase() : "R"}
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400 w-full overflow-hidden">
            <span className="truncate hover:text-neutral-200 transition-colors font-medium text-[11px]">
              {video.channelName}
            </span>
            <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-neutral-500 font-mono ml-2">
              {viewsStr && <span>{viewsStr}</span>}
              {viewsStr && video.uploadedDate && <span>·</span>}
              {video.uploadedDate && <span>{video.uploadedDate}</span>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
