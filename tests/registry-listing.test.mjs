import assert from "node:assert/strict";
import { test } from "node:test";

import {
  fetchRegistryJson,
  loadVerificationInput,
  parseArgs,
  publishedVersionForCheck,
  retryVerification,
  verifyRegistryListing,
  warnAboutVersionDifference,
} from "../scripts/verify-registry-listing.mjs";

const packageJson = {
  name: "molecare-mcp",
  version: "1.1.0",
  mcpName: "io.github.MoleCare/molecare-mcp",
};

const serverJson = {
  name: "io.github.MoleCare/molecare-mcp",
  version: "1.1.0",
  packages: [
    {
      registryType: "npm",
      identifier: "molecare-mcp",
      version: "1.1.0",
    },
  ],
};

const registryServer = {
  name: "io.github.MoleCare/molecare-mcp",
  version: "1.1.0",
  packages: [
    {
      registryType: "npm",
      identifier: "molecare-mcp",
      version: "1.1.0",
    },
  ],
};

const registryResponse = {
  server: registryServer,
  _meta: {
    "io.modelcontextprotocol.registry/official": {
      status: "active",
    },
  },
};

const validInput = {
  packageJson,
  serverJson,
  registryResponse,
  latestRegistryResponse: { server: structuredClone(registryServer) },
  npmMetadata: {
    version: "1.1.0",
    mcpName: "io.github.MoleCare/molecare-mcp",
  },
  latestNpmVersion: "1.1.0",
};

function withInput(overrides) {
  return structuredClone({ ...validInput, ...overrides });
}

function withPublishedVersion(version) {
  const input = withInput({ expectedPublishedVersion: version, latestNpmVersion: version });
  input.registryResponse.server.version = version;
  input.registryResponse.server.packages[0].version = version;
  input.latestRegistryResponse.server.version = version;
  input.latestRegistryResponse.server.packages[0].version = version;
  input.npmMetadata.version = version;
  return input;
}

test("accepts matching local, registry, and npm metadata", () => {
  assert.deepEqual(verifyRegistryListing(withInput()), {
    name: "io.github.MoleCare/molecare-mcp",
    package: "molecare-mcp",
    version: "1.1.0",
  });
});

test("rejects a registry server version that differs from package.json", () => {
  const input = withInput();
  input.registryResponse.server.version = "1.0.0";
  assert.throws(() => verifyRegistryListing(input), /registry server version mismatch/);
});

test("rejects a registry package identifier or type that differs from server.json", () => {
  const input = withInput();
  input.registryResponse.server.packages[0].registryType = "pypi";
  assert.throws(() => verifyRegistryListing(input), /registry packages mismatch/);
});

test("rejects an extra package in the registry entry", () => {
  const input = withInput();
  input.registryResponse.server.packages.push({
    registryType: "npm",
    identifier: "unexpected-package",
    version: "1.1.0",
  });
  assert.throws(() => verifyRegistryListing(input), /registry packages mismatch/);
});

test("rejects an npm mcpName that differs from the registry server name", () => {
  const input = withInput();
  input.npmMetadata.mcpName = "io.github.someone/another-server";
  assert.throws(() => verifyRegistryListing(input), /published npm mcpName mismatch/);
});

test("rejects an npm version that no longer represents the latest release", () => {
  const input = withInput({ latestNpmVersion: "1.2.0" });
  assert.throws(() => verifyRegistryListing(input), /npm latest version mismatch/);
});

test("scheduled checks select npm latest when main is awaiting a release", () => {
  assert.equal(publishedVersionForCheck("1.2.0", "1.1.0", true), "1.1.0");
  assert.equal(publishedVersionForCheck("1.2.0", "1.1.0", false), "1.2.0");
});

test("published-latest mode is explicit and rejects unknown arguments", () => {
  assert.deepEqual(parseArgs([]), { verifyPublishedLatest: false });
  assert.deepEqual(parseArgs(["--verify-published-latest"]), { verifyPublishedLatest: true });
  assert.throws(() => parseArgs(["--typo"]), /unknown argument: --typo/);
});

test("published-latest mode emits a warning only when the local version differs", () => {
  const warnings = [];
  assert.equal(warnAboutVersionDifference("1.2.0", "1.1.0", (text) => warnings.push(text)), true);
  assert.equal(warnAboutVersionDifference("1.1.0", "1.1.0", (text) => warnings.push(text)), false);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /^::warning /);
  assert.match(warnings[0], /package\.json is 1\.2\.0, while npm latest is 1\.1\.0/);
});

