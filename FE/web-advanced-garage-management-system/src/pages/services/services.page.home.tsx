import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  IconTool,
  IconCalendar,
  IconPhone,
  IconEngine,
  IconBolt,
  IconSnowflake,
  IconHandStop,
  IconCarGarage,
  IconPaint,
  IconSparkles,
  IconCertificate,
  IconShieldCheck,
  IconSettings,
  IconArrowRight,
  IconClock,
} from "@tabler/icons-react";

const ServicesPageHome = () => {
  const { t } = useTranslation();

  const serviceCategories = [
    {
      icon: IconTool,
      titleKey: "serviceMaintTitle",
      descKey: "serviceMaintDesc",
      itemKeys: ["serviceMaintItem1", "serviceMaintItem2", "serviceMaintItem3", "serviceMaintItem4", "serviceMaintItem5"],
      priceKey: "serviceMaintPrice",
      duration: null,
      priceNoteKey: null,
      popular: true,
    },
    {
      icon: IconEngine,
      titleKey: "serviceRepairTitle",
      descKey: "serviceRepairDesc",
      itemKeys: ["serviceRepairItem1", "serviceRepairItem2", "serviceRepairItem3", "serviceRepairItem4", "serviceRepairItem5"],
      priceKey: "serviceRepairPrice",
      priceNoteKey: "serviceRepairNote",
      duration: null,
      popular: false,
    },
    {
      icon: IconBolt,
      titleKey: "serviceElecTitle",
      descKey: "serviceElecDesc",
      itemKeys: ["serviceElecItem1", "serviceElecItem2", "serviceElecItem3", "serviceElecItem4", "serviceElecItem5"],
      priceKey: "serviceElecPrice",
      duration: "~60 phút",
      priceNoteKey: null,
      popular: false,
    },
    {
      icon: IconSnowflake,
      titleKey: "serviceACTitle",
      descKey: "serviceACDesc",
      itemKeys: ["serviceACItem1", "serviceACItem2", "serviceACItem3", "serviceACItem4", "serviceACItem5"],
      priceKey: "serviceACPrice",
      duration: "~120 phút",
      priceNoteKey: null,
      popular: true,
    },
    {
      icon: IconHandStop,
      titleKey: "serviceBrakeTitle",
      descKey: "serviceBrakeDesc",
      itemKeys: ["serviceBrakeItem1", "serviceBrakeItem2", "serviceBrakeItem3", "serviceBrakeItem4", "serviceBrakeItem5"],
      priceKey: "serviceBrakePrice",
      duration: "~60 phút",
      priceNoteKey: null,
      popular: false,
    },
    {
      icon: IconCarGarage,
      titleKey: "serviceTireTitle",
      descKey: "serviceTireDesc",
      itemKeys: ["serviceTireItem1", "serviceTireItem2", "serviceTireItem3", "serviceTireItem4", "serviceTireItem5"],
      priceKey: "serviceTirePrice",
      duration: "~45 phút",
      priceNoteKey: null,
      popular: false,
    },
    {
      icon: IconPaint,
      titleKey: "serviceBodyTitle",
      descKey: "serviceBodyDesc",
      itemKeys: ["serviceBodyItem1", "serviceBodyItem2", "serviceBodyItem3", "serviceBodyItem4", "serviceBodyItem5"],
      priceKey: "serviceBodyPrice",
      duration: "1-7 ngày",
      priceNoteKey: null,
      popular: false,
    },
    {
      icon: IconSparkles,
      titleKey: "serviceUpgradeTitle",
      descKey: "serviceUpgradeDesc",
      itemKeys: ["serviceUpgradeItem1", "serviceUpgradeItem2", "serviceUpgradeItem3", "serviceUpgradeItem4", "serviceUpgradeItem5"],
      priceKey: "serviceUpgradePrice",
      priceNoteKey: "serviceUpgradeNote",
      duration: null,
      popular: false,
    },
  ];

  return (
    <PageContainer>
      {/* Hero Section */}
      <HeroSection>
        <HeroContainer>
          <HeroBadge>
            <IconSettings size={16} />
            {t("servicePageBadge")}
          </HeroBadge>
          <HeroTitle>
            {t("servicePageTitle")}
            <br />
            <HeroHighlight>{t("servicePageTitleHighlight")}</HeroHighlight>
          </HeroTitle>
          <HeroDescription>
            {t("servicePageDescription")}
          </HeroDescription>
          <HeroButtonGroup>
            <PrimaryButton>
              <IconCalendar size={18} />
              {t("servicePageBookNow")}
            </PrimaryButton>
            <SecondaryButton>
              <IconPhone size={18} />
              {t("servicePageFreeConsult")}
            </SecondaryButton>
          </HeroButtonGroup>
        </HeroContainer>
      </HeroSection>

      {/* Stats Section */}
      <StatsSection>
        <StatsGrid>
          <StatItem>
            <StatNumber>15+</StatNumber>
            <StatLabel>{t("serviceStatYears")}</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>50,000+</StatNumber>
            <StatLabel>{t("serviceStatCarsRepaired")}</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>98%</StatNumber>
            <StatLabel>{t("serviceStatSatisfaction")}</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>24/7</StatNumber>
            <StatLabel>{t("serviceStatSupport")}</StatLabel>
          </StatItem>
        </StatsGrid>
      </StatsSection>

      {/* Service Categories */}
      <CategoriesSection>
        <SectionContainer>
          <SectionHeader>
            <SectionTitle>{t("serviceCategoryTitle")}</SectionTitle>
            <SectionDescription>
              {t("serviceCategoryDescription")}
            </SectionDescription>
          </SectionHeader>

          <ServicesGrid>
            {serviceCategories.map((service, index) => {
              const Icon = service.icon;
              return (
                <ServiceCard key={index}>
                  <CardHeader>
                    <IconWrapper>
                      <Icon size={24} />
                    </IconWrapper>
                    {service.popular && <PopularBadge>{t("servicePopular")}</PopularBadge>}
                  </CardHeader>
                  <CardTitle>{t(service.titleKey)}</CardTitle>
                  <CardDescription>{t(service.descKey)}</CardDescription>
                  <ItemList>
                    {service.itemKeys.map((key, i) => (
                      <ItemRow key={i}>
                        <ItemDot />
                        {t(key)}
                      </ItemRow>
                    ))}
                  </ItemList>
                  <CardFooter>
                    <PriceInfo>
                      <PriceText>{t(service.priceKey)}</PriceText>
                      {service.duration && (
                        <DurationText>
                          <IconClock size={14} />
                          {service.duration}
                        </DurationText>
                      )}
                      {service.priceNoteKey && !service.duration && (
                        <DurationText>{t(service.priceNoteKey)}</DurationText>
                      )}
                    </PriceInfo>
                    <BookButton>
                      {t("serviceBookBtn")} <IconArrowRight size={16} />
                    </BookButton>
                  </CardFooter>
                </ServiceCard>
              );
            })}
          </ServicesGrid>
        </SectionContainer>
      </CategoriesSection>

      {/* Why Choose Us */}
      <WhyChooseSection>
        <SectionContainer>
          <SectionTitle>{t("serviceWhyChooseTitle")}</SectionTitle>
          <WhyChooseGrid>
            <WhyChooseItem>
              <WhyChooseIcon>
                <IconCertificate size={28} color="#2563eb" />
              </WhyChooseIcon>
              <WhyChooseTitle>{t("serviceWhyCertifiedTitle")}</WhyChooseTitle>
              <WhyChooseDesc>{t("serviceWhyCertifiedDesc")}</WhyChooseDesc>
            </WhyChooseItem>
            <WhyChooseItem>
              <WhyChooseIcon>
                <IconShieldCheck size={28} color="#2563eb" />
              </WhyChooseIcon>
              <WhyChooseTitle>{t("serviceWhyWarrantyTitle")}</WhyChooseTitle>
              <WhyChooseDesc>{t("serviceWhyWarrantyDesc")}</WhyChooseDesc>
            </WhyChooseItem>
            <WhyChooseItem>
              <WhyChooseIcon>
                <IconSettings size={28} color="#2563eb" />
              </WhyChooseIcon>
              <WhyChooseTitle>{t("serviceWhyPartsTitle")}</WhyChooseTitle>
              <WhyChooseDesc>{t("serviceWhyPartsDesc")}</WhyChooseDesc>
            </WhyChooseItem>
          </WhyChooseGrid>
        </SectionContainer>
      </WhyChooseSection>

      {/* CTA Banner */}
      <CTABanner>
        <CTAContainer>
          <CTAContent>
            <CTATitle>{t("serviceCTATitle")}</CTATitle>
            <CTADescription>{t("serviceCTADescription")}</CTADescription>
          </CTAContent>
          <CTAButtonGroup>
            <CTAPrimaryButton>{t("serviceCTAContact")}</CTAPrimaryButton>
            <CTAOutlineButton>{t("serviceCTAPricing")}</CTAOutlineButton>
          </CTAButtonGroup>
        </CTAContainer>
      </CTABanner>
    </PageContainer>
  );
};

