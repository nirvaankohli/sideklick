const fs = require("node:fs");
const path = require("node:path");

const desiredFuseValues = {
  RunAsNode: false,
  EnableNodeOptionsEnvironmentVariable: false,
  EnableNodeCliInspectArguments: false,
  GrantFileProtocolExtraPrivileges: false,
  EnableCookieEncryption: true,
  EnableEmbeddedAsarIntegrityValidation: true,
  OnlyLoadAppFromAsar: true,
};

function resolveBinaryPath(context) {
  const productFilename = context?.packager?.appInfo?.productFilename || "SideKlick";

  if (process.platform === "darwin") {
    const appPath = path.join(context.appOutDir, `${productFilename}.app`);
    return path.join(appPath, "Contents", "MacOS", productFilename);
  }

  if (process.platform === "win32") {
    return path.join(context.appOutDir, `${productFilename}.exe`);
  }

  return path.join(context.appOutDir, productFilename);
}

module.exports = async function afterPack(context) {
  const binaryPath = resolveBinaryPath(context);
  if (!fs.existsSync(binaryPath)) {
    console.warn(`[fuses] skipped because binary was not found at ${binaryPath}`);
    return;
  }

  const { flipFuses, readFuses, FuseVersion, FuseV1Options } = require("@electron/fuses");
  const fuseOptions = { version: FuseVersion.V1 };

  for (const [fuseName, expectedValue] of Object.entries(desiredFuseValues)) {
    if (!(fuseName in FuseV1Options)) {
      continue;
    }

    fuseOptions[FuseV1Options[fuseName]] = expectedValue;
  }

  await flipFuses(binaryPath, fuseOptions);
  const currentFuses = await readFuses(binaryPath, FuseVersion.V1);

  const mismatches = [];
  for (const [fuseName, expectedValue] of Object.entries(desiredFuseValues)) {
    if (!(fuseName in FuseV1Options)) {
      continue;
    }

    const fuseOption = FuseV1Options[fuseName];
    if (currentFuses[fuseOption] !== expectedValue) {
      mismatches.push(`${fuseName}=${currentFuses[fuseOption]} (expected ${expectedValue})`);
    }
  }

  if (mismatches.length > 0) {
    throw new Error(`[fuses] verification failed: ${mismatches.join(", ")}`);
  }

  console.log(`[fuses] configured and verified for ${binaryPath}`);
};
