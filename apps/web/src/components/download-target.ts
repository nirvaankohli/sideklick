import { useEffect, useMemo, useState } from "react";

export const GITHUB_RELEASES_API =
  "https://api.github.com/repos/nirvaankohli/sideklick/releases";
export const GITHUB_RELEASES_PAGE_URL =
  "https://github.com/nirvaankohli/sideklick/releases";

type DevicePlatform = "mobile" | "mac" | "windows" | "linux" | "unknown";
type DesktopPlatform = Exclude<DevicePlatform, "mobile" | "unknown">;

type ReleaseAsset = {
  name?: string;
  browser_download_url?: string;
};

type LatestReleaseResponse = {
  html_url?: string;
  assets?: ReleaseAsset[];
};

function detectPlatform(): DevicePlatform {
  if (typeof window === "undefined") {
    return "unknown";
  }

  const userAgentData = window.navigator.userAgentData as
    | { mobile?: boolean; platform?: string }
    | undefined;
  const userAgent = window.navigator.userAgent;
  const platform = userAgentData?.platform ?? window.navigator.platform;
  const isTouchMac =
    platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  const isMobile =
    userAgentData?.mobile === true ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    ) ||
    isTouchMac;

  if (isMobile) {
    return "mobile";
  }

  if (/Mac/i.test(platform)) {
    return "mac";
  }

  if (/Win/i.test(platform)) {
    return "windows";
  }

  if (/Linux/i.test(platform)) {
    return "linux";
  }

  return "unknown";
}

function getDownloadLabel(platform: DevicePlatform): string {
  if (platform === "mac") {
    return "Download for Mac";
  }

  if (platform === "windows") {
    return "Download for Windows";
  }

  if (platform === "linux") {
    return "Download for Linux";
  }

  return "Download app";
}

function pickDownloadAssetUrl(
  assets: ReleaseAsset[],
  platform: DesktopPlatform,
): { url: string; name: string } | undefined {
  const validAssets = assets.filter(
    (asset): asset is { name: string; browser_download_url: string } =>
      Boolean(asset.name) && Boolean(asset.browser_download_url),
  );

  if (validAssets.length === 0) {
    return undefined;
  }

  const patternByPlatform: Record<DesktopPlatform, RegExp[]> = {
    mac: [/\bmac\b/i, /\bdarwin\b/i, /\.dmg$/i, /\.pkg$/i],
    windows: [/\bwin(dows)?\b/i, /\.exe$/i, /\.msi$/i],
    linux: [/\blinux\b/i, /\.appimage$/i, /\.deb$/i, /\.rpm$/i],
  };

  const patterns = patternByPlatform[platform];
  const matchedAsset = validAssets.find((asset) =>
    patterns.some((pattern) => pattern.test(asset.name)),
  );

  if (matchedAsset) {
    return {
      url: matchedAsset.browser_download_url,
      name: matchedAsset.name,
    };
  }

  const firstAsset = validAssets[0];
  if (!firstAsset) {
    return undefined;
  }

  return {
    url: firstAsset.browser_download_url,
    name: firstAsset.name,
  };
}

function triggerBrowserDownload(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function downloadAssetToDevice(
  url: string,
  fileName: string,
): Promise<void> {
  triggerBrowserDownload(url, fileName);
}

export function useDownloadTarget() {
  const [platform, setPlatform] = useState<DevicePlatform>("unknown");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadFileName, setDownloadFileName] = useState("sideklick");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  useEffect(() => {
    if (platform === "mobile") {
      return;
    }

    let isCancelled = false;

    const fetchLatestRelease = async () => {
      try {
        const response = await fetch(GITHUB_RELEASES_API);
        if (!response.ok) {
          throw new Error(`Unable to fetch release: ${response.status}`);
        }

        const releases = (await response.json()) as LatestReleaseResponse[];
        if (isCancelled) {
          return;
        }

        const release = releases[0];
        if (!release) {
          throw new Error("No releases found");
        }

        const desktopPlatform =
          platform === "mac" || platform === "windows" || platform === "linux"
            ? platform
            : undefined;
        const assets = release.assets ?? [];
        const asset = desktopPlatform
          ? pickDownloadAssetUrl(assets, desktopPlatform)
          : undefined;
        setDownloadUrl(asset?.url ?? "");
        setDownloadFileName(asset?.name ?? "sideklick");
      } catch {
        if (!isCancelled) {
          setDownloadUrl("");
          setDownloadFileName("sideklick");
        }
      }
    };

    void fetchLatestRelease();

    return () => {
      isCancelled = true;
    };
  }, [platform]);

  const label = useMemo(() => getDownloadLabel(platform), [platform]);
  const isMobile = platform === "mobile";
  const canDownload = downloadUrl.length > 0;

  return {
    canDownload,
    downloadLabel: label,
    downloadFileName,
    downloadUrl,
    isMobile,
  };
}
