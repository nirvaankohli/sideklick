const MAX_SCREENSHOT_EDGE = 1280;
const SCREENSHOT_JPEG_QUALITY = 72;
const REDACTED_IMAGE_PLACEHOLDER = "[redacted image payload]";

export async function capturePrimaryDisplayScreenshot({
  desktopCapturer,
  screen,
  maxScreenshotEdge = MAX_SCREENSHOT_EDGE,
  jpegQuality = SCREENSHOT_JPEG_QUALITY,
}: {
  desktopCapturer: Electron.DesktopCapturer;
  screen: Electron.Screen;
  maxScreenshotEdge?: number;
  jpegQuality?: number;
}): Promise<string> {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  const maxDimension = Math.max(width, height, 1);
  const scale = Math.min(1, maxScreenshotEdge / maxDimension);
  const captureWidth = Math.max(Math.round(width * scale), 1);
  const captureHeight = Math.max(Math.round(height * scale), 1);
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: {
      width: captureWidth,
      height: captureHeight,
    },
  });

  const matchingSource =
    sources.find((source) => source.display_id === String(primaryDisplay.id)) ||
    sources[0];
  if (!matchingSource || matchingSource.thumbnail.isEmpty()) {
    throw new Error("Could not capture a screen screenshot.");
  }

  const resizedThumbnail =
    matchingSource.thumbnail.getSize().width > captureWidth ||
    matchingSource.thumbnail.getSize().height > captureHeight
      ? matchingSource.thumbnail.resize({
          width: captureWidth,
          height: captureHeight,
          quality: "good",
        })
      : matchingSource.thumbnail;

  return `data:image/jpeg;base64,${resizedThumbnail
    .toJPEG(jpegQuality)
    .toString("base64")}`;
}

export function shouldCaptureAutomaticScreenshot(payload: {
  screenshotDataUrl?: string | null;
  actionType?: string | null;
}): boolean {
  if (payload?.screenshotDataUrl) {
    return false;
  }

  const actionType =
    typeof payload?.actionType === "string" ? payload.actionType.trim() : "";

  return Boolean(actionType && actionType !== "chat");
}

export function redactImageDataUrl(value: string): string {
  return value.startsWith("data:image/")
    ? REDACTED_IMAGE_PLACEHOLDER
    : value;
}

export function redactCapturePayload(value: unknown): unknown {
  if (typeof value === "string") {
    return redactImageDataUrl(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactCapturePayload(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        redactCapturePayload(entry),
      ]),
    );
  }

  return value;
}
