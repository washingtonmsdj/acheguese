export interface NearbyBusiness {
  id: string;
  name: string;
  category: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  canonicalUrl: string;
  neighborhood?: string;
  city?: string;
  logo?: string;
  rating: number;
  verified: boolean;
}
