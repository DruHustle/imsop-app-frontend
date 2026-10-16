import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { verifyDeployment } from "./verify-deployment.mjs";

async function fixture(run) {
  const directory = await mkdtemp(path.join(tmpdir(), "imsop-build-"));
  try {
    await mkdir(path.join(directory, "assets"));
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
test("rejects stale lazy Operations chunks even when the entry bundle is clean", () =>
  fixture(async directory => {
    await writeFile(
      path.join(directory, "assets/index.js"),
      'const base="/api";'
    );
    await writeFile(
      path.join(directory, "assets/Operations.js"),
      'fetch("https://imsop-app.onrender.com/api/operations/shipments");'
    );
    await assert.rejects(verifyDeployment(directory), /retired Render backend/);
  }));
test("accepts same-origin and Oracle bundles", () =>
  fixture(async directory => {
    await writeFile(
      path.join(directory, "assets/index.js"),
      'const base="/api";'
    );
    await writeFile(
      path.join(directory, "assets/Operations.js"),
      'const base="https://imsop-api.152-70-22-84.sslip.io";'
    );
    assert.equal(await verifyDeployment(directory), 2);
  }));
test("does not pass an absent build", () =>
  fixture(async directory => {
    await assert.rejects(verifyDeployment(directory), /Build the frontend/);
  }));
