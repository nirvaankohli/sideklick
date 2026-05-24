import { useEffect, useMemo, useState } from "react";

export const GITHUB_LATEST_RELEASE_API =
  "https://api.github.com/repos/nirvaankohli/sideklick/releases/latest";
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
): string | undefined {
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
    return matchedAsset.browser_download_url;
  }

  const firstAsset = validAssets[0];
  return firstAsset?.browser_download_url;
}

export function useDownloadTarget() {
  const [platform, setPlatform] = useState<DevicePlatform>("unknown");
  const [downloadUrl, setDownloadUrl] = useState(GITHUB_RELEASES_PAGE_URL);

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
        const response = await fetch(GITHUB_LATEST_RELEASE_API);
        if (!response.ok) {
          throw new Error(`Unable to fetch release: ${response.status}`);
        }

        const release = (await response.json()) as LatestReleaseResponse;
        if (isCancelled) {
          return;
        }

        const releasePageUrl = release.html_url ?? GITHUB_RELEASES_PAGE_URL;
        const desktopPlatform =
          platform === "mac" || platform === "windows" || platform === "linux"
            ? platform
            : undefined;
        const assets = release.assets ?? [];
        const assetUrl = desktopPlatform
          ? pickDownloadAssetUrl(assets, desktopPlatform)
          : undefined;

        setDownloadUrl(assetUrl ?? releasePageUrl);
      } catch {
        if (!isCancelled) {
          setDownloadUrl(GITHUB_RELEASES_PAGE_URL);
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

  return {
    downloadLabel: label,
    downloadUrl,
    isMobile,
  };
}

export function useDownloadLabel() {
  return useDownloadTarget().downloadLabel;
}
