declare module "react-modal" {
  import type { ComponentType } from "react";

  export interface Props {
    isOpen: boolean;
    onRequestClose?: (event: React.MouseEvent | React.KeyboardEvent) => void;
    style?: { content?: React.CSSProperties; overlay?: React.CSSProperties };
    className?: string;
    overlayClassName?: string;
    closeTimeoutMS?: number;
    [key: string]: unknown;
  }

  const Modal: ComponentType<Props>;
  export default Modal;
}
