import type { TFunction } from "i18next";

/**
 * Lines that are only `[ENUM]` map to `invoiceLineTag_<ENUM>` (shared: invoice + service order detail).
 */
export function formatLineItemBracketLines(text: string, t: TFunction): string {
  if (!text) return "";
  return text
    .split(/\r?\n/)
    .map((line) => {
      const m = line.trim().match(/^\[([A-Z][A-Z0-9_]*)\]$/);
      if (!m) return line;
      const key = `invoiceLineTag_${m[1]}`;
      return String(t(key, { defaultValue: line }));
    })
    .join("\n");
}

/** Maps `sourceType` from API to `invoiceSourceType_<value>` when a label exists. */
export function formatLineItemSourceTypeDisplay(
  sourceType: string,
  t: TFunction,
): string {
  if (!sourceType) return "—";
  return String(
    t(`invoiceSourceType_${sourceType}`, { defaultValue: sourceType }),
  );
}
