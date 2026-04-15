export { EventsService } from './services/EventsService';
export type { Event, CreateEventInput } from './services/EventsService';

// Re-export removido: o client de banco não deve ser re-exportado de domínios de negócio.
// Use os services do próprio domínio.
