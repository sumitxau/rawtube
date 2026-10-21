import type { WatchedVideo, MarkedChannel, ChannelPreference } from "@/types/library";
import { CURATED_CHANNELS, type CuratedChannel } from "@/lib/directory/channels";

export interface CreatorAffinity {
  channelId: string;
  channelTitle: string;
  watchCount: number;
  totalSecondsWatched: number;
  score: number;
  isSubscribed: boolean;
  preference?: "interested" | "not_interested";
}

export interface WatchStatsSummary {
  totalVideosWatched: number;
  totalMinutesWatched: number;
  topCreators: { name: string; minutes: number; count: number }[];
  isColdStart: boolean;
  interestedCount: number;
  hiddenCount: number;
}

export function computeCreatorAffinity(
  watchedVideos: WatchedVideo[],
  markedChannels: MarkedChannel[],
  preferences: ChannelPreference[] = []
): CreatorAffinity[] {
  const map = new Map<string, CreatorAffinity>();
  const subscribedIds = new Set(markedChannels.map((c) => c.channelId));
  const prefMap = new Map<string, "interested" | "not_interested">();

  for (const p of preferences) {
    if (p.channelId) prefMap.set(p.channelId, p.preference);
    if (p.channelTitle) prefMap.set(p.channelTitle.toLowerCase(), p.preference);
  }

  for (const item of watchedVideos) {
    const key = item.channelId || item.channelTitle || "unknown";
    if (key === "unknown") continue;

    const pref = prefMap.get(item.channelId || "") || prefMap.get((item.channelTitle || "").toLowerCase());
    if (pref === "not_interested") continue;

    const existing = map.get(key) || {
      channelId: item.channelId || "",
      channelTitle: item.channelTitle || "Unknown Creator",
      watchCount: 0,
      totalSecondsWatched: 0,
      score: 0,
      isSubscribed: subscribedIds.has(item.channelId || ""),
      preference: pref,
    };

    existing.watchCount += 1;
    existing.totalSecondsWatched += Math.max(item.progressSeconds || 0, 15);

    const isRecent = Date.now() - item.watchedAt < 48 * 3600 * 1000;
    const recencyMultiplier = isRecent ? 1.5 : 1.0;

    const watchTimeWeight = Math.min(existing.totalSecondsWatched / 20, 300);
    const prefBoost = existing.preference === "interested" ? 150 : 0;
    existing.score =
      (existing.watchCount * 25 + watchTimeWeight + (existing.isSubscribed ? 60 : 0) + prefBoost) *
      recencyMultiplier;

    map.set(key, existing);
  }

  for (const ch of markedChannels) {
    const pref = prefMap.get(ch.channelId) || prefMap.get(ch.channelTitle.toLowerCase());
    if (pref === "not_interested") continue;

    if (!map.has(ch.channelId)) {
      map.set(ch.channelId, {
        channelId: ch.channelId,
        channelTitle: ch.channelTitle,
        watchCount: 0,
        totalSecondsWatched: 0,
        score: pref === "interested" ? 200 : 50,
        isSubscribed: true,
        preference: pref,
      });
    }
  }

  for (const p of preferences) {
    if (p.preference === "interested" && !map.has(p.channelId)) {
      map.set(p.channelId, {
        channelId: p.channelId,
        channelTitle: p.channelTitle,
        watchCount: 0,
        totalSecondsWatched: 0,
        score: 150,
        isSubscribed: subscribedIds.has(p.channelId),
        preference: "interested",
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

export function getRecommendedChannelsForMyFeed(
  watchedVideos: WatchedVideo[],
  markedChannels: MarkedChannel[],
  preferences: ChannelPreference[] = []
): { channels: CuratedChannel[]; isColdStart: boolean; topAffinities: CreatorAffinity[] } {
  const notInterestedNames = new Set(
    preferences
      .filter((p) => p.preference === "not_interested")
      .map((p) => p.channelTitle.toLowerCase())
  );
  const notInterestedIds = new Set(
    preferences
      .filter((p) => p.preference === "not_interested")
      .map((p) => p.channelId)
  );

  const affinities = computeCreatorAffinity(watchedVideos, markedChannels, preferences);

  if (affinities.length > 0) {
    const matchedChannels: CuratedChannel[] = [];
    const seenIds = new Set<string>();

    for (const aff of affinities) {
      if (seenIds.has(aff.channelId)) continue;
      if (notInterestedIds.has(aff.channelId) || notInterestedNames.has(aff.channelTitle.toLowerCase())) continue;

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
  ]
    .filter(Boolean)
    .filter((c) => !notInterestedIds.has(c.id) && !notInterestedNames.has(c.name.toLowerCase()));

  return {
    channels: defaultSeeds,
    isColdStart: true,
    topAffinities: [],
  };
}

export function getWatchStatsSummary(
  watchedVideos: WatchedVideo[],
  preferences: ChannelPreference[] = []
): WatchStatsSummary {
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

  const interestedCount = preferences.filter((p) => p.preference === "interested").length;
  const hiddenCount = preferences.filter((p) => p.preference === "not_interested").length;

  return {
    totalVideosWatched,
    totalMinutesWatched: Math.round(totalSeconds / 60),
    topCreators,
    isColdStart: totalVideosWatched < 2 && interestedCount === 0,
    interestedCount,
    hiddenCount,
  };
}
