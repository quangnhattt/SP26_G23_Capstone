import "styled-components";
import type { Theme } from "@/context/ThemeContext";

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Theme augmentation
  export interface DefaultTheme extends Theme {}
}

