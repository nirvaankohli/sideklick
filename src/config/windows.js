const sharedWindowTemplate = {
  // Point a template at a different renderer entry file if you add more UIs later.
  htmlFile: "index.html",
  title: "SideClick - Chat & Assistant",
  startMode: "expanded",
  browserWindow: {
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    roundedCorners: true,
    hasShadow: true,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: false,
  },
  layout: {
    expanded: {
      width: 520,
      height: 380,
      minWidth: 280,
      minHeight: 180,
    },
    compact: {
      width: 260,
      height: 76,
    },
    anchor: {
      horizontal: "right",
      vertical: "top",
      padding: 18,
      topOffset: 72,
    },
  },
};

const windowTemplates = {
  chat: {
    id: "chat",
    title: "SideClick - Chat & Assistant",
    description: "Chat window.",
  },
};

const startupWindows = [
  {
    windowKey: "chat",
    template: "chat",
  },
];

function mergeObjects(base, overrides) {
  const next = { ...base };

  for (const [key, value] of Object.entries(overrides || {})) {
    const baseValue = next[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      next[key] = mergeObjects(baseValue, value);
    } else {
      next[key] = value;
    }
  }

  return next;
}

function resolveWindowTemplate(templateKey) {
  const template = windowTemplates[templateKey];

  if (!template) {
    throw new Error(`Unknown window template: ${templateKey}`);
  }

  return mergeObjects(sharedWindowTemplate, template);
}

function getStartupWindowConfigs() {
  return startupWindows.map((entry) => {
    const normalizedEntry =
      typeof entry === "string" ? { template: entry } : entry;
    const templateKey = normalizedEntry.template;
    const windowKey = normalizedEntry.windowKey || templateKey;
    const overrides = normalizedEntry.overrides || {};
    const config = mergeObjects(resolveWindowTemplate(templateKey), overrides);

    return {
      windowKey,
      templateKey,
      config,
    };
  });
}

module.exports = {
  sharedWindowTemplate,
  windowTemplates,
  startupWindows,
  resolveWindowTemplate,
  getStartupWindowConfigs,
};
