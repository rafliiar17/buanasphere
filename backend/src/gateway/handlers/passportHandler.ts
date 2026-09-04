import type { MicroappHandler } from '../types.ts';
import type { Env } from '../../db/index.ts';
import passportRawData from '../data/passport_dataset.json';

export interface PassportScoreItem {
  visaFree: number;
  rank: number;
  indoRequirement: string;
}

export interface PassportRankedCountry extends PassportScoreItem {
  iso3: string;
  entryStatus?: string;
}

export interface PassportLookupResult {
  iso3: string;
  rank: number;
  visaFree: number;
  indoRequirement: string;
  entryStatus?: string;
  found: boolean;
  error?: string;
}

export interface PassportListResult {
  totalRanked: number;
  rankings: PassportRankedCountry[];
  entryStatusMap: Record<string, string>;
  source: string;
}

const scoresMap = (passportRawData.scores || passportRawData.PASSPORT_SCORES || {}) as Record<
  string,
  PassportScoreItem
>;
const entryStatusMap = (passportRawData.entryStatus ||
  passportRawData.PASSPORT_ENTRY_STATUS_MAP ||
  {}) as Record<string, string>;

// Pre-sort rankings by rank ascending, then visaFree descending
const sortedRankings: PassportRankedCountry[] = Object.entries(scoresMap)
  .map(([iso3, score]) => ({
    iso3,
    rank: score.rank,
    visaFree: score.visaFree,
    indoRequirement: score.indoRequirement,
    entryStatus: entryStatusMap[iso3] || score.indoRequirement,
  }))
  .sort((a, b) => a.rank - b.rank || b.visaFree - a.visaFree);

export const passportHandler: MicroappHandler = {
  id: 'passport',
  name: 'Passport Power Index',
  description:
    'Global passport mobility ranking scores, visa-free access destination counts, and country passport lookup based on ISO-3',
  version: '1.0.0',
  cacheTtlSeconds: 86400,
  async handle(
    params: Record<string, any> = {},
    _env?: Env
  ): Promise<PassportLookupResult | PassportListResult> {
    const rawIso = params.iso3 || params.country || params.code;

    if (rawIso) {
      const targetIso = String(rawIso).trim().toUpperCase();
      const score = scoresMap[targetIso];

      if (!score) {
        return {
          iso3: targetIso,
          rank: -1,
          visaFree: 0,
          indoRequirement: 'Unknown',
          found: false,
          error: `Country ISO-3 '${targetIso}' not found in passport mobility database`,
        };
      }

      return {
        iso3: targetIso,
        rank: score.rank,
        visaFree: score.visaFree,
        indoRequirement: score.indoRequirement,
        entryStatus: entryStatusMap[targetIso] || score.indoRequirement,
        found: true,
      };
    }

    return {
      totalRanked: sortedRankings.length,
      rankings: sortedRankings,
      entryStatusMap,
      source: 'Passport Power Index',
    };
  },
};
