# Point queries and what they ask of a store

Two paths retrieve data for a selected point, chosen per hazard with
`pointQuery`.

|         | `'raster'`                                | `'bands'`                            |
| ------- | ----------------------------------------- | ------------------------------------ |
| reads   | the rendered variable only                | every band the panel shows           |
| via     | `layer.queryData` (`lib/raster-query.ts`) | zarrita direct (`lib/chaz-query.ts`) |
| used by | flood                                     | wind                                 |

## What each path requires of the store

`'raster'` asks for nothing beyond what rendering already needs. The layer owns
the projection and the pyramid level, so a store on any grid works, including
flood's 100 m Albers one, with no client-side coordinate maths.

`'bands'` is coupled to how the store was built. `chaz-query.ts` needs:

- **Every variable under one root.** It opens `0/<name>` for all seven bands off
  a single `source`. The CHAZ v1 layout spread these across three stores, so the
  v2 join is what makes one `FetchStore` enough.
- **`return_period` as a real dimension.** It opens `0/return_period` as a
  coordinate array and reads curves as `[null, iy, ix]`. Six sibling `rp_*`
  variables would mean six 2D reads each and hardcoded periods.
- **A regular 1-D `lat`/`lon` grid.** `nearestIndex` takes `coords[1] -
coords[0]` as the cell step. A projected grid would need the query point
  reprojected first.

It does not need the pyramid. It reads level `0` only.

## The chunking is not part of the contract, but the sharding could help

topozarr splits non-spatial dims to 1, chunk and shard both:

```
damage_fraction: chunks=(1, 200, 267)  shards=(1, 400, 534)
ead:             chunks=(200, 267)     shards=(400, 534)
```

The chunk part is right and neither path should want it otherwise. A chunk is
the atomic unit of compression, so a selector can choose which chunks to fetch
but can never read part of one. Left undivided, a `(6, 200, 267)` float32 chunk
is 1.25 MiB against 209 KiB for `(1, 200, 267)`, and every rendered tile would
pull six times the bytes it needs to draw one band. No client-side cleverness
recovers that.

The shard part is the one worth revisiting. A shard is a container of chunks
with an index, so a reader range-requests individual chunks inside a single
object. Pinning the shard to 1 on `return_period` puts each band in its own
object. A shard of `(6, 400, 534)` would serve both paths, since rendering would
still range-request only its one chunk.

The gain is not range coalescing. zarrita 0.7.3 issues one `getRange` per chunk
and `@zarrita/storage` has no batch API. It is that the shard index is cached
per shard path (`cache[shardPath]` in `codecs/sharding.ts`), so one shard means
one index fetch reused across all six chunks instead of six:

|                 | objects | index fetches | chunk fetches | total |
| --------------- | ------- | ------------- | ------------- | ----- |
| shard=1 (today) | 6       | 6             | 6             | 12    |
| shard=6         | 1       | 1             | 6             | 7     |

It also makes coalescing possible later, which it is not today with the ranges
spread across six objects.

That is a topozarr change, not a zarr-layer one. `metadata.py` sets
`chunks[i] = 1` and `shards[i] = 1` together for every non-spatial dim, and
`chunks_per_shard` only reaches the x/y dims, so there is no knob for it on
0.1.4.

Not urgent either way. The requests go out concurrently, and a query runs once
per click on one cell while rendering runs on every pan and zoom across many
tiles.

The load-bearing point is narrower: `chaz-query.ts` does not depend on
chunk-to-1. It would work, slightly better, without it. Do not cite the query
file as justification for the chunking, and do not treat the chunking as
something a future store must preserve for queries to work.

## Note on `'raster'` and pyramid levels

`queryRasterPoint` reads from the pyramid level on screen, so a bare map point
picked from far out returns a coarsened mean rather than the native value. That
is deliberate, matching what the map draws at that zoom.

It does not affect building selections. Clicks are gated at zoom 12
(`ZOOM_THRESHOLD` in `components/building-points.tsx`), where the screen is
finer than flood's 100 m grid, so the layer is on level 0 and the reported value
is the native one.