export default ServicesPageHome;

// Styled Components
const PageContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #ffffff;
  width: 100%;
  overflow-x: hidden;
`;

const HeroSection = styled.section`
  padding: 3.5rem 1rem;
  background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
  text-align: center;
`;

const HeroContainer = styled.div`
  max-width: 72rem;
  margin: 0 auto;
`;

const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  padding: 0.375rem 1rem;
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 1.25rem;
`;

const HeroTitle = styled.h1`
  font-size: 2.75rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  margin-bottom: 1.25rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const HeroHighlight = styled.span`
  color: #2563eb;
  font-style: italic;
`;

const HeroDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.7;
  margin-bottom: 2rem;
`;

const HeroButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #2563eb;
  color: #ffffff;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1d4ed8;
  }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #ffffff;
  color: #374151;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  border: 1px solid #d1d5db;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }
`;

const StatsSection = styled.section`
  padding: 2.5rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  max-width: 72rem;
  margin: 0 auto;
  text-align: center;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const StatItem = styled.div``;

const StatNumber = styled.h3`
  font-size: 2rem;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`;

const CategoriesSection = styled.section`
  padding: 4rem 1rem;
  background: #f8fafc;
`;

const SectionContainer = styled.div`
  max-width: 72rem;
  margin: 0 auto;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
  text-align: center;
`;

const SectionDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const ServiceCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, border-color 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #bfdbfe;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const IconWrapper = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  background: #eff6ff;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
`;

const PopularBadge = styled.span`
  background: #dcfce7;
  color: #16a34a;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.375rem;
`;

const CardDescription = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 0.75rem;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
  flex: 1;
`;

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #374151;
`;

const ItemDot = styled.span`
  width: 5px;
  height: 5px;
  background: #2563eb;
  border-radius: 50%;
  flex-shrink: 0;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
  margin-top: auto;
`;

const PriceInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const PriceText = styled.span`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #2563eb;
`;

const DurationText = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #9ca3af;
`;

const BookButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;

  &:hover {
    color: #1d4ed8;
  }
`;

const WhyChooseSection = styled.section`
  padding: 4rem 1rem;
  background: #ffffff;
`;

const WhyChooseGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-top: 2.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const WhyChooseItem = styled.div`
  text-align: center;
  padding: 1.5rem;
`;

const WhyChooseIcon = styled.div`
  width: 3.5rem;
  height: 3.5rem;
  background: #eff6ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const WhyChooseTitle = styled.h3`
  font-size: 1.0625rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
`;

const WhyChooseDesc = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
`;

const CTABanner = styled.section`
  padding: 2.5rem 1rem;
  background: #2563eb;
`;

const CTAContainer = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
`;

const CTAContent = styled.div``;

const CTATitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
`;

const CTADescription = styled.p`
  font-size: 0.9375rem;
  color: #bfdbfe;
`;

const CTAButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const CTAPrimaryButton = styled.button`
  background: #ffffff;
  color: #2563eb;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #f0f9ff;
  }
`;

const CTAOutlineButton = styled.button`
  background: transparent;
  color: #ffffff;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.6);
  }
`;
