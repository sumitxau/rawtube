import type { VideoMetadata } from "@/types/library";

export const PIPED_INSTANCES = [
    "https://api.piped.private.coffee",
    "https://pipedapi.ducks.party",
];

const DEFAULT_TIMEOUT_MS = 3000;
const queryCache = new Map<string, { data: unknown; expiry: number }>();

function getCached<T>(key: string): T | null {
    const item = queryCache.get(key);
    if (item && item.expiry > Date.now()) {
        return item.data as T;
    }
    if (typeof window !== "undefined") {
        try {
            const raw = sessionStorage.getItem(`rt_cache_${key}`);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.expiry > Date.now()) {
                    queryCache.set(key, parsed);
                    return parsed.data as T;
                }
            }
        } catch {
            // ignore storage errors
        }
    }
    return null;
}

function setCached(key: string, data: unknown, ttl = 600000): void {
    const entry = { data, expiry: Date.now() + ttl };
    queryCache.set(key, entry);
    if (typeof window !== "undefined") {
        try {
            sessionStorage.setItem(`rt_cache_${key}`, JSON.stringify(entry));
        } catch {
            // ignore quota errors
        }
    }
}

function getApiKey(): string | null {
    if (typeof window !== "undefined") {
        return localStorage.getItem("rawtube_yt_api_key") || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || null;
    }
    return process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || null;
}

