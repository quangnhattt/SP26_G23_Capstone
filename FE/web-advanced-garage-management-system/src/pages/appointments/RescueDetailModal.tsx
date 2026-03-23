import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FaTimes, FaUser, FaCar, FaMapMarkerAlt, FaWrench } from "react-icons/fa";
import type { IRescueRequest } from "@/apis/rescue";

import { rescueStatusConfig } from "./rescueStatusConfig";

interface Props {
  data: IRescueRequest | null;
  loading: boolean;
  onClose: () => void;
}

const RescueDetailModal = ({ data, loading, onClose }: Props) => {
  const { t, i18n } = useTranslation();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const locale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";
      return new Date(dateStr).toLocaleDateString(locale);
    } catch {
      return dateStr;
    }
  };

  const getStatusInfo = (status: string) =>
    rescueStatusConfig[status] || { labelKey: "", color: "#6b7280", bg: "#f3f4f6" };

  return (
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{t("rescueDetailTitle")}</Title>
          <CloseBtn onClick={onClose}>
            <FaTimes size={18} />
          </CloseBtn>
        </Header>

        {loading ? (
          <Loading>{t("loading")}</Loading>
        ) : data ? (
          <Body>
            <Section>
              <SectionTitle>
                <FaUser size={16} />
                {t("appointmentsCustomerInfo")}
              </SectionTitle>
              <Grid>
                <Field>
                  <Label>{t("fullName")}</Label>
                  <Value>{data.customerName}</Value>
                </Field>
                <Field>
                  <Label>{t("phoneNumber")}</Label>
                  <Value>{data.customerPhone}</Value>
                </Field>
              </Grid>
            </Section>

            <Divider />

            <Section>
              <SectionTitle>
                <FaCar size={16} />
                {t("bookingVehicleInfo")}
              </SectionTitle>
              <Grid>
                <Field>
                  <Label>{t("rescueMgrCar")}</Label>
                  <Value>
                    {data.brand} {data.model}
                  </Value>
                </Field>
                <Field>
                  <Label>{t("licensePlate")}</Label>
                  <Value>{data.licensePlate}</Value>
                </Field>
              </Grid>
            </Section>

            <Divider />

            <Section>
              <SectionTitle>
                <FaWrench size={16} />
                {t("appointmentsRequestInfo")}
              </SectionTitle>
              <Grid>
                <Field>
                  <Label>{t("rescueDetailCode")}</Label>
                  <Value>#{data.rescueId}</Value>
                </Field>
                <Field>
                  <Label>{t("status")}</Label>
                  <StatusBadge
                    $color={getStatusInfo(data.status).color}
                    $bg={getStatusInfo(data.status).bg}
                  >
                    {getStatusInfo(data.status).labelKey
                      ? t(getStatusInfo(data.status).labelKey)
                      : data.status}
                  </StatusBadge>
                </Field>
                <Field>
                  <Label>{t("appointmentsCreated")}</Label>
                  <Value>{formatDate(data.createdDate)}</Value>
                </Field>
                {data.rescueType && (
                  <Field>
                    <Label>{t("rescueDetailType")}</Label>
                    <Value>{data.rescueType}</Value>
                  </Field>
                )}
              </Grid>
              <Field style={{ marginTop: "0.75rem" }}>
                <Label>{t("rescueAddress")}</Label>
                <Value>
                  <InlineIcon>
                    <FaMapMarkerAlt size={13} />
                  </InlineIcon>
                  {data.currentAddress}
                </Value>
              </Field>
              <Field style={{ marginTop: "0.75rem" }}>
                <Label>{t("rescueProblemDescLabel")}</Label>
                <Value>{data.problemDescription}</Value>
              </Field>
            </Section>
          </Body>
        ) : (
          <Loading>{t("errorOccurred")}</Loading>
        )}
      </Card>
    </Overlay>
  );
};

export default RescueDetailModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
`;

const Title = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 6px;
  transition: background 0.15s;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
`;

const Loading = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
`;

const Body = styled.div`
  padding: 1.5rem;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #111827;
`;

const Divider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 1.25rem 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const Value = styled.span`
  font-size: 0.875rem;
  color: #111827;
  line-height: 1.4;
`;

const StatusBadge = styled.span<{ $color: string; $bg: string }>`
  padding: 0.2rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
  width: fit-content;
`;

const InlineIcon = styled.span`
  margin-right: 0.375rem;
  color: #9ca3af;
`;
