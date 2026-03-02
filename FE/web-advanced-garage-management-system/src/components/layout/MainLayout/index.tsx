import MobileDrawer from "@/components/common/modal/MobileDrawerModal";
import { useTheme } from "@/context/ThemeContext";
import useDevice from "@/hooks/useDevice";
import useWindowDimensions from "@/hooks/useWindowDimension";
import type React from "react";
import { Outlet } from "react-router-dom";
import styled from "styled-components";
import Header from "../Header";
import Footer from "../Footer";

const MainLayout: React.FC = () => {
  const { theme } = useTheme();
  const { isMobile } = useDevice();
  const { height } = useWindowDimensions();

  return (
    <>
      <Container style={{ backgroundColor: theme.black, minHeight: height }}>
        <Header/>
        <Content
          style={{
            marginTop: isMobile ? "60px" : "70px",
          }}
        >
          <OutletContent>
            <Outlet />
          </OutletContent>
        </Content>
        <Footer/>
      </Container>
      <MobileDrawer />
    </>
  );
};

export default MainLayout;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #0e1225;
  flex: 1;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  overflow-x: auto;
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  // min-height: calc(100vh - 180px);
  height: 100%;
  overflow-x: auto;
`;

const OutletContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;
