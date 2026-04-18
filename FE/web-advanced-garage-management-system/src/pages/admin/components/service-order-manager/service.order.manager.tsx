import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { createGlobalStyle } from "styled-components";
import useAuth from "@/hooks/useAuth";
import {
  HiSearch,
  HiEye,
  HiPlusCircle,
  HiClipboardCheck,
  HiDocumentText,
  HiPlay,
  HiArchive,
  HiCheckCircle,
  HiArrowNarrowRight,
} from "react-icons/hi";
import { Checkbox, ConfigProvider, Modal, Table, Tag, Select as AntSelect, Tooltip } from "antd";
import type { TableColumnsType } from "antd";
import {
  serviceOrderService,
  type IServiceOrder,
} from "@/services/admin/serviceOrderService";
import { toast } from "react-toastify";
import useSelectTextColorFix from "@/hooks/useSelectTextColorFix";
import { getTechnicians, type ITechnician } from "@/apis/technicians";
import ServiceOrderDetailModal from "./service.order.detail.modal";
import AdditionalItemsModal from "./additional-items.modal";
import RespondAdditionalItemsModal from "./respond-additional-items.modal";
import InvoiceModal from "./invoice.modal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PAGE_SIZE = 20;
const RESCUE_MAINTENANCE_TYPE = "RESCUE";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "default",
  WAITING: "default",
  IN_DIAGNOSIS: "volcano",
  QUOTED: "gold",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  WAITING_FOR_PAYMENT: "purple",
  CLOSED: "cyan",
  CANCELLED: "red",
};

const TYPE_COLOR: Record<string, string> = {
  REPAIR: "orange",
  MAINTENANCE: "cyan",
  INSPECTION: "purple",
};

const isRescueServiceOrder = (maintenanceType?: string | null) =>
  (maintenanceType ?? "").toUpperCase() === RESCUE_MAINTENANCE_TYPE;

// ─── Component ───────────────────────────────────────────────────────────────

