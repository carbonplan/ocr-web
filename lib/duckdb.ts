import type { AsyncDuckDB } from '@duckdb/duckdb-wasm'

let db: AsyncDuckDB | null = null
let initPromise: Promise<AsyncDuckDB> | null = null

export async function getDuckDB(): Promise<AsyncDuckDB> {
  if (db) return db
  if (initPromise) return initPromise

  initPromise = (async () => {
    const duckdb = await import('@duckdb/duckdb-wasm')
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)

    const workerUrl = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker!}");`], {
        type: 'text/javascript',
      }),
    )

    const worker = new Worker(workerUrl)
    const instance = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker)
    await instance.instantiate(bundle.mainModule, bundle.pthreadWorker)
    URL.revokeObjectURL(workerUrl)

    const conn = await instance.connect()
    await conn.query('SET builtin_httpfs = false;')
    await conn.query('INSTALL httpfs; LOAD httpfs;')
    await conn.query('INSTALL spatial; LOAD spatial;')
    await conn.close()

    db = instance
    return instance
  })().catch((err) => {
    initPromise = null
    throw err
  })

  return initPromise
}
