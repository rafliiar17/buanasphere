import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const ratesTable = sqliteTable(
  'rates',
  {
    id: text('id').primaryKey(), // provider_base_quote e.g. bca_USD_IDR
    provider: text('provider').notNull(),
    baseCurrency: text('base_currency').notNull(),
    quoteCurrency: text('quote_currency').notNull(),
    buyRate: real('buy_rate').notNull(),
    sellRate: real('sell_rate').notNull(),
    midRate: real('mid_rate').notNull(),
    spread: real('spread').notNull(),
    retrievedAt: text('retrieved_at').notNull(),
    providerTimestamp: text('provider_timestamp'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_rates_pair').on(table.baseCurrency, table.quoteCurrency),
    index('idx_rates_provider').on(table.provider),
  ]
);

export const rateHistoryTable = sqliteTable(
  'rate_history',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    provider: text('provider').notNull(),
    baseCurrency: text('base_currency').notNull(),
    quoteCurrency: text('quote_currency').notNull(),
    buyRate: real('buy_rate').notNull(),
    sellRate: real('sell_rate').notNull(),
    midRate: real('mid_rate').notNull(),
    spread: real('spread').notNull(),
    timestamp: text('timestamp').notNull(),
  },
  (table) => [
    index('idx_history_pair_time').on(table.baseCurrency, table.quoteCurrency, table.timestamp),
    index('idx_history_provider').on(table.provider),
  ]
);

export const apiKeysTable = sqliteTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    keyHash: text('key_hash').notNull().unique(),
    name: text('name').notNull(),
    tier: text('tier').notNull().default('free'), // free | pro | enterprise
    ownerEmail: text('owner_email').notNull(),
    createdAt: text('created_at').notNull(),
    lastUsedAt: text('last_used_at'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [
    uniqueIndex('idx_api_keys_hash').on(table.keyHash),
  ]
);

export const quarantineRatesTable = sqliteTable(
  'quarantine_rates',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    provider: text('provider').notNull(),
    baseCurrency: text('base_currency').notNull(),
    quoteCurrency: text('quote_currency').notNull(),
    buyRate: real('buy_rate').notNull(),
    sellRate: real('sell_rate').notNull(),
    reason: text('reason').notNull(),
    rawPayload: text('raw_payload'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_quarantine_created').on(table.createdAt),
  ]
);

export type RateRow = typeof ratesTable.$inferSelect;
export type InsertRateRow = typeof ratesTable.$inferInsert;

export type RateHistoryRow = typeof rateHistoryTable.$inferSelect;
export type InsertRateHistoryRow = typeof rateHistoryTable.$inferInsert;

export type ApiKeyRow = typeof apiKeysTable.$inferSelect;
export type InsertApiKeyRow = typeof apiKeysTable.$inferInsert;

export type QuarantineRateRow = typeof quarantineRatesTable.$inferSelect;
export type InsertQuarantineRateRow = typeof quarantineRatesTable.$inferInsert;
