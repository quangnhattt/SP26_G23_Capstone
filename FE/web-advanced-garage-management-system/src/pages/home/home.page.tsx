import styled, { keyframes } from "styled-components";
import HeroSection from "./components/hero.section";
import StatsSection from "./components/stats.section";
import CustomerQuickView from "./components/customer.quickview";
import FeaturesContainer from "./components/features.container";
import PricingContainer from "./components/pricing.container";
import TestimonialsContainer from "./components/testimonials.container";
import React from "react";
import { AuthContext } from "@/context/AuthContext";
import { useAppDispatch } from "@/store/store";
import { setVisibleLogin } from "@/store/slices/appSlice";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ROUTER_PAGE } from "@/routes/contants";
import { FaPhoneAlt } from "react-icons/fa";

const HomePage = () => {
  const { t } = useTranslation();
  const { user } = React.useContext(AuthContext);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleBookAppointment = () => {
    if (!user) {
      dispatch(setVisibleLogin(true));
      return;
    }
    navigate(ROUTER_PAGE.booking);
  };

  const handleRescue = () => {
    if (!user) {
      dispatch(setVisibleLogin(true));
      return;
    }
    navigate(ROUTER_PAGE.rescue);
  };

  return (
    <PageContainer>
      {/* Hero Section */}
      <HeroSection />

      {/* Customer quick view — only visible for roleId=4 */}
      <CustomerQuickView />

      {/* Statistics Section */}
      <StatsSection />

      {/* Smart Management Features */}
      <FeaturesSection>
        <FeaturesContainer />
      </FeaturesSection>

      {/* Pricing Section */}
      <PricingSection>
        <PricingContainer />
      </PricingSection>

      {/* How It Works */}
      <WorkflowSection>
        <WorkflowContainer>
          <SectionHeader>
            <SectionTitle>{t("homeWorkflowTitle")}</SectionTitle>
            <SectionDescription>
              {t("homeWorkflowDesc")}
            </SectionDescription>
          </SectionHeader>

          <WorkflowGrid>
            <WorkflowStep>
              <StepNumber>
                <span>1</span>
              </StepNumber>
              <StepTitle>{t("homeWorkflowStep1Title")}</StepTitle>
              <StepDescription>
                {t("homeWorkflowStep1Desc")}
              </StepDescription>
            </WorkflowStep>

            <WorkflowStep>
              <StepNumber>
                <span>2</span>
              </StepNumber>
              <StepTitle>{t("homeWorkflowStep2Title")}</StepTitle>
              <StepDescription>
                {t("homeWorkflowStep2Desc")}
              </StepDescription>
            </WorkflowStep>

            <WorkflowStep>
              <StepNumber>
                <span>3</span>
              </StepNumber>
              <StepTitle>{t("homeWorkflowStep3Title")}</StepTitle>
              <StepDescription>
                {t("homeWorkflowStep3Desc")}
              </StepDescription>
            </WorkflowStep>

            <WorkflowStep>
              <StepNumber>
                <span>4</span>
              </StepNumber>
              <StepTitle>{t("homeWorkflowStep4Title")}</StepTitle>
              <StepDescription>
                {t("homeWorkflowStep4Desc")}
              </StepDescription>
            </WorkflowStep>
          </WorkflowGrid>
        </WorkflowContainer>
      </WorkflowSection>

      {/* Testimonials */}
      <TestimonialsSection>
        <TestimonialsContainer />
      </TestimonialsSection>

      {/* Final CTA */}
      <CTASection>
        <CTAContainer>
          <CTAIconWrapper>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </CTAIconWrapper>
          <CTATitle>{t("homeCTATitle")}</CTATitle>
          <CTADescription>
            {t("homeCTADesc")}
          </CTADescription>
          <CTAButtonGroup>
            <CTAPrimaryButton onClick={handleBookAppointment}>
              <svg fill="currentColor" viewBox="0 0 16 16">
                <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z" />
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
              </svg>
              {t("homeCTABookNow")}
            </CTAPrimaryButton>
            <CTASecondaryButton>
              <svg fill="currentColor" viewBox="0 0 16 16">
                <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
              </svg>
              {t("homeCTAPhone")}
            </CTASecondaryButton>
          </CTAButtonGroup>
        </CTAContainer>
      </CTASection>
      {/* Floating Rescue Button */}
      <RescueFloatingButton onClick={handleRescue}>
        <RescuePulse />
        <RescueIconWrapper>
          <FaPhoneAlt size={22} />
        </RescueIconWrapper>
        <RescueLabel>{t("homeRescue")}</RescueLabel>
      </RescueFloatingButton>
    </PageContainer>
  );
};

