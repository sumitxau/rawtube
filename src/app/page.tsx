"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Search,
  RefreshCw,
  Plus,
  X,
  Radio,
  ArrowDownCircle,
  Shield,
  EyeOff,
  Settings2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useLibrary } from "@/hooks/use-library";
import { fetchChannelUploads, searchVideosPage, PIPED_INSTANCES } from "@/lib/api/client";
import { VideoCard } from "@/components/video/video-card";
import type { VideoMetadata } from "@/types/library";

// Handcrafted educational starter channels
const STARTER_CHANNELS = [
  { id: "UCYO_jab_esuFRV4b17AJtAw", name: "3Blue1Brown", handle: "@3blue1brown" },
  { id: "UCHnyfMqiRRG1u-2MsSQLbXA", name: "Veritasium", handle: "@veritasium" },
  { id: "UCsBjURrPoezykLs9EqgamOA", name: "Fireship", handle: "@fireship" },
  { id: "UC9-y-6csu5WGm29I7JiwpnA", name: "Computerphile", handle: "@computerphile" },
];

export default function HomePage() {
  const { markedChannels, markChannel, unmarkChannel, isReady, savedVideos } = useLibrary();

  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VideoMetadata[]>([]);
  const [searchNextPage, setSearchNextPage] = useState<string | undefined>(undefined);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | "all">("all");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Focus Mode: Vanishes the feed for zero distractions
  const [focusMode, setFocusMode] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);

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
    <div className="relative min-h-screen bg-[#0e0f12] text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white overflow-x-hidden">
      {/* Subtle Monochrome Ambient Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0e0f12]/90 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-6 lg:px-10 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand: Pure RAWTUBE Text */}
          <Link href="/" className="flex items-center shrink-0">
            <span className="font-black text-sm tracking-[0.25em] text-white hover:text-neutral-300 transition-colors uppercase select-none">
              RAWTUBE
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg relative">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels, videos or topics..."
                className="w-full pl-9 pr-14 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 text-white placeholder:text-neutral-500 transition-all font-normal"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-8 text-neutral-500 hover:text-white p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <span className="absolute right-2.5 text-[9px] font-mono text-neutral-500 bg-neutral-900 px-1 py-0.5 rounded border border-neutral-800 pointer-events-none">
                ↵
              </span>
            </div>
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Focus Mode (Vanish Feed) Toggle */}
            <Button
              variant={focusMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFocusMode(!focusMode)}
              className={`gap-1.5 text-xs rounded-lg h-8 px-2.5 font-medium transition-colors ${
                focusMode
                  ? "bg-neutral-800 text-white border border-neutral-700"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-950"
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{focusMode ? "Focus: ON" : "Focus"}</span>
            </Button>

            {/* Manage Channels Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChannelModal(true)}
              className="text-neutral-400 hover:text-white hover:bg-neutral-950 rounded-lg gap-1.5 text-xs h-8 px-2.5 font-medium"
              title="Subscriptions"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Channels ({markedChannels.length})</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadFeed}
              disabled={loading || markedChannels.length === 0}
              className="text-neutral-400 hover:text-white hover:bg-neutral-950 rounded-lg gap-1.5 text-xs h-8 px-2 font-medium"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-white" : ""}`} />
            </Button>

            <Link href="/watch-later">
              <Button
                variant="outline"
                size="sm"
                className="bg-neutral-950 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700 text-white rounded-lg gap-1.5 text-xs h-8 px-3 font-medium"
              >
                <Bookmark className="w-3 h-3 text-neutral-400" />
                <span>Saved</span>
                {savedVideos.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-neutral-900 text-neutral-300 rounded text-[10px] font-mono border border-neutral-800 font-semibold">
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
            className="mb-10 pb-8 border-b border-neutral-900"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-neutral-400" />
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Search: {searchQuery}
                </h2>
                <span className="text-xs text-neutral-500 font-mono">
                  ({searchResults.length})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchResults([]);
                  setSearchNextPage(undefined);
                }}
                className="text-neutral-400 hover:text-white text-xs h-7 px-2 font-medium"
              >
                Clear
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
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium bg-neutral-950 border border-neutral-800 px-4 py-2 rounded-lg">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Loading more...</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={loadMoreSearchResults}
                    className="gap-2 text-xs bg-neutral-950 border-neutral-800 hover:bg-neutral-900 text-white font-medium px-4 py-2 rounded-lg"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Load More</span>
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Focus Mode: Vanish the entire feed */}
        {focusMode ? (
          <div className="max-w-md mx-auto my-24 p-8 rounded-xl bg-neutral-950 border border-neutral-900 text-center">
            <h2 className="text-sm font-bold tracking-wider uppercase text-white mb-2">Focus Mode Active</h2>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Feed is vanished. Use the search bar above to look up specific videos or creators.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFocusMode(false)}
              className="bg-black border-neutral-800 hover:bg-neutral-900 text-white text-xs rounded-lg px-3 py-1.5"
            >
              Show Feed
            </Button>
          </div>
        ) : (
          /* Normal Feed Mode */
          markedChannels.length === 0 ? (
            /* Empty State: Clean Monochrome Channels */
            <div className="max-w-xl mx-auto my-14 p-6 sm:p-8 rounded-xl bg-neutral-950 border border-neutral-900 text-left">
              <div className="text-xs font-bold tracking-wider text-neutral-300 uppercase mb-1">
                Your Feed is Empty
              </div>
              <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                RawTube displays videos only from channels you choose. Add channels below or search above.
              </p>

              <div className="space-y-2 mb-6">
                {STARTER_CHANNELS.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-black border border-neutral-800/80 hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-white">
                        {ch.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">{ch.handle}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        markChannel({
                          channelId: ch.id,
                          channelTitle: ch.name,
                          markedAt: Date.now(),
                        })
                      }
                      className="h-7 px-2.5 text-xs bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white rounded-md gap-1"
                    >
                      <Plus className="w-3 h-3 text-neutral-400" />
                      <span>Add</span>
                    </Button>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-neutral-600 font-mono text-center">
                Search for any creator or topic using the top search bar
              </div>
            </div>
          ) : (
            /* Populated Chronological Feed */
            <div>
              {/* Channel Filter Pill Bar with 1-Click [✕] Remove Button */}
              <div className="flex items-center justify-between gap-4 mb-6 pb-2 border-b border-neutral-900 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedChannelId("all")}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors font-semibold ${
                      selectedChannelId === "all"
                        ? "bg-white text-black shadow-sm"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-950"
                    }`}
                  >
                    All ({videos.length})
                  </button>

                  {markedChannels.map((ch) => (
                    <div
                      key={ch.channelId}
                      className={`flex items-center gap-1.5 text-xs pl-2.5 pr-1.5 py-1 rounded-md transition-colors truncate max-w-[170px] ${
                        selectedChannelId === ch.channelId
                          ? "bg-white text-black font-semibold"
                          : "text-neutral-300 bg-neutral-950 border border-neutral-800"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedChannelId(ch.channelId)}
                        className="truncate text-left"
                        title={ch.channelTitle}
                      >
                        {ch.channelTitle}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          unmarkChannel(ch.channelId);
                          if (selectedChannelId === ch.channelId) setSelectedChannelId("all");
                        }}
                        title={`Remove ${ch.channelTitle}`}
                        className="p-0.5 rounded hover:bg-neutral-800 hover:text-white text-neutral-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-neutral-500 shrink-0 hidden md:flex items-center gap-1.5 font-mono">
                  <Radio className="w-3 h-3 text-neutral-400" />
                  <span>{PIPED_INSTANCES[0].replace("https://", "")}</span>
                </div>
              </div>

              {/* Video Cards Grid */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader size={100} />
                </div>
              ) : filteredVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredVideos.map((video, idx) => (
                    <div
                      key={video.id}
                      className="relative group block p-0.5"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <AnimatePresence>
                        {hoveredIndex === idx && (
                          <motion.span
                            className="absolute inset-0 h-full w-full bg-neutral-900/60 block rounded-xl -z-10"
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
                <div className="py-20 text-center text-neutral-500 text-xs">
                  No uploads found for selected channels.
                </div>
              )}
            </div>
          )
        )}
      </main>

      {/* Channel Management Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
              <h2 className="text-xs font-bold tracking-wider uppercase text-white">Subscriptions</h2>
              <button
                onClick={() => setShowChannelModal(false)}
                className="text-neutral-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {markedChannels.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center font-mono">No channels added yet.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                {markedChannels.map((ch) => (
                  <div
                    key={ch.channelId}
                    className="flex items-center justify-between p-3 rounded-lg bg-black border border-neutral-800/80"
                  >
                    <span className="font-medium text-xs text-white truncate mr-2">
                      {ch.channelTitle}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        unmarkChannel(ch.channelId);
                        if (selectedChannelId === ch.channelId) setSelectedChannelId("all");
                      }}
                      className="text-neutral-400 hover:text-white hover:bg-neutral-900 h-7 px-2 text-xs gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChannelModal(false)}
                className="text-xs bg-black border-neutral-800 text-white rounded-md px-3"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Minimalist Monochrome Footer */}
      <footer className="mt-auto border-t border-neutral-900 py-4 px-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <span>RAWTUBE · LOCAL-FIRST</span>
          <span>
            {markedChannels.length} Channels · {savedVideos.length} Saved
          </span>
        </div>
      </footer>
    </div>
  );
}
