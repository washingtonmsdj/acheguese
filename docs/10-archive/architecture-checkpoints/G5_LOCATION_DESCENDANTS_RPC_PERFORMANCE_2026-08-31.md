# G5 — Location descendants RPC performance evidence — 2026-08-31

Status: **CLOSED for the optimization slice; G5 remains in progress.**

This document records the evidence for the optimization of `public.rpc_get_location_descendants_ids(uuid)` introduced by migration `20260831030016_optimize_location_descendants_prefix_g5.sql`.

## Scope

The RPC is the canonical ID-only descendant resolver used by the location hierarchy read model. This slice does **not** replace it with full-row location reads and does **not** change territorial-group semantics, grants, volatility, or execution authority.

The migration preserves:

- `LANGUAGE plpgsql`;
- `STABLE` volatility;
- security invoker behavior (`prosecdef = false`);
- fixed `search_path = public, pg_temp`;
- existing EXECUTE grants for `anon`, `authenticated` and `service_role`;
- territorial groups resolved through `territorial_group_members`;
- normal locations resolved by `geographic_path = v_path OR geographic_path LIKE v_path || '/%'`.

The prefix branch is supported by the G5 `text_pattern_ops` index on `locations.geographic_path` installed earlier in the same phase.

## Semantic equivalence

The live project `xhdowzacfujckjelqhtd` was revalidated on 2026-08-31 against direct set construction.

| sample | RPC count | direct count | exact set match |
| --- | ---: | ---: | --- |
| Bahia state (`35448ab5-6028-47a8-85d3-af2d212d1cb4`) | 1484 | 1484 | yes |
| Salvador city (`63c41c29-adce-40f5-a552-e52d176123c3`) | 195 | 195 | yes |
| Acupe de Brotas district (`43d104bd-9ed9-4ee6-912c-805aa9d4a97d`) | 1 | 1 | yes |
| territorial group (`fc322564-17cf-4de0-95f1-d78672750e8d`) | 4 | 4 | yes |

The comparison sorts and compares the UUID sets rather than relying only on cardinality.

## Performance history

Before the prefix-based implementation, the Salvador RPC path had been measured at approximately **103 ms** in the G5 investigation.

During the original migration validation, the optimized implementation showed:

- first post-create/cold observation: approximately **201.4 ms**;
- subsequent warm observation: approximately **24.44 ms**.

Those numbers were intentionally not collapsed into a single headline because cache state materially affects the measurement.

### 2026-08-31 live revalidation

A fresh `EXPLAIN (ANALYZE, BUFFERS)` of the canonical Salvador call produced:

- first observed execution in the session: **147.109 ms**, `shared hit=822`;
- immediate warm execution: **0.630 ms**, `shared hit=39`.

This confirms two things:

1. the optimized RPC remains live and correct;
2. cold/warm variance is large enough that no single per-call latency should be treated as a guaranteed production SLA.

The robust conclusion remains architectural: the RPC now uses the indexed geographic-path prefix strategy instead of the older recursive descendant traversal for normal locations, while preserving exact result semantics.

## Decision

- Keep `LocationHierarchyReadService.getDescendantIds()` on `rpc_get_location_descendants_ids`.
- Do not regress to full-row descendant queries for callers that need IDs only.
- Do not remove the normal/unique geographic-path indexes; the `text_pattern_ops` index is supplemental.
- Do not quote the fastest warm-cache observation as a guaranteed latency.
- Any future performance regression should be compared using the same location ID, result cardinality and cache-state notes.

## Source authority

- migration: `supabase/migrations/20260831030016_optimize_location_descendants_prefix_g5.sql`;
- source owner: `src/core/location/services/LocationHierarchyReadService.ts`;
- canonical RPC: `public.rpc_get_location_descendants_ids(uuid)`.

This evidence closes the missing documentation for the G5 location-descendants optimization. It does not close the remaining G5 operational blockers and does not authorize starting G6.
