import { Modal, Tag, Descriptions, Table, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import type {
  IIntakeDetail,
  IServiceDetail,
  IPartDetail,
  IVehicleIntakeCondition,
} from "@/services/admin/intakeService";

interface Props {
  open: boolean;
  loading: boolean;
  data: IIntakeDetail | null;
  onClose: () => void;
}

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val,
  );

const statusColor: Record<string, string> = {
  APPROVED: "green",
  REJECTED: "red",
  PENDING: "orange",
  WAITING: "orange",
  IN_PROGRESS: "blue",
  DONE: "green",
  CANCELLED: "red",
  QUOTED: "blue",
};

const IntakeDetailModal = ({ open, loading, data, onClose }: Props) => {
  const { t } = useTranslation();

  const serviceColumns: ColumnsType<IServiceDetail> = [
    {
      title: t("intakeDetailCode"),
      dataIndex: "serviceProductCode",
      key: "serviceProductCode",
      width: 130,
    },
    {
      title: t("intakeDetailName"),
      dataIndex: "serviceProductName",
      key: "serviceProductName",
    },
    {
      title: t("intakeDetailQty"),
      dataIndex: "serviceQty",
      key: "serviceQty",
      width: 70,
      align: "right",
    },
    {
      title: t("intakeDetailPrice"),
      dataIndex: "servicePrice",
      key: "servicePrice",
      width: 130,
      align: "right",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: t("intakeDetailStatus"),
      dataIndex: "serviceStatus",
      key: "serviceStatus",
      width: 110,
      render: (s: string) => <Tag color={statusColor[s] ?? "default"}>{s}</Tag>,
    },
    {
      title: t("intakeDetailNotes"),
      dataIndex: "serviceNotes",
      key: "serviceNotes",
    },
  ];

  const partColumns: ColumnsType<IPartDetail> = [
    {
      title: t("intakeDetailCode"),
      dataIndex: "partProductCode",
      key: "partProductCode",
      width: 130,
    },
    {
      title: t("intakeDetailName"),
      dataIndex: "partProductName",
      key: "partProductName",
    },
    {
      title: t("intakeDetailQty"),
      dataIndex: "partQty",
      key: "partQty",
      width: 70,
      align: "right",
    },
    {
      title: t("intakeDetailPrice"),
      dataIndex: "partPrice",
      key: "partPrice",
      width: 130,
      align: "right",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: t("intakeDetailStatus"),
      dataIndex: "partStatus",
      key: "partStatus",
      width: 110,
      render: (s: string) => <Tag color={statusColor[s] ?? "default"}>{s}</Tag>,
    },
    { title: t("intakeDetailNotes"), dataIndex: "partNotes", key: "partNotes" },
  ];

  const conditionColumns: ColumnsType<IVehicleIntakeCondition> = [
    {
      title: t("intakeDetailCheckIn"),
      dataIndex: "checkInTime",
      key: "checkInTime",
      width: 160,
      render: formatDate,
    },
    {
      title: t("intakeDetailFront"),
      dataIndex: "frontStatus",
      key: "frontStatus",
      width: 100,
    },
    {
      title: t("intakeDetailRear"),
      dataIndex: "rearStatus",
      key: "rearStatus",
      width: 100,
    },
    {
      title: t("intakeDetailLeft"),
      dataIndex: "leftStatus",
      key: "leftStatus",
      width: 100,
    },
    {
      title: t("intakeDetailRight"),
      dataIndex: "rightStatus",
      key: "rightStatus",
      width: 100,
    },
    {
      title: t("intakeDetailRoof"),
      dataIndex: "roofStatus",
      key: "roofStatus",
      width: 100,
    },
    {
      title: t("intakeDetailConditionNote"),
      dataIndex: "intakeConditionNote",
      key: "intakeConditionNote",
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      title={
        <ModalTitle>
          {t("intakeDetailTitle")}
          {data && (
            <span style={{ color: "#1d4ed8", marginLeft: 8 }}>
              #{data.maintenanceId}
            </span>
          )}
        </ModalTitle>
      }
      styles={{
        body: {
          maxHeight: "75vh",
          overflowY: "auto",
          padding: "1.25rem 1.5rem",
        },
      }}
    >
      {loading || !data ? (
        <SpinWrapper>
          <Spin size="large" />
        </SpinWrapper>
      ) : (
        <ModalBody>
          {/* Basic info */}
          <Section>
            <SectionTitle>{t("intakeDetailBasicInfo")}</SectionTitle>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label={t("intakeDetailDate")}>
                {formatDate(data.maintenanceDate)}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailMaintenanceStatus")}>
                <Tag color={statusColor[data.maintenanceStatus] ?? "default"}>
                  {data.maintenanceStatus}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Section>

          {/* Customer & Car */}
          <Section>
            <SectionTitle>{t("intakeDetailCustomer")}</SectionTitle>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label={t("intakeDetailFullName")}>
                {data.customer.fullName}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailPhone")}>
                {data.customer.phone}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailEmail")}>
                {data.customer.email}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailDob")}>
                {data.customer.dob}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailLicensePlate")}>
                {data.car.licensePlate}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailCarBrand")}>
                {data.car.brand ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailCarModel")}>
                {data.car.model ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailCarYear")}>
                {data.car.year ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailCarColor")}>
                {data.car.color ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailCarDetails")}>
                {data.car.carDetails}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailEngine")}>
                {data.car.engineNumber}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailChassis")}>
                {data.car.chassisNumber ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label={t("intakeDetailOdometer")}>
                {data.car.currentOdometer} km
              </Descriptions.Item>
            </Descriptions>
          </Section>

          {/* Technician */}
          {(data.technicianName ||
            data.technicianPhone ||
            data.technicianEmail) && (
            <Section>
              <SectionTitle>{t("intakeDetailTechnician")}</SectionTitle>
              <Descriptions bordered size="small" column={2}>
                {data.technicianName && (
                  <Descriptions.Item label={t("intakeDetailTechnicianName")}>
                    {data.technicianName}
                  </Descriptions.Item>
                )}
                {data.technicianPhone && (
                  <Descriptions.Item label={t("intakeDetailTechnicianPhone")}>
                    {data.technicianPhone}
                  </Descriptions.Item>
                )}
                {data.technicianEmail && (
                  <Descriptions.Item
                    label={t("intakeDetailTechnicianEmail")}
                    span={2}
                  >
                    {data.technicianEmail}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Section>
          )}

          {/* Package */}
          {data.package && (
            <Section>
              <SectionTitle>{t("intakeDetailPackage")}</SectionTitle>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label={t("intakeDetailPackageCode")}>
                  {data.package.packageCode}
                </Descriptions.Item>
                <Descriptions.Item label={t("intakeDetailPackageName")}>
                  {data.package.packageName}
                </Descriptions.Item>
                <Descriptions.Item
                  label={t("intakeDetailPackagePrice")}
                  span={2}
                >
                  {formatCurrency(data.package.packagePrice)}
                </Descriptions.Item>
              </Descriptions>
            </Section>
          )}

          {/* Services */}
          {data.serviceDetails.length > 0 && (
            <Section>
              <SectionTitle>{t("intakeDetailServices")}</SectionTitle>
              <TableWrapper>
                <Table<IServiceDetail>
                  rowKey="serviceProductId"
                  columns={serviceColumns}
                  dataSource={data.serviceDetails}
                  pagination={false}
                  size="small"
                  scroll={{ x: 700 }}
                />
              </TableWrapper>
            </Section>
          )}

          {/* Parts */}
          {data.partDetails.length > 0 && (
            <Section>
              <SectionTitle>{t("intakeDetailParts")}</SectionTitle>
              <TableWrapper>
                <Table<IPartDetail>
                  rowKey="partProductId"
                  columns={partColumns}
                  dataSource={data.partDetails}
                  pagination={false}
                  size="small"
                  scroll={{ x: 700 }}
                />
              </TableWrapper>
            </Section>
          )}

          {/* Vehicle conditions */}
          {data.vehicleIntakeConditions.length > 0 && (
            <Section>
              <SectionTitle>{t("intakeDetailConditions")}</SectionTitle>
              <TableWrapper>
                <Table<IVehicleIntakeCondition>
                  rowKey="intakeConditionId"
                  columns={conditionColumns}
                  dataSource={data.vehicleIntakeConditions}
                  pagination={false}
                  size="small"
                  scroll={{ x: 800 }}
                />
              </TableWrapper>
            </Section>
          )}
        </ModalBody>
      )}
    </Modal>
  );
};

export default IntakeDetailModal;

const ModalTitle = styled.span`
  display: block;
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827 !important;
  justify-content: space-between;
`;

const SpinWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 3rem 0;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .ant-descriptions-item-label {
    color: #374151 !important;
    font-weight: 600 !important;
    background: #f9fafb !important;
  }

  .ant-descriptions-item-content {
    color: #111827 !important;
  }

  .ant-table,
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    color: #111827 !important;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1d4ed8;
  margin: 0;
  padding-bottom: 0.375rem;
  border-bottom: 2px solid #dbeafe;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;
