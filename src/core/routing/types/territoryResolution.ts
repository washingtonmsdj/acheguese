import type { Location, TerritorialGroupWithMembers } from "@/core/location/types";

export type ResolvedTerritory =
  | { kind: "location"; location: Location }
  | { kind: "group"; group: TerritorialGroupWithMembers }
  | null;
