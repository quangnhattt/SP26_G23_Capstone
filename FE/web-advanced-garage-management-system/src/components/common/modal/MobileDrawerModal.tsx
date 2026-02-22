import React from "react";
import Modal from "react-modal";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { appSelector, setVisibleDrawer } from "@/store/slices/appSlice";
import { useTheme } from "@/context/ThemeContext";
import "./DrawerModal.css";

interface LoginModalProps {
  // You can add any additional props you need for the modal here
}

export interface LoginModalHandle {
  openModal: () => void;
  closeModal: () => void;
}

const MobileDrawer: React.FC<LoginModalProps> = (props) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { visibleDrawer } = useAppSelector(appSelector);

  const handleRequestClose = React.useCallback(() => {
    dispatch(setVisibleDrawer(false));
  }, [dispatch]);

  React.useEffect(() => {
    if (visibleDrawer) {
      document.body.style.overflow = "hidden";
      document.body.style.pointerEvents = "none";
    } else {
      document.body.style.overflow = "auto";
      document.body.style.pointerEvents = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      document.body.style.pointerEvents = "auto";
    };
  }, [visibleDrawer]);

  return (
    <Modal
      {...props}
      isOpen={visibleDrawer}
      onRequestClose={handleRequestClose}
      style={{
        content: {
          backgroundColor: theme.primaryColor,
          pointerEvents: "auto",
        },
        overlay: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          zIndex: 1001,
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 1,
          transition:
            "backdrop-filter 100ms ease-in-out, opacity 100ms ease-in-out",
          backdropFilter: "blur(10px)",
        },
      }}
      closeTimeoutMS={100}
      // overlayClassName={"modal-overlay"}
      className={"modal-content"}
    >
      {/* <Sidebar fromModal={true} /> */}
    </Modal>
  );
};

export default MobileDrawer;