test("published-latest mode queries the actual release when local manifests are ahead", async () => {
  const localPackageJson = { ...packageJson, version: "1.2.0" };
  const localServerJson = structuredClone(serverJson);
  localServerJson.version = "1.2.0";
  localServerJson.packages[0].version = "1.2.0";
  const npmSpecs = [];
  const registryUrls = [];

  const input = await loadVerificationInput({
    packageJson: localPackageJson,
    serverJson: localServerJson,
    registryBaseUrl: "https://registry.example/",
    verifyPublishedLatest: true,
    npmViewImpl: async (packageSpec) => {
      npmSpecs.push(packageSpec);
      if (packageSpec.endsWith("@latest")) return "1.1.0";
      assert.equal(packageSpec, "molecare-mcp@1.1.0");
      return validInput.npmMetadata;
    },
    fetchRegistryJsonImpl: async (url) => {
      registryUrls.push(url);
      return url.endsWith("/latest")
        ? validInput.latestRegistryResponse
        : validInput.registryResponse;
    },
  });

  assert.deepEqual(npmSpecs, ["molecare-mcp@latest", "molecare-mcp@1.1.0"]);
  assert.deepEqual(registryUrls, [
    "https://registry.example/v0.1/servers/io.github.MoleCare%2Fmolecare-mcp/versions/1.1.0",
    "https://registry.example/v0.1/servers/io.github.MoleCare%2Fmolecare-mcp/versions/latest",
  ]);
  assert.deepEqual(verifyRegistryListing(input), {
    name: "io.github.MoleCare/molecare-mcp",
    package: "molecare-mcp",
    version: "1.1.0",
  });
});

test("scheduled checks still verify the latest published release", () => {
  assert.deepEqual(verifyRegistryListing(withPublishedVersion("1.0.0")), {
    name: "io.github.MoleCare/molecare-mcp",
    package: "molecare-mcp",
    version: "1.0.0",
  });
});

test("scheduled checks still reject drift in the latest published release", () => {
  const input = withPublishedVersion("1.0.0");
  input.latestRegistryResponse.server.version = "0.9.0";
  assert.throws(() => verifyRegistryListing(input), /latest registry version mismatch/);
});

test("scheduled checks still reject the wrong package version", () => {
  const input = withPublishedVersion("1.0.0");
  input.registryResponse.server.packages[0].version = "0.9.0";
  assert.throws(() => verifyRegistryListing(input), /registry npm package version mismatch/);
});

test("rejects a deprecated npm package version", () => {
  const input = withInput();
  input.npmMetadata.deprecated = "use a newer release";
  assert.throws(() => verifyRegistryListing(input), /is deprecated/);
});

test("rejects an inactive registry entry", () => {
  const input = withInput();
  input.registryResponse._meta["io.modelcontextprotocol.registry/official"].status = "deprecated";
  assert.throws(() => verifyRegistryListing(input), /registry entry status mismatch/);
});

test("rejects a registry version that is no longer latest", () => {
  const input = withInput();
  input.latestRegistryResponse.server.version = "1.2.0";
  assert.throws(() => verifyRegistryListing(input), /latest registry version mismatch/);
});

test("retries while a successful registry response still contains stale metadata", async () => {
  let calls = 0;
  const verified = await retryVerification(
    async () => {
      calls += 1;
      const input = withInput();
      if (calls === 1) input.latestRegistryResponse.server.version = "1.0.0";
      return input;
    },
    { attempts: 2, retryDelayMs: 0 },
  );

  assert.equal(verified.version, "1.1.0");
  assert.equal(calls, 2);
});

test("retries a registry lookup while a published entry propagates", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response("not ready", { status: 404 });
    }
    return new Response(JSON.stringify(registryResponse), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await fetchRegistryJson("https://registry.example/server", {
    attempts: 2,
    retryDelayMs: 0,
    fetchImpl,
  });

  assert.deepEqual(result, registryResponse);
  assert.equal(calls, 2);
});

test("fails loudly after the registry retry budget is exhausted", async () => {
  await assert.rejects(
    fetchRegistryJson("https://registry.example/server", {
      attempts: 2,
      retryDelayMs: 0,
      fetchImpl: async () => new Response("still missing", { status: 404 }),
    }),
    /HTTP 404: still missing/,
  );
});