export default HomePage;

// Styled Components
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  70% {
    transform: scale(1.6);
    opacity: 0;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
`;

const PageContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #ffffff;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
`;

const FeaturesSection = styled.section`
  padding: 4rem 1rem;
  background-color: #f3f4f6;
  overflow-x: hidden;
  width: 100%;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 1rem;
`;

const SectionDescription = styled.p`
  color: #6b7280;
`;

const PricingSection = styled.section`
  padding: 4rem 1rem;
  background-color: #ffffff;
  overflow-x: hidden;
  width: 100%;
`;

const WorkflowSection = styled.section`
  padding: 4rem 1rem;
  background-color: #f3f4f6;
  overflow-x: hidden;
  width: 100%;
`;

const WorkflowContainer = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  width: 100%;
`;

const WorkflowGrid = styled.div`
  display: grid;
  gap: 2rem;
  width: 100%;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const WorkflowStep = styled.div`
  text-align: center;
  min-width: 0;
`;

const StepNumber = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: #2563eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;

  span {
    color: white;
    font-weight: bold;
    font-size: 1.25rem;
  }
`;

const StepTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #111827;
`;

const StepDescription = styled.p`
  color: #374151;
`;

const TestimonialsSection = styled.section`
  padding: 4rem 1rem;
  background-color: #ffffff;
  overflow-x: hidden;
  width: 100%;
`;

const CTASection = styled.section`
  padding: 4rem 1rem;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  overflow-x: hidden;
  width: 100%;
`;

const CTAContainer = styled.div`
  max-width: 64rem;
  margin: 0 auto;
  text-align: center;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 3rem 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  box-sizing: border-box;

  @media (min-width: 768px) {
    padding: 4rem 3rem;
  }
`;

const CTAIconWrapper = styled.div`
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1.5rem;
  background-color: #dbeafe;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 2rem;
    height: 2rem;
    color: #1d4ed8;
  }
`;

const CTATitle = styled.h2`
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    font-size: 2.25rem;
  }
`;

const CTADescription = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1rem;
  line-height: 1.6;
  max-width: 42rem;
  margin-left: auto;
  margin-right: auto;
`;

const CTAButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  align-items: center;

  @media (min-width: 640px) {
    flex-direction: row;
  }
`;

const CTAPrimaryButton = styled.button`
  background-color: #1d4ed8;
  color: white;
  padding: 0.875rem 1.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #1e40af;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const CTASecondaryButton = styled.button`
  border: 1px solid #e5e7eb;
  color: #111827;
  padding: 0.875rem 1.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const RescueFloatingButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
  transition: all 0.3s;

  &:hover {
    background: #b91c1c;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
  }

  @media (max-width: 768px) {
    bottom: 1.5rem;
    right: 1.5rem;
    padding: 0.75rem 1.25rem;
  }
`;

const RescuePulse = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50px;
  background: #dc2626;
  animation: ${pulse} 2s infinite;
  z-index: -1;
`;

const RescueIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RescueLabel = styled.span`
  font-size: 0.9375rem;
  font-weight: 700;
  white-space: nowrap;
`;
