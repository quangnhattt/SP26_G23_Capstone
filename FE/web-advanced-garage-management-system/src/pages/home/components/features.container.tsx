import { useTranslation } from "react-i18next";
import styled from "styled-components";

interface FeatureItem {
  id: number;
  bgColor: string;
  textColor: string;
  iconPath: string;
  titleKey: string;
  descriptionKey: string;
}

const featuresData: FeatureItem[] = [
  {
    id: 1,
    bgColor: "#dbeafe",
    textColor: "#2563eb",
    iconPath:
      "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    titleKey: "homeFeatureBookingTitle",
    descriptionKey: "homeFeatureBookingDesc",
  },
  {
    id: 2,
    bgColor: "#dcfce7",
    textColor: "#16a34a",
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    titleKey: "homeFeatureDiagnosisTitle",
    descriptionKey: "homeFeatureDiagnosisDesc",
  },
  {
    id: 3,
    bgColor: "#f3e8ff",
    textColor: "#9333ea",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
    titleKey: "homeFeatureTrackingTitle",
    descriptionKey: "homeFeatureTrackingDesc",
  },
  {
    id: 4,
    bgColor: "#fed7aa",
    textColor: "#ea580c",
    iconPath:
      "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
    titleKey: "homeFeatureSupport247Title",
    descriptionKey: "homeFeatureSupport247Desc",
  },
  {
    id: 5,
    bgColor: "#fecaca",
    textColor: "#dc2626",
    iconPath:
      "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    titleKey: "homeFeatureConsultingTitle",
    descriptionKey: "homeFeatureConsultingDesc",
  },
  {
    id: 6,
    bgColor: "#e0e7ff",
    textColor: "#4f46e5",
    iconPath:
      "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    titleKey: "homeFeatureCertTitle",
    descriptionKey: "homeFeatureCertDesc",
  },
];

const FeaturesContainer = () => {
  const { t } = useTranslation();

  return (
    <Container>
      <SectionHeader>
        <SectionTitle>{t("homeFeaturesSectionTitle")}</SectionTitle>
        <SectionDescription>
          {t("homeFeaturesSectionDesc")}
        </SectionDescription>
      </SectionHeader>

      <FeaturesGrid>
        {featuresData.map((feature) => (
          <FeatureCard key={feature.id}>
            <FeatureIcon
              $bgColor={feature.bgColor}
              $textColor={feature.textColor}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={feature.iconPath}
                />
              </svg>
            </FeatureIcon>
            <FeatureTitle>{t(feature.titleKey)}</FeatureTitle>
            <FeatureDescription>{t(feature.descriptionKey)}</FeatureDescription>
          </FeatureCard>
        ))}
      </FeaturesGrid>
    </Container>
  );
};

export default FeaturesContainer;

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

const Container = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  width: 100%;
`;

const FeaturesGrid = styled.div`
  display: grid;
  gap: 2rem;
  width: 100%;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const FeatureCard = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  min-width: 0;
`;

const FeatureIcon = styled.div<{ $bgColor: string; $textColor: string }>`
  width: 3rem;
  height: 3rem;
  background-color: ${(props) => props.$bgColor};
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;

  svg {
    width: 1.5rem;
    height: 1.5rem;
    color: ${(props) => props.$textColor};
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #6b7280;
`;

const FeatureDescription = styled.p`
  color: #6b7280;
`;
