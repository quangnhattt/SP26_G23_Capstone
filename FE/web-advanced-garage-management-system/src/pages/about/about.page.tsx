import { images } from "@/assets/imagesAsset";
import { ROUTER_PAGE } from "@/routes/contants";
import {
  IconBulb,
  IconCar,
  IconCertificate,
  IconClock,
  IconHeart,
  IconMapPin,
  IconPhone,
  IconShield,
  IconStar,
  IconTool,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

const PRIMARY_BLUE = "#007bff";
const LIGHT_BLUE = "#e7f1ff";

const DURATION_MS = 2000;
const EASING = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

const CountUp = ({
  target,
  suffix,
  duration = DURATION_MS,
  isInView,
}: {
  target: number;
  suffix: string;
  duration?: number;
  isInView: boolean;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isInView) return;

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = EASING(progress);
      const current = Math.floor(eased * target);
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, isInView]);

  const formatted =
    target >= 1000
      ? displayValue.toLocaleString()
      : displayValue.toString();

  return <>{formatted}{suffix}</>;
};

const AboutPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsInView, setStatsInView] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsInView(true);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { icon: IconCar, target: 15, suffix: "+", label: t("yearsExperience") },
    { icon: IconUsers, target: 50000, suffix: "+", label: t("customers") },
    { icon: IconTool, target: 30, suffix: "+", label: t("technicians") },
    { icon: IconStar, target: 98, suffix: "%", label: t("satisfaction") },
  ];

  const coreValues = [
    { icon: IconCertificate, title: t("quality"), desc: t("qualityDesc") },
    { icon: IconHeart, title: t("dedication"), desc: t("dedicationDesc") },
    { icon: IconBulb, title: t("innovation"), desc: t("innovationDesc") },
    {
      icon: IconUsers,
      title: t("professionalism"),
      desc: t("professionalismDesc"),
    },
  ];

  const timeline = [
    { year: "2009", title: t("established"), desc: t("establishedDesc") },
    { year: "2013", title: t("expansion"), desc: t("expansionDesc") },
    { year: "2017", title: t("certification"), desc: t("certificationDesc") },
    { year: "2020", title: t("ownership"), desc: t("ownershipDesc") },
    {
      year: "2023",
      title: t("newPositioning"),
      desc: t("newPositioningDesc"),
    },
    { year: "2026", title: t("autocarePro"), desc: t("autocareProDesc") },
  ];

  const team = [
    { name: "NVM - Nguyễn Văn Minh", role: t("ceo") },
    { name: "TTH - Trần Thị Hương", role: t("businessStrategyManager") },
    { name: "LHN - Lê Hoàng Nam", role: t("technicalDepartmentHead") },
    { name: "PVD - Phạm Văn Dũng", role: t("serviceExpert") },
  ];

  const certifications = [
    t("toyotaAuthorized"),
    t("hondaCertified"),
    t("hyundaiGold"),
    t("mbrCertified"),
    t("boschCarService"),
    t("densoAuthorized"),
  ];

  const handleLearnMore = () => {
    document.getElementById("mission-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const handleContactNow = () => navigate(ROUTER_PAGE.contact);
  const handleGetDirections = () => {
    window.open(
      "https://www.google.com/maps/search/?api=1&query=Nguyen+Van+Linh+Hanoi+Vietnam",
      "_blank"
    );
  };

  return (
    <PageWrapper>
      {/* Hero Section */}
      <SectionBlock $variant="white">
        <HeroSection>
          <HeroContent>
            <HeroTitle>{t("aboutHeroTitle")}</HeroTitle>
            <HeroSubtitle>{t("aboutHeroSubtitle")}</HeroSubtitle>
            <HeroButtons>
              <PrimaryButton onClick={handleLearnMore}>
                {t("learnMore")}
              </PrimaryButton>
              <SecondaryButton onClick={handleContactNow}>
                {t("contactNow")}
              </SecondaryButton>
            </HeroButtons>
          </HeroContent>
          <HeroBrandBlock>
            <img
              style={{ height: 75, width: 75 }}
              src={images.logo_app}
              alt="Logo"
            />
            <BrandName>{t("nameProject")}</BrandName>
            <BrandSince>{t("since2009")}</BrandSince>
          </HeroBrandBlock>
        </HeroSection>
      </SectionBlock>

      {/* Statistics Section */}
      <SectionBlock $variant="light">
        <StatsGrid ref={statsRef}>
          {stats.map(({ icon: Icon, target, suffix, label }) => (
            <StatCard key={label}>
              <StatIcon>
                <Icon size={36} stroke={2} color={PRIMARY_BLUE} />
              </StatIcon>
              <StatValue>
                <CountUp
                  target={target}
                  suffix={suffix}
                  isInView={statsInView}
                />
              </StatValue>
              <StatLabel>{label}</StatLabel>
            </StatCard>
          ))}
        </StatsGrid>
      </SectionBlock>

      {/* Mission & Vision */}
      <SectionBlock $variant="white" id="mission-section">
        <MissionVisionGrid>
          <MissionCard>
            <MissionIcon>
              <IconShield size={40} stroke={2} color={PRIMARY_BLUE} />
            </MissionIcon>
            <MissionTitle>{t("mission")}</MissionTitle>
            <MissionDesc>{t("missionDesc")}</MissionDesc>
          </MissionCard>
          <MissionCard>
            <MissionIcon>
              <IconStar size={40} stroke={2} color="#28a745" />
            </MissionIcon>
            <MissionTitle>{t("vision")}</MissionTitle>
            <MissionDesc>{t("visionDesc")}</MissionDesc>
          </MissionCard>
        </MissionVisionGrid>
      </SectionBlock>

      {/* Core Values */}
      <SectionBlock $variant="light">
        <SectionHeader>
          <SectionTitle>{t("coreValues")}</SectionTitle>
          <SectionSubtitle>{t("coreValuesSubtitle")}</SectionSubtitle>
        </SectionHeader>
        <CoreValuesGrid>
          {coreValues.map(({ icon: Icon, title, desc }) => (
            <ValueCard key={title}>
              <ValueIcon>
                <Icon size={36} stroke={2} color={PRIMARY_BLUE} />
              </ValueIcon>
              <ValueTitle>{title}</ValueTitle>
              <ValueDesc>{desc}</ValueDesc>
            </ValueCard>
          ))}
        </CoreValuesGrid>
      </SectionBlock>

      {/* Development Timeline */}
      <SectionBlock $variant="white">
        <SectionHeader>
          <SectionTitle>{t("developmentJourney")}</SectionTitle>
        </SectionHeader>
        <TimelineWrapper>
          <TimelineTrack />
          {timeline.map((item, index) => (
            <TimelineItem key={item.year} $alignRight={index % 2 === 1}>
              <TimelineCard $alignRight={index % 2 === 1}>
                <TimelineYear>{item.year}</TimelineYear>
                <TimelineTitle>{item.title}</TimelineTitle>
                <TimelineDesc>{item.desc}</TimelineDesc>
              </TimelineCard>
              <TimelineCenter>
                <TimelineNode />
              </TimelineCenter>
            </TimelineItem>
          ))}
        </TimelineWrapper>
      </SectionBlock>

      {/* Leadership Team */}
      <SectionBlock $variant="light">
        <SectionHeader>
          <SectionTitle>{t("leadershipTeam")}</SectionTitle>
          <SectionSubtitle>{t("leadershipTeamSubtitle")}</SectionSubtitle>
        </SectionHeader>
        <TeamGrid>
          {team.map(({ name, role }) => (
            <TeamCard key={name}>
              <TeamAvatar>
                <IconUser size={48} stroke={1.5} color={PRIMARY_BLUE} />
              </TeamAvatar>
              <TeamName>{name}</TeamName>
              <TeamRole>{role}</TeamRole>
            </TeamCard>
          ))}
        </TeamGrid>
      </SectionBlock>

      {/* Certifications & Partners */}
      <SectionBlock $variant="white">
        <SectionHeader>
          <SectionTitle>{t("certificationsPartners")}</SectionTitle>
          <SectionSubtitle>
            {t("certificationsPartnersSubtitle")}
          </SectionSubtitle>
        </SectionHeader>
        <CertificationsGrid>
          {certifications.map((name) => (
            <CertBadge key={name}>
              <IconCertificate size={20} stroke={2} color={PRIMARY_BLUE} />
              <span>{name}</span>
            </CertBadge>
          ))}
        </CertificationsGrid>
      </SectionBlock>

      {/* Visit Us */}
      <SectionBlock $variant="light">
        <SectionHeader>
          <SectionTitle>{t("visitUs")}</SectionTitle>
        </SectionHeader>
        <VisitGrid>
          <VisitCard>
            <IconMapPin size={28} stroke={2} color={PRIMARY_BLUE} />
            <VisitTitle>{t("address")}</VisitTitle>
            <VisitContent>{t("aboutAddress")}</VisitContent>
          </VisitCard>
          <VisitCard>
            <IconClock size={28} stroke={2} color={PRIMARY_BLUE} />
            <VisitTitle>{t("workingHours")}</VisitTitle>
            <VisitContent>{t("aboutWorkingHours")}</VisitContent>
          </VisitCard>
          <VisitCard>
            <IconPhone size={28} stroke={2} color={PRIMARY_BLUE} />
            <VisitTitle>{t("hotline")}</VisitTitle>
            <VisitContent>{t("aboutHotline")}</VisitContent>
          </VisitCard>
        </VisitGrid>
        <DirectionsButton onClick={handleGetDirections}>
          {t("getDirections")}
        </DirectionsButton>
      </SectionBlock>
    </PageWrapper>
  );
};

export default AboutPage;

// Styled Components
const PageWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #ffffff;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
`;

const SectionBlock = styled.section<{ $variant: "white" | "light" }>`
  background: ${({ $variant }) =>
    $variant === "white" ? "#ffffff" : "#f8f9fa"};
  padding: 2.5rem 0;
  border-top: 1px solid #e9ecef;
  overflow-x: hidden;

  &:first-child {
    border-top: none;
  }

  @media (max-width: 768px) {
    padding: 1.5rem 0;
  }
`;

const HeroSection = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
  min-width: 0;

  @media (max-width: 900px) {
    flex-direction: column;
    text-align: center;
  }

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }

  @media (max-width: 480px) {
    padding: 2rem 1rem;
  }
`;

const HeroContent = styled.div`
  flex: 1;
  max-width: 600px;
`;

const HeroTitle = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  color: #1a365d;
  margin: 0 0 1rem;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1rem;
  color: #6c757d;
  margin: 0 0 1.5rem;
  line-height: 1.6;
`;

const HeroButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    justify-content: center;
  }
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${PRIMARY_BLUE};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;

  &:hover {
    background: #0069d9;
    transform: translateY(-1px);
  }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: ${PRIMARY_BLUE};
  border: 2px solid ${LIGHT_BLUE};
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${PRIMARY_BLUE};
    background: ${LIGHT_BLUE};
  }
`;

const HeroBrandBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${LIGHT_BLUE};
  border-radius: 16px;
  padding: 4rem 5rem;
  min-width: 420px;

  @media (max-width: 900px) {
    width: 100%;
    max-width: 500px;
  }

  @media (max-width: 480px) {
    min-width: 0;
    width: 100%;
    max-width: 100%;
    padding: 3rem 1.5rem;
  }
`;

const BrandName = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a365d;
  margin-top: 1rem;
`;

const BrandSince = styled.span`
  font-size: 0.95rem;
  color: #6c757d;
  margin-top: 0.25rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
`;

const StatIcon = styled.div`
  margin-bottom: 0.75rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1a365d;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
`;

const MissionVisionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }
`;

const MissionCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
`;

