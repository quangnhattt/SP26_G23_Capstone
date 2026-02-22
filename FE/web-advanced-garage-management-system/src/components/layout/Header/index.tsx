import type { DeviceProps } from "@/constants/types";
import useDevice from "@/hooks/useDevice";
import type React from "react";
import { useRef } from "react";
import styled from "styled-components";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const { isMobile } = useDevice();
  const contentRef = useRef<HTMLDivElement>(null);


    return (
        <MainHeader ref={contentRef} isMobile={isMobile ? 1 : 0} id="headerGarage">
            <div>hhhh</div>
        </MainHeader>
    );
}


export default Header;

const MainHeader = styled.div<DeviceProps>`
  display: flex;
  color: #ffffff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  flex-direction: column;
  padding-top: 0;
  width: 100%;
  height: auto;
  min-height: ${({ isMobile }) => (isMobile === 1 ? "54px" : "100px")};
  z-index: 1000;
`;
