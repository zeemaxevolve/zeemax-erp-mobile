import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { STORE_FILE, readStoreFile } from "./storage-bridge.js";

/* ============================================================
   MOBILE NATIVE BRIDGE
   Provides the same window.zeemaxNative shape the app already
   calls on desktop — exportBackup / pickMergeFile / importBackup —
   adapted to what's actually available on Android:

   - Export: there's no desktop-style "Save As" dialog on Android, so
     export writes a backup file into the app's Cache directory, then
     hands it to the OS Share sheet — the person picks where it goes
     (Drive, email, WhatsApp, a USB-connected computer, anywhere).
   - Merge / Import: there's no native "Open" dialog either, so both
     use a hidden HTML file input, which Android already renders as
     its own native file/document picker — no extra plugin needed.

   window.zeemaxNative.openDataFolder is deliberately NOT implemented
   here — there's no equivalent "reveal in Explorer" concept on a
   sandboxed mobile OS, so that button simply doesn't render on mobile
   (the Settings UI checks for this before showing it).
   ============================================================ */

function pickJSONFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.style.display = "none";
    input.onchange = () => {
      const file = input.files && input.files[0];
      document.body.removeChild(input);
      if (!file) { resolve({ canceled: true }); return; }
      const reader = new FileReader();
      reader.onload = () => resolve({ canceled: false, text: reader.result, name: file.name });
      reader.onerror = () => resolve({ canceled: false, error: "Could not read that file." });
      reader.readAsText(file);
    };
    document.body.appendChild(input);
    input.click();
  });
}

function parseBackupText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "That file isn't valid JSON — it doesn't look like a Zeemax ERP backup." };
  }
  const raw = parsed.zeemax_db || parsed.chemflow_db;
  if (!raw) {
    return { error: "That file doesn't contain recognizable Zeemax ERP data." };
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { error: "That backup's data is corrupted and can't be read." };
  }
  return { data };
}

export function installMobileNativeBridge() {
  window.zeemaxNative = {
    async exportBackup() {
      const store = await readStoreFile();
      const fileName = `zeemax-erp-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const json = JSON.stringify(store);
      await Filesystem.writeFile({ path: fileName, directory: Directory.Cache, data: json, encoding: Encoding.UTF8 });
      const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
      await Share.share({
        title: "Zeemax ERP Backup",
        text: "Zeemax ERP data backup — merge this into another device from Settings.",
        url: uri,
        dialogTitle: "Save or send your backup",
      });
      return { canceled: false, filePath: fileName };
    },

    async pickMergeFile() {
      const picked = await pickJSONFile();
      if (picked.canceled) return { canceled: true };
      if (picked.error) return { canceled: false, error: picked.error };
      const { data, error } = parseBackupText(picked.text);
      if (error) return { canceled: false, error };
      return { canceled: false, data, sourcePath: picked.name };
    },

    async importBackup() {
      const picked = await pickJSONFile();
      if (picked.canceled) return { canceled: true };
      if (picked.error) return { canceled: false, error: picked.error };
      let parsed;
      try {
        parsed = JSON.parse(picked.text);
      } catch {
        return { canceled: false, error: "That file isn't valid JSON — it doesn't look like a Zeemax ERP backup." };
      }
      if (typeof parsed !== "object" || parsed === null || !("zeemax_db" in parsed || "chemflow_db" in parsed)) {
        return { canceled: false, error: "That file doesn't contain recognizable Zeemax ERP data." };
      }
      try {
        const current = await Filesystem.readFile({ path: STORE_FILE, directory: Directory.Data, encoding: Encoding.UTF8 });
        await Filesystem.writeFile({ path: `${STORE_FILE}.before-import-${Date.now()}.bak`, directory: Directory.Data, data: current.data, encoding: Encoding.UTF8 });
      } catch { /* nothing to back up on a brand new install */ }
      await Filesystem.writeFile({ path: STORE_FILE, directory: Directory.Data, data: picked.text, encoding: Encoding.UTF8 });
      return { canceled: false, restoredFrom: picked.name };
    },

    async sharePDF(base64Data, fileName) {
      await Filesystem.writeFile({ path: fileName, directory: Directory.Cache, data: base64Data });
      const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
      await Share.share({
        title: fileName,
        text: `${fileName.replace(/\.pdf$/i, "")} — from Zeemax ERP`,
        url: uri,
        dialogTitle: "Share this document",
      });
      return { canceled: false, filePath: fileName };
    },

    platform: "android",
  };
}
