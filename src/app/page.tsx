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
  ArrowDownCircle,
  EyeOff,
  Settings2,
  Shuffle,
  Zap,
  RotateCcw,
  Clock,
  Keyboard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useLibrary } from "@/hooks/use-library";
import { searchVideosPage } from "@/lib/api/client";
import { VideoCard } from "@/components/video/video-card";
import {
  DIRECTORY_CATEGORIES,
  getChannelsByCategory,
  interleaveAndShuffle,
  shuffleVideos,
} from "@/lib/directory/channels";
import {
  getRecommendedChannelsForMyFeed,
  getWatchStatsSummary,
  type WatchStatsSummary,
} from "@/lib/recommendation/engine";
import type { VideoMetadata } from "@/types/library";

export default function HomePage() {
  const {
    markedChannels,
    markChannel,
    unmarkChannel,
    isReady,
    savedVideos,
    watchedVideos,
    preferences,
    removeChannelPreference,
    clearAllLocalData,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [shuffling, setShuffling] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VideoMetadata[]>([]);
  const [searchNextPage, setSearchNextPage] = useState<string | undefined>(undefined);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [focusMode, setFocusMode] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savedApiKey, setSavedApiKey] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("rawtube_yt_api_key");
      if (stored) {
        queueMicrotask(() => {
          setApiKeyInput(stored);
        });
      }
    }
  }, []);

  const handleSaveApiKey = () => {
    if (typeof window !== "undefined") {
      if (apiKeyInput.trim()) {
        localStorage.setItem("rawtube_yt_api_key", apiKeyInput.trim());
      } else {
        localStorage.removeItem("rawtube_yt_api_key");
      }
      setSavedApiKey(true);
      setTimeout(() => setSavedApiKey(false), 2000);
      loadCategoryFeed();
    }
  };

  const watchStats: WatchStatsSummary = useMemo(() => {
    return getWatchStatsSummary(watchedVideos, preferences);
  }, [watchedVideos, preferences]);

  const notInterestedSet = useMemo(() => {
    const s = new Set<string>();
    for (const p of preferences) {
      if (p.preference === "not_interested") {
        if (p.channelId) s.add(p.channelId);
        if (p.channelTitle) s.add(p.channelTitle.toLowerCase());
      }
    }
    return s;
  }, [preferences]);

  const categoryChannels = useMemo(() => {
    return getChannelsByCategory(activeTab);
  }, [activeTab]);

  const loadCategoryFeed = useCallback(async () => {
    setLoading(true);
    setVideos([]);

    try {
      if (activeTab === "my-feed") {
        const rec = getRecommendedChannelsForMyFeed(watchedVideos, markedChannels, preferences);
        const topChannels = rec.channels.slice(0, 4);

        const queries = topChannels.length > 0
          ? topChannels.map((c) => `${c.name} engineering`)
          : ["harkirat full stack web3", "solidity rust chai aur code piyush garg"];

        const results = await Promise.allSettled(queries.map((q) => searchVideosPage(q)));
        const all: VideoMetadata[] = [];
        for (const res of results) {
          if (res.status === "fulfilled") all.push(...res.value.videos);
        }

        const seen = new Set<string>();
        const unique = all.filter((v) => {
          if (seen.has(v.id)) return false;
          if (notInterestedSet.has(v.channelId) || notInterestedSet.has(v.channelName.toLowerCase())) return false;
          seen.add(v.id);
          return true;
        });

        setVideos(interleaveAndShuffle(unique));
      } else if (activeTab === "all") {
        const [indiaRes, web3Res] = await Promise.allSettled([
          searchVideosPage("harkirat chai aur code piyush garg akshay saini striver kunal kushwaha"),
          searchVideosPage("solidity rust smart contract security primeagen fireship theo t3"),
        ]);

        const all: VideoMetadata[] = [];
        if (indiaRes.status === "fulfilled") all.push(...indiaRes.value.videos);
        if (web3Res.status === "fulfilled") all.push(...web3Res.value.videos);

        const seen = new Set<string>();
        const unique = all.filter((v) => {
          if (seen.has(v.id)) return false;
          if (notInterestedSet.has(v.channelId) || notInterestedSet.has(v.channelName.toLowerCase())) return false;
          seen.add(v.id);
          return true;
        });

        setVideos(interleaveAndShuffle(unique));
      } else {
        const cat = DIRECTORY_CATEGORIES.find((c) => c.id === activeTab);
        const query = cat ? cat.seedQuery : "technology software engineering";
        const result = await searchVideosPage(query);

        const seen = new Set<string>();
        const unique = result.videos.filter((v) => {
          if (seen.has(v.id)) return false;
          if (notInterestedSet.has(v.channelId) || notInterestedSet.has(v.channelName.toLowerCase())) return false;
          seen.add(v.id);
          return true;
        });

        setVideos(interleaveAndShuffle(unique));
      }
    } catch (err) {
      console.error("Feed error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, markedChannels, watchedVideos, preferences, notInterestedSet]);

  useEffect(() => {
    if (isReady) {
      loadCategoryFeed();
    }
  }, [isReady, activeTab, loadCategoryFeed]);

  const handleShuffle = useCallback(() => {
    setShuffling(true);
    setVideos((prev) => interleaveAndShuffle(shuffleVideos(prev)));
    setTimeout(() => setShuffling(false), 300);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl && (activeEl as HTMLElement).isContentEditable);

      if (e.key === "Escape") {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          return;
        }
        if (showChannelModal) {
          setShowChannelModal(false);
          return;
        }
        if (isInput) {
          (activeEl as HTMLElement).blur();
          return;
        }
        if (searchQuery) {
          setSearchQuery("");
          setSearchResults([]);
          setSearchNextPage(undefined);
          return;
        }
      }

      if (isInput) return;

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleShuffle();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      } else if (e.key === "?") {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcutsModal, showChannelModal, searchQuery, handleShuffle]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults([]);
    setSearchNextPage(undefined);

    try {
      const result = await searchVideosPage(searchQuery.trim());
      setSearchResults(
        result.videos.filter(
          (v) => !notInterestedSet.has(v.channelId) && !notInterestedSet.has(v.channelName.toLowerCase())
        )
      );
      setSearchNextPage(result.nextpage);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const loadMoreSearchResults = useCallback(async () => {
    if (!searchNextPage || loadingMore || searching) return;

    setLoadingMore(true);
    try {
      const result = await searchVideosPage(searchQuery.trim(), searchNextPage);
      const filtered = result.videos.filter(
        (v) => !notInterestedSet.has(v.channelId) && !notInterestedSet.has(v.channelName.toLowerCase())
      );
      setSearchResults((prev) => [...prev, ...filtered]);
      setSearchNextPage(result.nextpage);
    } catch (err) {
      console.error("Load more search failed:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [searchNextPage, loadingMore, searching, searchQuery, notInterestedSet]);

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

  const handleFollowCategory = async () => {
    for (const ch of categoryChannels) {
      await markChannel({
        channelId: ch.id,
        channelTitle: ch.name,
        markedAt: Date.now(),
      });
    }
  };

  const hiddenChannelsList = useMemo(() => {
    return preferences.filter((p) => p.preference === "not_interested");
  }, [preferences]);

  return (
    <div className="relative min-h-screen bg-[#0e0f12] text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <header className="sticky top-0 z-40 bg-[#0e0f12]/90 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-6 lg:px-10 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
              setSearchNextPage(undefined);
              setActiveTab("all");
              setFocusMode(false);
            }}
            className="flex items-center shrink-0 group cursor-pointer"
            title="Reset to Home Feed"
          >
            <span className="font-black text-sm tracking-[0.25em] text-white group-hover:text-neutral-300 transition-colors uppercase select-none">
              RAWTUBE
            </span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-lg relative">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tech channels, research papers, topics... (/ to focus)"
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
                /
              </span>
            </div>
          </form>

          <div className="flex items-center gap-1.5">
            <Button
              variant={focusMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFocusMode(!focusMode)}
              className={`gap-1.5 text-xs rounded-lg h-8 px-2.5 font-medium transition-colors ${
                focusMode
                  ? "bg-neutral-800 text-white border border-neutral-700"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
              title="Toggle Focus Mode (F)"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{focusMode ? "Focus: ON" : "Focus"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChannelModal(true)}
              className="text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg gap-1.5 text-xs h-8 px-2.5 font-medium"
              title="Subscriptions & Preferences"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Settings</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShuffle}
              disabled={loading || videos.length === 0}
              className="text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg gap-1.5 text-xs h-8 px-2 font-medium"
              title="Shuffle (S)"
            >
              <Shuffle className={`w-3.5 h-3.5 ${shuffling ? "animate-spin text-white" : ""}`} />
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

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcutsModal(true)}
              className="text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg gap-1.5 text-xs h-8 px-2 font-medium"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </Button>

            <Link href="/history">
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg gap-1.5 text-xs h-8 px-2.5 font-medium"
                title="Watch History"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">History</span>
                {watchedVideos.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-neutral-900 text-neutral-400 rounded text-[10px] font-mono border border-neutral-800">
                    {watchedVideos.length}
                  </span>
                )}
              </Button>
            </Link>

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

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
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
          <div>
            <div className="relative flex items-center gap-1.5 mb-6 pb-2 border-b border-neutral-800/80 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("my-feed")}
                className={`relative text-xs px-3.5 py-1.5 rounded-md transition-colors font-medium shrink-0 ${
                  activeTab === "my-feed"
                    ? "text-black font-semibold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {activeTab === "my-feed" && (
                  <motion.span
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-white rounded-md -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span>My Feed</span>
                {markedChannels.length > 0 && (
                  <span className="ml-1 text-[10px] opacity-80">({markedChannels.length})</span>
                )}
              </button>

              {DIRECTORY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`relative text-xs px-3 py-1.5 rounded-md transition-colors font-medium shrink-0 ${
                    activeTab === cat.id
                      ? "text-black font-semibold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {activeTab === cat.id && (
                    <motion.span
                      layoutId="activeCategoryPill"
                      className="absolute inset-0 bg-white rounded-md -z-10 shadow-sm"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {activeTab === "my-feed" ? (
              <div className="mb-6 p-4 sm:p-5 rounded-xl bg-[#16171b] border border-neutral-800/80 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-white" />
                      <h1 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                        My Personal Feed
                      </h1>
                      <span className="text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                        100% On-Device
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      {watchStats.isColdStart
                        ? "Seeded with Web3 & authentic Indian engineering creators. Automatically tunes as you watch and mark interested."
                        : `Tuned by ${watchStats.totalVideosWatched} watched videos (${watchStats.totalMinutesWatched} min) · ${watchStats.interestedCount} boosted · ${watchStats.hiddenCount} hidden.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShuffle}
                      disabled={loading || videos.length === 0}
                      className="h-7 text-xs bg-black border-neutral-800 hover:bg-neutral-900 text-white rounded-md gap-1.5 font-medium"
                      title="Shuffle"
                    >
                      <Shuffle className={`w-3 h-3 ${shuffling ? "animate-spin text-white" : ""}`} />
                      <span>Shuffle</span>
                    </Button>
                  </div>
                </div>

                {watchStats.topCreators.length > 0 && (
                  <div className="pt-2 border-t border-neutral-800/60 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-neutral-500 font-mono text-[11px]">Top Affinities:</span>
                    {watchStats.topCreators.map((creator) => (
                      <Link
                        key={creator.name}
                        href={`/channel/${encodeURIComponent(creator.name)}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors text-[11px] font-medium"
                        title={`Open channel: ${creator.name}`}
                      >
                        <span>{creator.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {creator.minutes}m
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
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
                    onClick={handleShuffle}
                    disabled={loading || videos.length === 0}
                    className="h-7 text-xs bg-black border-neutral-800 hover:bg-neutral-900 text-white rounded-md gap-1.5 font-medium"
                    title="Shuffle"
                  >
                    <Shuffle className={`w-3 h-3 ${shuffling ? "animate-spin text-white" : ""}`} />
                    <span>Shuffle</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFollowCategory}
                    className="h-7 text-xs bg-black border-neutral-800 hover:bg-neutral-900 text-white rounded-md gap-1 font-medium"
                    title="Follow"
                  >
                    <Plus className="w-3 h-3 text-neutral-400" />
                    <span>Follow All ({categoryChannels.length})</span>
                  </Button>
                </div>
              </div>
            )}

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

                    <VideoCard
                      video={video}
                      onHide={(hiddenId) => {
                        setVideos((prev) => prev.filter((v) => v.channelId !== hiddenId && v.channelName !== hiddenId));
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-500 text-xs max-w-sm mx-auto">
                <p>No recent uploads found. Refresh or try another category.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#16171b] border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
              <h2 className="text-xs font-bold tracking-wider uppercase text-white font-mono">
                Settings & Preferences
              </h2>
              <button
                onClick={() => setShowChannelModal(false)}
                className="text-neutral-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-5 pb-4 border-b border-neutral-800">
              <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                Optional YouTube Data API v3 Key (Ultra-Fast 50ms)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 bg-black border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveApiKey}
                  className="h-8 text-xs bg-black border-neutral-800 hover:bg-neutral-900 text-white rounded-md px-3"
                >
                  {savedApiKey ? "Saved" : "Save"}
                </Button>
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Leave blank to use decentralized Piped proxy. Stored strictly in your browser.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-xs font-mono text-neutral-400 mb-2">
                Subscribed Channels ({markedChannels.length})
              </h3>
              {markedChannels.length === 0 ? (
                <p className="text-xs text-neutral-600 py-2 font-mono">No channels subscribed.</p>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {markedChannels.map((ch) => (
                    <div
                      key={ch.channelId}
                      className="flex items-center justify-between p-2 rounded-md bg-black border border-neutral-800/80"
                    >
                      <Link
                        href={`/channel/${encodeURIComponent(ch.channelId || ch.channelTitle)}`}
                        onClick={() => setShowChannelModal(false)}
                        className="font-medium text-xs text-white hover:underline truncate mr-2"
                        title={`View channel: ${ch.channelTitle}`}
                      >
                        {ch.channelTitle}
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unmarkChannel(ch.channelId)}
                        className="text-neutral-400 hover:text-white hover:bg-neutral-900 h-6 px-1.5 text-[11px]"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hiddenChannelsList.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-mono text-neutral-400 mb-2">
                  Hidden / Not Interested Channels ({hiddenChannelsList.length})
                </h3>
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {hiddenChannelsList.map((p) => (
                    <div
                      key={p.channelId}
                      className="flex items-center justify-between p-2 rounded-md bg-black border border-neutral-800/80"
                    >
                      <span className="font-medium text-xs text-neutral-400 truncate mr-2">
                        {p.channelTitle}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChannelPreference(p.channelId)}
                        className="text-neutral-400 hover:text-white hover:bg-neutral-900 h-6 px-2 text-[11px] gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Unhide</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (confirm("Wipe all local subscriptions, preferences, and watch history?")) {
                    await clearAllLocalData();
                    setShowChannelModal(false);
                  }
                }}
                className="text-neutral-500 hover:text-red-400 text-xs px-2 h-7"
              >
                Wipe Local Data
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChannelModal(false)}
                className="text-xs bg-black border-neutral-800 text-white rounded-md px-3 h-7"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-[#121316] p-5 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-white" />
                <h3 className="text-sm font-semibold text-white tracking-tight">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-neutral-500 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#18191e] border border-neutral-800/60">
                <span className="text-neutral-300 font-medium">Focus Search Bar</span>
                <kbd className="px-2 py-0.5 rounded bg-black border border-neutral-700 font-mono text-[11px] text-neutral-300">/</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#18191e] border border-neutral-800/60">
                <span className="text-neutral-300 font-medium">Shuffle Current Feed</span>
                <kbd className="px-2 py-0.5 rounded bg-black border border-neutral-700 font-mono text-[11px] text-neutral-300">s</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#18191e] border border-neutral-800/60">
                <span className="text-neutral-300 font-medium">Toggle Focus Mode</span>
                <kbd className="px-2 py-0.5 rounded bg-black border border-neutral-700 font-mono text-[11px] text-neutral-300">f</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#18191e] border border-neutral-800/60">
                <span className="text-neutral-300 font-medium">Toggle Shortcuts Cheat Sheet</span>
                <kbd className="px-2 py-0.5 rounded bg-black border border-neutral-700 font-mono text-[11px] text-neutral-300">?</kbd>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#18191e] border border-neutral-800/60">
                <span className="text-neutral-300 font-medium">Dismiss Modals / Clear Search</span>
                <kbd className="px-2 py-0.5 rounded bg-black border border-neutral-700 font-mono text-[11px] text-neutral-300">Esc</kbd>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShortcutsModal(false)}
                className="text-xs bg-black border-neutral-800 text-white rounded-md px-3 h-7"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto border-t border-neutral-800/60 py-4 px-6 text-center text-xs text-neutral-500 bg-[#0e0f12]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <span>RAWTUBE · LOCAL-FIRST INTELLIGENCE</span>
          <span>
            {markedChannels.length} Followed · {savedVideos.length} Saved · {watchedVideos.length} Watched
          </span>
        </div>
      </footer>
    </div>
  );
}
