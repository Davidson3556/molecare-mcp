#!/usr/bin/env node

import { execFile as execFileCallback } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const DEFAULT_REGISTRY_URL = "https://registry.modelcontextprotocol.io";
const OFFICIAL_METADATA_KEY = "io.modelcontextprotocol.registry/official";

function assertMatch(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label} mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function getNpmPackage(serverJson) {
  const npmPackages = serverJson.packages?.filter((entry) => entry.registryType === "npm") ?? [];
  if (npmPackages.length !== 1) {
    throw new Error(`server.json must declare exactly one npm package; found ${npmPackages.length}`);
  }
  return npmPackages[0];
}

function unwrapServer(response, label) {
  if (!response || typeof response !== "object" || !response.server) {
    throw new Error(`${label} response does not contain a server object`);
  }
  return response.server;
}

export function verifyRegistryListing({
  packageJson,
  serverJson,
  registryResponse,
  latestRegistryResponse,
  npmMetadata,
  latestNpmVersion,
}) {
  const expectedPackage = getNpmPackage(serverJson);
  const registryServer = unwrapServer(registryResponse, "registry version");
  const latestRegistryServer = unwrapServer(latestRegistryResponse, "registry latest-version");

  assertMatch(serverJson.version, packageJson.version, "server.json version");
  assertMatch(packageJson.mcpName, serverJson.name, "package.json mcpName");
  assertMatch(expectedPackage.identifier, packageJson.name, "server.json npm identifier");
  assertMatch(expectedPackage.version, packageJson.version, "server.json npm package version");

  assertMatch(registryServer.name, serverJson.name, "registry server name");
  assertMatch(registryServer.version, packageJson.version, "registry server version");

  const expectedPackageIdentities = (serverJson.packages ?? [])
    .map((entry) => `${entry.registryType}:${entry.identifier}`)
    .sort();
  const publishedPackageIdentities = (registryServer.packages ?? [])
    .map((entry) => `${entry.registryType}:${entry.identifier}`)
    .sort();
  if (JSON.stringify(publishedPackageIdentities) !== JSON.stringify(expectedPackageIdentities)) {
    throw new Error(
      `registry packages mismatch: expected ${expectedPackageIdentities.join(", ") || "no packages"}; ` +
        `got ${publishedPackageIdentities.join(", ") || "no packages"}`,
    );
  }
  const registryPackage = registryServer.packages?.find(
    (entry) =>
      entry.identifier === expectedPackage.identifier &&
      entry.registryType === expectedPackage.registryType,
  );
  if (!registryPackage) {
    const publishedPackages = (registryServer.packages ?? [])
      .map((entry) => `${entry.registryType}:${entry.identifier}`)
      .join(", ");
    throw new Error(
      `registry package mismatch: expected ${expectedPackage.registryType}:${expectedPackage.identifier}; ` +
        `got ${publishedPackages || "no packages"}`,
    );
  }
  assertMatch(registryPackage.version, packageJson.version, "registry npm package version");

  const registryStatus = registryResponse._meta?.[OFFICIAL_METADATA_KEY]?.status;
  assertMatch(registryStatus, "active", "registry entry status");
  assertMatch(latestRegistryServer.name, serverJson.name, "latest registry server name");
  assertMatch(latestRegistryServer.version, packageJson.version, "latest registry version");

  assertMatch(npmMetadata.version, packageJson.version, "published npm version");
  assertMatch(npmMetadata.mcpName, registryServer.name, "published npm mcpName");
  if (typeof npmMetadata.deprecated === "string" && npmMetadata.deprecated.trim()) {
    throw new Error(
      `npm package ${packageJson.name}@${packageJson.version} is deprecated: ${npmMetadata.deprecated}`,
    );
  }
  assertMatch(latestNpmVersion, packageJson.version, "npm latest version");

  return {
    name: registryServer.name,
    package: expectedPackage.identifier,
    version: packageJson.version,
  };
}

function wait(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

export async function retryVerification(
  loadInput,
  { attempts = 6, retryDelayMs = 5_000 } = {},
) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return verifyRegistryListing(await loadInput());
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      console.warn(
        `Verification attempt ${attempt}/${attempts} failed: ${lastError.message}; ` +
          `retrying in ${retryDelayMs}ms`,
      );
      await wait(retryDelayMs);
    }
  }

  throw new Error(
    `registry and npm did not converge after ${attempts} attempts: ${lastError?.message ?? "unknown error"}`,
  );
}

export async function fetchRegistryJson(
  url,
  { attempts = 6, retryDelayMs = 5_000, fetchImpl = fetch } = {},
) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });

      if (response.ok) {
        return await response.json();
      }

      const responseBody = (await response.text()).slice(0, 500);
      lastError = new Error(
        `registry returned HTTP ${response.status}${responseBody ? `: ${responseBody}` : ""}`,
      );
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      console.warn(
        `Registry lookup attempt ${attempt}/${attempts} failed; retrying in ${retryDelayMs}ms`,
      );
      await wait(retryDelayMs);
    }
  }

  throw new Error(`could not fetch ${url}: ${lastError?.message ?? "unknown error"}`);
}

async function npmView(packageSpec, ...fields) {
  try {
    const { stdout } = await execFile("npm", ["view", packageSpec, ...fields, "--json"], {
      maxBuffer: 1024 * 1024,
      timeout: 15_000,
    });
    return JSON.parse(stdout);
  } catch (error) {
    const detail = error.stderr?.trim() || error.message;
    throw new Error(`npm view ${packageSpec} failed: ${detail}`);
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function main() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const [packageJson, serverJson] = await Promise.all([
    readJson(resolve(root, "package.json")),
    readJson(resolve(root, "server.json")),
  ]);
  const npmPackage = getNpmPackage(serverJson);
  const registryBaseUrl = (process.env.MCP_REGISTRY_URL || DEFAULT_REGISTRY_URL).replace(/\/$/, "");
  const encodedName = encodeURIComponent(serverJson.name);
  const encodedVersion = encodeURIComponent(packageJson.version);
  const versionUrl = `${registryBaseUrl}/v0.1/servers/${encodedName}/versions/${encodedVersion}`;
  const latestUrl = `${registryBaseUrl}/v0.1/servers/${encodedName}/versions/latest`;
  const exactPackageSpec = `${npmPackage.identifier}@${packageJson.version}`;

  const verified = await retryVerification(async () => {
    const [registryResponse, latestRegistryResponse, npmMetadata, latestNpmVersion] =
      await Promise.all([
        fetchRegistryJson(versionUrl, { attempts: 1 }),
        fetchRegistryJson(latestUrl, { attempts: 1 }),
        npmView(exactPackageSpec, "version", "mcpName", "deprecated"),
        npmView(`${npmPackage.identifier}@latest`, "version"),
      ]);

    return {
      packageJson,
      serverJson,
      registryResponse,
      latestRegistryResponse,
      npmMetadata,
      latestNpmVersion,
    };
  });
  console.log(
    `Verified ${verified.name} ${verified.version}: registry and npm package ${verified.package} agree`,
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(`Registry verification failed: ${error.message}`);
    process.exitCode = 1;
  });
}
