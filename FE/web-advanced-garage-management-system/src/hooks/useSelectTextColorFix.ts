import { useEffect, useMemo } from "react";
import type { ThemeConfig } from "antd";

interface UseSelectTextColorFixOptions {
  key?: string;
  textColor?: string;
  placeholderColor?: string;
  backgroundColor?: string;
  popupZIndex?: number;
  useParentPopupContainer?: boolean;
}

const sanitizeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "select";

const useSelectTextColorFix = (options?: UseSelectTextColorFixOptions) => {
  const key = sanitizeKey(options?.key ?? "select");
  const textColor = options?.textColor ?? "#000";
  const placeholderColor = options?.placeholderColor ?? textColor;
  const backgroundColor = options?.backgroundColor ?? "#fff";
  const popupZIndex = options?.popupZIndex ?? 1300;
  const useParentPopupContainer = options?.useParentPopupContainer ?? true;

  const selectClassName = `${key}-select`;
  const popupClassName = `${key}-dropdown`;

  useEffect(() => {
    if (typeof document === "undefined") return;

    const styleId = `${key}-select-text-color-fix-style`;
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      .${selectClassName} .ant-select-selector,
      .${selectClassName} .ant-select-selector .ant-select-selection-item,
      .${selectClassName} .ant-select-selector .ant-select-selection-placeholder,
      .${selectClassName} .ant-select-arrow,
      .${selectClassName} .ant-select-clear {
        color: ${textColor} !important;
        -webkit-text-fill-color: ${textColor} !important;
        opacity: 1 !important;
      }

      .${selectClassName}.ant-select-disabled .ant-select-selector,
      .${selectClassName}.ant-select-disabled .ant-select-selector .ant-select-selection-item,
      .${selectClassName}.ant-select-disabled .ant-select-selector .ant-select-selection-placeholder {
        color: ${textColor} !important;
        -webkit-text-fill-color: ${textColor} !important;
        opacity: 1 !important;
      }

      .${popupClassName} .ant-select-item,
      .${popupClassName} .ant-select-item-option-content,
      .${popupClassName} .ant-select-item-option-selected .ant-select-item-option-content,
      .${popupClassName} .ant-select-item-option-active .ant-select-item-option-content,
      .${popupClassName} .ant-empty-description {
        color: ${textColor} !important;
      }
    `;

    document.head.appendChild(style);
  }, [key, popupClassName, selectClassName, textColor]);

  const configProviderTheme = useMemo<ThemeConfig>(
    () => ({
      token: {
        colorText: textColor,
        colorTextPlaceholder: placeholderColor,
      },
      components: {
        Select: {
          colorText: textColor,
          colorTextPlaceholder: placeholderColor,
          colorBgContainer: backgroundColor,
          optionSelectedColor: textColor,
          colorTextDisabled: textColor,
          colorTextQuaternary: textColor,
          zIndexPopup: popupZIndex,
        },
      },
    }),
    [backgroundColor, placeholderColor, popupZIndex, textColor],
  );

  return {
    configProviderTheme,
    selectClassName,
    popupClassName,
    getPopupContainer: useParentPopupContainer
      ? (triggerNode: HTMLElement) => triggerNode.parentElement ?? document.body
      : undefined,
  };
};

export default useSelectTextColorFix;
