import MobileDrawer from "@/components/common/modal/MobileDrawerModal";
import { useTheme } from "@/context/ThemeContext";
import useDevice from "@/hooks/useDevice";
import useWindowDimensions from "@/hooks/useWindowDimension";
import type React from "react";
import { Outlet } from "react-router-dom";
import styled from "styled-components";
import Header from "../Header";

const MainLayout: React.FC = () => {
  const { theme } = useTheme();
  const { isMobile } = useDevice();
  const { height } = useWindowDimensions();

  return (
    <div>
      <Container style={{ backgroundColor: theme.black, minHeight: height }}>
        <Header/>
        <Content
          style={{
            marginTop: isMobile ? "80px" : "90px",
          }}
        >
          <OutletContent>
            <Outlet />
          </OutletContent>
        </Content>
      </Container>
      <MobileDrawer />
    </div>
  );
};

export default MainLayout;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #0e1225;
  flex: 1;
  height: 100%;
  overflow: hidden;
  overflow-x: auto;
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  // min-height: calc(100vh - 180px);
  height: 100%;

  margin-top: 115px;
  // margin-bottom: 80px;
  overflow-x: auto;
`;

const OutletContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;
