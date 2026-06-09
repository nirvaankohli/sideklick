import path from "node:path";
import fs from "node:fs";

const desiredFuseValues = {
  RunAsNode: false,
  EnableNodeOptionsEnvironmentVariable: false,
  EnableNodeCliInspectArguments: false,
  GrantFileProtocolExtraPrivileges: false,
  EnableCookieEncryption: true,
  EnableEmbeddedAsarIntegrityValidation: true,
  OnlyLoadAppFromAsar: true,
};

function resolveBinaryPathFromArg(rawPath) {
  if (!rawPath) {
    return null;
  }

  const absolutePath = path.resolve(rawPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${absolutePath}`);
  }

  if (absolutePath.endsWith(".app")) {
    const appName = path.basename(absolutePath, ".app");
    return path.join(absolutePath, "Contents", "MacOS", appName);
  }

  return absolutePath;
}

async function main() {
  const [, , targetPath] = process.argv;
  const binaryPath = resolveBinaryPathFromArg(targetPath);
  if (!binaryPath) {
    throw new Error(
      "Usage: node scripts/configure-electron-fuses.mjs <path-to-packaged-electron-binary-or-.app>",
    );
  }

  const { flipFuses, FuseVersion, FuseV1Options } = await import("@electron/fuses");

  const fuseOptions = {};
  for (const [fuseName, expectedValue] of Object.entries(desiredFuseValues)) {
    if (fuseName in FuseV1Options) {
      fuseOptions[FuseV1Options[fuseName]] = expectedValue;
    }
  }

  await flipFuses(binaryPath, {
    version: FuseVersion.V1,
    ...fuseOptions,
  });

  console.log(`[fuses] configured ${binaryPath}`);
}

main().catch((error) => {
  console.error("[fuses] configuration failed", error);
  process.exit(1);
});
