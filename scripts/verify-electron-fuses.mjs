import fs from "node:fs";
import path from "node:path";

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
      "Usage: pnpm run desktop:verify-fuses -- <path-to-packaged-electron-binary-or-.app>",
    );
  }

  const { FuseVersion, FuseV1Options, readFuses } = await import("@electron/fuses");
  const fuseValues = await readFuses(binaryPath, FuseVersion.V1);

  const failures = [];
  for (const [fuseName, expectedValue] of Object.entries(desiredFuseValues)) {
    if (!(fuseName in FuseV1Options)) {
      continue;
    }

    const fuseOption = FuseV1Options[fuseName];
    const actualValue = fuseValues[fuseOption];
    if (actualValue !== expectedValue) {
      failures.push({
        fuseName,
        expectedValue,
        actualValue,
      });
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(
        `[fuses] ${failure.fuseName} expected ${failure.expectedValue} but found ${failure.actualValue}`,
      );
    }
    process.exit(1);
  }

  console.log(`[fuses] verified ${path.basename(binaryPath)} with expected SideKlick fuse values`);
}

main().catch((error) => {
  console.error("[fuses] verification failed", error);
  process.exit(1);
});
