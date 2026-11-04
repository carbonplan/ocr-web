import { IcechunkStore } from 'icechunk-js'

const stores = new Map<string, Promise<IcechunkStore>>()

// One open per repo: the session (snapshot + manifests) is shared by every
// layer and query reading from it.
export const openIcechunkStore = (url: string): Promise<IcechunkStore> => {
  let pending = stores.get(url)
  if (!pending) {
    pending = IcechunkStore.open(url, { branch: 'main' }).catch((err) => {
      stores.delete(url)
      throw err
    })
    stores.set(url, pending)
  }
  return pending
}
