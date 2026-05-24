/**
 * createGeospatialPort
 *
 * Factory que retorna a implementação de IGeospatialPort.
 * Usa HaversineGeospatialPort com coordenadas canônicas de locations.
 */

import { HaversineGeospatialPort } from '@/integrations/maps/services/HaversineGeospatialPort';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import type { IGeospatialPort } from './IGeospatialPort';

export function createGeospatialPort(): IGeospatialPort {
  return new HaversineGeospatialPort(createLocationRepository());
}
