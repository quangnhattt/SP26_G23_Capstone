import { images } from "@/assets/imagesAsset";
import { ROUTER_PAGE } from "@/routes/contants";
import { IconMapPin, IconMail, IconPhone } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <FooterWrapper>
      <FooterTop>
        <FooterGrid>
          {/* Column 1: Company branding */}
          <BrandColumn>
            <BrandSection onClick={() => handleNavigate(ROUTER_PAGE.home)}>
              <img
                style={{ height: 75, width: 75 }}
                src={images.logo_app}
                alt="Logo"
              />
              <BrandName>{t("nameProject")}</BrandName>
            </BrandSection>
            <Description>{t("footerDescription")}</Description>
          </BrandColumn>

          {/* Column 2: Services */}
          <Column>
            <ColumnTitle>{t("services")}</ColumnTitle>
            <List>
              <ListItem onClick={() => handleNavigate(ROUTER_PAGE.services)}>
                {t("periodicMaintenance")}
              </ListItem>
              <ListItem onClick={() => handleNavigate(ROUTER_PAGE.services)}>
                {t("engineRepair")}
              </ListItem>
              <ListItem onClick={() => handleNavigate(ROUTER_PAGE.services)}>
                {t("brakeSystem")}
              </ListItem>
              <ListItem onClick={() => handleNavigate(ROUTER_PAGE.services)}>
                {t("acElectrical")}
              </ListItem>
            </List>
          </Column>

          {/* Column 3: Support */}
          <Column>
            <ColumnTitle>{t("support")}</ColumnTitle>
            <List>
              <ListItem onClick={() => handleNavigate(ROUTER_PAGE.services)}>
                {t("faq")}
              </ListItem>
              <ListItem onClick={() => handleNavigate(ROUTER_PAGE.pricing)}>
                {t("pricing")}
              </ListItem>
              <ListItem onClick={() => handleNavigate(ROUTER_PAGE.about)}>
                {t("warrantyPolicy")}
              </ListItem>
              <ListItem onClick={() => handleNavigate(ROUTER_PAGE.contact)}>
                {t("contact")}
              </ListItem>
            </List>
          </Column>

          {/* Column 4: Contact */}
          <Column>
            <ColumnTitle>{t("contact")}</ColumnTitle>
            <ContactList>
              <ContactItem>
                <IconWrapper>
                  <IconMapPin size={18} stroke={2} />
                </IconWrapper>
                <span>{t("footerAddress")}</span>
              </ContactItem>
              <ContactItem>
                <IconWrapper>
                  <IconPhone size={18} stroke={2} />
                </IconWrapper>
                <span>{t("footerPhone")}</span>
              </ContactItem>
              <ContactItem>
                <IconWrapper>
                  <IconMail size={18} stroke={2} />
                </IconWrapper>
                <span>{t("footerEmail")}</span>
              </ContactItem>
            </ContactList>
          </Column>
        </FooterGrid>
      </FooterTop>

      <FooterBottom>
        <Copyright>{t("copyright", { year: new Date().getFullYear() })}</Copyright>
      </FooterBottom>
    </FooterWrapper>
  );
};

export default Footer;

const FooterWrapper = styled.footer`
  background: #ffffff;
  width: 100%;
  border-top: 1px solid #e9ecef;
`;

const FooterTop = styled.div`
  padding: 3rem 8rem 2rem;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 1200px) {
    padding: 2.5rem 4rem 1.5rem;
  }

  @media (max-width: 768px) {
    padding: 2rem 1.5rem 1rem;
  }
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
  gap: 3rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    align-items: center;
    justify-items: center;
    text-align: center;
  }
`;

const BrandColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 600px) {
    align-items: center;
    text-align: center;
  }
`;

const BrandSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  flex-shrink: 0;

  @media (max-width: 600px) {
    justify-content: center;
  }
`;

const BrandName = styled.h3`
  color: #333;
  font-size: 1.25rem;
  font-family: "Playfair Display", serif;
  font-weight: 600;
  margin: 0;
`;

const Description = styled.p`
  color: #6c757d;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  max-width: 280px;

  @media (max-width: 600px) {
    margin: 0 auto;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 600px) {
    align-items: center;
    text-align: center;
  }
`;

const ColumnTitle = styled.h4`
  color: #333;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (max-width: 600px) {
    align-items: center;
  }
`;

const ListItem = styled.li`
  color: #6c757d;
  font-size: 0.95rem;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #007bff;
  }
`;

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: fit-content;

  @media (max-width: 600px) {
    align-items: center;
  }
`;

const ContactItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
  color: #6c757d;
  font-size: 0.95rem;
  line-height: 1.5;
  align-self: flex-start;

  span {
    flex: 0 1 auto;
    min-width: 0;
  }

  @media (max-width: 600px) {
    justify-content: center;
    align-items: center;
    align-self: center;
  }
`;

const IconWrapper = styled.span`
  color: #adb5bd;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-top: 2px;
`;

const FooterBottom = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 8rem;
  border-top: 2px solid #e0e0e0;
  text-align: center;

  @media (max-width: 1200px) {
    padding: 1.25rem 4rem;
  }

  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
  }
`;

const Copyright = styled.p`
  color: #000;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
`;
