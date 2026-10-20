"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Search,
  RefreshCw,
  Plus,
  Check,
  X,
  Radio,
  ArrowDownCircle,
  EyeOff,
  Settings2,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useLibrary } from "@/hooks/use-library";
import { fetchChannelUploads, searchVideosPage, PIPED_INSTANCES } from "@/lib/api/client";
import { VideoCard } from "@/components/video/video-card";
import {
  DIRECTORY_CATEGORIES,
  getChannelsByCategory,
  type DirectoryCategory,
  type CuratedChannel,
} from "@/lib/directory/channels";
import type { VideoMetadata } from "@/types/library";

export default function HomePage() {
  const { markedChannels, markChannel, unmarkChannel, isReady, savedVideos } = useLibrary();

  // Active category: defaults to "ai-research" or "all" so visitors NEVER see an empty dead screen
  const [activeTab, setActiveTab] = useState<string>("ai-research");
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VideoMetadata[]>([]);
  const [searchNextPage, setSearchNextPage] = useState<string | undefined>(undefined);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Focus Mode & Modals
  const [focusMode, setFocusMode] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // Get curated channels for currently selected category
  const categoryChannels = useMemo(() => {
    return getChannelsByCategory(activeTab);
  }, [activeTab]);

  // Load feed based on active tab
  const loadCategoryFeed = useCallback(async () => {
    setLoading(true);
    setVideos([]);

    try {
      if (activeTab === "my-feed") {
        if (markedChannels.length === 0) {
          setVideos([]);
          setLoading(false);
          return;
        }

        const results = await Promise.allSettled(
          markedChannels.map((ch) => fetchChannelUploads(ch.channelId))
        );

        const all: VideoMetadata[] = [];
        for (const res of results) {
          if (res.status === "fulfilled") all.push(...res.value);
        }
        setVideos(all);
      } else {
        // Fetch from the top curated channels in this category
        const channelsToFetch = categoryChannels.slice(0, 5);
        const results = await Promise.allSettled(
          channelsToFetch.map((ch) => fetchChannelUploads(ch.id))
        );

        const all: VideoMetadata[] = [];
        for (const res of results) {
          if (res.status === "fulfilled") all.push(...res.value);
        }

        // If specific channel API was slow, supplement with category search query
        if (all.length < 6) {
          const cat = DIRECTORY_CATEGORIES.find((c) => c.id === activeTab);
          if (cat) {
            const searchFallback = await searchVideosPage(cat.seedQuery);
            all.push(...searchFallback.videos);
          }
        }

        // Deduplicate videos by ID
        const seen = new Set<string>();
        const unique = all.filter((v) => {
          if (seen.has(v.id)) return false;
          seen.add(v.id);
          return true;
        });

        setVideos(unique);
      }
    } catch (err) {
      console.error("Feed error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, markedChannels, categoryChannels]);

  useEffect(() => {
    if (isReady) {
      loadCategoryFeed();
    }
  }, [isReady, activeTab, loadCategoryFeed]);

  // Direct Search
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

  // Load More Search Results (Endless Scrolling)
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

  // Auto-fetch on scroll
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

  // Bulk follow all channels in the current category
  const handleFollowCategory = async () => {
    for (const ch of categoryChannels) {
      await markChannel({
        channelId: ch.id,
        channelTitle: ch.name,
        markedAt: Date.now(),
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0e0f12] text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white overflow-x-hidden">
      {/* Subtle Monochrome Grid */}
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
                placeholder="Search tech channels, research papers, topics..."
                className="w-full pl-9 pr-14 py-2 text-xs rounded-lg bg-[#16171b] border border-neutral-800 focus:outline-none focus:border-neutral-500 text-white placeholder:text-neutral-500 transition-all font-normal"
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
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
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
              className="text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg gap-1.5 text-xs h-8 px-2.5 font-medium"
              title="My Subscriptions"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Subscriptions ({markedChannels.length})</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadCategoryFeed}
              disabled={loading}
              className="text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg gap-1.5 text-xs h-8 px-2 font-medium"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-white" : ""}`} />
            </Button>

            <Link href="/watch-later">
              <Button
                variant="outline"
                size="sm"
                className="bg-[#16171b] border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-white rounded-lg gap-1.5 text-xs h-8 px-3 font-medium"
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
        
        {/* Search Results Display */}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {searchNextPage && (
              <div ref={loadMoreTriggerRef} className="flex items-center justify-center py-10 mt-6">
                {loadingMore ? (
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium bg-[#16171b] border border-neutral-800 px-4 py-2 rounded-lg">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Loading more...</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={loadMoreSearchResults}
                    className="gap-2 text-xs bg-[#16171b] border-neutral-800 hover:bg-neutral-800 text-white font-medium px-4 py-2 rounded-lg"
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
          <div className="max-w-md mx-auto my-24 p-8 rounded-xl bg-[#16171b] border border-neutral-800 text-center">
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
          /* Normal Active Feed: Never Dead! */
          <div>
            {/* Category Navigation Bar */}
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-neutral-800/80 overflow-x-auto no-scrollbar">
              {/* My Personal Feed Tab */}
              <button
                onClick={() => setActiveTab("my-feed")}
                className={`text-xs px-3.5 py-1.5 rounded-md transition-colors font-semibold shrink-0 ${
                  activeTab === "my-feed"
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-400 hover:text-white bg-[#16171b] border border-neutral-800/80"
                }`}
              >
                My Feed ({markedChannels.length})
              </button>

              {/* Curated Category Tabs */}
              {DIRECTORY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium shrink-0 ${
                    activeTab === cat.id
                      ? "bg-white text-black shadow-sm font-semibold"
                      : "text-neutral-400 hover:text-white hover:bg-[#16171b]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Category Header & Follow Controls */}
            {activeTab !== "my-feed" && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#16171b] border border-neutral-800/80">
                <div>
                  <h1 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                    {DIRECTORY_CATEGORIES.find((c) => c.id === activeTab)?.label}
                  </h1>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {DIRECTORY_CATEGORIES.find((c) => c.id === activeTab)?.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFollowCategory}
                    className="h-7 text-xs bg-black border-neutral-800 hover:bg-neutral-900 text-white rounded-md gap-1 font-medium"
                    title="Add all channels in this category to your subscriptions"
                  >
                    <Plus className="w-3 h-3 text-neutral-400" />
                    <span>Follow All ({categoryChannels.length})</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Video Cards Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader size={100} />
              </div>
            ) : videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video, idx) => (
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
              /* Empty state only if My Feed is truly empty */
              <div className="py-20 text-center text-neutral-500 text-xs max-w-sm mx-auto">
                {activeTab === "my-feed" ? (
                  <div>
                    <p className="text-sm font-semibold text-neutral-300 mb-1">Your Personal Feed is Empty</p>
                    <p className="text-xs text-neutral-500 mb-4">
                      Explore the categories above like AI Research, Web3 or Robotics, and click Follow on creators!
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("ai-research")}
                      className="text-xs bg-[#16171b] border-neutral-800 text-white"
                    >
                      Browse AI Research
                    </Button>
                  </div>
                ) : (
                  <p>No recent uploads found. Refresh or try another category.</p>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Subscriptions Management Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#16171b] border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
              <h2 className="text-xs font-bold tracking-wider uppercase text-white font-mono">My Subscriptions</h2>
              <button
                onClick={() => setShowChannelModal(false)}
                className="text-neutral-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {markedChannels.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center font-mono">No channels subscribed yet.</p>
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
                      onClick={() => unmarkChannel(ch.channelId)}
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
      <footer className="mt-auto border-t border-neutral-800/60 py-4 px-6 text-center text-xs text-neutral-500 bg-[#0e0f12]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <span>RAWTUBE · LOCAL-FIRST INTELLIGENCE</span>
          <span>
            {markedChannels.length} Channels Followed · {savedVideos.length} Saved
          </span>
        </div>
      </footer>
    </div>
  );
}
