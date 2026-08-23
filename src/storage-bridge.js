import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";

/* ============================================================
   MOBILE STORAGE BRIDGE
   Implements the exact same window.storage API the app already
   calls on desktop:
     get(key, shared) / set(key, value, shared) / delete(key, shared) / list(prefix, shared)
   "shared" has no meaning on a single-user mobile install, same as
   desktop — everything lives in one local file on the phone.

   The whole store is one JSON object (key -> string value) written to
   a single file in the app's private Data directory (not visible to
   other apps, survives app updates, removed on uninstall — the normal,
   expected behavior for local app data on Android).

   Writes go through a temp-file-then-rename pattern, same principle as
   desktop's storage.js, so a crash or the app being killed mid-write
   can never leave a half-written, corrupted file behind.
   ============================================================ */

const STORE_FILE = "zeemax-mobile-storage.json";
const STORE_TMP = "zeemax-mobile-storage.json.tmp";

async function readStoreFile() {
  try {
    const result = await Filesystem.readFile({ path: STORE_FILE, directory: Directory.Data, encoding: Encoding.UTF8 });
    const text = typeof result.data === "string" ? result.data : await result.data.text();
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function writeStoreFile(obj) {
  const json = JSON.stringify(obj);
  await Filesystem.writeFile({ path: STORE_TMP, directory: Directory.Data, data: json, encoding: Encoding.UTF8 });
  try {
    await Filesystem.rename({ from: STORE_TMP, to: STORE_FILE, directory: Directory.Data });
  } catch {
    // Some Android/webview versions don't support Filesystem.rename in
    // every configuration — fall back to a direct write, which is still
    // correct, just without the atomic temp-file guarantee.
    await Filesystem.writeFile({ path: STORE_FILE, directory: Directory.Data, data: json, encoding: Encoding.UTF8 });
    try { await Filesystem.deleteFile({ path: STORE_TMP, directory: Directory.Data }); } catch { /* fine if it never existed */ }
  }
}

export function installMobileStorageBridge() {
  window.storage = {
    async get(key) {
      const store = await readStoreFile();
      if (!(key in store)) return null;
      return { key, value: store[key], shared: false };
    },
    async set(key, value) {
      const store = await readStoreFile();
      store[key] = value;
      await writeStoreFile(store);
      return { key, value, shared: false };
    },
    async delete(key) {
      const store = await readStoreFile();
      const existed = key in store;
      delete store[key];
      await writeStoreFile(store);
      return existed ? { key, deleted: true, shared: false } : null;
    },
    async list(prefix) {
      const store = await readStoreFile();
      const keys = Object.keys(store).filter((k) => !prefix || k.startsWith(prefix));
      return { keys, prefix, shared: false };
    },
  };
}

export { STORE_FILE, readStoreFile, writeStoreFile };
