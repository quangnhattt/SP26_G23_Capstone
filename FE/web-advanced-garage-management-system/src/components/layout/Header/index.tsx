import { images } from "@/assets/imagesAsset";
import { ROUTER_PAGE } from "@/routes/contants";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  return (
    <>
      <MainHeader>
        <Nav>
        <LogoSection
            onClick={() => {
              navigate(ROUTER_PAGE.home);
              window.scrollTo({ top: 0, behavior: "smooth" });
              setIsMobileMenuOpen(false);
            }}
          >
            <img
              style={{ height: 50, width: 50 }}
              src={images.logo_app}
              alt="Logo"
            />
            <LogoText>{t("nameProject")}</LogoText>
          </LogoSection>
        </Nav>
      </MainHeader>
    </>
  );
};

export default Header;

const MainHeader = styled.div`
  position: relative;
  width: 100%;
  z-index: 100;
`;

const Nav = styled.nav`
  position: fixed;
  top: 0;
  width: 100%;
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 3rem;
  z-index: 100;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
    position: relative;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  flex-shrink: 0;
`;

const LogoText = styled.h1`
  color: #333;
  font-size: 1.25rem;
  font-family: "Playfair Display", serif;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;
