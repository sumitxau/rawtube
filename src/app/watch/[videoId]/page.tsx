"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Tv2,
  Bookmark,
  BookmarkCheck,
  Eye,
  Calendar,
  Share2,
  Check,
  Maximize2,
  Minimize2,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useLibrary } from "@/hooks/use-library";
import { fetchVideoDetails, type PipedStreamResponse } from "@/lib/api/client";

interface PageProps {
  params: Promise<{ videoId: string }>;
}

export default function WatchPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const videoId = unwrappedParams.videoId;

  const {
    savedVideos,
    saveVideo,
    removeSavedVideo,
    recordWatchProgress,
    markedChannels,
    markChannel,
    unmarkChannel,
  } = useLibrary();

  const [details, setDetails] = useState<PipedStreamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const isSaved = savedVideos.some((v) => v.videoId === videoId);

  // Extract channel ID from uploaderUrl (e.g. "/channel/UC...")
  const channelId = details?.uploaderUrl
    ? details.uploaderUrl.replace("/channel/", "")
    : "";

  const isMarked = markedChannels.some((c) => c.channelId === channelId);

  // 1. Fetch metadata & record watch progress in IndexedDB
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchVideoDetails(videoId);
        if (isMounted) {
          setDetails(data);
          // Record watch history locally
          recordWatchProgress(videoId, 0);
        }
      } catch (err) {
        console.error("Failed to load video details", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (videoId) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [videoId, recordWatchProgress]);

  // 2. Toggle Bookmark
  const handleToggleSave = async () => {
    if (isSaved) {
      await removeSavedVideo(videoId);
    } else {
      await saveVideo({
        videoId,
        title: details?.title || "Video",
        channelTitle: details?.uploader || "Channel",
        thumbnailUrl: details?.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        savedAt: Date.now(),
      });
    }
  };

  // 3. Toggle Channel Subscription
  const handleToggleChannel = async () => {
    if (!channelId) return;

    if (isMarked) {
      await unmarkChannel(channelId);
    } else {
      await markChannel({
        channelId,
        channelTitle: details?.uploader || "Unknown",
        avatarUrl: details?.uploaderAvatar,
        markedAt: Date.now(),
      });
    }
  };

  // 4. Copy share link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Header (Hidden in Focus Mode) */}
      {!focusMode && (
        <header className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-800/90 px-4 sm:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-white transition-colors p-1"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-400" />
              <span>Back to Feed</span>
            </Link>

            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-red-500 shadow-sm">
                <Tv2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white">RawTube</span>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFocusMode(true)}
              className="gap-1.5 text-xs bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white rounded-xl h-8 px-3 font-medium"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Focus Mode</span>
            </Button>
          </div>
        </header>
      )}

      {/* Main Player & Info Area */}
      <main className={`flex-1 flex flex-col ${focusMode ? "p-0" : "max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8"}`}>
        {/* Isolated Privacy Player Container */}
        <div className={`relative w-full overflow-hidden bg-black ${focusMode ? "h-screen" : "aspect-video rounded-2xl border border-neutral-800 shadow-2xl"}`}>
          {/* Official YouTube Embed with No-Cookie Privacy */}
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={details?.title || "Video Player"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full border-0"
          />

          {/* Floating Exit Focus Mode Button */}
          {focusMode && (
            <button
              onClick={() => setFocusMode(false)}
              className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white text-xs backdrop-blur-md border border-neutral-700 transition-opacity opacity-70 hover:opacity-100"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Focus</span>
            </button>
          )}
        </div>

        {/* Video Metadata (Hidden in Focus Mode) */}
        {!focusMode && (
          <div className="mt-6">
            {loading ? (
              <div className="py-16 flex justify-center items-center">
                <Loader size={120} />
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Video Title */}
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  {details?.title || "Video Playback"}
                </h1>

                {/* Actions & Channel Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-neutral-800/80">
                  {/* Channel Details */}
                  <div className="flex items-center gap-3">
                    {details?.uploaderAvatar && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={details.uploaderAvatar}
                        alt={details.uploader}
                        className="w-10 h-10 rounded-full border border-neutral-700 object-cover"
                      />
                    )}
                    <div>
                      <h2 className="font-semibold text-sm text-white">
                        {details?.uploader || "Unknown Channel"}
                      </h2>
                      {details?.uploadDate && (
                        <div className="text-xs text-neutral-400 font-medium">{details.uploadDate}</div>
                      )}
                    </div>

                    {/* Mark / Unmark Channel Button */}
                    {channelId && (
                      <Button
                        variant={isMarked ? "secondary" : "outline"}
                        size="sm"
                        onClick={handleToggleChannel}
                        className={`ml-2 gap-1.5 text-xs rounded-xl h-8 px-3 font-semibold transition-all ${
                          isMarked
                            ? "bg-neutral-800 text-white border-neutral-700"
                            : "bg-white text-neutral-950 hover:bg-neutral-200 border-white"
                        }`}
                      >
                        {isMarked ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Marked</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Mark Channel</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleSave}
                      className="gap-2 text-xs bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white rounded-xl h-8 px-3 font-medium"
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5 text-neutral-300" />
                          <span>Watch Later</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                      className="gap-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-xl h-8 px-3 font-medium"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Description Box */}
                {details?.description && (
                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 sm:p-5">
                    <div
                      className={`text-xs sm:text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed font-normal ${
                        showFullDesc ? "" : "line-clamp-4"
                      }`}
                    >
                      {details.description}
                    </div>

                    <button
                      onClick={() => setShowFullDesc(!showFullDesc)}
                      className="mt-3 text-xs font-semibold text-white hover:underline block"
                    >
                      {showFullDesc ? "Show less" : "...more"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
