const sharedWindowTemplate = {
  // Point a template at a different renderer entry file if you add more UIs later.
  htmlFile: "index.html",
  title: "SideKlick - Chat & Assistant",
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
      width: 272,
      height: 82,
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
  onboarding: {
    id: "onboarding",
    title: "SideKlick - Welcome",
    htmlFile: "onboarding.html",
    description: "First-run startup window for onboarding or setup.",
    browserWindow: {
      transparent: false,
      roundedCorners: true,
      backgroundColor: "#0d121b",
    },
    layout: {
      expanded: {
        width: 1320,
        height: 900,
        minWidth: 920,
        minHeight: 680,
        viewportWidthRatio: 0.82,
        viewportHeightRatio: 0.82,
      },
      compact: {
        width: 280,
        height: 80,
      },
      anchor: {
        horizontal: "center",
        vertical: "middle",
        padding: 18,
        topOffset: 72,
      },
    },
  },
  home: {
    id: "home",
    title: "SideKlick - Home",
    htmlFile: "home.html",
    description: "Home window with class folders.",
    layout: {
      expanded: {
        width: 920,
        height: 640,
        minWidth: 760,
        minHeight: 520,
      },
      compact: {
        width: 252,
        height: 80,
      },
    },
  },
  chat: {
    id: "chat",
    title: "SideKlick - Chat & Assistant",
    description: "Chat window.",
    layout: {
      expanded: {
        width: 760,
        height: 560,
        minWidth: 560,
        minHeight: 420,
      },
      compact: {
        width: 272,
        height: 82,
      },
    },
  },
};

const firstRunStartupWindows = [
  {
    windowKey: "onboarding",
    template: "onboarding",
  },
];

const startupWindows = [
  {
    windowKey: "home",
    template: "home",
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

function resolveStartupWindowConfigs(entries) {
  return entries.map((entry) => {
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

function getStartupWindowConfigs() {
  return resolveStartupWindowConfigs(startupWindows);
}

function getFirstRunStartupWindowConfigs() {
  return resolveStartupWindowConfigs(firstRunStartupWindows);
}

module.exports = {
  sharedWindowTemplate,
  windowTemplates,
  firstRunStartupWindows,
  startupWindows,
  resolveWindowTemplate,
  getFirstRunStartupWindowConfigs,
  getStartupWindowConfigs,
};