const ServiceOrderManager = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isTech = user?.roleID === 3;
  const [items, setItems] = useState<IServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [additionalId, setAdditionalId] = useState<number | null>(null);
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [additionalCanAdd, setAdditionalCanAdd] = useState(false);
  const [respondId, setRespondId] = useState<number | null>(null);
  const [respondOpen, setRespondOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [invoiceMode, setInvoiceMode] = useState<"create" | "view">("create");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [technicians, setTechnicians] = useState<ITechnician[]>([]);
  const [assigningIds, setAssigningIds] = useState<number[]>([]);
  const [startingDiagnosisIds, setStartingDiagnosisIds] = useState<number[]>(
    [],
  );
  const [transferringIds, setTransferringIds] = useState<number[]>([]);
  const [transferredIds, setTransferredIds] = useState<number[]>([]);
  const [confirmingRepairIds, setConfirmingRepairIds] = useState<number[]>([]);
  const [finishingRepairIds, setFinishingRepairIds] = useState<number[]>([]);
  const [processingPaymentIds, setProcessingPaymentIds] = useState<number[]>([]);
  const [respondedIds, setRespondedIds] = useState<number[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMaintenanceId, setPaymentMaintenanceId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | null>(
    null,
  );
  const selectFix = useSelectTextColorFix({ key: "service-order-filter" });

  const fetchOrders = useCallback(
    async (page: number, search?: string, status?: string, type?: string) => {
      try {
        setLoading(true);
        setError(null);
        const res = await serviceOrderService.getServiceOrders({
          page,
          pageSize: PAGE_SIZE,
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
          ...(type ? { maintenanceType: type } : {}),
        });
        setItems(res.items ?? []);
        setTotalCount(res.totalCount ?? 0);
      } catch {
        setError(t("serviceOrderError"));
        toast.error(t("serviceOrderError"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  const refreshOrders = useCallback(() => {
    fetchOrders(currentPage, searchTerm || undefined, statusFilter, typeFilter);
  }, [currentPage, fetchOrders, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    fetchOrders(currentPage, searchTerm || undefined, statusFilter, typeFilter);
  }, [currentPage, statusFilter, typeFilter, searchTerm, fetchOrders]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const data = await getTechnicians();
        setTechnicians(data ?? []);
      } catch {
        toast.error(t("serviceOrderAssignLoadTechError"));
      }
    };
    fetchTechnicians();
  }, [t]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders(1, value.trim() || undefined, statusFilter, typeFilter);
    }, 400);
  };

  const handleStatusChange = (value: unknown) => {
    const nextValue = typeof value === "string" ? value : undefined;
    setStatusFilter(nextValue);
    setCurrentPage(1);
  };

  const handleTypeChange = (value: unknown) => {
    const nextValue = typeof value === "string" ? value : undefined;
    setTypeFilter(nextValue);
    setCurrentPage(1);
  };

  const handleViewDetail = (id: number) => {
    setDetailId(id);
    setDetailOpen(true);
  };

  const handleOpenAdditional = (record: IServiceOrder) => {
    setAdditionalId(record.maintenanceId);
    setAdditionalCanAdd(record.status === "IN_DIAGNOSIS");
    setAdditionalOpen(true);
  };

  const handleOpenRespond = (id: number) => {
    setRespondId(id);
    setRespondOpen(true);
  };

  const handleOpenInvoice = (id: number, mode: "create" | "view") => {
    setInvoiceId(id);
    setInvoiceMode(mode);
    setInvoiceOpen(true);
  };

  const handleAssignTechnician = async (
    maintenanceId: number,
    technicianId: number,
  ) => {
    if (assigningIds.includes(maintenanceId)) return;
    const selectedTech = technicians.find(
      (tech) => tech.technicianId === technicianId,
    );
    if (!selectedTech) {
      toast.error(t("serviceOrderAssignError"));
      return;
    }

    try {
      setAssigningIds((prev) => [...prev, maintenanceId]);
      await serviceOrderService.assignTechnician(maintenanceId, {
        technicianId,
      });
      toast.success(t("serviceOrderAssignSuccess"));
      refreshOrders();
    } catch {
      toast.error(t("serviceOrderAssignError"));
    } finally {
      setAssigningIds((prev) => prev.filter((id) => id !== maintenanceId));
    }
  };

  const handleTransferOrder = async (maintenanceId: number) => {
    if (transferringIds.includes(maintenanceId)) return;
    try {
      setTransferringIds((prev) => [...prev, maintenanceId]);
      await serviceOrderService.transferOrder(maintenanceId);
      setTransferredIds((prev) => [...prev, maintenanceId]);
      toast.success(t("serviceOrderTransferOrderSuccess"));
      refreshOrders();
    } catch {
      toast.error(t("serviceOrderTransferOrderError"));
    } finally {
      setTransferringIds((prev) => prev.filter((id) => id !== maintenanceId));
    }
  };

  const handleStartDiagnosis = async (maintenanceId: number) => {
    if (startingDiagnosisIds.includes(maintenanceId)) return;
    try {
      setStartingDiagnosisIds((prev) => [...prev, maintenanceId]);
      await serviceOrderService.startDiagnosis(maintenanceId);
      toast.success(t("serviceOrderStartDiagnosisSuccess"));
      refreshOrders();
    } catch {
      toast.error(t("serviceOrderStartDiagnosisError"));
    } finally {
      setStartingDiagnosisIds((prev) =>
        prev.filter((id) => id !== maintenanceId),
      );
    }
  };

  const handleConfirmRepair = async (maintenanceId: number) => {
    if (confirmingRepairIds.includes(maintenanceId)) return;
    try {
      setConfirmingRepairIds((prev) => [...prev, maintenanceId]);
      await serviceOrderService.confirmRepair(maintenanceId);
      toast.success(t("serviceOrderConfirmRepairSuccess"));
      refreshOrders();
    } catch {
      toast.error(t("serviceOrderConfirmRepairError"));
    } finally {
      setConfirmingRepairIds((prev) => prev.filter((id) => id !== maintenanceId));
    }
  };

  const handleFinishRepair = async (maintenanceId: number) => {
    if (finishingRepairIds.includes(maintenanceId)) return;
    try {
      setFinishingRepairIds((prev) => [...prev, maintenanceId]);
      await serviceOrderService.finishRepair(maintenanceId);
      toast.success(t("serviceOrderFinishRepairSuccess"));
      refreshOrders();
    } catch {
      toast.error(t("serviceOrderFinishRepairError"));
    } finally {
      setFinishingRepairIds((prev) => prev.filter((id) => id !== maintenanceId));
    }
  };

  const handleProcessPayment = async (
    maintenanceId: number,
    method: "CASH" | "TRANSFER",
  ) => {
    if (processingPaymentIds.includes(maintenanceId)) return;

    try {
      setProcessingPaymentIds((prev) => [...prev, maintenanceId]);
      await serviceOrderService.processPayment(maintenanceId, {
        paymentMethod: method,
      });
      toast.success(t("serviceOrderProcessPaymentSuccess"));
      setPaymentModalOpen(false);
      setPaymentMaintenanceId(null);
      setPaymentMethod(null);
      refreshOrders();
    } catch {
      toast.error(t("serviceOrderProcessPaymentError"));
    } finally {
      setProcessingPaymentIds((prev) => prev.filter((id) => id !== maintenanceId));
    }
  };

  const openPaymentModal = (maintenanceId: number) => {
    setPaymentMaintenanceId(maintenanceId);
    setPaymentMethod("CASH");
    setPaymentModalOpen(true);
  };

  const transferQrPayload =
    paymentMaintenanceId !== null
      ? `AGMS|MAINTENANCE:${paymentMaintenanceId}|METHOD:TRANSFER`
      : "";
  const transferQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    transferQrPayload,
  )}`;

  const columns: TableColumnsType<IServiceOrder> = [
    {
      title: t("serviceOrderColNo"),
      key: "index",
      width: 60,
      align: "center",
      render: (_: unknown, __: IServiceOrder, index: number) =>
        (currentPage - 1) * PAGE_SIZE + index + 1,
    },
    {
      title: t("serviceOrderColOrderId"),
      dataIndex: "maintenanceId",
      key: "maintenanceId",
      width: 90,
      align: "center",
    },
    {
      title: t("serviceOrderColCustomer"),
      dataIndex: "customerName",
      key: "customerName",
      width: 200,
    },
    {
      title: t("serviceOrderColVehicle"),
      dataIndex: "carInfo",
      key: "carInfo",
      width: 200,
    },
    {
      title: t("serviceOrderColTechnician"),
      key: "technicianName",
      width: 220,
      render: (_: unknown, record: IServiceOrder) => {
        const isRescueRecord = isRescueServiceOrder(record.maintenanceType);
        const normalizedTechnicianName = (record.technicianName ?? "").trim();
        const hasTechnician =
          normalizedTechnicianName.length > 0 &&
          !["—", "-", "N/A", "null", "undefined"].includes(
            normalizedTechnicianName,
          );
        if (hasTechnician) return record.technicianName;
        if (isRescueRecord) return "—";

        return (
          <AssignSelect
            className={selectFix.selectClassName}
            popupClassName={selectFix.popupClassName}
            getPopupContainer={selectFix.getPopupContainer}
            style={{ width: "100%" }}
            placeholder={t("serviceOrderAssignTechPlaceholder")}
            loading={assigningIds.includes(record.maintenanceId)}
            disabled={isTech}
            value={undefined}
            onChange={(value) =>
              handleAssignTechnician(record.maintenanceId, Number(value))
            }
            options={technicians.map((tech) => ({
              value: tech.technicianId,
              label: <span style={{ color: "#111827" }}>{tech.fullName}</span>,
            }))}
          />
        );
      },
    },
    {
      title: t("serviceOrderColServiceType"),
      key: "maintenanceType",
      width: 140,
      render: (_: unknown, record: IServiceOrder) => (
        <Tag color={TYPE_COLOR[record.maintenanceType] ?? "default"}>
          {t(`serviceOrderType_${record.maintenanceType}`) ||
            record.maintenanceType}
        </Tag>
      ),
    },
    {
      title: t("serviceOrderColStatus"),
      key: "status",
      width: 150,
      render: (_: unknown, record: IServiceOrder) =>
        isRescueServiceOrder(record.maintenanceType) ? (
          <span>—</span>
        ) : (
          <Tag color={STATUS_COLOR[record.status] ?? "default"}>
            {t(`serviceOrderStatus_${record.status}`) || record.status}
          </Tag>
        ),
    },
    {
      title: t("serviceOrderColReceiveDate"),
      key: "maintenanceDate",
      width: 160,
      render: (_: unknown, record: IServiceOrder) =>
        formatDate(record.maintenanceDate),
    },
    {
      title: t("serviceOrderColCompletedDate"),
      key: "completedDate",
      width: 160,
      render: (_: unknown, record: IServiceOrder) =>
        formatDate(record.completedDate),
    },
    {
      title: t("serviceOrderAction"),
      key: "action",
      width: 150,
      align: "center",
      fixed: "right" as const,
      render: (_: unknown, record: IServiceOrder) => {
        const isRescueRecord = isRescueServiceOrder(record.maintenanceType);
        return (
          <ActionGroup>
            <Tooltip title={t("serviceOrderTooltipView")}>
              <ActionBtn onClick={() => handleViewDetail(record.maintenanceId)}>
                <HiEye size={17} />
              </ActionBtn>
            </Tooltip>

            {!isRescueRecord && (
              <>
                {record.status === "WAITING" && (
                  <Tooltip title={t("serviceOrderTooltipStartDiagnosis")}>
                    <ActionBtn
                      $color="green"
                      onClick={() => handleStartDiagnosis(record.maintenanceId)}
                      disabled={startingDiagnosisIds.includes(record.maintenanceId)}
                    >
                      <HiPlay size={17} />
                    </ActionBtn>
                  </Tooltip>
                )}

                {isTech && (record.status === "IN_DIAGNOSIS" || record.status === "QUOTED") && (
                  <Tooltip title={t("serviceOrderTooltipAdditional")}>
                    <ActionBtn
                      $color="orange"
                      onClick={() => handleOpenAdditional(record)}
                    >
                      <HiPlusCircle size={17} />
                    </ActionBtn>
                  </Tooltip>
                )}

                {record.status === "QUOTED" && !isTech && !respondedIds.includes(record.maintenanceId) && (
                  <Tooltip title={t("serviceOrderTooltipApprove")}>
                    <ActionBtn
                      $color="green"
                      onClick={() => handleOpenRespond(record.maintenanceId)}
                    >
                      <HiClipboardCheck size={17} />
                    </ActionBtn>
                  </Tooltip>
                )}

                {record.status === "IN_DIAGNOSIS" && isTech && (
                  <Tooltip title={t("serviceOrderTooltipConfirmRepair")}>
                    <ActionBtn
                      $color="green"
                      onClick={() => handleConfirmRepair(record.maintenanceId)}
                      disabled={confirmingRepairIds.includes(record.maintenanceId)}
                    >
                      <HiArrowNarrowRight size={17} />
                    </ActionBtn>
                  </Tooltip>
                )}

                {record.status === "IN_PROGRESS" && !isTech && !transferredIds.includes(record.maintenanceId) && (
                  <Tooltip title={t("serviceOrderTooltipTransferOrder")}>
                    <ActionBtn
                      $color="blue"
                      onClick={() => handleTransferOrder(record.maintenanceId)}
                      disabled={transferringIds.includes(record.maintenanceId)}
                    >
                      <HiArchive size={17} />
                    </ActionBtn>
                  </Tooltip>
                )}

                {record.status === "IN_PROGRESS" && isTech && (
                  <Tooltip title={t("serviceOrderTooltipFinishRepair")}>
                    <ActionBtn
                      $color="green"
                      onClick={() => handleFinishRepair(record.maintenanceId)}
                      disabled={finishingRepairIds.includes(record.maintenanceId)}
                    >
                      <HiCheckCircle size={17} />
                    </ActionBtn>
                  </Tooltip>
                )}

                {record.status === "COMPLETED" && !isTech && (
                  <Tooltip title={t("serviceOrderTooltipCreateInvoice")}>
                    <ActionBtn
                      $color="purple"
                      onClick={() => handleOpenInvoice(record.maintenanceId, "create")}
                    >
                      <HiDocumentText size={17} />
                    </ActionBtn>
                  </Tooltip>
                )}

                {(record.status === "WAITING_FOR_PAYMENT" || record.status === "CLOSED") && (
                  <Tooltip title={t("serviceOrderTooltipInvoice")}>
                    <ActionBtn
                      $color="purple"
                      onClick={() => handleOpenInvoice(record.maintenanceId, "view")}
                    >
                      <HiDocumentText size={17} />
                    </ActionBtn>
                  </Tooltip>
                )}

                {record.status === "WAITING_FOR_PAYMENT" && !isTech && (
                  <Tooltip title={t("serviceOrderTooltipProcessPayment")}>
                    <ActionBtn
                      $color="green"
                      onClick={() => openPaymentModal(record.maintenanceId)}
                      disabled={processingPaymentIds.includes(record.maintenanceId)}
                    >
                      <HiCheckCircle size={17} />
                    </ActionBtn>
                  </Tooltip>
                )}
              </>
            )}
          </ActionGroup>
        );
      },
    },
  ];

  return (
    <Container>
      <FilterSelectGlobalStyle />
      <Header>
        <Title>{t("serviceOrderTitle")}</Title>
        <Subtitle>{t("serviceOrderSubtitle")}</Subtitle>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Toolbar>
        <SearchWrapper>
          <HiSearch size={16} color="#9ca3af" />
          <SearchInput
            placeholder={t("serviceOrderSearchPlaceholder")}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </SearchWrapper>
        <ConfigProvider theme={selectFix.configProviderTheme}>
          <FilterSelect
            className={selectFix.selectClassName}
            popupClassName={selectFix.popupClassName}
            getPopupContainer={selectFix.getPopupContainer}
            allowClear
            placeholder={t("serviceOrderStatusFilter")}
            style={{ minWidth: 190 }}
            value={statusFilter}
            onChange={handleStatusChange}
            options={[
              {
                value: "WAITING",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("serviceOrderStatus_WAITING")}
                  </span>
                ),
              },
              {
                value: "IN_DIAGNOSIS",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("serviceOrderStatus_IN_DIAGNOSIS")}
                  </span>
                ),
              },
              {
                value: "QUOTED",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("serviceOrderStatus_QUOTED")}
                  </span>
                ),
              },
              {
                value: "IN_PROGRESS",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("serviceOrderStatus_IN_PROGRESS")}
                  </span>
                ),
              },
              {
                value: "COMPLETED",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("serviceOrderStatus_COMPLETED")}
                  </span>
                ),
              },
              {
                value: "WAITING_FOR_PAYMENT",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("serviceOrderStatus_WAITING_FOR_PAYMENT")}
                  </span>
                ),
              },
              {
                value: "CLOSED",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("serviceOrderStatus_CLOSED")}
                  </span>
                ),
              },
              {
                value: "CANCELLED",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("serviceOrderStatus_CANCELLED")}
                  </span>
                ),
              },
            ]}
          />
          <FilterSelect
            className={selectFix.selectClassName}
            popupClassName={selectFix.popupClassName}
            getPopupContainer={selectFix.getPopupContainer}
            allowClear
            placeholder={t("serviceOrderTypeFilter")}
            style={{ minWidth: 190 }}
            value={typeFilter}
            onChange={handleTypeChange}
            options={[
              {
                value: "REPAIR",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("serviceOrderType_REPAIR")}
                  </span>
                ),
              },
              {
                value: "MAINTENANCE",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("serviceOrderType_MAINTENANCE")}
                  </span>
                ),
              },
              {
                value: "INSPECTION",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("serviceOrderType_INSPECTION")}
                  </span>
                ),
              },
            ]}
          />
        </ConfigProvider>
      </Toolbar>

      <TableCard>
        <Table<IServiceOrder>
          rowKey="maintenanceId"
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: "max-content" }}
          pagination={{
            current: currentPage,
            pageSize: PAGE_SIZE,
            total: totalCount,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} / ${total} ${t("serviceOrderUnit")}`,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      </TableCard>

      <ServiceOrderDetailModal
        isOpen={detailOpen}
        maintenanceId={detailId}
        onClose={() => setDetailOpen(false)}
      />

      <AdditionalItemsModal
        isOpen={additionalOpen}
        maintenanceId={additionalId}
        canAdd={additionalCanAdd}
        onClose={() => setAdditionalOpen(false)}
        onSuccess={() =>
          fetchOrders(
            currentPage,
            searchTerm || undefined,
            statusFilter,
            typeFilter,
          )
        }
      />

      <RespondAdditionalItemsModal
        isOpen={respondOpen}
        maintenanceId={respondId}
        onClose={() => setRespondOpen(false)}
        onSuccess={() => {
          if (respondId !== null) {
            setRespondedIds((prev) => [...prev, respondId]);
          }
          fetchOrders(
            currentPage,
            searchTerm || undefined,
            statusFilter,
            typeFilter,
          );
        }}
      />

      <InvoiceModal
        isOpen={invoiceOpen}
        maintenanceId={invoiceId}
        mode={invoiceMode}
        onSuccess={refreshOrders}
        onClose={() => setInvoiceOpen(false)}
      />

      <Modal
        open={paymentModalOpen}
        title={t("serviceOrderPaymentModalTitle")}
        onCancel={() => {
          setPaymentModalOpen(false);
          setPaymentMaintenanceId(null);
          setPaymentMethod(null);
        }}
        onOk={() => {
          if (!paymentMaintenanceId || !paymentMethod) return;
          handleProcessPayment(paymentMaintenanceId, paymentMethod);
        }}
        okText={
          paymentMethod === "TRANSFER"
            ? t("serviceOrderPaymentConfirmTransfer")
            : t("serviceOrderPaymentConfirmCash")
        }
        cancelText={t("serviceOrderPaymentCancel")}
        okButtonProps={{
          disabled: !paymentMethod || paymentMaintenanceId === null,
          loading:
            paymentMaintenanceId !== null &&
            processingPaymentIds.includes(paymentMaintenanceId),
        }}
        centered
      >
        <PaymentMethodBox>
          <PaymentLabel>{t("serviceOrderPaymentChooseMethod")}</PaymentLabel>
          <MethodRow>
            <Checkbox
              checked={paymentMethod === "CASH"}
              onChange={(e) => setPaymentMethod(e.target.checked ? "CASH" : null)}
            >
              {t("serviceOrderPaymentMethodCash")}
            </Checkbox>
            <Checkbox
              checked={paymentMethod === "TRANSFER"}
              onChange={(e) =>
                setPaymentMethod(e.target.checked ? "TRANSFER" : null)
              }
            >
              {t("serviceOrderPaymentMethodTransfer")}
            </Checkbox>
          </MethodRow>

          {paymentMethod === "TRANSFER" && paymentMaintenanceId !== null && (
            <QrBox>
              <QrNote>{t("serviceOrderPaymentQrHint")}</QrNote>
              <img src={transferQrUrl} alt="transfer-qr" width={220} height={220} />
              <QrPayload>{transferQrPayload}</QrPayload>
            </QrBox>
          )}
        </PaymentMethodBox>
      </Modal>
    </Container>
  );
};

