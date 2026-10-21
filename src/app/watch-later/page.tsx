"use client";

import Link from "next/link";
import { ArrowLeft, Bookmark, Trash2, Play } from "lucide-react";
import { useLibrary } from "@/hooks/use-library";
import { Button } from "@/components/ui/button";

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

function formatDate(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function WatchLaterPage() {
  const { savedVideos, removeSavedVideo, isReady } = useLibrary();

  const handleClearAll = async () => {
    if (confirm("Remove all saved videos from your Watch Later list?")) {
      for (const v of savedVideos) {
        await removeSavedVideo(v.videoId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0f12] text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <header className="sticky top-0 z-40 bg-[#0e0f12]/90 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-6 lg:px-10 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Feed</span>
          </Link>

          <Link href="/" className="flex items-center">
            <span className="font-black text-sm tracking-[0.25em] text-white hover:text-neutral-300 transition-colors uppercase select-none">
              RAWTUBE
            </span>
          </Link>

          <div className="text-xs font-mono text-neutral-400 bg-[#16171b] border border-neutral-800 px-2.5 py-1 rounded-md">
            {savedVideos.length} Saved
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-white" />
              <h1 className="text-lg font-bold text-white tracking-tight">Watch Later</h1>
              <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                {savedVideos.length}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Private offline bookmarks stored directly in your browser.
            </p>
          </div>

          {savedVideos.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="h-8 text-xs bg-black border-neutral-800 hover:bg-neutral-900 hover:text-red-400 text-neutral-400 rounded-lg gap-1.5 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </Button>
            </div>
          )}
        </div>

        {!isReady ? (
          <div className="py-20 text-center text-xs text-neutral-500 font-mono">Loading saved library...</div>
        ) : savedVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {savedVideos.map((video) => {
              const dur = formatDuration(video.duration);
              return (
                <div
                  key={video.videoId}
                  className="group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all duration-200"
                >
                  <Link href={`/watch/${video.videoId}`} className="block relative aspect-video bg-neutral-950 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />

                    {dur && (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        {dur}
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-col p-3.5 gap-2 flex-1 justify-between">
                    <div>
                      <Link href={`/watch/${video.videoId}`}>
                        <h3 className="font-medium text-sm text-neutral-100 line-clamp-2 leading-snug hover:text-white transition-colors" title={video.title}>
                          {video.title}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between text-xs text-neutral-400 mt-1 font-medium">
                        <span className="truncate">{video.channelTitle}</span>
                        {video.savedAt && (
                          <span className="shrink-0 text-[11px] text-neutral-500 font-mono">
                            {formatDate(video.savedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                      <Link
                        href={`/watch/${video.videoId}`}
                        className="text-[11px] font-medium text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        <span>Watch</span>
                      </Link>
                      <button
                        onClick={() => removeSavedVideo(video.videoId)}
                        className="text-[11px] font-medium text-neutral-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-md mx-auto my-20 p-8 rounded-xl bg-[#16171b] border border-neutral-800 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4 text-neutral-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-white mb-1">
              Your Watch Later list is empty
            </h2>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Click the bookmark icon on any video thumbnail in the feed to save it for later viewing.
            </p>
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="bg-black border-neutral-800 hover:bg-neutral-900 text-white text-xs rounded-lg px-4 py-2"
              >
                Browse Tech Feed
              </Button>
            </Link>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-neutral-800/60 py-4 px-6 text-center text-xs text-neutral-500 bg-[#0e0f12]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <span>RAWTUBE · LOCAL-FIRST STORAGE</span>
          <span>{savedVideos.length} Saved Items</span>
        </div>
      </footer>
    </div>
  );
}
