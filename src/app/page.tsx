"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tv2,
  Bookmark,
  Search,
  RefreshCw,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  X,
  Radio,
  ArrowDownCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useLibrary } from "@/hooks/use-library";
import { fetchChannelUploads, searchVideosPage, PIPED_INSTANCES } from "@/lib/api/client";
import { VideoCard } from "@/components/video/video-card";
import type { VideoMetadata } from "@/types/library";

// Handcrafted educational starter channels for 1-click onboarding
const STARTER_CHANNELS = [
  { id: "UCYO_jab_esuFRV4b17AJtAw", name: "3Blue1Brown", handle: "@3blue1brown" },
  { id: "UCHnyfMqiRRG1u-2MsSQLbXA", name: "Veritasium", handle: "@veritasium" },
  { id: "UCsBjURrPoezykLs9EqgamOA", name: "Fireship", handle: "@fireship" },
  { id: "UC9-y-6csu5WGm29I7JiwpnA", name: "Computerphile", handle: "@computerphile" },
];

export default function HomePage() {
  const { markedChannels, markChannel, isReady, savedVideos } = useLibrary();

  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VideoMetadata[]>([]);
  const [searchNextPage, setSearchNextPage] = useState<string | undefined>(undefined);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | "all">("all");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch recent uploads concurrently across all marked channels
  const loadFeed = async () => {
    if (markedChannels.length === 0) {
      setVideos([]);
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.allSettled(
        markedChannels.map((ch) => fetchChannelUploads(ch.channelId))
      );

      const allVideos: VideoMetadata[] = [];
      for (const res of results) {
        if (res.status === "fulfilled") {
          allVideos.push(...res.value);
        }
      }

      setVideos(allVideos);
    } catch (err) {
      console.error("Feed error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady && markedChannels.length > 0) {
      loadFeed();
    }
  }, [isReady, markedChannels.length]);

  // 2. Direct Search via Piped with Endless Pagination
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults([]);
    setSearchNextPage(undefined);

    try {
      const result = await searchVideosPage(searchQuery.trim());
      setSearchResults(result.videos);
      setSearchNextPage(result.nextpage);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  // 3. Load More Search Results (Endless Scrolling)
  const loadMoreSearchResults = useCallback(async () => {
    if (!searchNextPage || loadingMore || searching) return;

    setLoadingMore(true);
    try {
      const result = await searchVideosPage(searchQuery.trim(), searchNextPage);
      setSearchResults((prev) => [...prev, ...result.videos]);
      setSearchNextPage(result.nextpage);
    } catch (err) {
      console.error("Load more search failed:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [searchNextPage, loadingMore, searching, searchQuery]);

  // Auto-fetch next page as user scrolls near bottom
  useEffect(() => {
    if (!loadMoreTriggerRef.current) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && searchNextPage && !loadingMore) {
          loadMoreSearchResults();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreTriggerRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [searchNextPage, loadingMore, loadMoreSearchResults]);

  // Filter feed by currently selected channel pill
  const filteredVideos = useMemo(() => {
    if (selectedChannelId === "all") return videos;
    return videos.filter((v) => v.channelId === selectedChannelId);
  }, [videos, selectedChannelId]);

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white overflow-x-hidden">
      {/* Aceternity-inspired Ambient Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-red-600/[0.08] via-neutral-900/[0.02] to-transparent blur-3xl opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-800/90 px-4 sm:px-6 lg:px-10 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-700/80 flex items-center justify-center text-red-500 shadow-inner group-hover:border-red-500/50 transition-colors">
              <Tv2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-white group-hover:text-white transition-colors">
              RawTube
            </span>
          </Link>

          {/* Aceternity Smooth Search Input */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos, channels, or topics..."
                className="w-full pl-10 pr-16 py-2 text-sm rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-500 text-white placeholder:text-neutral-400 transition-all shadow-sm font-normal"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-9 text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="absolute right-3 text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700 pointer-events-none">
                ↵
              </span>
            </div>
          </form>

          {/* Action Buttons using shadcn Button */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadFeed}
              disabled={loading || markedChannels.length === 0}
              className="text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-xl gap-1.5 text-xs h-8 px-2.5 font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Link href="/watch-later">
              <Button
                variant="outline"
                size="sm"
                className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-white rounded-xl gap-2 text-xs h-8 px-3 shadow-sm font-medium"
              >
                <Bookmark className="w-3.5 h-3.5 text-neutral-300" />
                <span>Watch Later</span>
                {savedVideos.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-neutral-800 text-white rounded text-[11px] font-mono border border-neutral-700 font-semibold">
                    {savedVideos.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        
        {/* Search Results Display with Endless Scrolling */}
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 pb-8 border-b border-neutral-800/80"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">
                  Search Results for &ldquo;{searchQuery}&rdquo;
                </h2>
                <span className="text-xs text-neutral-300 font-medium">
                  ({searchResults.length} videos loaded)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchResults([]);
                  setSearchNextPage(undefined);
                }}
                className="text-neutral-300 hover:text-white text-xs h-7 px-2.5 font-medium"
              >
                Clear Search
              </Button>
            </div>

            {/* Video Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {/* Infinite Scroll Trigger & Indicator */}
            {searchNextPage && (
              <div
                ref={loadMoreTriggerRef}
                className="flex items-center justify-center py-10 mt-6"
              >
                {loadingMore ? (
                  <div className="flex items-center gap-2 text-sm text-neutral-300 font-medium bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Loading more videos...</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={loadMoreSearchResults}
                    className="gap-2 text-xs bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white font-medium px-4 py-2 rounded-xl"
                  >
                    <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                    <span>Load More Videos</span>
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Normal Feed Mode */}
        {markedChannels.length === 0 ? (
          /* Empty State: Sleek, non-AI onboarding card */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto my-12 p-8 sm:p-10 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-md text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-12 h-12 mx-auto rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 mb-5 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2.5">
              Distraction-Free Video Feed
            </h1>
            <p className="text-sm text-neutral-300 max-w-md mx-auto leading-relaxed mb-8 font-normal">
              RawTube respects your attention. No algorithmic rabbit holes, no Shorts, and no tracking. You choose exactly which channels appear here.
            </p>

            <div className="text-left bg-neutral-950 border border-neutral-800/90 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Quick-add recommended channels:
                </span>
                <span className="text-[11px] text-neutral-400 font-mono font-medium">100% Local</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STARTER_CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() =>
                      markChannel({
                        channelId: ch.id,
                        channelTitle: ch.name,
                        markedAt: Date.now(),
                      })
                    }
                    className="group/item flex items-center justify-between p-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition-all text-left"
                  >
                    <div>
                      <div className="font-semibold text-xs text-neutral-100 group-hover/item:text-white">
                        {ch.name}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">{ch.handle}</div>
                    </div>
                    <PlusCircle className="w-4 h-4 text-neutral-400 group-hover/item:text-emerald-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-neutral-400 flex items-center justify-center gap-1.5 font-medium">
              <span>Looking for someone else? Type their name or topic in the search bar above</span>
            </div>
          </motion.div>
        ) : (
          /* Populated Chronological Feed */
          <div>
            {/* Channel Filter Pill Bar */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-2 border-b border-neutral-800 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedChannelId("all")}
                  className={`text-xs px-3.5 py-1.5 rounded-lg transition-colors font-semibold ${
                    selectedChannelId === "all"
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-900"
                  }`}
                >
                  All Channels ({videos.length})
                </button>

                {markedChannels.map((ch) => (
                  <button
                    key={ch.channelId}
                    onClick={() => setSelectedChannelId(ch.channelId)}
                    className={`text-xs px-3.5 py-1.5 rounded-lg transition-colors truncate max-w-[150px] font-medium ${
                      selectedChannelId === ch.channelId
                        ? "bg-white text-neutral-950 shadow-sm font-semibold"
                        : "text-neutral-300 hover:text-white hover:bg-neutral-900"
                    }`}
                    title={ch.channelTitle}
                  >
                    {ch.channelTitle}
                  </button>
                ))}
              </div>

              <div className="text-xs text-neutral-400 shrink-0 hidden md:flex items-center gap-2 font-medium">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Piped Proxy:</span>
                <span className="font-mono text-[11px] text-neutral-300">
                  {PIPED_INSTANCES[0].replace("https://", "")}
                </span>
              </div>
            </div>

            {/* Video Cards Grid with Aceternity Card Hover Backdrop */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader size={110} />
              </div>
            ) : filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredVideos.map((video, idx) => (
                  <div
                    key={video.id}
                    className="relative group block p-1"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Aceternity layoutId Hover Gradient Glow */}
                    <AnimatePresence>
                      {hoveredIndex === idx && (
                        <motion.span
                          className="absolute inset-0 h-full w-full bg-neutral-800/50 block rounded-2xl -z-10"
                          layoutId="hoverBackground"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, transition: { duration: 0.15 } }}
                          exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.05 } }}
                        />
                      )}
                    </AnimatePresence>

                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-400 text-xs font-medium">
                No videos available for this selection.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Minimalist Local-First Footer */}
      <footer className="mt-auto border-t border-neutral-800 py-4 px-6 text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-neutral-300 font-medium">RawTube — 100% Client-side · Private · No Tracking</span>
          <span className="font-mono text-[11px] text-neutral-400">
            Storage: IndexedDB ({markedChannels.length} channels, {savedVideos.length} bookmarks)
          </span>
        </div>
      </footer>
    </div>
  );
}