export default ServiceOrderManager;

// ─── Styled Components ───────────────────────────────────────────────────────

const Container = styled.div`
  padding: 24px;
  background: #f9fafb;
  min-height: 100%;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;

  .service-order-filter-select .ant-select-selector,
  .service-order-filter-select .ant-select-selector .ant-select-selection-item,
  .service-order-filter-select
    .ant-select-selector
    .ant-select-selection-item-content,
  .service-order-filter-select
    .ant-select-selector
    .ant-select-selection-placeholder,
  .service-order-filter-select .ant-select-selection-search-input,
  .service-order-filter-select .ant-select-arrow,
  .service-order-filter-select .ant-select-clear {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
  }

  .service-order-filter-select.ant-select-multiple .ant-select-selection-item,
  .service-order-filter-select.ant-select-multiple
    .ant-select-selection-item-content,
  .service-order-filter-select.ant-select-multiple
    .ant-select-selection-item-remove {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
  }

  .service-order-filter-select.ant-select-multiple .ant-select-selection-item {
    background: #f3f4f6 !important;
    border-color: #d1d5db !important;
  }

  .service-order-filter-select.ant-select-disabled .ant-select-selector,
  .service-order-filter-select.ant-select-disabled
    .ant-select-selector
    .ant-select-selection-item,
  .service-order-filter-select.ant-select-disabled
    .ant-select-selector
    .ant-select-selection-placeholder {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
  }
`;

