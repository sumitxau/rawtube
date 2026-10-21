import type { WatchedVideo, MarkedChannel, VideoMetadata } from "@/types/library";
import { CURATED_CHANNELS, type CuratedChannel, interleaveAndShuffle, shuffleVideos } from "@/lib/directory/channels";

export interface CreatorAffinity {
  channelId: string;
  channelTitle: string;
  watchCount: number;
  totalSecondsWatched: number;
  score: number;
  isSubscribed: boolean;
}

export interface WatchStatsSummary {
  totalVideosWatched: number;
  totalMinutesWatched: number;
  topCreators: { name: string; minutes: number; count: number }[];
  isColdStart: boolean;
}

export function computeCreatorAffinity(
  watchedVideos: WatchedVideo[],
  markedChannels: MarkedChannel[]
): CreatorAffinity[] {
  const map = new Map<string, CreatorAffinity>();
  const subscribedIds = new Set(markedChannels.map((c) => c.channelId));

  for (const item of watchedVideos) {
    const key = item.channelId || item.channelTitle || "unknown";
    if (key === "unknown") continue;

    const existing = map.get(key) || {
      channelId: item.channelId || "",
      channelTitle: item.channelTitle || "Unknown Creator",
      watchCount: 0,
      totalSecondsWatched: 0,
      score: 0,
      isSubscribed: subscribedIds.has(item.channelId || ""),
    };

    existing.watchCount += 1;
    existing.totalSecondsWatched += Math.max(item.progressSeconds || 0, 15);

    const isRecent = Date.now() - item.watchedAt < 48 * 3600 * 1000;
    const recencyMultiplier = isRecent ? 1.5 : 1.0;

    const watchTimeWeight = Math.min(existing.totalSecondsWatched / 20, 300);
    existing.score = (existing.watchCount * 25 + watchTimeWeight + (existing.isSubscribed ? 60 : 0)) * recencyMultiplier;

    map.set(key, existing);
  }

  for (const ch of markedChannels) {
    if (!map.has(ch.channelId)) {
      map.set(ch.channelId, {
        channelId: ch.channelId,
        channelTitle: ch.channelTitle,
        watchCount: 0,
        totalSecondsWatched: 0,
        score: 50,
        isSubscribed: true,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

export function getRecommendedChannelsForMyFeed(
  watchedVideos: WatchedVideo[],
  markedChannels: MarkedChannel[]
): { channels: CuratedChannel[]; isColdStart: boolean; topAffinities: CreatorAffinity[] } {
  const affinities = computeCreatorAffinity(watchedVideos, markedChannels);

  if (affinities.length > 0) {
    const matchedChannels: CuratedChannel[] = [];
    const seenIds = new Set<string>();

    for (const aff of affinities) {
      if (seenIds.has(aff.channelId)) continue;

      const found = CURATED_CHANNELS.find((c) => c.id === aff.channelId);
      if (found) {
        matchedChannels.push(found);
      } else if (aff.channelId) {
        matchedChannels.push({
          id: aff.channelId,
          name: aff.channelTitle,
          handle: `@${aff.channelTitle.replace(/\s+/g, "").toLowerCase()}`,
          category: "custom",
        });
      }
      seenIds.add(aff.channelId);
      if (matchedChannels.length >= 8) break;
    }

    if (matchedChannels.length > 0) {
      return {
        channels: matchedChannels,
        isColdStart: false,
        topAffinities: affinities.slice(0, 5),
      };
    }
  }

  const defaultSeeds: CuratedChannel[] = [
    CURATED_CHANNELS.find((c) => c.name.includes("Patrick Collins"))!,
    CURATED_CHANNELS.find((c) => c.name.includes("Smart Contract Programmer"))!,
    CURATED_CHANNELS.find((c) => c.name === "Harkirat Singh")!,
    CURATED_CHANNELS.find((c) => c.name === "Chai aur Code")!,
    CURATED_CHANNELS.find((c) => c.name === "Piyush Garg")!,
    CURATED_CHANNELS.find((c) => c.name === "Akshay Saini")!,
    CURATED_CHANNELS.find((c) => c.name.includes("ThePrimeagen"))!,
  ].filter(Boolean);

  return {
    channels: defaultSeeds,
    isColdStart: true,
    topAffinities: [],
  };
}

export function getWatchStatsSummary(watchedVideos: WatchedVideo[]): WatchStatsSummary {
  const totalVideosWatched = watchedVideos.length;
  let totalSeconds = 0;
  const creatorSeconds = new Map<string, { seconds: number; count: number }>();

  for (const v of watchedVideos) {
    const name = v.channelTitle || "Unknown";
    const sec = Math.max(v.progressSeconds || 0, 15);
    totalSeconds += sec;

    const curr = creatorSeconds.get(name) || { seconds: 0, count: 0 };
    curr.seconds += sec;
    curr.count += 1;
    creatorSeconds.set(name, curr);
  }

  const topCreators = Array.from(creatorSeconds.entries())
    .map(([name, data]) => ({
      name,
      minutes: Math.max(Math.round(data.seconds / 60), 1),
      count: data.count,
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 4);

  return {
    totalVideosWatched,
    totalMinutesWatched: Math.round(totalSeconds / 60),
    topCreators,
    isColdStart: totalVideosWatched < 2,
  };
}
