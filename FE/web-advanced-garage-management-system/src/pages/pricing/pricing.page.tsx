import { useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  IconTool,
  IconEngine,
  IconSnowflake,
  IconCarGarage,
  IconBolt,
  IconPaint,
  IconStar,
  IconChevronDown,
  IconChevronUp,
  IconCalendar,
  IconPhone,
  IconCheck,
  IconCrown,
  IconDiamond,
  IconClipboardList,
} from "@tabler/icons-react";
import { getProducts } from "@/services/admin/productService";
import type { IProduct } from "@/services/admin/productService";

const tabs = [
  { key: "maintenance", icon: IconTool, labelKey: "pricingTabMaintenance" },
  { key: "repair", icon: IconEngine, labelKey: "pricingTabRepair" },
  { key: "ac", icon: IconSnowflake, labelKey: "pricingTabAC" },
  { key: "tire", icon: IconCarGarage, labelKey: "pricingTabTire" },
  { key: "electrical", icon: IconBolt, labelKey: "pricingTabElectrical" },
  { key: "body", icon: IconPaint, labelKey: "pricingTabBody" },
];

const PricingPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("maintenance");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data.items);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + "d";
  };

  const faqItems = [
    { q: "pricingFaq1Q", a: "pricingFaq1A" },
    { q: "pricingFaq2Q", a: "pricingFaq2A" },
    { q: "pricingFaq3Q", a: "pricingFaq3A" },
    { q: "pricingFaq4Q", a: "pricingFaq4A" },
    { q: "pricingFaq5Q", a: "pricingFaq5A" },
  ];

  const membershipTiers = [
    {
      name: "membershipMember",
      points: "membershipFree",
      desc: "membershipMemberDesc",
      icon: IconStar,
      color: "#6b7280",
      bg: "#f9fafb",
      border: "#e5e7eb",
      features: [
        "membershipFeature1Mem",
        "membershipFeature2Mem",
        "membershipFeature3Mem",
        "membershipFeature4Mem",
      ],
      badge: null,
    },
    {
      name: "membershipSilver",
      points: "membershipSilverPoints",
      desc: "membershipSilverDesc",
      icon: IconStar,
      color: "#6b7280",
      bg: "#f9fafb",
      border: "#e5e7eb",
      features: [
        "membershipFeature1Silver",
        "membershipFeature2Silver",
        "membershipFeature3Silver",
        "membershipFeature4Silver",
        "membershipFeature5Silver",
      ],
      badge: null,
    },
    {
      name: "membershipGold",
      points: "membershipGoldPoints",
      desc: "membershipGoldDesc",
      icon: IconCrown,
      color: "#d97706",
      bg: "#fffbeb",
      border: "#f59e0b",
      features: [
        "membershipFeature1Gold",
        "membershipFeature2Gold",
        "membershipFeature3Gold",
        "membershipFeature4Gold",
        "membershipFeature5Gold",
        "membershipFeature6Gold",
        "membershipFeature7Gold",
      ],
      badge: "membershipGoldBadge",
    },
    {
      name: "membershipDiamond",
      points: "membershipDiamondPoints",
      desc: "membershipDiamondDesc",
      icon: IconDiamond,
      color: "#2563eb",
      bg: "#eff6ff",
      border: "#3b82f6",
      features: [
        "membershipFeature1Diamond",
        "membershipFeature2Diamond",
        "membershipFeature3Diamond",
        "membershipFeature4Diamond",
        "membershipFeature5Diamond",
        "membershipFeature6Diamond",
        "membershipFeature7Diamond",
        "membershipFeature8Diamond",
      ],
      badge: null,
    },
  ];

  return (
    <PageContainer>
      {/* Hero Section */}
      <HeroSection>
        <HeroContainer>
          <HeroBadge>{t("pricingPageBadge")}</HeroBadge>
          <HeroTitle>
            {t("pricingPageTitle")}{" "}
            <HeroHighlight>{t("pricingPageTitleHighlight")}</HeroHighlight>
          </HeroTitle>
          <HeroSubtitle>{t("pricingPageSubtitle")}</HeroSubtitle>

          {/* Category Tabs */}
          <TabsContainer>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Tab
                  key={tab.key}
                  $active={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon size={16} />
                  {t(tab.labelKey)}
                </Tab>
              );
            })}
          </TabsContainer>
        </HeroContainer>
      </HeroSection>

      {/* Price Table Section */}
      <TableSection>
        <TableContainer>
          <TableCard>
            <TableHeader>
              <TableHeaderLeft>
                <IconClipboardList size={20} color="#2563eb" />
                <TableHeaderTitle>
                  {t("pricingTableIcon")}{" "}
                  {t(
                    tabs.find((tab) => tab.key === activeTab)?.labelKey || ""
                  )}
                </TableHeaderTitle>
              </TableHeaderLeft>
              <TableHeaderSubtitle>
                {t("pricingTableSubtitle")}
              </TableHeaderSubtitle>
            </TableHeader>

            <StyledTable>
              <thead>
                <tr>
                  <Th align="left">{t("pricingTableService")}</Th>
                  <Th align="right">{t("pricingTablePrice")}</Th>
                  <Th align="right">{t("pricingTableNote")}</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <Td colSpan={3} align="center">
                      {t("loading")}
                    </Td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <Td colSpan={3} align="center">
                      --
                    </Td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <Td align="left">{product.name}</Td>
                      <TdPrice align="right">
                        {formatPrice(product.price)}
                      </TdPrice>
                      <TdNote align="right">
                        {product.description || t("pricingTableVehicleType")}
                      </TdNote>
                    </tr>
                  ))
                )}
              </tbody>
            </StyledTable>

            <TableCTA>
              <CTAButton>
                <IconCalendar size={18} />
                {t("pricingCTAButton")}
              </CTAButton>
            </TableCTA>
          </TableCard>
        </TableContainer>
      </TableSection>

      {/* Membership Section */}
      <MembershipSection>
        <SectionContainer>
          <SectionTitle>{t("membershipTitle")}</SectionTitle>
          <SectionSubtitle>{t("membershipSubtitle")}</SectionSubtitle>

          <MembershipGrid>
            {membershipTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <MembershipCard
                  key={tier.name}
                  $borderColor={tier.border}
                  $highlighted={!!tier.badge}
                >
                  {tier.badge && (
                    <MembershipBadge>{t(tier.badge)}</MembershipBadge>
                  )}
                  <MembershipIconWrapper $bg={tier.bg}>
                    <Icon size={24} color={tier.color} />
                  </MembershipIconWrapper>
                  <MembershipTierLabel $color={tier.color}>
                    {t(tier.name)}
                  </MembershipTierLabel>
                  <MembershipPoints>{t(tier.points)}</MembershipPoints>
                  <MembershipDesc>{t(tier.desc)}</MembershipDesc>
                  <MembershipDivider />
                  <MembershipFeatures>
                    {tier.features.map((fKey) => (
                      <MembershipFeature key={fKey}>
                        <IconCheck size={14} color="#16a34a" />
                        {t(fKey)}
                      </MembershipFeature>
                    ))}
                  </MembershipFeatures>
                </MembershipCard>
              );
            })}
          </MembershipGrid>
        </SectionContainer>
      </MembershipSection>

      {/* FAQ Section */}
      <FaqSection>
        <SectionContainer>
          <SectionTitle>{t("pricingFaqTitle")}</SectionTitle>
          <FaqList>
            {faqItems.map((item, index) => (
              <FaqItem key={index}>
                <FaqQuestion onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  <FaqQuestionText>{t(item.q)}</FaqQuestionText>
                  {openFaq === index ? (
                    <IconChevronUp size={20} color="#6b7280" />
                  ) : (
                    <IconChevronDown size={20} color="#6b7280" />
                  )}
                </FaqQuestion>
                {openFaq === index && item.a && (
                  <FaqAnswer>{t(item.a)}</FaqAnswer>
                )}
              </FaqItem>
            ))}
          </FaqList>
        </SectionContainer>
      </FaqSection>

      {/* Bottom CTA */}
      <BottomCTA>
        <BottomCTAContainer>
          <BottomCTATitle>{t("pricingBottomTitle")}</BottomCTATitle>
          <BottomCTASubtitle>{t("pricingBottomSubtitle")}</BottomCTASubtitle>
          <BottomCTAButtons>
            <BottomCTAPrimary>
              <IconPhone size={18} />
              {t("pricingBottomContact")}
            </BottomCTAPrimary>
            <BottomCTAOutline>{t("pricingBottomViewServices")}</BottomCTAOutline>
          </BottomCTAButtons>
        </BottomCTAContainer>
      </BottomCTA>
    </PageContainer>
  );
};