const FilterSelect = styled(AntSelect)`
  &&& .ant-select-selector,
  &&& .ant-select-selector .ant-select-selection-item,
  &&& .ant-select-selector .ant-select-selection-item-content,
  &&& .ant-select-selector .ant-select-selection-placeholder,
  &&& .ant-select-selection-search-input,
  &&& .ant-select-arrow,
  &&& .ant-select-clear,
  &&& .ant-select-selection-item-remove {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
  }

  &&&.ant-select-disabled .ant-select-selector,
  &&&.ant-select-disabled .ant-select-selector .ant-select-selection-item,
  &&&.ant-select-disabled
    .ant-select-selector
    .ant-select-selection-placeholder {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
  }
`;

const AssignSelect = styled(AntSelect)`
  &&&&& .ant-select-selector,
  &&&&& .ant-select-selector .ant-select-selection-item,
  &&&&& .ant-select-selector .ant-select-selection-item-content,
  &&&&& .ant-select-selector .ant-select-selection-placeholder,
  &&&&& .ant-select-selection-search-input,
  &&&&& .ant-select-arrow,
  &&&&& .ant-select-clear,
  &&&&& .ant-select-selector .ant-select-selection-item * {
    color: #111827 !important;
    -webkit-text-fill-color: #111827 !important;
    opacity: 1 !important;
    text-shadow: none !important;
  }
`;

