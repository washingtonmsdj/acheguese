/**
 * createGeospatialPort
 *
 * Factory que retorna a implementação de IGeospatialPort.
 * Usa GeospatialServiceMock como implementação padrão.
 */

import { GeospatialServiceMock } from '@/integrations/maps/services/GeospatialServiceMock';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import type { IGeospatialPort } from './IGeospatialPort';

export function createGeospatialPort(): IGeospatialPort {
  return new GeospatialServiceMock(createLocationRepository());
}
