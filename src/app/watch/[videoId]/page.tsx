"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Share2,
  Check,
  EyeOff,
  Plus,
  CheckCircle2,
  MessageSquare,
  ThumbsUp,
  Shield,
  Send,
  Tv,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useLibrary } from "@/hooks/use-library";
import {
  fetchVideoDetails,
  fetchVideoComments,
  type PipedStreamResponse,
  type PipedComment,
} from "@/lib/api/client";

interface PageProps {
  params: Promise<{ videoId: string }>;
}

interface LocalNote {
  id: string;
  text: string;
  time: number;
}

export default function WatchPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0e0f12] text-white flex items-center justify-center">
          <Loader size={100} />
        </div>
      }
    >
      <WatchContent {...props} />
    </Suspense>
  );
}

function WatchContent({ params }: PageProps) {
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
  const [theaterMode, setTheaterMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Comments & Local Notes State
  const [comments, setComments] = useState<PipedComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localNotes, setLocalNotes] = useState<LocalNote[]>([]);
  const [noteInput, setNoteInput] = useState("");

  const isSaved = savedVideos.some((v) => v.videoId === videoId);

  // Channel ID
  const channelId = details?.uploaderUrl
    ? details.uploaderUrl.replace("/channel/", "")
    : "";

  const isMarked = markedChannels.some((c) => c.channelId === channelId);

  // Load local user notes from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`rawtube_notes_${videoId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        queueMicrotask(() => {
          setLocalNotes(parsed);
        });
      }
    } catch {
      // ignore
    }
  }, [videoId]);

  // 1. Fetch metadata & conditionally record watch progress
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchVideoDetails(videoId);
        if (isMounted) {
          setDetails(data);
          if (!focusMode) {
            const chId = data.uploaderUrl ? data.uploaderUrl.replace("/channel/", "") : "";
            recordWatchProgress(videoId, 0, undefined, data.uploader, chId, data.title);
          }
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
  }, [videoId, focusMode, recordWatchProgress]);

  useEffect(() => {
    if (focusMode || !details) return;

    const chId = details.uploaderUrl ? details.uploaderUrl.replace("/channel/", "") : "";
    let accumulatedSeconds = 0;

    const timer = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        accumulatedSeconds += 10;
        recordWatchProgress(videoId, accumulatedSeconds, details.views, details.uploader, chId, details.title);
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [videoId, focusMode, details, recordWatchProgress]);

  // 2. Fetch public YouTube comments
  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState && comments.length === 0) {
      setLoadingComments(true);
      try {
        const data = await fetchVideoComments(videoId);
        setComments(data);
      } catch (err) {
        console.error("Failed to load comments", err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // Add a local user note/comment
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    const newNote: LocalNote = {
      id: Date.now().toString(),
      text: noteInput.trim(),
      time: Date.now(),
    };

    const updated = [newNote, ...localNotes];
    setLocalNotes(updated);
    setNoteInput("");
    try {
      localStorage.setItem(`rawtube_notes_${videoId}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // 3. Toggle Bookmark
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

  // 4. Toggle Channel Subscription
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

  // 5. Copy share link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0e0f12] text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0e0f12]/90 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 py-3.5">
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

          {/* Focus Mode (Incognito) Toggle */}
          <Button
            variant={focusMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFocusMode(!focusMode)}
            className={`gap-1.5 text-xs rounded-lg h-8 px-3 font-medium transition-colors ${
              focusMode
                ? "bg-neutral-800 text-white border-neutral-700"
                : "bg-black border-neutral-800 hover:bg-neutral-900 text-white"
            }`}
          >
            <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
            <span>{focusMode ? "Focus: ON" : "Focus"}</span>
          </Button>
        </div>
      </header>

      {/* Main Container - Expansive & Screen Optimized */}
      <main className={`flex-1 w-full mx-auto transition-all duration-200 ${
        theaterMode
          ? "max-w-full px-0 sm:px-6 lg:px-10 py-4"
          : "max-w-7xl xl:max-w-[1550px] p-4 sm:p-6 lg:p-8"
      }`}>
        
        {/* Focus Mode Banner */}
        {focusMode && (
          <div className="mb-4 flex items-center justify-between px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs mx-4 sm:mx-0">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>Focus Mode active: Comments hidden · No history recorded</span>
            </div>
            <button
              onClick={() => setFocusMode(false)}
              className="text-xs text-neutral-300 hover:text-white underline font-medium"
            >
              Disable
            </button>
          </div>
        )}

        {/* Video Player - Responsive & Theater-Ready */}
        <div className={`relative w-full overflow-hidden bg-neutral-950 border border-neutral-900 shadow-2xl transition-all duration-200 ${
          theaterMode
            ? "h-[60vh] sm:h-[75vh] xl:h-[82vh] rounded-none sm:rounded-2xl"
            : "aspect-video max-h-[80vh] rounded-xl"
        }`}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={details?.title || "Video Player"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full border-0"
          />
        </div>

        {/* Video Metadata */}
        <div className="mt-6">
          {loading ? (
            <div className="py-16 flex justify-center items-center">
              <Loader size={100} />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Video Title */}
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                {details?.title || "Video"}
              </h1>

              {/* Actions & Channel Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-neutral-900">
                {/* Channel Details */}
                <div className="flex items-center gap-3">
                  <Link
                    href={`/channel/${encodeURIComponent(channelId || details?.uploader || "channel")}`}
                    className="flex items-center gap-3 group"
                    title={`View ${details?.uploader || "channel"}`}
                  >
                    {details?.uploaderAvatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={details.uploaderAvatar}
                        alt={details.uploader}
                        className="w-9 h-9 rounded-full border border-neutral-800 object-cover group-hover:border-neutral-500 transition-colors"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-white text-xs group-hover:border-neutral-500 transition-colors">
                        {details?.uploader?.[0] || "Y"}
                      </div>
                    )}
                    <div>
                      <h2 className="font-semibold text-xs text-white group-hover:underline">
                        {details?.uploader || "YouTube Channel"}
                      </h2>
                      {details?.uploadDate && (
                        <div className="text-[11px] text-neutral-500 font-mono">{details.uploadDate}</div>
                      )}
                    </div>
                  </Link>

                  {/* Mark / Unmark Channel Button */}
                  {channelId && (
                    <Button
                      variant={isMarked ? "secondary" : "outline"}
                      size="sm"
                      onClick={handleToggleChannel}
                      className={`ml-2 gap-1 text-xs rounded-lg h-7 px-2.5 font-medium transition-colors ${
                        isMarked
                          ? "bg-neutral-900 text-white border-neutral-800"
                          : "bg-white text-black hover:bg-neutral-200 border-white"
                      }`}
                    >
                      {isMarked ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-neutral-300" />
                          <span>Marked</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
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
                    className="gap-1.5 text-xs bg-black border-neutral-800 hover:bg-neutral-900 text-white rounded-lg h-8 px-3 font-medium"
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-white" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Save</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheaterMode(!theaterMode)}
                    className={`gap-1.5 text-xs rounded-lg h-8 px-2.5 font-medium transition-colors ${
                      theaterMode
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                    }`}
                    title="Toggle Theater Mode"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{theaterMode ? "Default" : "Theater"}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
                    className="gap-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg h-8 px-2.5 font-medium"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied</span>
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
                <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4">
                  <div
                    className={`text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed ${
                      showFullDesc ? "" : "line-clamp-3"
                    }`}
                  >
                    {details.description}
                  </div>

                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="mt-2 text-xs font-semibold text-neutral-400 hover:text-white block"
                  >
                    {showFullDesc ? "Show less" : "More"}
                  </button>
                </div>
              )}

              {/* Comments & Personal Notes Section */}
              {!focusMode && (
                <div className="mt-4 pt-4 border-t border-neutral-900">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleComments}
                      className="gap-2 text-xs bg-black border-neutral-800 hover:bg-neutral-900 text-white rounded-lg h-8 px-3 font-medium"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{showComments ? "Hide Comments" : "Watch Comments"}</span>
                      {comments.length > 0 && (
                        <span className="text-[10px] text-neutral-500 font-mono">
                          ({comments.length + localNotes.length})
                        </span>
                      )}
                    </Button>
                  </div>

                  {showComments && (
                    <div className="flex flex-col gap-4">
                      {/* Personal Notes / Local Comment Box */}
                      <form onSubmit={handleAddNote} className="flex gap-2">
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Add a private note or comment on this video..."
                          className="flex-1 px-3.5 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-neutral-500 text-white placeholder:text-neutral-500"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!noteInput.trim()}
                          className="bg-white text-black hover:bg-neutral-200 text-xs rounded-lg h-8 px-3 font-semibold disabled:opacity-40"
                        >
                          <Send className="w-3 h-3" />
                        </Button>
                      </form>

                      {/* Display Personal Notes First */}
                      {localNotes.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase block">
                            Your Saved Notes:
                          </span>
                          {localNotes.map((note) => (
                            <div
                              key={note.id}
                              className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs"
                            >
                              <div className="text-white leading-relaxed">{note.text}</div>
                              <div className="text-[10px] text-neutral-600 font-mono mt-1">
                                {new Date(note.time).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Public YouTube Comments */}
                      {loadingComments ? (
                        <div className="py-8 flex justify-center items-center">
                          <Loader size={80} />
                        </div>
                      ) : comments.length > 0 ? (
                        <div className="space-y-3">
                          <span className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase block">
                            Public YouTube Comments:
                          </span>
                          {comments.map((comment, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-900 flex gap-3 text-left"
                            >
                              {comment.authorAvatar ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={comment.authorAvatar}
                                  alt={comment.author}
                                  className="w-7 h-7 rounded-full border border-neutral-800 object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                                  {comment.author[0] || "U"}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-xs text-white truncate">
                                    {comment.author}
                                  </span>
                                  {comment.commentedTime && (
                                    <span className="text-[10px] text-neutral-500 font-mono">
                                      {comment.commentedTime}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                                {(comment.likeCount ?? 0) > 0 && (
                                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-neutral-500 font-mono">
                                    <ThumbsUp className="w-3 h-3 text-neutral-600" />
                                    <span>{comment.likeCount}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-neutral-500">
                          Comments unavailable for this video.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