export async function apiGet<T>(path: string, customInstance?: string): Promise<T> {
    const cached = getCached<T>(path);
    if (cached) return cached;

    const instances = customInstance ? [customInstance, ...PIPED_INSTANCES] : PIPED_INSTANCES;

    const fetchSingle = async (base: string): Promise<T> => {
        const cleanBase = base.replace(/\/+$/, "");
        const url = `${cleanBase}${path}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: { Accept: "application/json" },
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = (await response.json()) as T;
            setCached(path, json);
            return json;
        } catch (err) {
            clearTimeout(timeoutId);
            throw err instanceof Error ? err : new Error("Request failed");
        }
    };

    if (instances.length === 1) {
        return fetchSingle(instances[0]);
    }

    // Staggered race: Try primary instance first; if it takes > 750ms, fire backup in parallel
    try {
        const primaryPromise = fetchSingle(instances[0]);
        const backupTrigger = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Stagger trigger")), 750)
        );

        return await Promise.race([primaryPromise, backupTrigger]);
    } catch {
        // If primary timed out past 750ms or errored, race all instances concurrently
        return await Promise.any(instances.map((inst) => fetchSingle(inst)));
    }
}

export interface PipedChannelResponse {
    id: string;
    name: string;
    avatarUrl: string;
    relatedStreams: Array<{
        url: string;
        title: string;
        thumbnail: string;
        uploaderName: string;
        uploaderUrl: string;
        uploaderAvatar: string;
        uploadedDate: string;
        duration: number;
        views: number;
    }>;
}

export async function fetchChannelUploads(channelId: string, channelName?: string): Promise<VideoMetadata[]> {
    const cacheKey = `uploads_${channelId}`;
    const cached = getCached<VideoMetadata[]>(cacheKey);
    if (cached) return cached;

    try {
        const data = await apiGet<PipedChannelResponse>(`/channel/${channelId}`);
        if (data.relatedStreams && data.relatedStreams.length > 0) {
            const list: VideoMetadata[] = data.relatedStreams.map((stream) => {
                const videoId = stream.url.replace("/watch?v=", "");
                return {
                    id: videoId,
                    title: stream.title,
                    channelName: stream.uploaderName || data.name,
                    channelId,
                    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    duration: stream.duration,
                    uploadedDate: stream.uploadedDate,
                    views: stream.views,
                };
            });
            setCached(cacheKey, list);
            return list;
        }
    } catch {
        // channel endpoint fallback
    }

    if (channelName) {
        const search = await searchVideosPage(channelName);
        const list = search.videos.slice(0, 6);
        setCached(cacheKey, list);
        return list;
    }

    return [];
}

export interface ChannelPageData {
    id: string;
    name: string;
    avatarUrl?: string;
    bannerUrl?: string;
    description?: string;
    subscriberCount?: number;
    videos: VideoMetadata[];
    nextpage?: string;
}

export async function fetchChannelPage(idOrName: string): Promise<ChannelPageData> {
    const decoded = decodeURIComponent(idOrName);
    const isChannelId = decoded.startsWith("UC");

    if (isChannelId) {
        try {
            const data = await apiGet<PipedChannelResponse>(`/channel/${decoded}`);
            if (data && data.relatedStreams) {
                const videos: VideoMetadata[] = data.relatedStreams.map((stream) => {
                    const videoId = stream.url.replace("/watch?v=", "");
                    return {
                        id: videoId,
                        title: stream.title,
                        channelName: stream.uploaderName || data.name,
                        channelId: decoded,
                        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                        duration: stream.duration,
                        uploadedDate: stream.uploadedDate,
                        views: stream.views,
                    };
                });
                return {
                    id: decoded,
                    name: data.name || decoded,
                    avatarUrl: data.avatarUrl,
                    videos,
                };
            }
        } catch {
            // fallback
        }
    }

    const searchRes = await searchVideosPage(decoded);
    return {
        id: decoded,
        name: decoded,
        videos: searchRes.videos,
        nextpage: searchRes.nextpage,
    };
}

export interface PipedStreamResponse {
    title: string;
    description: string;
    uploadDate: string;
    uploader: string;
    uploaderUrl: string;
    uploaderAvatar: string;
    thumbnailUrl: string;
    views: number;
    likes: number;
}

export async function fetchVideoDetails(videoId: string): Promise<PipedStreamResponse> {
    try {
        const data = await apiGet<PipedStreamResponse>(`/streams/${videoId}`);
        if (data && data.title) {
            return {
                ...data,
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            };
        }
    } catch {
        // stream fallback
    }

    try {
        const oembedRes = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (oembedRes.ok) {
            const data = await oembedRes.json();
            return {
                title: data.title || "Video",
                description: "",
                uploadDate: "Recently Uploaded",
                uploader: data.author_name || "YouTube Channel",
                uploaderUrl: data.author_url || "",
                uploaderAvatar: "",
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                views: 0,
                likes: 0,
            };
        }
    } catch {
        // oembed fallback
    }

    return {
        title: "Video",
        description: "",
        uploadDate: "",
        uploader: "YouTube Channel",
        uploaderUrl: "",
        uploaderAvatar: "",
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        views: 0,
        likes: 0,
    };
}

export interface PipedComment {
    commentId: string;
    author: string;
    authorAvatar?: string;
    authorThumbnail?: string;
    content: string;
    commentText?: string;
    commentedTime?: string;
    likeCount?: number;
}

interface RawPipedComment {
    commentId?: string;
    author?: string;
    thumbnail?: string;
    authorAvatar?: string;
    content?: string;
    commentText?: string;
    commentedTime?: string;
    likeCount?: number;
}

export async function fetchVideoComments(videoId: string): Promise<PipedComment[]> {
    try {
        const data = await apiGet<{ comments?: Array<RawPipedComment> }>(`/comments/${videoId}`);
        if (!data.comments) return [];
        return data.comments.map((c) => ({
            commentId: c.commentId || String(Math.random()),
            author: c.author || "Anonymous",
            authorAvatar: c.thumbnail || c.authorAvatar || "",
            authorThumbnail: c.thumbnail,
            content: c.commentText || c.content || "",
            commentText: c.commentText || c.content || "",
            commentedTime: c.commentedTime,
            likeCount: typeof c.likeCount === "number" ? c.likeCount : 0,
        }));
    } catch {
        return [];
    }
}

export interface SearchPageResult {
    videos: VideoMetadata[];
    nextpage?: string;
}

export async function searchVideosPage(
    query: string,
    nextpage?: string
): Promise<SearchPageResult> {
    const cacheKey = `search_${query}_${nextpage || ""}`;
    const cached = getCached<SearchPageResult>(cacheKey);
    if (cached) return cached;

    const apiKey = getApiKey();
    if (apiKey && !nextpage) {
        try {
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=25&key=${apiKey}`;
            const res = await fetch(ytUrl);
            if (res.ok) {
                interface YouTubeItem {
                    id: { videoId: string };
                    snippet: {
                        title: string;
                        channelTitle: string;
                        channelId: string;
                        publishedAt?: string;
                    };
                }
                const data = (await res.json()) as { items?: YouTubeItem[]; nextPageToken?: string };
                const videos: VideoMetadata[] = (data.items || []).map((item: YouTubeItem) => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    channelName: item.snippet.channelTitle,
                    channelId: item.snippet.channelId,
                    thumbnailUrl: `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
                    uploadedDate: item.snippet.publishedAt ? new Date(item.snippet.publishedAt).toLocaleDateString() : "",
                    views: 0,
                }));
                const result = { videos, nextpage: data.nextPageToken };
                setCached(cacheKey, result);
                return result;
            }
        } catch {
            // yt api fallback
        }
    }

    const path = nextpage
        ? `/nextpage/search?nextpage=${encodeURIComponent(nextpage)}&q=${encodeURIComponent(query)}&filter=videos`
        : `/search?q=${encodeURIComponent(query)}&filter=videos`;

    try {
        interface PipedItem {
            type?: string;
            url: string;
            title: string;
            uploaderName?: string;
            uploader?: string;
            uploaderUrl?: string;
            uploadedDate?: string;
            views?: number;
            duration?: number;
        }
        const data = await apiGet<{ items?: Array<PipedItem>; nextpage?: string }>(path);
        if (!data.items) return { videos: [], nextpage: undefined };

        const videos: VideoMetadata[] = data.items
            .filter((item) => item.type === "stream")
            .map((item) => {
                const videoId = item.url.replace("/watch?v=", "");
                return {
                    id: videoId,
                    title: item.title,
                    channelName: item.uploaderName || item.uploader || "Unknown Channel",
                    channelId: item.uploaderUrl ? item.uploaderUrl.replace("/channel/", "") : "",
                    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    duration: item.duration,
                    uploadedDate: item.uploadedDate,
                    views: item.views,
                };
            });

        const result = { videos, nextpage: data.nextpage };
        setCached(cacheKey, result);
        return result;
    } catch {
        return { videos: [], nextpage: undefined };
    }
}

export async function searchVideos(query: string): Promise<VideoMetadata[]> {
    const result = await searchVideosPage(query);
    return result.videos;
}
