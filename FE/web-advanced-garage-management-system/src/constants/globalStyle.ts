import type { Theme } from "@/context/ThemeContext";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle<{ theme: Theme }>`
  html {
    height: 100%;
    scroll-behavior: smooth;

    &::-webkit-scrollbar {
      width: 5px !important;
      margin-right: 1 !important;
      background-color: ${({ theme }) => `${theme.black} !important`} ;
    }

    &::-webkit-scrollbar-track {
      background-color: transparent !important;
    }

    &::-webkit-scrollbar-thumb {
      background-color: ${({ theme }) => `${theme.hightlai} !important`} ;
      border-radius: 8px;
    }

    @media (max-width: 768px) {
      &::-webkit-scrollbar {
        display: none !important;
      }

      -ms-overflow-style: none !important;
      scrollbar-width: none !important;
    }
  }

  input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}

  body {
    font-family: 'Jost', sans-serif;

    &::-webkit-scrollbar {
      width: 5px !important;
      margin-right: 1 !important;
      background-color: ${({ theme }) => `${theme.black} !important`} ;
    }

    &::-webkit-scrollbar-track {
      background-color: transparent !important;
    }

    &::-webkit-scrollbar-thumb {
      background-color: ${({ theme }) => `${theme.hightlai} !important`} ;
      border-radius: 8px;
    }

    @media (max-width: 768px) {
      &::-webkit-scrollbar {
        display: none !important;
      }

      -ms-overflow-style: none !important;
      scrollbar-width: none !important;
    }
  }

  :root {
   --toastify-color-light: #fff;
  --toastify-color-dark: #121212;
  --toastify-color-info: #69A9F9;
  --toastify-color-success: #69A9F9;
  --toastify-color-warning: #f1c40f;
  --toastify-color-error: #FF4646;
  --toastify-toast-background: #fff;
  }

  * {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
  }

  input[type="datetime-local"],
  input[type="email"],
  input[type="month"],
  input[type="number"],
  input[type="password"],
  input[type="search"],
  input[type="tel"],
  input[type="text"],
  input[type="time"],
  input[type="url"],
  input[type="week"],
  select:focus,

  input, textarea {
    // font-size: 14px;
    font-family: 'Jost', sans-serif;
    color: ${({ theme }) => theme.white}
  }
  
  div {
    font-family: 'Jost', sans-serif;
    color: ${({ theme }) => theme.white}
  }

  p {
    font-family: 'Jost', sans-serif;
    color: ${({ theme }) => theme.white}
  }

  button {
    color: ${({ theme }) => theme.white}
  }

  

`;

export default GlobalStyle;