export default PricingPage;

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
  padding: 3.5rem 1rem 2rem;
  background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
  text-align: center;
`;

const HeroContainer = styled.div`
  max-width: 72rem;
  margin: 0 auto;
`;

const HeroBadge = styled.div`
  display: inline-block;
  font-size: 0.8125rem;
  color: #64748b;
  margin-bottom: 1rem;
`;

const HeroTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const HeroHighlight = styled.span`
  color: #2563eb;
  font-style: italic;
`;

const HeroSubtitle = styled.p`
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.7;
  max-width: 40rem;
  margin: 0 auto 2rem;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1.25rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid ${({ $active }) => ($active ? "#2563eb" : "#e5e7eb")};
  background: ${({ $active }) => ($active ? "#2563eb" : "#ffffff")};
  color: ${({ $active }) => ($active ? "#ffffff" : "#374151")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #2563eb;
    color: ${({ $active }) => ($active ? "#ffffff" : "#2563eb")};
  }
`;

const TableSection = styled.section`
  padding: 2rem 1rem 3rem;
  background: #f8fafc;
`;

const TableContainer = styled.div`
  max-width: 56rem;
  margin: 0 auto;
`;

const TableCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
`;

const TableHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
`;

const TableHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const TableHeaderTitle = styled.h3`
  font-size: 1.0625rem;
  font-weight: 600;
  color: #111827;
