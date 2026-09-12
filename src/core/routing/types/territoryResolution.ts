import type { Location } from "@/core/location/types";
import type { TerritorialGroupWithMembers } from "@/core/territorial/contracts";

export type ResolvedTerritory =
  | { kind: "location"; location: Location }
  | { kind: "group"; group: TerritorialGroupWithMembers }
  | null;
