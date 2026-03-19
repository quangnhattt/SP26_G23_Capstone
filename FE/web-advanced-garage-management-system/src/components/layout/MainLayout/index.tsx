import MobileDrawer from "@/components/common/modal/MobileDrawerModal";
import { ROUTER_PAGE } from "@/routes/contants";
import useDevice from "@/hooks/useDevice";
import useWindowDimensions from "@/hooks/useWindowDimension";
import type React from "react";
import { Outlet, useLocation } from "react-router-dom";
import styled from "styled-components";
import Header from "../Header";
import Footer from "../Footer";

const MainLayout: React.FC = () => {
  const { isMobile } = useDevice();
  const { height } = useWindowDimensions();
  const { pathname } = useLocation();
  const isLightPage =
    pathname === ROUTER_PAGE.contact || pathname === ROUTER_PAGE.about;

  return (
    <>
      <Container
        $isContactPage={isLightPage}
        style={{ minHeight: height }}
      >
        <Header/>
        <Content
          $isContactPage={isLightPage}
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

const Container = styled.div<{ $isContactPage?: boolean }>`
  display: flex;
  flex-direction: column;
  background-color: ${({ $isContactPage }) => ($isContactPage ? "#ffffff" : "#0e1225")};
  flex: 1;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  overflow-x: auto;
`;

const Content = styled.div<{ $isContactPage?: boolean }>`
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100%;
  overflow-x: auto;
  background-color: ${({ $isContactPage }) => ($isContactPage ? "#ffffff" : "transparent")};
`;

const OutletContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow-x: hidden;
`;
