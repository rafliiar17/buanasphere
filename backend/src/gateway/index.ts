import { MicroappRegistry, defaultGatewayRegistry } from './registry.ts';
import { quakeHandler } from './handlers/quakeHandler.ts';
import { populationHandler } from './handlers/populationHandler.ts';
import { timeHandler } from './handlers/timeHandler.ts';
import { passportHandler } from './handlers/passportHandler.ts';
import { flightHandler } from './handlers/flightHandler.ts';
import { natureHandler } from './handlers/natureHandler.ts';
import { capitalsHandler } from './handlers/capitalsHandler.ts';

export * from './types.ts';
export * from './registry.ts';
export {
  quakeHandler,
  populationHandler,
  timeHandler,
  passportHandler,
  flightHandler,
  natureHandler,
  capitalsHandler,
};

/**
 * Registers all microapp dataset and ingestion handlers into the provided MicroappRegistry.
 */
export function registerAllMicroappHandlers(registry: MicroappRegistry): void {
  registry.register(quakeHandler);
  registry.register(populationHandler);
  registry.register(timeHandler);
  registry.register(passportHandler);
  registry.register(flightHandler);
  registry.register(natureHandler);
  registry.register(capitalsHandler);
}

// Auto-register all handlers into default instance
registerAllMicroappHandlers(defaultGatewayRegistry);