`;

const TableHeaderSubtitle = styled.p`
  font-size: 0.8125rem;
  color: #9ca3af;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead tr {
    border-bottom: 1px solid #e5e7eb;
  }
`;

const Th = styled.th<{ align?: string }>`
  padding: 0.75rem 1.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  text-align: ${({ align }) => align || "left"};
  white-space: nowrap;
`;

const Td = styled.td<{ align?: string }>`
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  color: #374151;
  text-align: ${({ align }) => align || "left"};
  border-bottom: 1px solid #f1f5f9;
`;

const TdPrice = styled(Td)`
  color: #dc2626;
  font-weight: 600;
  white-space: nowrap;
`;

const TdNote = styled(Td)`
  color: #9ca3af;
  font-size: 0.8125rem;
  font-style: italic;
`;

const TableCTA = styled.div`
  padding: 1.25rem 1.5rem;
  text-align: center;
  border-top: 1px solid #f1f5f9;
`;

const CTAButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #2563eb;
  color: #ffffff;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;

const MembershipSection = styled.section`
  padding: 4rem 1rem;
  background: #ffffff;
`;

const SectionContainer = styled.div`
  max-width: 72rem;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 0.5rem;
`;

const SectionSubtitle = styled.p`
  font-size: 1rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 2.5rem;
`;

const MembershipGrid = styled.div`
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

const MembershipCard = styled.div<{
  $borderColor: string;
  $highlighted: boolean;
}>`
  position: relative;
  background: #ffffff;
  border: ${({ $highlighted, $borderColor }) =>
    $highlighted ? `2px solid ${$borderColor}` : `1px solid ${$borderColor}`};
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
`;

const MembershipBadge = styled.span`
  position: absolute;
  top: -0.75rem;
  background: #16a34a;
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
`;

const MembershipIconWrapper = styled.div<{ $bg: string }>`
  width: 3rem;
  height: 3rem;
  background: ${({ $bg }) => $bg};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
`;

const MembershipTierLabel = styled.span<{ $color: string }>`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
`;

const MembershipPoints = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
`;

const MembershipDesc = styled.p`
  font-size: 0.8125rem;
  color: #9ca3af;
`;

const MembershipDivider = styled.div`
  width: 100%;
  height: 1px;
  background: #f1f5f9;
  margin: 1rem 0;
`;

const MembershipFeatures = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  text-align: left;
`;

const MembershipFeature = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #374151;
  line-height: 1.4;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const FaqSection = styled.section`
  padding: 4rem 1rem;
  background: #f8fafc;
`;

const FaqList = styled.div`
  max-width: 48rem;
  margin: 2rem auto 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FaqItem = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
`;

const FaqQuestion = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
`;

const FaqQuestionText = styled.span`
  font-size: 0.9375rem;
  font-weight: 500;
  color: #111827;
`;

const FaqAnswer = styled.div`
  padding: 0 1.25rem 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
`;

const BottomCTA = styled.section`
  padding: 3rem 1rem;
  background: #f8fafc;
  text-align: center;
`;

const BottomCTAContainer = styled.div`
  max-width: 40rem;
  margin: 0 auto;
`;

const BottomCTATitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
`;

const BottomCTASubtitle = styled.p`
  font-size: 0.9375rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
`;

const BottomCTAButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const BottomCTAPrimary = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #2563eb;
  color: #ffffff;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;

const BottomCTAOutline = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  color: #374151;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  border: 1px solid #d1d5db;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
`;
