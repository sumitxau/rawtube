import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, CheckCircle2, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  saveVideo,
  removeSavedVideo,
  setChannelPreference,
  removeChannelPreference,
} from "@/lib/db/database";
import type { VideoMetadata } from "@/types/library";

interface VideoCardProps {
  video: VideoMetadata;
  onHide?: (channelId: string) => void;
  isSaved?: boolean;
  isWatched?: boolean;
  preference?: "interested" | "not_interested";
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

export function VideoCard({
  video,
  onHide,
  isSaved = false,
  isWatched = false,
  preference,
}: VideoCardProps) {
  const [hidden, setHidden] = useState(false);

  const channelKey = video.channelId || video.channelName;
  const currentPref = preference;

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
        thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
        duration: video.duration,
        savedAt: Date.now(),
      });
    }
  };

  const handleInterested = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentPref === "interested") {
      await removeChannelPreference(channelKey);
    } else {
      await setChannelPreference(channelKey, video.channelName, "interested");
    }
  };

  const handleNotInterested = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setHidden(true);
    await setChannelPreference(channelKey, video.channelName, "not_interested");
    if (onHide) onHide(channelKey);
  };

  if (hidden || currentPref === "not_interested") {
    return null;
  }

  const durationStr = formatDuration(video.duration);
  const viewsStr = formatViews(video.views);
  const thumbUrl = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden bg-[#141519] border border-neutral-800/90 hover:border-neutral-600 transition-all duration-200 shadow-sm hover:shadow-md">
      <Link href={`/watch/${video.id}`} className="block relative aspect-video w-full bg-neutral-950 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes("mqdefault")) {
              target.src = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
            }
          }}
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

        <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
          <button
            onClick={handleInterested}
            aria-label="Interested"
            title={currentPref === "interested" ? "Boosted in My Feed" : "Mark as Interested (boost creator)"}
            className={`p-1.5 rounded-md backdrop-blur-sm transition-colors border ${
              currentPref === "interested"
                ? "bg-white text-black border-white"
                : "bg-black/75 hover:bg-black text-neutral-400 hover:text-white border-neutral-800 opacity-0 group-hover:opacity-100"
            }`}
          >
            <ThumbsUp className="w-3 h-3" />
          </button>

          <button
            onClick={handleNotInterested}
            aria-label="Not Interested"
            title="Not Interested (hide this channel)"
            className="p-1.5 rounded-md bg-black/75 hover:bg-red-950/80 hover:text-red-400 text-neutral-400 backdrop-blur-sm transition-colors border border-neutral-800 opacity-0 group-hover:opacity-100"
          >
            <ThumbsDown className="w-3 h-3" />
          </button>

          <button
            onClick={handleToggleBookmark}
            aria-label={isSaved ? "Remove from Watch Later" : "Save to Watch Later"}
            className="p-1.5 rounded-md bg-black/75 hover:bg-black text-white backdrop-blur-sm transition-colors border border-neutral-800 opacity-80 group-hover:opacity-100"
            title={isSaved ? "Saved in Watch Later" : "Save to Watch Later"}
          >
            {isSaved ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-white" />
            ) : (
              <Bookmark className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
            )}
          </button>
        </div>
      </Link>

      <div className="flex flex-col p-3.5 gap-2 flex-1 justify-between">
        <Link href={`/watch/${video.id}`}>
          <h3
            className="font-medium text-xs sm:text-[13px] text-neutral-100 line-clamp-2 leading-snug hover:text-white transition-colors"
            title={video.title}
          >
            {video.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/40">
          <Link
            href={`/channel/${encodeURIComponent(video.channelId || video.channelName)}`}
            className="flex items-center gap-2 overflow-hidden hover:text-white transition-colors group/ch"
            title={`View channel: ${video.channelName}`}
          >
            <div className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-300 shrink-0 select-none group-hover/ch:border-neutral-500">
              {video.channelName ? video.channelName[0].toUpperCase() : "R"}
            </div>
            <span className="truncate font-medium text-[11px] text-neutral-400 group-hover/ch:text-white">
              {video.channelName}
            </span>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-neutral-500 font-mono ml-2">
            {viewsStr && <span>{viewsStr}</span>}
            {viewsStr && video.uploadedDate && <span>·</span>}
            {video.uploadedDate && <span>{video.uploadedDate}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