const MissionIcon = styled.div`
  margin-bottom: 1rem;
`;

const MissionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.75rem;
`;

const MissionDesc = styled.p`
  font-size: 0.95rem;
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 2rem;

  @media (max-width: 480px) {
    padding: 0 1rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem;
`;

const SectionSubtitle = styled.p`
  font-size: 0.95rem;
  color: #6c757d;
  margin: 0;
`;

const CoreValuesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }
`;

const ValueCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
`;

const ValueIcon = styled.div`
  margin-bottom: 1rem;
`;

const ValueTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem;
`;

const ValueDesc = styled.p`
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.5;
  margin: 0;
`;

const TimelineWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;

  @media (max-width: 480px) {
    padding: 0 1rem;
  }
`;

const TimelineTrack = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
  bottom: 0;
  width: 2px;
  background: ${PRIMARY_BLUE};
  z-index: 0;
  pointer-events: none;
`;

const TimelineItem = styled.div<{ $alignRight?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 24px 1fr;
  align-items: start;
  gap: 1rem;
  position: relative;
  margin-bottom: 0.5rem;
  min-width: 0;

  &:last-child::after {
    content: "";
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 16px;
    bottom: -50px;
    width: 4px;
    background: #ffffff;
    z-index: 2;
    pointer-events: none;
  }

  @media (max-width: 600px) {
    gap: 0.75rem;
    grid-template-columns: 1fr 24px 1fr;

    &:last-child::after {
      left: 50%;
      transform: translateX(-50%);
    }
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const TimelineCard = styled.div<{ $alignRight?: boolean }>`
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  grid-column: ${({ $alignRight }) => ($alignRight ? 3 : 1)};
  grid-row: 1;
  min-width: 0;
`;

const TimelineCenter = styled.div`
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
`;

const TimelineYear = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${PRIMARY_BLUE};
  margin-bottom: 0.25rem;
`;

const TimelineTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.35rem;
`;

const TimelineDesc = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.5;
`;

const TimelineNode = styled.div`
  width: 16px;
  height: 16px;
  min-width: 16px;
  border-radius: 50%;
  background: ${PRIMARY_BLUE};
  flex-shrink: 0;
`;

const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }
`;

const TeamCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
`;

const TeamAvatar = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  background: ${LIGHT_BLUE};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TeamName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
`;

const TeamRole = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
`;

const CertificationsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 480px) {
    padding: 0 1rem;
  }
`;

const CertBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  color: #333;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  min-width: 0;

  span {
    white-space: nowrap;
  }

  @media (max-width: 600px) {
    font-size: 0.85rem;
    padding: 0.5rem 0.75rem;
  }

  @media (max-width: 380px) {
    span {
      white-space: normal;
      word-break: break-word;
    }
  }
`;

const VisitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto 1.5rem;
  padding: 0 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }
`;

const VisitCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
`;

const VisitTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0.75rem 0 0.25rem;
`;

const VisitContent = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.5;
`;

const DirectionsButton = styled.button`
  display: block;
  margin: 0 auto;
  background: ${PRIMARY_BLUE};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;

  &:hover {
    background: #0069d9;
    transform: translateY(-1px);
  }
`;
