/**
 * Compatibility facade for legacy map geocoding imports.
 * Canonical geocoding ownership lives in core/location and core/geocoding.
 */

export {
  GeocodingService,
  geocodingService,
} from "./MapGeocodingAdapter";

export type {
  ForwardGeocodeResult,
  ReverseGeocodeResult,
} from "./MapGeocodingAdapter";