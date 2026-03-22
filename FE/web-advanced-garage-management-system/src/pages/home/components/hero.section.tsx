import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { AuthContext } from "@/context/AuthContext";
import React from "react";
import { useAppDispatch } from "@/store/store";
import { setVisibleLogin } from "@/store/slices/appSlice";
import { useNavigate } from "react-router-dom";
import { ROUTER_PAGE } from "@/routes/contants";

const HeroSection = () => {
  const {t} = useTranslation();
  const { user } = React.useContext(AuthContext);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();


  return (
    <HeroSectionContainer>
      <HeroContainer>
        <HeroSubtitle>{t("heroSubtitle")}</HeroSubtitle>
        <HeroTitle>
          {t("heroTitle1")}
          <br />
          <HeroHighlight>{t("heroTitleHighlight1")}</HeroHighlight> {t("and")}{" "}
          <HeroHighlight>{t("heroTitleHighlight2")}</HeroHighlight>
        </HeroTitle>
        <HeroDescription>
          {t("heroDescription")}
        </HeroDescription>
        <ButtonGroup>
          <ButtonRow>
            <PrimaryButton 
              onClick={() => {
                if (!user) {
                  dispatch(setVisibleLogin(true));
                  return;
                }
                navigate(ROUTER_PAGE.booking);
              }}
              type="button"
            >
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 0a.5.5 0 0 1 .5.5v7h7a.5.5 0 0 1 0 1h-7v7a.5.5 0 0 1-1 0v-7h-7a.5.5 0 0 1 0-1h7v-7A.5.5 0 0 1 8 0z" />
              </svg>
              {t("bookAppointmentNow")}
            </PrimaryButton>
            {user?.roleID === 4 && (
              <>
                <SecondaryButton
                  onClick={() => navigate(ROUTER_PAGE.appointments)}
                  type="button"
                >
                  {t("heroMyAppointments")}
                  <svg
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"
                    />
                  </svg>
                </SecondaryButton>
                <SecondaryButton type="button">
                  {t("viewCustomerPortal")}
                  <svg
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"
                    />
                  </svg>
                </SecondaryButton>
              </>
            )}
            {user && [1, 2, 3].includes(user.roleID) && (
              <SecondaryButton
                onClick={() => navigate(ROUTER_PAGE.admin)}
                type="button"
              >
                {t("accessAdminDashboard")}
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path
                    fillRule="evenodd"
                    d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"
                  />
                </svg>
              </SecondaryButton>
            )}
          </ButtonRow>
        </ButtonGroup>
      </HeroContainer>
    </HeroSectionContainer>
  );
};

export default HeroSection;

const HeroSectionContainer = styled.section`
  padding: 2.5rem 0;
  background-color: #f3f4f6;
  overflow-x: hidden;
   &:first-child {
    border-top: none;
  }

  @media (max-width: 768px) {
    padding: 1.5rem 0;
  }
`;

const HeroContainer = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  text-align: center;
  padding: 0 1rem;
  width: 100%;
`;

const HeroSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
  font-weight: 400;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
  line-height: 1.1;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }

  @media (min-width: 1024px) {
    font-size: 4rem;
  }
`;

const HeroHighlight = styled.span`
  color: #1d4ed8;
  font-weight: 700;
`;

const HeroDescription = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 2.5rem;
  max-width: 50rem;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.7;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  align-items: center;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;

  @media (min-width: 640px) {
    flex-direction: row;
    gap: 1rem;
  }
`;

const PrimaryButton = styled.button`
  background-color: #1d4ed8;
  color: white;
  padding: 0.875rem 1.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  pointer-events: auto;

  &:hover {
    background-color: #1e40af;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  svg {
    width: 18px;
    height: 18px;
    pointer-events: none;
  }
`;

const SecondaryButton = styled.button`
  border: 1px solid #e5e7eb;
  color: #111827;
  padding: 0.875rem 1.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;