const FilterSelectGlobalStyle = createGlobalStyle`
  .service-order-filter-dropdown .ant-select-item,
  .service-order-filter-dropdown .ant-select-item-option-content,
  .service-order-filter-dropdown .ant-select-item-option-selected .ant-select-item-option-content,
  .service-order-filter-dropdown .ant-select-item-option-active .ant-select-item-option-content,
  .service-order-filter-dropdown .ant-empty-description {
    color: #000 !important;
  }
`;

const SearchWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  flex: 1;
  min-width: 220px;
  max-width: 360px;
  cursor: text;
  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #111827;
  background: transparent;
  &::placeholder {
    color: #9ca3af;
  }
`;

const TableCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  padding: 0 8px;

  .ant-table {
    color: #374151;
  }
  .ant-table-thead > tr > th,
  .ant-table-thead > tr > td {
    color: #374151 !important;
    background: #f3f4f6 !important;
  }
  .ant-table-tbody > tr > td {
    color: #374151 !important;
  }
  .ant-table-tbody > tr:hover > td {
    background: #f9fafb !important;
  }
  .ant-pagination {
    color: #374151;
  }
`;

const ErrorBox = styled.div`
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
  margin-bottom: 16px;
`;

const COLOR_MAP: Record<string, { text: string; border: string; bg: string }> =
  {
    blue: { text: "#3b82f6", border: "#93c5fd", bg: "#eff6ff" },
    orange: { text: "#f97316", border: "#fdba74", bg: "#fff7ed" },
    green: { text: "#16a34a", border: "#86efac", bg: "#f0fdf4" },
    purple: { text: "#7c3aed", border: "#c4b5fd", bg: "#f5f3ff" },
  };

const ActionBtn = styled.button<{ $color?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: ${({ $color }) => COLOR_MAP[$color ?? "blue"]?.text ?? "#3b82f6"};
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: ${({ $color }) => COLOR_MAP[$color ?? "blue"]?.bg ?? "#eff6ff"};
    border-color: ${({ $color }) =>
      COLOR_MAP[$color ?? "blue"]?.border ?? "#93c5fd"};
  }
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const PaymentMethodBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PaymentLabel = styled.div`
  color: #111827;
  font-size: 14px;
  font-weight: 600;
`;

const MethodRow = styled.div`
  display: flex;
  gap: 14px;
`;

const QrBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
`;

const QrNote = styled.div`
  color: #6b7280;
  font-size: 13px;
  text-align: center;
`;

const QrPayload = styled.code`
  color: #111827;
  font-size: 12px;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
  word-break: break-all;
`;
