const assert = require("assert");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

// In-memory fake filesystem standing in for Capacitor's real Filesystem
// plugin, so this test can run in plain Node without an actual Android
// device/emulator.
const fakeFS = new Map();
const FakeFilesystem = {
  async readFile({ path: p }) {
    if (!fakeFS.has(p)) {
      const err = new Error("File does not exist");
      err.code = "ENOENT";
      throw err;
    }
    return { data: fakeFS.get(p) };
  },
  async writeFile({ path: p, data }) {
    fakeFS.set(p, data);
    return { uri: p };
  },
  async rename({ from, to }) {
    if (!fakeFS.has(from)) throw new Error("source does not exist");
    fakeFS.set(to, fakeFS.get(from));
    fakeFS.delete(from);
  },
  async deleteFile({ path: p }) {
    fakeFS.delete(p);
  },
};
const FakeDirectory = { Data: "DATA" };
const FakeEncoding = { UTF8: "utf8" };

// Load storage-bridge.js with @capacitor/filesystem swapped for the fake
const srcPath = path.resolve(__dirname, "src/storage-bridge.js");
const out = babel.transformFileSync(srcPath, {
  presets: [["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }]],
});
const m = new Module(srcPath, module);
m.filename = srcPath;
m.paths = Module._nodeModulePaths(path.dirname(srcPath));
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "@capacitor/filesystem") {
    return "@capacitor/filesystem-fake";
  }
  return originalResolve.call(this, request, ...rest);
};
require.cache["@capacitor/filesystem-fake"] = {
  id: "@capacitor/filesystem-fake",
  filename: "@capacitor/filesystem-fake",
  loaded: true,
  exports: { Filesystem: FakeFilesystem, Directory: FakeDirectory, Encoding: FakeEncoding },
};
m._compile(out.code, srcPath);
Module._resolveFilename = originalResolve;

const { installMobileStorageBridge } = m.exports;

global.window = {};
installMobileStorageBridge();
const storage = window.storage;

(async () => {
  console.log("--- Mobile storage bridge tests ---");

  // Test 1: missing key returns null
  {
    const res = await storage.get("nope");
    assert.strictEqual(res, null);
    console.log("✓ missing key returns null");
  }

  // Test 2: set() then get() round-trips correctly
  {
    await storage.set("zeemax_db", JSON.stringify({ hello: "world" }));
    const res = await storage.get("zeemax_db");
    assert.strictEqual(JSON.parse(res.value).hello, "world");
    console.log("✓ set() persists and get() retrieves the exact value");
  }

  // Test 3: data survives a "restart" — i.e. a fresh bridge install reading the same fake file
  {
    global.window = {};
    installMobileStorageBridge();
    const res = await window.storage.get("zeemax_db");
    assert.ok(res, "data must survive across bridge re-installs (simulated app restart)");
    assert.strictEqual(JSON.parse(res.value).hello, "world");
    console.log("✓ data survives across app restarts (fresh bridge instance, same file)");
  }

  // Test 4: multiple keys don't clobber each other
  {
    await window.storage.set("other_key", "some other value");
    const a = await window.storage.get("zeemax_db");
    const b = await window.storage.get("other_key");
    assert.ok(a && b, "both keys should coexist");
    assert.strictEqual(b.value, "some other value");
    console.log("✓ multiple keys coexist without clobbering each other");
  }

  // Test 5: list() with prefix filtering
  {
    await window.storage.set("prefix:one", "1");
    await window.storage.set("prefix:two", "2");
    await window.storage.set("noprefix", "3");
    const res = await window.storage.list("prefix:");
    assert.strictEqual(res.keys.length, 2);
    assert.ok(res.keys.includes("prefix:one") && res.keys.includes("prefix:two"));
    console.log("✓ list() correctly filters by prefix");
  }

  // Test 6: delete() removes the key
  {
    await window.storage.delete("other_key");
    const res = await window.storage.get("other_key");
    assert.strictEqual(res, null);
    console.log("✓ delete() removes the key");
  }

  // Test 7: atomic write via rename leaves no stray temp file
  {
    await window.storage.set("zeemax_db", JSON.stringify({ updated: true }));
    assert.ok(!fakeFS.has("zeemax-mobile-storage.json.tmp"), "temp file should be renamed away, not left behind");
    console.log("✓ atomic write leaves no stray .tmp file");
  }

  // Test 8: corrupted file degrades gracefully instead of crashing the app
  {
    fakeFS.set("zeemax-mobile-storage.json", "{not valid json!!");
    const res = await window.storage.get("zeemax_db");
    assert.strictEqual(res, null, "a corrupted store file should degrade to 'no data' rather than throw");
    console.log("✓ corrupted file degrades gracefully instead of throwing");
  }

  console.log("\n=== MOBILE STORAGE BRIDGE TESTS PASSED ===");
  process.exit(0);
})().catch((e) => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});
