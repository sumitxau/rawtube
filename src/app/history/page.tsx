"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Trash2, Play, Search, X } from "lucide-react";
import { useLibrary } from "@/hooks/use-library";
import { Button } from "@/components/ui/button";

function formatSeconds(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function HistoryPage() {
  const { watchedVideos, removeWatchedVideo, clearWatchedHistory, savedVideos, isReady } = useLibrary();
  const [filterQuery, setFilterQuery] = useState("");

  const filteredHistory = useMemo(() => {
    if (!filterQuery.trim()) return watchedVideos;
    const q = filterQuery.toLowerCase();
    return watchedVideos.filter((v) => {
      const matchTitle = (v.title || "").toLowerCase().includes(q);
      const matchChannel = (v.channelTitle || "").toLowerCase().includes(q);
      return matchTitle || matchChannel;
    });
  }, [watchedVideos, filterQuery]);

  const handleClear = async () => {
    if (confirm("Clear all watch history from this device?")) {
      await clearWatchedHistory();
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

          <div className="flex items-center gap-2">
            <Link href="/watch-later">
              <Button
                variant="outline"
                size="sm"
                className="bg-[#16171b] border-neutral-800 hover:bg-neutral-800 text-white rounded-lg gap-1.5 text-xs h-8 px-3 font-medium"
              >
                <span>Saved ({savedVideos.length})</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white" />
              <h1 className="text-lg font-bold text-white tracking-tight">Watch History</h1>
              <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                {watchedVideos.length}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Private playback history tracked strictly on this device.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter history..."
                className="pl-8 pr-7 py-1.5 text-xs rounded-lg bg-[#16171b] border border-neutral-800 focus:outline-none focus:border-neutral-500 text-white placeholder:text-neutral-600 font-normal w-44 sm:w-56"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery("")}
                  className="absolute right-2 text-neutral-500 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {watchedVideos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="h-8 text-xs bg-black border-neutral-800 hover:bg-neutral-900 hover:text-red-400 text-neutral-400 rounded-lg gap-1.5 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </Button>
            )}
          </div>
        </div>

        {!isReady ? (
          <div className="py-20 text-center text-xs text-neutral-500 font-mono">Loading history...</div>
        ) : filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredHistory.map((item) => {
              const hasProgress = (item.progressSeconds || 0) > 0;
              const percent = item.durationSeconds && item.durationSeconds > 0
                ? Math.min(Math.round(((item.progressSeconds || 0) / item.durationSeconds) * 100), 100)
                : 0;

              return (
                <div
                  key={item.videoId}
                  className="group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all duration-200"
                >
                  <Link href={`/watch/${item.videoId}`} className="block relative aspect-video bg-neutral-950 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`}
                      alt={item.title || "Video"}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes("mqdefault")) {
                          target.src = `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`;
                        }
                      }}
                    />

                    {percent > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800 overflow-hidden">
                        <div className="h-full bg-white" style={{ width: `${percent}%` }} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-col p-3.5 gap-2 flex-1 justify-between">
                    <div>
                      <Link href={`/watch/${item.videoId}`}>
                        <h3 className="font-medium text-sm text-neutral-100 line-clamp-2 leading-snug hover:text-white transition-colors" title={item.title || item.videoId}>
                          {item.title || "Watched Video"}
                        </h3>
                      </Link>

                      <div className="flex items-center justify-between text-xs text-neutral-400 mt-1 font-medium">
                        {item.channelTitle ? (
                          <Link
                            href={`/channel/${encodeURIComponent(item.channelId || item.channelTitle)}`}
                            className="truncate hover:text-white transition-colors"
                          >
                            {item.channelTitle}
                          </Link>
                        ) : (
                          <span className="truncate">Unknown Creator</span>
                        )}
                        <span className="shrink-0 text-[11px] text-neutral-500 font-mono">
                          {formatDate(item.watchedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 font-mono">
                        {hasProgress ? `At ${formatSeconds(item.progressSeconds)}` : "Watched"}
                      </span>

                      <button
                        onClick={() => removeWatchedVideo(item.videoId)}
                        className="text-neutral-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                        title="Delete from history"
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
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-white mb-1">
              No Watch History
            </h2>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Videos you watch will appear here with your playback resume points.
            </p>
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-black border-neutral-800 text-white text-xs">
                Browse Feed
              </Button>
            </Link>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-neutral-800/60 py-4 px-6 text-center text-xs text-neutral-500 bg-[#0e0f12]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <span>RAWTUBE · LOCAL PLAYBACK HISTORY</span>
          <span>{watchedVideos.length} Watched Sessions</span>
        </div>
      </footer>
    </div>
  );
}
