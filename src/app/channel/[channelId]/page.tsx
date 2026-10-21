"use client";

import { use, useEffect, useState, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Check, Plus, RefreshCw, ThumbsUp, ThumbsDown, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { VideoCard } from "@/components/video/video-card";
import { useLibrary } from "@/hooks/use-library";
import { fetchChannelPage, searchVideosPage, type ChannelPageData } from "@/lib/api/client";
import type { VideoMetadata } from "@/types/library";

interface PageProps {
  params: Promise<{ channelId: string }>;
}

export default function ChannelPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0e0f12] text-white flex items-center justify-center">
          <Loader size={100} />
        </div>
      }
    >
      <ChannelContent {...props} />
    </Suspense>
  );
}

function ChannelContent({ params }: PageProps) {
  const unwrappedParams = use(params);
  const rawId = unwrappedParams.channelId;
  const channelIdentifier = decodeURIComponent(rawId);

  const {
    markedChannels,
    markChannel,
    unmarkChannel,
    savedVideos,
    preferences,
    setChannelPreference,
    removeChannelPreference,
  } = useLibrary();

  const [channelData, setChannelData] = useState<ChannelPageData | null>(null);
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [nextpage, setNextpage] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  const channelKey = channelData?.id || channelIdentifier;
  const channelName = channelData?.name || channelIdentifier;

  const isMarked = markedChannels.some(
    (c) => c.channelId === channelKey || c.channelTitle.toLowerCase() === channelName.toLowerCase()
  );

  const currentPref = preferences.find(
    (p) => p.channelId === channelKey || p.channelTitle.toLowerCase() === channelName.toLowerCase()
  )?.preference;

  const loadChannel = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchChannelPage(channelIdentifier);
      setChannelData(data);
      setVideos(data.videos);
      setNextpage(data.nextpage);
    } catch (err) {
      console.error("Channel load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [channelIdentifier]);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const data = await fetchChannelPage(channelIdentifier);
        if (!active) return;
        setChannelData(data);
        setVideos(data.videos);
        setNextpage(data.nextpage);
      } catch (err) {
        if (!active) return;
        console.error("Channel load failed:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [channelIdentifier]);

  const loadMore = useCallback(async () => {
    if (!nextpage || loadingMore || loading) return;

    setLoadingMore(true);
    try {
      const res = await searchVideosPage(channelName, nextpage);
      setVideos((prev) => [...prev, ...res.videos]);
      setNextpage(res.nextpage);
    } catch (err) {
      console.error("Failed to load more channel videos:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [nextpage, loadingMore, loading, channelName]);

  useEffect(() => {
    if (!loadMoreTriggerRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextpage && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreTriggerRef.current);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [nextpage, loadingMore, loadMore]);

  const handleToggleFollow = async () => {
    if (isMarked) {
      await unmarkChannel(channelKey);
    } else {
      await markChannel({
        channelId: channelKey,
        channelTitle: channelName,
        avatarUrl: channelData?.avatarUrl,
        markedAt: Date.now(),
      });
    }
  };

  const handleInterested = async () => {
    if (currentPref === "interested") {
      await removeChannelPreference(channelKey);
    } else {
      await setChannelPreference(channelKey, channelName, "interested");
    }
  };

  const handleNotInterested = async () => {
    if (currentPref === "not_interested") {
      await removeChannelPreference(channelKey);
    } else {
      await setChannelPreference(channelKey, channelName, "not_interested");
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
      </header>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="mb-8 p-6 rounded-2xl bg-[#16171b] border border-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {channelData?.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={channelData.avatarUrl}
                alt={channelName}
                className="w-16 h-16 rounded-full border border-neutral-700 object-cover bg-neutral-900"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xl font-bold text-white select-none">
                {channelName[0]?.toUpperCase() || "C"}
              </div>
            )}

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {channelName}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400 font-mono">
                <span>{videos.length} videos loaded</span>
                {currentPref === "interested" && (
                  <span className="text-[10px] bg-neutral-900 text-white px-2 py-0.5 rounded border border-neutral-800">
                    Boosted
                  </span>
                )}
                {currentPref === "not_interested" && (
                  <span className="text-[10px] bg-red-950/80 text-red-400 px-2 py-0.5 rounded border border-red-900/50">
                    Hidden
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleInterested}
              className={`h-8 text-xs rounded-lg gap-1.5 font-medium transition-colors ${
                currentPref === "interested"
                  ? "bg-white text-black hover:bg-neutral-200 border-white"
                  : "bg-black border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-white"
              }`}
              title="Boost channel in My Feed"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{currentPref === "interested" ? "Interested" : "Interested"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNotInterested}
              className={`h-8 text-xs rounded-lg gap-1.5 font-medium transition-colors ${
                currentPref === "not_interested"
                  ? "bg-red-900/60 text-white border-red-800"
                  : "bg-black border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-red-400"
              }`}
              title="Don't recommend channel"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>{currentPref === "not_interested" ? "Hidden" : "Not Interested"}</span>
            </Button>

            <Button
              variant={isMarked ? "secondary" : "outline"}
              size="sm"
              onClick={handleToggleFollow}
              className={`h-8 text-xs rounded-lg gap-1.5 font-medium transition-colors ${
                isMarked
                  ? "bg-neutral-900 text-white border border-neutral-800"
                  : "bg-white text-black hover:bg-neutral-200 border-white"
              }`}
            >
              {isMarked ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Follow</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
            Channel Content
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLoading(true);
              loadChannel();
            }}
            disabled={loading}
            className="text-neutral-500 hover:text-white h-7 px-2 text-xs"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-white" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader size={100} />
          </div>
        ) : videos.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {nextpage && (
              <div ref={loadMoreTriggerRef} className="flex items-center justify-center py-10 mt-6">
                {loadingMore ? (
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium bg-[#16171b] border border-neutral-800 px-4 py-2 rounded-lg">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Loading more...</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="gap-2 text-xs bg-[#16171b] border-neutral-800 hover:bg-neutral-800 text-white font-medium px-4 py-2 rounded-lg"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Load More</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto my-20 p-8 rounded-xl bg-[#16171b] border border-neutral-800 text-center">
            <p className="text-xs text-neutral-400 mb-4">No videos found for this channel.</p>
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-black border-neutral-800 text-white text-xs">
                Back to Feed
              </Button>
            </Link>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-neutral-800/60 py-4 px-6 text-center text-xs text-neutral-500 bg-[#0e0f12]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <span>RAWTUBE · LOCAL-FIRST CHANNEL EXPLORER</span>
          <span>{videos.length} Videos</span>
        </div>
      </footer>
    </div>
  );
}
