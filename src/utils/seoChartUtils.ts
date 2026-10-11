// Utilities for Keyword 30-day Rank History & Recharts Line Chart visualization

export type ChartTimeRange = '7d' | '14d' | '30d';

/**
 * Generates an array of the last N date strings in 'MM-DD' format,
 * aligned with the current applet anchor date (2026-10-11).
 */
export const getLastNDates = (days: number = 30): string[] => {
  const dates: string[] = [];
  const baseDate = new Date(2026, 9, 11); // October 11, 2026

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${month}-${day}`);
  }
  return dates;
};

export const LAST_30_DAYS = getLastNDates(30);

/**
 * Generate a realistic daily 30-day ranking series for any keyword,
 * anchored at currentRank on the final day, with realistic SEO progression.
 */
export const generateRealistic30DayHistory = (
  currentRank: number,
  previousRank: number = currentRank + 2,
  seedStr: string = 'kw'
): { date: string; rank: number }[] => {
  const dates = LAST_30_DAYS;
  const history: { date: string; rank: number }[] = [];

  // Create a pseudo-random hash from seedStr
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) % 10000;
  }

  // Determine starting rank 30 days ago: usually slightly lower or volatile
  const rankDelta = (previousRank - currentRank) * 2;
  const startingRank = Math.max(1, Math.min(60, currentRank + rankDelta + (seed % 5) - 2));

  for (let i = 0; i < dates.length; i++) {
    const progress = i / (dates.length - 1); // 0.0 to 1.0

    // Smooth curve from startingRank to currentRank
    const interpolatedBase = startingRank + (currentRank - startingRank) * Math.pow(progress, 0.85);

    // Add small realistic day-to-day SERP jitter (unless on final day)
    let jitter = 0;
    if (i !== dates.length - 1) {
      const pseudoWave = Math.sin((i + seed) * 0.7) * 1.5;
      jitter = Math.round(pseudoWave);
    }

    const calculatedRank = Math.max(1, Math.min(100, Math.round(interpolatedBase + jitter)));
    history.push({
      date: dates[i],
      rank: calculatedRank,
    });
  }

  // Ensure last day is exact currentRank
  history[history.length - 1].rank = currentRank;

  return history;
};

/**
 * Normalizes keyword history so that every date in the target range
 * has an exact rank value. If existing history is sparse, interpolates smoothly.
 */
export const normalizeKeywordHistoryForDates = (
  existingHistory: { date: string; rank: number }[] | undefined,
  currentRank: number,
  dates: string[],
  keywordId: string = 'kw'
): Record<string, number> => {
  const dateToRank: Record<string, number> = {};

  if (!existingHistory || existingHistory.length === 0) {
    const full = generateRealistic30DayHistory(currentRank, currentRank + 2, keywordId);
    full.forEach((pt) => {
      dateToRank[pt.date] = pt.rank;
    });
    return dateToRank;
  }

  // Map known dates
  const knownMap = new Map<string, number>();
  existingHistory.forEach((h) => knownMap.set(h.date, h.rank));
  knownMap.set(dates[dates.length - 1], currentRank);

  // If we have sparse points (e.g. 6 points over 30 days), interpolate missing dates
  const knownEntries = Array.from(knownMap.entries()).sort((a, b) => {
    return dates.indexOf(a[0]) - dates.indexOf(b[0]);
  });

  if (knownEntries.length < dates.length) {
    // Fill in between known points
    dates.forEach((targetDate, dateIdx) => {
      if (knownMap.has(targetDate)) {
        dateToRank[targetDate] = knownMap.get(targetDate)!;
        return;
      }

      // Find closest before and after
      let prevPt = knownEntries[0];
      let nextPt = knownEntries[knownEntries.length - 1];

      for (const entry of knownEntries) {
        const entryIdx = dates.indexOf(entry[0]);
        if (entryIdx <= dateIdx && entryIdx >= dates.indexOf(prevPt[0])) {
          prevPt = entry;
        }
        if (entryIdx >= dateIdx && entryIdx <= dates.indexOf(nextPt[0])) {
          nextPt = entry;
        }
      }

      const pIdx = dates.indexOf(prevPt[0]);
      const nIdx = dates.indexOf(nextPt[0]);

      if (pIdx === nIdx) {
        dateToRank[targetDate] = prevPt[1];
      } else {
        const ratio = (dateIdx - pIdx) / (nIdx - pIdx);
        const interp = Math.round(prevPt[1] + (nextPt[1] - prevPt[1]) * ratio);
        dateToRank[targetDate] = Math.max(1, Math.min(100, interp));
      }
    });
  } else {
    dates.forEach((d) => {
      dateToRank[d] = knownMap.get(d) ?? currentRank;
    });
  }

  return dateToRank;
};

/**
 * Calculate statistical indicators for 30-day ranking performance
 */
export const calculateKeywordHistoryStats = (
  historyPoints: { date: string; rank: number }[]
) => {
  if (!historyPoints || historyPoints.length === 0) {
    return {
      peakRank: 1,
      lowestRank: 1,
      avgRank: '1.0',
      netChange: 0,
      daysInTop3: 0,
      daysInTop10: 0,
      volatility: '平稳',
    };
  }

  const ranks = historyPoints.map((p) => p.rank);
  const peakRank = Math.min(...ranks);
  const lowestRank = Math.max(...ranks);
  const avg = (ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(1);
  const netChange = historyPoints[0].rank - historyPoints[historyPoints.length - 1].rank;
  const daysInTop3 = ranks.filter((r) => r <= 3).length;
  const daysInTop10 = ranks.filter((r) => r <= 10).length;

  // Calculate variance/volatility
  let diffSum = 0;
  for (let i = 1; i < ranks.length; i++) {
    diffSum += Math.abs(ranks[i] - ranks[i - 1]);
  }
  const avgDailyShift = diffSum / (ranks.length - 1);
  const volatility =
    avgDailyShift > 2.5 ? '剧烈波动' : avgDailyShift > 1.2 ? '温和波动' : '稳步推进';

  return {
    peakRank,
    lowestRank,
    avgRank: avg,
    netChange,
    daysInTop3,
    daysInTop10,
    volatility,
  };
};
