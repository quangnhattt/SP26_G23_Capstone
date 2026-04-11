// src/styles/GlobalStyles.ts
import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body {
    font-family: 'Poppins', sans-serif;
    background-color: #fff;
    color: #333;
    scroll-behavior: smooth;
  }
  a {
    text-decoration: none;
    color: inherit;
  }

  /* Force black text on all Ant Design Select components */
  .ant-select-selector,
  .ant-select-selection-item,
  .ant-select-selection-search-input,
  .ant-select-item,
  .ant-select-item-option-content,
  .ant-select-item-group {
    color: #111827 !important;
  }
  .ant-select-selection-placeholder {
    color: #9ca3af !important;
  }
  .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
    background-color: #f3f4f6 !important;
  }
  .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    background-color: #dbeafe !important;
    color: #1d4ed8 !important;
  }
`;

export default GlobalStyles;
