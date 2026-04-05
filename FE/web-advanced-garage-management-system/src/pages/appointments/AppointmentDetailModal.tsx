import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FaCar, FaUser, FaWrench, FaTimes, FaCalendarAlt, FaBoxOpen } from "react-icons/fa";
import { Table as AntTable } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { IAppointmentDetail } from "@/apis/appointments";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "#d97706", bg: "#fef3c7" },
  CONFIRMED: { label: "Đã xác nhận", color: "#2563eb", bg: "#dbeafe" },
  CHECKED_IN: { label: "Đã nhận xe", color: "#7c3aed", bg: "#ede9fe" },
  DONE: { label: "Hoàn thành", color: "#16a34a", bg: "#dcfce7" },
  CANCELLED: { label: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
};

interface Props {
  data: IAppointmentDetail | null;
  loading: boolean;
  onClose: () => void;
}

const AppointmentDetailModal = ({ data, loading, onClose }: Props) => {
  const { t } = useTranslation();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

  const getStatusInfo = (status: string) =>
    statusConfig[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };

  const getServiceTypeLabel = (type: string) => {
    switch (type?.toUpperCase()) {
      case "REPAIR": return t("bookingServiceTypeRepair");
      case "MAINTENANCE": return t("bookingServiceTypeMaintenance");
      default: return type;
    }
  };

  type SuggestedPart = NonNullable<IAppointmentDetail["suggestedParts"]>[number];

  const suggestedPartsColumns: ColumnsType<SuggestedPart> = [
    {
      title: "#",
      key: "index",
      align: "center",
      width: 48,
      render: (_: unknown, __: SuggestedPart, index: number) => index + 1,
    },
    {
      title: t("partCode"),
      dataIndex: "code",
      key: "code",
      render: (code: string) => <code style={{ fontSize: "0.8rem", color: "#374151" }}>{code}</code>,
    },
    {
      title: t("partName"),
      dataIndex: "name",
      key: "name",
      render: (name: string) => <span style={{ fontWeight: 600, color: "#1a1d2e" }}>{name}</span>,
    },
    {
      title: t("price"),
      dataIndex: "price",
      key: "price",
      align: "right",
      render: (price: number) => (
        <span style={{ color: "#1d4ed8", fontWeight: 600 }}>{formatPrice(price)}</span>
      ),
    },
    {
      title: t("score"),
      dataIndex: "score",
      key: "score",
      align: "center",
      render: (score: number) => (
        <ScoreBadge>{score.toFixed(2)}</ScoreBadge>
      ),
    },
  ];

  return (
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{t("appointmentsViewDetail")}</Title>
          <CloseBtn onClick={onClose}>
            <FaTimes size={18} />
          </CloseBtn>
        </Header>

        {loading ? (
          <Loading>{t("loading")}</Loading>
        ) : data ? (
          <Body>
            {/* Vehicle */}
            <Section>
              <SectionTitle><FaCar size={16} />{t("bookingVehicleInfo")}</SectionTitle>
              <Grid>
                <Field>
                  <Label>{t("brand")}</Label>
                  <Value>{data.car.brand} {data.car.model}</Value>
                </Field>
                <Field>
                  <Label>{t("licensePlate")}</Label>
                  <Value>{data.car.licensePlate}</Value>
                </Field>
                <Field>
                  <Label>{t("year")}</Label>
                  <Value>{data.car.year}</Value>
                </Field>
                <Field>
                  <Label>{t("color")}</Label>
                  <Value>{data.car.color}</Value>
                </Field>
                <Field>
                  <Label>{t("currentOdometer")}</Label>
                  <Value>{data.car.currentOdometer?.toLocaleString()} km</Value>
                </Field>
              </Grid>
            </Section>

            <Divider />

            {/* Customer */}
            <Section>
              <SectionTitle><FaUser size={16} />{t("appointmentsCustomerInfo")}</SectionTitle>
              <Grid>
                <Field>
                  <Label>{t("fullName")}</Label>
                  <Value>{data.customer.fullName}</Value>
                </Field>
                <Field>
                  <Label>{t("phoneNumber")}</Label>
                  <Value>{data.customer.phone}</Value>
                </Field>
                <Field>
                  <Label>{t("email")}</Label>
                  <Value>{data.customer.email}</Value>
                </Field>
              </Grid>
            </Section>

            <Divider />

            {/* Request */}
            <Section>
              <SectionTitle><FaWrench size={16} />{t("appointmentsRequestInfo")}</SectionTitle>
              <Grid>
                <Field>
                  <Label>{t("status")}</Label>
                  <StatusBadge $color={getStatusInfo(data.status).color} $bg={getStatusInfo(data.status).bg}>
                    {getStatusInfo(data.status).label}
                  </StatusBadge>
                </Field>
                <Field>
                  <Label>{t("bookingServiceTypeLabel")}</Label>
                  <Value>{getServiceTypeLabel(data.serviceType)}</Value>
                </Field>
                <Field>
                  <Label>{t("appointmentsCreated")}</Label>
                  <Value>{formatDate(data.createdDate)}</Value>
                </Field>
                {data.confirmedDate && (
                  <Field>
                    <Label>{t("appointmentsConfirmedDate")}</Label>
                    <Value>{formatDate(data.confirmedDate)}</Value>
                  </Field>
                )}
                <Field>
                  <Label>{t("appointmentsDate")}</Label>
                  <Value>{formatDate(data.appointmentDate)}</Value>
                </Field>
              </Grid>
              {data.notes && (
                <Field style={{ marginTop: "0.75rem" }}>
                  <Label>{t("appointmentsNotes")}</Label>
                  <Value>{data.notes}</Value>
                </Field>
              )}
              {data.rejectionReason && (
                <Field style={{ marginTop: "0.75rem" }}>
                  <Label>{t("appointmentsRejectionReason")}</Label>
                  <Value style={{ color: "#dc2626" }}>{data.rejectionReason}</Value>
                </Field>
              )}
            </Section>

            {/* Maintenance */}
            {data.maintenance && (
              <>
                <Divider />
                <Section>
                  <SectionTitle><FaCalendarAlt size={16} />{t("appointmentsMaintenanceInfo")}</SectionTitle>
                  <Grid>
                    <Field>
                      <Label>{t("status")}</Label>
                      <Value>{data.maintenance.status}</Value>
                    </Field>
                    <Field>
                      <Label>{t("appointmentsTotalAmount")}</Label>
                      <Value>{formatPrice(data.maintenance.totalAmount)}</Value>
                    </Field>
                    <Field>
                      <Label>{t("appointmentsFinalAmount")}</Label>
                      <PriceValue>{formatPrice(data.maintenance.finalAmount)}</PriceValue>
                    </Field>
                  </Grid>
                </Section>
              </>
            )}

            {/* Symptoms */}
            {data.symptoms && data.symptoms.length > 0 && (
              <>
                <Divider />
                <Section>
                  <SectionTitle>{t("bookingSymptomLabel")}</SectionTitle>
                  <TagRow>
                    {data.symptoms.map((s, i) => (
                      <Tag key={i}>{s}</Tag>
                    ))}
                  </TagRow>
                </Section>
              </>
            )}

            {/* Suggested Parts */}
            {data.suggestedParts && data.suggestedParts.length > 0 && (
              <>
                <Divider />
                <Section>
                  <SectionTitle><FaBoxOpen size={16} />{t("suggestedParts")}</SectionTitle>
                  <TableCard>
                    <AntTable
                      columns={suggestedPartsColumns}
                      dataSource={data.suggestedParts}
                      rowKey="productId"
                      pagination={false}
                      size="small"
                      scroll={{ x: "max-content" }}
                    />
                  </TableCard>
                </Section>
              </>
            )}
          </Body>
        ) : null}
      </Card>
    </Overlay>
  );
};

export default AppointmentDetailModal;

// Styled
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
  max-width: 820px;
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
`;

const PriceValue = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: #1d4ed8;
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

const TagRow = styled.div`
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  font-size: 0.75rem;
  color: #374151;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 0.2rem 0.625rem;
  border-radius: 6px;
`;

const TableCard = styled.div`
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;

  .ant-table {
    color: #374151;
  }
  .ant-table-thead > tr > th,
  .ant-table-thead > tr > td {
    color: #374151 !important;
    background: #f3f4f6 !important;
    font-size: 0.8rem;
  }
  .ant-table-tbody > tr > td {
    color: #374151 !important;
  }
  .ant-table-tbody > tr:hover > td {
    background: #f9fafb !important;
  }
`;

const ScoreBadge = styled.span`
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;
