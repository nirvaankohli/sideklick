const cramInputConstraints = Object.freeze({
  maxMaterialCharacters: 24000,
  minMeaningfulWords: 5,
  minUniqueMeaningfulWords: 3,
});

class CramMaterialValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "CramMaterialValidationError";
    this.code = code;
  }
}

function normalizeCramMaterialInput(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function extractMeaningfulWords(value) {
  return normalizeCramMaterialInput(value)
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9'-]{2,}/g) || [];
}

function getApproxTokenCount(value) {
  return Math.ceil(normalizeCramMaterialInput(value).length / 4);
}

function validateCramMaterialInput(value) {
  const normalizedMaterial = normalizeCramMaterialInput(value);

  if (!normalizedMaterial) {
    return {
      ok: false,
      code: "empty",
      message: "Paste exam material or upload readable notes before building a cram plan.",
    };
  }

  if (normalizedMaterial.length > cramInputConstraints.maxMaterialCharacters) {
    return {
      ok: false,
      code: "too_large",
      message: `Cram Mode currently supports up to ${cramInputConstraints.maxMaterialCharacters.toLocaleString()} characters at once. Trim to the most testable notes and try again.`,
    };
  }

  const meaningfulWords = extractMeaningfulWords(normalizedMaterial);
  const uniqueMeaningfulWords = new Set(meaningfulWords);

  if (
    meaningfulWords.length < cramInputConstraints.minMeaningfulWords ||
    uniqueMeaningfulWords.size < cramInputConstraints.minUniqueMeaningfulWords
  ) {
    return {
      ok: false,
      code: "too_sparse",
      message: "Add a little more real study content. Cram Mode works best with at least a few complete concepts, definitions, or worked steps.",
    };
  }

  return {
    ok: true,
    normalizedMaterial,
    approxTokens: getApproxTokenCount(normalizedMaterial),
    meaningfulWordCount: meaningfulWords.length,
    uniqueMeaningfulWordCount: uniqueMeaningfulWords.size,
  };
}

const exported = {
  CramMaterialValidationError,
  cramInputConstraints,
  extractMeaningfulWords,
  getApproxTokenCount,
  normalizeCramMaterialInput,
  validateCramMaterialInput,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = exported;
}

if (typeof window !== "undefined") {
  window.CRAM_SHARED = exported;
}
