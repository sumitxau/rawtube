import type { VideoMetadata } from "@/types/library";

/**
 * Piped API Client
 * Decentralized YouTube metadata proxy without Google API keys.
 * Includes automatic instance fallback if one public mirror goes down.
 */

// List of public Piped instances to try in sequence (tested & active)
export const PIPED_INSTANCES = [
  "https://pipedapi.ducks.party",
  "https://piped-api.garudalinux.org",
  "https://api.piped.projectsegfau.lt",
  "https://pipedapi.kavin.rocks",
];

const DEFAULT_TIMEOUT_MS = 8000; // 8 second timeout per request

/**
 * Fetch wrapper with timeout and automatic instance fallback
 */
export async function apiGet<T>(path: string, customInstance?: string): Promise<T> {
    const instances = customInstance ? [customInstance, ...PIPED_INSTANCES] : PIPED_INSTANCES;
    let lastError: Error | null = null;

    for (const instance of instances) {
        const cleanBase = instance.replace(/\/+$/, "");
        const url = `${cleanBase}${path}`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    Accept: "application/json",
                },
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return (await response.json()) as T;
            }
        } catch (err) {
            // Instance failed or timed out — silently advance to next mirror
            lastError = err instanceof Error ? err : new Error("Network request failed");
        }
    }

    throw new Error(`All Piped instances failed. Last error: ${lastError?.message}`);
}

// 1. Channel Uploads (Home Feed Generator)

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

export async function fetchChannelUploads(channelId: string): Promise<VideoMetadata[]> {
    const data = await apiGet<PipedChannelResponse>(`/channel/${channelId}`);

    if (!data.relatedStreams) return [];

    return data.relatedStreams.map((stream) => {

        const videoId = stream.url.replace("/watch?v=", "");
        return {
            id: videoId,
            title: stream.title,
            channelName: stream.uploaderName || data.name,
            channelId: channelId,
            thumbnailUrl: stream.thumbnail,
            duration: stream.duration,
            uploadedDate: stream.uploadedDate,
            views: stream.views,
        };
    });
}


// 2. Video Details (Watch Page)

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
    return await apiGet<PipedStreamResponse>(`/streams/${videoId}`);
}

// 3. Search (Channels and Videos) with Endless Pagination Support

export interface SearchPageResult {
  videos: VideoMetadata[];
  nextpage?: string;
}

export async function searchVideosPage(
  query: string,
  nextpage?: string
): Promise<SearchPageResult> {
  const path = nextpage
    ? `/nextpage/search?nextpage=${encodeURIComponent(nextpage)}&q=${encodeURIComponent(query)}&filter=videos`
    : `/search?q=${encodeURIComponent(query)}&filter=videos`;

  const data = await apiGet<{ items?: Array<any>; nextpage?: string }>(path);

  if (!data.items) return { videos: [], nextpage: undefined };

  const videos: VideoMetadata[] = data.items
    .filter((item) => item.type === "stream")
    .map((item) => ({
      id: item.url.replace("/watch?v=", ""),
      title: item.title,
      channelName: item.uploaderName || item.uploader || "Unknown Channel",
      channelId: item.uploaderUrl ? item.uploaderUrl.replace("/channel/", "") : "",
      thumbnailUrl: item.thumbnail,
      duration: item.duration,
      uploadedDate: item.uploadedDate,
      views: item.views,
    }));

  return {
    videos,
    nextpage: data.nextpage,
  };
}

export async function searchVideos(query: string): Promise<VideoMetadata[]> {
  const result = await searchVideosPage(query);
  return result.videos;
}
