/** @deprecated PublicIdentity owns slug persistence. Keep this import path for callers. */
export {
  checkBusinessSlugExists as checkSlugExists,
  getExistingBusinessSlugs as getSimilarSlugs,
} from "@/core/public-identity/adapters/BusinessIdentityAdapter";
