import type { CountrySpatialMetadata } from './types';
import rawCountrySpatialData from './data/country_spatial_dataset.json';

export const EXTENDED_COUNTRIES_DATA: readonly CountrySpatialMetadata[] =
  rawCountrySpatialData as unknown as readonly CountrySpatialMetadata[];
