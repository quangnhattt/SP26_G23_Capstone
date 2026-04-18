import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { Pagination } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { AuthContext } from "@/context/AuthContext";
import { ROUTER_PAGE } from "@/routes/contants";
import { useTranslation } from "react-i18next";
import {
  FaCar,
  FaPlus,
  FaSearch,
  FaEllipsisV,
  FaFileAlt,
  FaClock,
  FaUser,
  FaPhone,
  FaEye,
  FaMapMarkerAlt,
  FaTools,
  FaTimes,
  FaClipboardCheck,
} from "react-icons/fa";
import RespondAdditionalItemsModal from "@/pages/admin/components/service-order-manager/respond-additional-items.modal";
import { getServiceOrderDetail } from "@/services/admin/serviceOrderService";
import {
  getAppointments,
  getAppointmentById,
  type IAppointment,
  type IAppointmentDetail,
} from "@/apis/appointments";
import {
  getRescueRequests,
  getRescueCustomerById,
  makeRescuePayment,
  makeRescueDeposit,
  customerConsent,
  acceptTowing,
  arriveRescue,
  type IRescueRequest,
  type IRescuePaymentPayload,
} from "@/apis/rescue";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import AppointmentDetailModal from "./AppointmentDetailModal";
import RescheduleModal from "./RescheduleModal";
import RescueDetailModal from "./RescueDetailModal";
import { rescueStatusConfig } from "./rescueStatusConfig";
import RescueStepProgress from "@/pages/admin/components/rescue-manager/RescueStepProgress";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING: { label: "Chờ xác nhận", color: "#d97706", bg: "#fef3c7" },
  CONFIRMED: { label: "Đã xác nhận", color: "#2563eb", bg: "#dbeafe" },
  CHECKED_IN: { label: "Đã nhận xe", color: "#7c3aed", bg: "#ede9fe" },
  DONE: { label: "Hoàn thành", color: "#16a34a", bg: "#dcfce7" },
  CANCELLED: { label: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
  RESCHEDULED: { label: "Cần dời lịch", color: "#b45309", bg: "#fef3c7" },
};

const IN_PROGRESS_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN"];
const IN_PROGRESS_RESCUE_STATUSES = [
  "PENDING",
  "PROPOSED_ROADSIDE",
  "PROPOSED_TOWING",
  "PROPOSAL_ACCEPTED",
  "EN_ROUTE",
  "ON_SITE",
  "DIAGNOSING",
  "REPAIRING",
  "REPAIR_COMPLETE",
  "TOWING_DISPATCHED",
  "TOWING_ACCEPTED",
  "TOWED",
  "INVOICED",
  "INVOICE_SENT",
  "PAYMENT_PENDING",
  "PAYMENT_SUBMITTED",
];
type MainTab = "BOOKING" | "RESCUE" | "ADDITIONAL_ITEMS";

const AppointmentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const autoOpenedRef = useRef(false);
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [rescueRequests, setRescueRequests] = useState<IRescueRequest[]>([]);
  const [activeTab, setActiveTab] = useState<MainTab>("BOOKING");
  const [loading, setLoading] = useState(true);
  const [loadingRescue, setLoadingRescue] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<IAppointmentDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Reschedule modal
  const [rescheduleAppointment, setRescheduleAppointment] = useState<{ id: number; reason?: string | null } | null>(null);
  const [rescueDetailData, setRescueDetailData] =
    useState<IRescueRequest | null>(null);
  const [showRescueModal, setShowRescueModal] = useState(false);
  const [loadingRescueDetail, setLoadingRescueDetail] = useState(false);

  // Role detection: 3 = Technician, 4 = Customer
  const isTechnician = user?.roleID === 3;
  const isCustomer = user?.roleID === 4;

  // Customer action states
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentModalRescue, setConsentModalRescue] =
    useState<IRescueRequest | null>(null);
  const [consentNotes, setConsentNotes] = useState("");
  const [consenting, setConsenting] = useState(false);
  const [acceptingTowingId, setAcceptingTowingId] = useState<number | null>(
    null,
  );
  const [invoiceModalRescue, setInvoiceModalRescue] =
    useState<IRescueRequest | null>(null);
  const [invoiceFetching, setInvoiceFetching] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<IRescuePaymentPayload["paymentMethod"]>("TRANSFER");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Deposit modal
  const [depositModalRescue, setDepositModalRescue] = useState<IRescueRequest | null>(null);
  const [depositFetching, setDepositFetching] = useState(false);
  const depositMethod: IRescuePaymentPayload["paymentMethod"] = "TRANSFER";
  const [depositRef, setDepositRef] = useState("");
  const [depositPaying, setDepositPaying] = useState(false);

  // Technician simple action loading
  const [techActionLoadingId, setTechActionLoadingId] = useState<number | null>(
    null,
  );

  // Additional items approval
  const [showAdditionalModal, setShowAdditionalModal] = useState(false);
  const [additionalMaintenanceId, setAdditionalMaintenanceId] = useState<number | null>(null);
  const [loadingAdditionalId, setLoadingAdditionalId] = useState<number | null>(null);


  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAppointments({
        page: currentPage,
        pageSize: pageSize,
        status: filterStatus !== "all" ? filterStatus : undefined,
        searchTerm: searchTerm.trim() || undefined,
      });
      setAppointments(data.items);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filterStatus, searchTerm]);

  useEffect(() => {
    if (!user) {
      navigate(ROUTER_PAGE.home);
      return;
    }

    const fetchRescueRequests = async () => {
      try {
        setLoadingRescue(true);
        const data = await getRescueRequests();
        setRescueRequests(data);
      } catch (error) {
        console.error("Error fetching rescue requests:", error);
      } finally {
        setLoadingRescue(false);
      }
    };

    fetchRescueRequests();

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === "sp26_rescue_mock_v1") {
        fetchRescueRequests();
      }
    };
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, [user, navigate]);

  useEffect(() => {
    if (user && activeTab !== "RESCUE") {
      fetchAppointments();
    }
  }, [fetchAppointments, user, activeTab]);

  const filteredAppointments = appointments;

  const inProgressCount = appointments.filter((a) =>
    IN_PROGRESS_STATUSES.includes(a.status),
  ).length;
  const completedCount = appointments.filter((a) => a.status === "DONE").length;
  const cancelledCount = appointments.filter(
    (a) => a.status === "CANCELLED",
  ).length;
  const rescueInProgressCount = rescueRequests.filter((r) =>
    IN_PROGRESS_RESCUE_STATUSES.includes(r.status),
  ).length;
  const rescueCompletedCount = rescueRequests.filter(
    (r) => r.status === "COMPLETED",
  ).length;
  const rescueCancelledCount = rescueRequests.filter(
    (r) => r.status === "CANCELLED",
  ).length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const getStatusInfo = (status: string) =>
    statusConfig[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  const getRescueStatusInfo = (status: string) => {
    const cfg = rescueStatusConfig[status];
    if (!cfg) return { label: status, color: "#6b7280", bg: "#f3f4f6" };
    return {
      label: cfg.labelKey ? t(cfg.labelKey) : status,
      color: cfg.color,
      bg: cfg.bg,
    };
  };

  const filteredRescueRequests = rescueRequests
    .filter((r) => {
      if (filterStatus === "all") return true;
      if (filterStatus === "IN_PROGRESS") {
        return IN_PROGRESS_RESCUE_STATUSES.includes(r.status);
      }
      if (filterStatus === "DONE") return r.status === "COMPLETED";
      return r.status === filterStatus;
    })
    .filter((r) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const carName = `${r.brand} ${r.model}`.toLowerCase();
      return (
        carName.includes(q) ||
        r.licensePlate?.toLowerCase().includes(q) ||
        r.problemDescription?.toLowerCase().includes(q) ||
        r.currentAddress?.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.customerPhone?.toLowerCase().includes(q)
      );
    });

  const handleViewDetail = async (id: number) => {
    setOpenMenuId(null);
    setLoadingDetail(true);
    setShowModal(true);
    try {
      const data = await getAppointmentById(id);
      setDetailData(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("errorOccurred")));
      setShowModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setDetailData(null);
  };

  const handleRescheduleSuccess = async () => {
    setRescheduleAppointment(null);
    try {
      const data = await getAppointments();
      setAppointments(data);
    } catch { /* ignore */ }
  };
  const closeRescueModal = () => {
    setShowRescueModal(false);
    setRescueDetailData(null);
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type?.toUpperCase()) {
      case "REPAIR":
        return t("bookingServiceTypeRepair");
      case "MAINTENANCE":
        return t("bookingServiceTypeMaintenance");
      default:
        return type;
    }
  };

  const fetchRescueRequestsRefresh = async () => {
    try {
      const data = await getRescueRequests();
      setRescueRequests(data);
    } catch (error) {
      console.error("Error fetching rescue requests:", error);
    }
    // Reload rescue detail nếu modal đang mở
    if (rescueDetailData) {
      try {
        const detail = await getRescueCustomerById(rescueDetailData.rescueId);
        setRescueDetailData(detail);
      } catch {
        // ignore
      }
    }
  };

  // ─── Additional Items Approval ─────────────────────────────
  const openAdditionalItemsModal = async (appointmentId: number, maintenanceId?: number | null) => {
    setLoadingAdditionalId(appointmentId);
    try {
      if (!maintenanceId) {
        toast.info(t("appointmentsAdditionalNoMaintenance"));
        return;
      }
      const serviceOrder = await getServiceOrderDetail(maintenanceId);
      setAdditionalMaintenanceId(serviceOrder.maintenanceId);
      setShowAdditionalModal(true);
    } catch {
      toast.error(t("errorOccurred"));
    } finally {
      setLoadingAdditionalId(null);
    }
  };

  // ─── Technician simple actions ─────────────────────────────
  const handleTechArrive = async (id: number) => {
    setTechActionLoadingId(id);
    try {
      await arriveRescue(id);
      toast.success("Đã xác nhận đến nơi!");
      fetchRescueRequestsRefresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Xác nhận thất bại!"));
    } finally {
      setTechActionLoadingId(null);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!invoiceModalRescue || !paymentAmount) return;
    setPaymentSubmitting(true);
    try {
      await makeRescuePayment(invoiceModalRescue.rescueId, {
        paymentMethod,
        amount: Number(paymentAmount),
        transactionReference: paymentRef.trim() || undefined,
      });
      toast.success("Thanh toán thành công!");
      setInvoiceModalRescue(null);
      setPaymentAmount("");
      setPaymentRef("");
      fetchRescueRequestsRefresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Thanh toán thất bại!"));
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const genPaymentRef = (rescueId: number) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `RESCUE${rescueId}${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  };

  const openInvoiceModal = async (rescue: IRescueRequest) => {
    setPaymentMethod("TRANSFER");
    setPaymentAmount("");
    setPaymentRef(genPaymentRef(rescue.rescueId));
    setInvoiceModalRescue(rescue);
    setInvoiceFetching(true);
    try {
      const detail = await getRescueCustomerById(rescue.rescueId);
      setInvoiceModalRescue(detail);
      const repairSubtotal = (detail.repairItems ?? []).reduce(
        (s, i) => s + Number(i.lineTotal ?? i.unitPrice * i.quantity),
        0,
      );
      const serviceFeeNum = Number(detail.serviceFee ?? 0);
      const total = detail.invoice?.total != null
        ? Number(detail.invoice.total)
        : serviceFeeNum > 0
          ? serviceFeeNum
          : repairSubtotal;
      const depositAmount = Number(detail.depositAmount ?? 0);
      const requiresDeposit =
        detail.requiresDeposit === true || depositAmount > 0;
      const payable = requiresDeposit ? Math.max(total - depositAmount, 0) : total;
      setPaymentAmount(String(payable));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("errorOccurred")));
    } finally {
      setInvoiceFetching(false);
    }
  };

  const openDepositModal = async (id: number) => {
    setDepositRef("");
    setDepositFetching(true);
    setDepositModalRescue({ rescueId: id } as IRescueRequest); // show modal immediately with loading
    try {
      const detail = await getRescueCustomerById(id);
      setDepositModalRescue(detail);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("errorOccurred")));
      setDepositModalRescue(null);
    } finally {
      setDepositFetching(false);
    }
  };

  const handlePayDeposit = async () => {
    if (!depositModalRescue?.depositAmount) return;
    setDepositPaying(true);
    try {
      await makeRescueDeposit(depositModalRescue.rescueId, {
        paymentMethod: depositMethod,
        amount: depositModalRescue.depositAmount,
        transactionReference: depositRef.trim() || undefined,
      });
      toast.success(t("rescueDepositPaySuccess"));
      setDepositModalRescue(null);
      fetchRescueRequestsRefresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("rescueDepositPayError")));
    } finally {
      setDepositPaying(false);
    }
  };

  const openConsentModal = (rescue: IRescueRequest) => {
    setConsentModalRescue(rescue);
    setConsentNotes("");
    setShowConsentModal(true);
  };

  const handleCustomerConsent = async (consentGiven: boolean) => {
    if (!consentModalRescue) return;
    setConsenting(true);
    try {
      await customerConsent(consentModalRescue.rescueId, {
        consentGiven,
        consentNotes: consentNotes.trim() || undefined,
      });
      toast.success(
        consentGiven
          ? "Đã xác nhận đồng ý sửa tại chỗ!"
          : "Đã từ chối sửa tại chỗ!",
      );
      setShowConsentModal(false);
      setConsentModalRescue(null);
      fetchRescueRequestsRefresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Xác nhận thất bại!"));
    } finally {
      setConsenting(false);
    }
  };

  const handleAcceptTowing = async (rescueId: number) => {
    setAcceptingTowingId(rescueId);
    try {
      await acceptTowing(rescueId);
      toast.success("Đã chấp nhận dịch vụ kéo xe!");
      fetchRescueRequestsRefresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Xác nhận thất bại!"));
    } finally {
      setAcceptingTowingId(null);
    }
  };

  const handleViewRescueDetail = async (id: number) => {
    setOpenMenuId(null);
    setLoadingRescueDetail(true);
    setShowRescueModal(true);
    try {
      const data = await getRescueCustomerById(id);
      setRescueDetailData(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("errorOccurred")));
      setShowRescueModal(false);
    } finally {
      setLoadingRescueDetail(false);
    }
  };

  // Auto-open modal from URL params (e.g. ?openAppt=123 or ?openRescue=456&tab=RESCUE)
  useEffect(() => {
    if (autoOpenedRef.current) return;
    const params = new URLSearchParams(location.search);
    const openAppt = params.get("openAppt");
    const openRescue = params.get("openRescue");
    const tab = params.get("tab") as MainTab | null;
    if (!openAppt && !openRescue) return;
    autoOpenedRef.current = true;
    if (tab) setActiveTab(tab);
    if (openRescue) {
      if (!tab) setActiveTab("RESCUE");
      handleViewRescueDetail(Number(openRescue));
    } else if (openAppt) {
      handleViewDetail(Number(openAppt));
    }
    // Clean URL so back/refresh doesn't re-open
    navigate(location.pathname, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  return (
    <PageWrapper>
      <Container>
        <Header>
          <HeaderContent>
            <HeaderTitle>{t("appointmentsTitle")}</HeaderTitle>
            <HeaderSubtitle>{t("appointmentsSubtitle")}</HeaderSubtitle>
          </HeaderContent>
          <NewBookingButton onClick={() => navigate(ROUTER_PAGE.booking)}>
            <FaPlus size={14} />
            {t("appointmentsNewBooking")}
          </NewBookingButton>
        </Header>

        <MainTabs>
          <MainTabButton
            $active={activeTab === "BOOKING"}
            onClick={() => {
              setActiveTab("BOOKING");
              setFilterStatus("all");
            }}
          >
            Đặt lịch
          </MainTabButton>
          <MainTabButton
            $active={activeTab === "RESCUE"}
            onClick={() => {
              setActiveTab("RESCUE");
              setFilterStatus("all");
            }}
          >
            {t("appointmentsRescueTab")}
          </MainTabButton>
          {isCustomer && (
            <MainTabButton
              $active={activeTab === "ADDITIONAL_ITEMS"}
              onClick={() => setActiveTab("ADDITIONAL_ITEMS")}
            >
              <FaClipboardCheck size={13} style={{ marginRight: 5 }} />
              {t("appointmentsAdditionalItemsTab")}
            </MainTabButton>
          )}
        </MainTabs>

        <ToolBar style={{ display: activeTab === "ADDITIONAL_ITEMS" ? "none" : undefined }}>
          <FilterTabs>
            <FilterTab
              $active={filterStatus === "all"}
              onClick={() => setFilterStatus("all")}
            >
              {t("appointmentsAll")}
              <TabCount $active={filterStatus === "all"}>
                {activeTab === "BOOKING"
                  ? appointments.length
                  : rescueRequests.length}
              </TabCount>
            </FilterTab>
            <FilterTab
              $active={filterStatus === "IN_PROGRESS"}
              onClick={() => setFilterStatus("IN_PROGRESS")}
            >
              {t("appointmentsInProgress")}
              <TabCount $active={filterStatus === "IN_PROGRESS"}>
                {activeTab === "BOOKING"
                  ? inProgressCount
                  : rescueInProgressCount}
              </TabCount>
            </FilterTab>
            <FilterTab
              $active={filterStatus === "DONE"}
              onClick={() => setFilterStatus("DONE")}
            >
              {t("appointmentsCompleted")}
              <TabCount $active={filterStatus === "DONE"}>
                {activeTab === "BOOKING"
                  ? completedCount
                  : rescueCompletedCount}
              </TabCount>
            </FilterTab>
            <FilterTab
              $active={filterStatus === "CANCELLED"}
              onClick={() => setFilterStatus("CANCELLED")}
            >
              {t("appointmentsCancelled")}
              <TabCount $active={filterStatus === "CANCELLED"}>
                {activeTab === "BOOKING"
                  ? cancelledCount
                  : rescueCancelledCount}
              </TabCount>
            </FilterTab>
          </FilterTabs>
          <SearchBox>
            <FaSearch size={14} color="#9ca3af" />
            <SearchInput
              placeholder={t("appointmentsSearch")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBox>
        </ToolBar>

        <ContentSection>
          {activeTab === "ADDITIONAL_ITEMS" ? (
            (() => {
              const inProgressAppts = appointments.filter((a) =>
                IN_PROGRESS_STATUSES.includes(a.status) &&
                a.maintenanceStatus === "QUOTED",
              );
              if (loading) return <LoadingMessage>{t("loading")}</LoadingMessage>;
              if (inProgressAppts.length === 0)
                return (
                  <EmptyState>
                    <FaClipboardCheck size={48} color="#d1d5db" />
                    <EmptyTitle>{t("appointmentsAdditionalEmpty")}</EmptyTitle>
                    <EmptyDesc>{t("appointmentsAdditionalEmptyDesc")}</EmptyDesc>
                  </EmptyState>
                );
              return (
                <AppointmentList>
                  {inProgressAppts.map((appt) => {
                    const statusInfo = getStatusInfo(appt.status);
                    const carName = `${appt.carBrand} ${appt.carModel}`;
                    const isLoadingThis = loadingAdditionalId === appt.appointmentId;
                    return (
                      <AppointmentCard key={appt.appointmentId}>
                        <CardLeft>
                          <CarIconWrapper>
                            <FaCar size={22} color="#6b7280" />
                          </CarIconWrapper>
                          <CarInfo>
                            <CarName>{carName}</CarName>
                            <CarPlate>{appt.licensePlate}</CarPlate>
                          </CarInfo>
                        </CardLeft>
                        <CardRight>
                          <CardTitleRow>
                            <CardTitle>
                              {getServiceTypeLabel(appt.serviceType)}
                            </CardTitle>
                            <BadgeGroup>
                              <StatusBadge $color={statusInfo.color} $bg={statusInfo.bg}>
                                {statusInfo.label}
                              </StatusBadge>
                            </BadgeGroup>
                          </CardTitleRow>
                          <InfoRow>
                            <FaUser size={13} color="#9ca3af" />
                            <InfoText>{appt.customerFullName}</InfoText>
                          </InfoRow>
                          <CardFooter>
                            <FooterItem>
                              <FaFileAlt size={12} />
                              #appointment-{appt.appointmentId}
                            </FooterItem>
                            <FooterItem>
                              <FaClock size={12} />
                              {formatDate(appt.appointmentDate || appt.createdDate)}
                            </FooterItem>
                            <ApproveItemsBtn
                              onClick={() => openAdditionalItemsModal(appt.appointmentId, appt.maintenanceId)}
                              disabled={isLoadingThis}
                            >
                              <FaClipboardCheck size={13} />
                              {isLoadingThis
                                ? t("loading")
                                : t("appointmentsAdditionalApproveBtn")}
                            </ApproveItemsBtn>
                          </CardFooter>
                        </CardRight>
                      </AppointmentCard>
                    );
                  })}
                </AppointmentList>
              );
            })()
          ) : activeTab === "BOOKING" && loading ? (
            <LoadingMessage>{t("loading")}</LoadingMessage>
          ) : activeTab === "RESCUE" && loadingRescue ? (
            <LoadingMessage>{t("loading")}</LoadingMessage>
          ) : activeTab === "BOOKING" && filteredAppointments.length === 0 ? (
            <EmptyState>
              <FaCar size={48} color="#d1d5db" />
              <EmptyTitle>{t("appointmentsEmpty")}</EmptyTitle>
              <EmptyDesc>{t("appointmentsEmptyDesc")}</EmptyDesc>
              <EmptyButton onClick={() => navigate(ROUTER_PAGE.booking)}>
                <FaPlus size={14} />
                {t("appointmentsNewBooking")}
              </EmptyButton>
            </EmptyState>
          ) : activeTab === "RESCUE" && filteredRescueRequests.length === 0 ? (
            <EmptyState>
              <FaTools size={48} color="#d1d5db" />
              <EmptyTitle>Chưa có yêu cầu cứu hộ</EmptyTitle>
              <EmptyDesc>
                Danh sách yêu cầu cứu hộ sẽ hiển thị tại đây.
              </EmptyDesc>
            </EmptyState>
          ) : (
            <AppointmentList>
              {activeTab === "BOOKING" &&
                filteredAppointments.map((appointment) => {
                  const statusInfo = getStatusInfo(appointment.status);
                  const carName = `${appointment.carBrand} ${appointment.carModel}`;
                  return (
                    <AppointmentCard key={appointment.appointmentId}>
                      <CardLeft>
                        <CarIconWrapper>
                          <FaCar size={22} color="#6b7280" />
                        </CarIconWrapper>
                        <CarInfo>
                          <CarName>{carName}</CarName>
                          <CarPlate>{appointment.licensePlate}</CarPlate>
                        </CarInfo>
                      </CardLeft>

                      <CardRight>
                        <CardTitleRow>
                          <CardTitle>
                            {getServiceTypeLabel(appointment.serviceType)}
                          </CardTitle>
                          <BadgeGroup>
                            <StatusBadge
                              $color={statusInfo.color}
                              $bg={statusInfo.bg}
                            >
                              {statusInfo.label}
                            </StatusBadge>
                          </BadgeGroup>
                          <MoreButtonWrapper>
                            <MoreButton
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === appointment.appointmentId
                                    ? null
                                    : appointment.appointmentId,
                                )
                              }
                            >
                              <FaEllipsisV size={14} color="#9ca3af" />
                            </MoreButton>
                            {openMenuId === appointment.appointmentId && (
                              <DropdownMenu>
                                <DropdownItem
                                  onClick={() =>
                                    handleViewDetail(appointment.appointmentId)
                                  }
                                >
                                  <FaEye size={14} color="#6b7280" />
                                  {t("appointmentsViewDetail")}
                                </DropdownItem>
                              </DropdownMenu>
                            )}
                          </MoreButtonWrapper>
                        </CardTitleRow>

                        {appointment.notes && (
                          <CardDesc>{appointment.notes}</CardDesc>
                        )}

                        {/* Nút phản hồi dời lịch dành cho Customer */}
                        {isCustomer && appointment.status === "RESCHEDULED" && (
                          <RespondRescheduleBtn
                            onClick={() =>
                              setRescheduleAppointment({
                                id: appointment.appointmentId,
                                reason: appointment.rejectionReason,
                              })
                            }
                          >
                            📅 Phản hồi yêu cầu dời lịch
                          </RespondRescheduleBtn>
                        )}

                        <InfoRow>
                          <FaUser size={13} color="#9ca3af" />
                          <InfoText>{appointment.customerFullName}</InfoText>
                          <FaPhone
                            size={12}
                            color="#9ca3af"
                            style={{ marginLeft: "0.75rem" }}
                          />
                          <InfoText>
                            {appointment.phone || appointment.customerPhone}
                          </InfoText>
                        </InfoRow>

                        {appointment.packageName && (
                          <SymptomRow>
                            <SymptomTag>{appointment.packageName}</SymptomTag>
                          </SymptomRow>
                        )}

                        <CardFooter>
                          <FooterItem>
                            <FaFileAlt size={12} />
                            #appointment-{appointment.appointmentId}
                          </FooterItem>
                          <FooterItem>
                            <FaClock size={12} />
                            {formatDate(
                              appointment.appointmentDate ||
                                appointment.createdDate,
                            )}
                          </FooterItem>
                          {appointment.packageFinalPrice != null &&
                            appointment.packageFinalPrice > 0 && (
                              <PriceTag>
                                {t("appointmentsQuote")}:{" "}
                                {formatPrice(appointment.packageFinalPrice)}
                              </PriceTag>
                            )}
                        </CardFooter>
                      </CardRight>
                    </AppointmentCard>
                  );
                })}

              {activeTab === "RESCUE" &&
                filteredRescueRequests.map((rescue) => {
                  const statusInfo = getRescueStatusInfo(rescue.status);
                  const carName = `${rescue.brand} ${rescue.model}`;
                  return (
                    <AppointmentCard key={rescue.rescueId}>
                      <CardLeft>
                        <CarIconWrapper>
                          <FaTools size={20} color="#6b7280" />
                        </CarIconWrapper>
                        <CarInfo>
                          <CarName>{carName}</CarName>
                          <CarPlate>{rescue.licensePlate}</CarPlate>
                        </CarInfo>
                      </CardLeft>

                      <CardRight>
                        <CardTitleRow>
                          <CardTitle>
                            {rescue.problemDescription || "Yêu cầu cứu hộ"}
                          </CardTitle>
                          <BadgeGroup>
                            <StatusBadge
                              $color={statusInfo.color}
                              $bg={statusInfo.bg}
                            >
                              {statusInfo.label}
                            </StatusBadge>
                          </BadgeGroup>
                          <MoreButtonWrapper>
                            <MoreButton
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === rescue.rescueId
                                    ? null
                                    : rescue.rescueId,
                                )
                              }
                            >
                              <FaEllipsisV size={14} color="#9ca3af" />
                            </MoreButton>
                            {openMenuId === rescue.rescueId && (
                              <DropdownMenu>
                                <DropdownItem
                                  onClick={() =>
                                    handleViewRescueDetail(rescue.rescueId)
                                  }
                                >
                                  <FaEye size={14} color="#6b7280" />
                                  {t("appointmentsViewDetail")}
                                </DropdownItem>
                              </DropdownMenu>
                            )}
                          </MoreButtonWrapper>
                        </CardTitleRow>

                        <InfoRow>
                          <FaUser size={13} color="#9ca3af" />
                          <InfoText>{rescue.customerName}</InfoText>
                          <FaPhone
                            size={12}
                            color="#9ca3af"
                            style={{ marginLeft: "0.75rem" }}
                          />
                          <InfoText>{rescue.customerPhone}</InfoText>
                        </InfoRow>

                        <InfoRow>
                          <FaMapMarkerAlt size={12} color="#9ca3af" />
                          <InfoText>{rescue.currentAddress}</InfoText>
                        </InfoRow>

                        <RescueStepProgress status={rescue.status} rescueType={rescue.rescueType} />

                        {/* ── Technician actions ── */}
                        {isTechnician &&
                          rescue.status === "EN_ROUTE" && (
                          <CustomerActionRow>
                            <CustomerActionBtn
                              $color="#0d9488"
                              onClick={() => handleTechArrive(rescue.rescueId)}
                              disabled={techActionLoadingId === rescue.rescueId}
                            >
                              {techActionLoadingId === rescue.rescueId
                                ? "Đang xử lý..."
                                : "Xác nhận đã đến nơi"}
                            </CustomerActionBtn>
                          </CustomerActionRow>
                        )}
                        {isTechnician &&
                          ["ON_SITE", "DIAGNOSING", "REPAIRING"].includes(
                            rescue.status,
                          ) && (
                            <CustomerActionRow>
                              <CustomerActionBtn
                                $color="#ea580c"
                                onClick={() =>
                                  handleViewRescueDetail(rescue.rescueId)
                                }
                              >
                                {rescue.status === "REPAIRING"
                                  ? "Báo hoàn tất sửa chữa"
                                  : "Chẩn đoán & xử lý"}
                              </CustomerActionBtn>
                            </CustomerActionRow>
                          )}

                        {/* ── Customer actions ── */}
                        {isCustomer &&
                          ["PROPOSED_ROADSIDE", "PROPOSED_TOWING"].includes(rescue.status) && (
                            <CustomerActionRow>
                              <CustomerActionBtn
                                $color="#2563eb"
                                onClick={() => handleViewRescueDetail(rescue.rescueId)}
                              >
                                {rescue.status === "PROPOSED_ROADSIDE"
                                  ? t("rescueViewRoadsideProposal")
                                  : t("rescueViewTowingProposal")}
                              </CustomerActionBtn>
                            </CustomerActionRow>
                          )}
                        {isCustomer && rescue.status === "PROPOSAL_ACCEPTED" && (() => {
                          const needsDeposit = rescue.requiresDeposit === true || (rescue.depositAmount != null && rescue.depositAmount > 0);
                          if (!needsDeposit) {
                            // Không cần cọc → chỉ xem chi tiết, chờ SA điều KTV
                            return (
                              <CustomerActionRow>
                                <CustomerActionBtn $color="#7c3aed" onClick={() => handleViewRescueDetail(rescue.rescueId)}>
                                  {t("rescueViewDetailBtn")}
                                </CustomerActionBtn>
                              </CustomerActionRow>
                            );
                          }
                          if (!rescue.isDepositPaid) {
                            // Cần cọc, chưa trả → hiện 2 nút
                            return (
                              <CustomerActionRow>
                                <CustomerActionBtn $color="#7c3aed" onClick={() => handleViewRescueDetail(rescue.rescueId)}>
                                  {t("rescueViewDetailBtn")}
                                </CustomerActionBtn>
                                <CustomerActionBtn $color="#ea580c" onClick={() => openDepositModal(rescue.rescueId)}>
                                  {t("rescuePayDepositBtn")}
                                </CustomerActionBtn>
                              </CustomerActionRow>
                            );
                          }
                          if (!rescue.isDepositConfirmed) {
                            // Đã trả, chờ SA xác nhận
                            return (
                              <CustomerActionRow>
                                <CustomerActionBtn $color="#d97706" disabled style={{ opacity: 0.75, cursor: "default" }} onClick={() => {}}>
                                  {t("rescueDepositWaitingConfirm")}
                                </CustomerActionBtn>
                              </CustomerActionRow>
                            );
                          }
                          // Cọc đã xác nhận, chờ SA điều KTV
                          return (
                            <CustomerActionRow>
                              <CustomerActionBtn $color="#16a34a" disabled style={{ opacity: 0.75, cursor: "default" }} onClick={() => {}}>
                                {t("rescueDepositConfirmedWaiting")}
                              </CustomerActionBtn>
                            </CustomerActionRow>
                          );
                        })()}
                        {isCustomer && rescue.status === "DIAGNOSING" && (
                          <CustomerActionRow>
                            <CustomerActionBtn
                              $color="#16a34a"
                              onClick={() => openConsentModal(rescue)}
                            >
                              Xem kết quả chẩn đoán & xác nhận
                            </CustomerActionBtn>
                          </CustomerActionRow>
                        )}
                        {isCustomer &&
                          rescue.status === "TOWING_DISPATCHED" && (
                            <CustomerActionRow>
                              <CustomerActionBtn
                                $color="#0891b2"
                                onClick={() =>
                                  handleAcceptTowing(rescue.rescueId)
                                }
                                disabled={acceptingTowingId === rescue.rescueId}
                              >
                                {acceptingTowingId === rescue.rescueId
                                  ? "Đang xử lý..."
                                  : "Chấp nhận kéo xe"}
                              </CustomerActionBtn>
                            </CustomerActionRow>
                          )}
                        {isCustomer &&
                          ["INVOICE_SENT", "PAYMENT_PENDING"].includes(
                            rescue.status,
                          ) && (
                            <CustomerActionRow>
                              <CustomerActionBtn
                                $color="#1d4ed8"
                                onClick={() => openInvoiceModal(rescue)}
                              >
                                {t("rescueViewInvoiceAndPay")}
                              </CustomerActionBtn>
                            </CustomerActionRow>
                          )}
                        {isCustomer && rescue.status === "PAYMENT_SUBMITTED" && (
                          <CustomerActionRow>
                            <CustomerActionBtn
                              $color="#16a34a"
                              disabled
                              style={{ opacity: 0.75, cursor: "default" }}
                              onClick={() => {}}
                            >
                              {t("rescuePaymentSubmittedInfo")}
                            </CustomerActionBtn>
                          </CustomerActionRow>
                        )}

                        <CardFooter>
                          <FooterItem>
                            <FaFileAlt size={12} />
                            #rescue-{rescue.rescueId}
                          </FooterItem>
                          <FooterItem>
                            <FaClock size={12} />
                            {formatDate(rescue.createdDate)}
                          </FooterItem>
                          <ViewDetailBtn
                            onClick={() => handleViewRescueDetail(rescue.rescueId)}
                          >
                            <FaEye size={12} />
                            Xem chi tiết
                          </ViewDetailBtn>
                        </CardFooter>
                      </CardRight>
                    </AppointmentCard>
                  );
                })}
            </AppointmentList>
          )}

          {/* ── PAGINATION (BOOKING TAB ONLY) ── */}
          {activeTab === "BOOKING" && !loading && totalCount > 0 && (
            <PaginationWrapper>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalCount}
                showSizeChanger={false}
                onChange={(page) => setCurrentPage(page)}
              />
            </PaginationWrapper>
          )}
        </ContentSection>
      </Container>

      <RespondAdditionalItemsModal
        isOpen={showAdditionalModal}
        maintenanceId={additionalMaintenanceId}
        onClose={() => {
          setShowAdditionalModal(false);
          setAdditionalMaintenanceId(null);
        }}
        onSuccess={() => {
          setShowAdditionalModal(false);
          setAdditionalMaintenanceId(null);
          fetchAppointments();
        }}
      />

      {showModal && (
        <AppointmentDetailModal
          data={detailData}
          loading={loadingDetail}
          onClose={closeModal}
        />
      )}
      {rescheduleAppointment && (
        <RescheduleModal
          appointmentId={rescheduleAppointment.id}
          rejectionReason={rescheduleAppointment.reason}
          onClose={() => setRescheduleAppointment(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}
      {showRescueModal && (
        <RescueDetailModal
          data={rescueDetailData}
          loading={loadingRescueDetail}
          onClose={closeRescueModal}
          onRefresh={fetchRescueRequestsRefresh}
          userRoleID={user?.roleID}
        />
      )}

      {/* Customer Consent Modal */}
      {showConsentModal && consentModalRescue && (
        <PaymentOverlay onClick={() => setShowConsentModal(false)}>
          <PaymentCard
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <PaymentHeader>
              <PaymentTitle>Xác nhận sửa chữa tại chỗ</PaymentTitle>
              <CloseModalBtn onClick={() => setShowConsentModal(false)}>
                <FaTimes size={18} />
              </CloseModalBtn>
            </PaymentHeader>
            <PaymentBody>
              <AcceptJobInfo>
                <AcceptJobRow>
                  <AcceptJobLabel>Xe</AcceptJobLabel>
                  <AcceptJobValue>
                    {consentModalRescue.brand} {consentModalRescue.model} —{" "}
                    {consentModalRescue.licensePlate}
                  </AcceptJobValue>
                </AcceptJobRow>
                <AcceptJobRow>
                  <AcceptJobLabel>Vấn đề</AcceptJobLabel>
                  <AcceptJobValue>
                    {consentModalRescue.problemDescription}
                  </AcceptJobValue>
                </AcceptJobRow>
              </AcceptJobInfo>
              <div style={{ marginTop: "1rem" }}>
                <FormLabel>Ghi chú xác nhận (tuỳ chọn)</FormLabel>
                <textarea
                  rows={3}
                  value={consentNotes}
                  onChange={(e) => setConsentNotes(e.target.value)}
                  placeholder="VD: Khách hàng đồng ý kiểm tra và sửa chữa tại chỗ."
                  disabled={consenting}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    resize: "vertical",
                    minHeight: "80px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </PaymentBody>
            <PaymentFooter>
              <PaymentCancelBtn
                onClick={() => handleCustomerConsent(false)}
                disabled={consenting}
                style={{ color: "#dc2626", borderColor: "#dc2626" }}
              >
                {consenting ? "Đang xử lý..." : "Từ chối"}
              </PaymentCancelBtn>
              <PaymentConfirmBtn
                onClick={() => handleCustomerConsent(true)}
                disabled={consenting}
                style={{ background: "#16a34a" }}
              >
                {consenting ? "Đang xử lý..." : "Đồng ý sửa tại chỗ"}
              </PaymentConfirmBtn>
            </PaymentFooter>
          </PaymentCard>
        </PaymentOverlay>
      )}

      {/* Invoice + Payment Modal */}
      {invoiceModalRescue && (
        <PaymentOverlay onClick={() => setInvoiceModalRescue(null)}>
          <PaymentCard
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px" }}
          >
            <PaymentHeader>
              <PaymentTitle>Hoá đơn cứu hộ</PaymentTitle>
              <CloseModalBtn onClick={() => setInvoiceModalRescue(null)}>
                <FaTimes size={18} />
              </CloseModalBtn>
            </PaymentHeader>
            <PaymentBody>
              {/* ── Invoice details ── */}
              <AcceptJobInfo>
                <AcceptJobRow>
                  <AcceptJobLabel>XE</AcceptJobLabel>
                  <AcceptJobValue>
                    {invoiceModalRescue.brand} {invoiceModalRescue.model} —{" "}
                    {invoiceModalRescue.licensePlate}
                  </AcceptJobValue>
                </AcceptJobRow>
                <AcceptJobRow>
                  <AcceptJobLabel>LOẠI CỨU HỘ</AcceptJobLabel>
                  <AcceptJobValue>
                    {invoiceModalRescue.rescueType === "ROADSIDE"
                      ? "Sửa tại chỗ"
                      : invoiceModalRescue.rescueType === "TOWING"
                        ? "Kéo xe về gara"
                        : "—"}
                  </AcceptJobValue>
                </AcceptJobRow>
                {invoiceFetching ? (
                  <AcceptJobRow>
                    <AcceptJobValue style={{ color: "#6b7280", fontStyle: "italic" }}>
                      {t("loading")}
                    </AcceptJobValue>
                  </AcceptJobRow>
                ) : invoiceModalRescue.invoice ? (
                  <>
                    <AcceptJobRow>
                      <AcceptJobLabel>Phí dịch vụ</AcceptJobLabel>
                      <AcceptJobValue>
                        {invoiceModalRescue.invoice.rescueServiceFee.toLocaleString("vi-VN")} đ
                      </AcceptJobValue>
                    </AcceptJobRow>
                    {invoiceModalRescue.invoice.manualDiscount > 0 && (
                      <AcceptJobRow>
                        <AcceptJobLabel>Giảm giá</AcceptJobLabel>
                        <AcceptJobValue style={{ color: "#16a34a" }}>
                          − {invoiceModalRescue.invoice.manualDiscount.toLocaleString("vi-VN")} đ
                        </AcceptJobValue>
                      </AcceptJobRow>
                    )}
                    <AcceptJobRow
                      style={{ borderTop: "1px solid #e5e7eb", paddingTop: "0.5rem", marginTop: "0.25rem" }}
                    >
                      <AcceptJobLabel style={{ fontWeight: 700, color: "#111827" }}>
                        Tổng thanh toán
                      </AcceptJobLabel>
                      <AcceptJobValue style={{ fontWeight: 700, fontSize: "1.05rem", color: "#1d4ed8" }}>
                        {invoiceModalRescue.invoice.total.toLocaleString("vi-VN")} đ
                      </AcceptJobValue>
                    </AcceptJobRow>
                    {invoiceModalRescue.invoice.notes && (
                      <AcceptJobRow>
                        <AcceptJobLabel>Ghi chú</AcceptJobLabel>
                        <AcceptJobValue>{invoiceModalRescue.invoice.notes}</AcceptJobValue>
                      </AcceptJobRow>
                    )}
                  </>
                ) : !invoiceModalRescue.repairItems?.length ? (
                  <AcceptJobRow>
                    <AcceptJobValue style={{ color: "#6b7280", fontStyle: "italic" }}>
                      Chưa có thông tin hoá đơn chi tiết
                    </AcceptJobValue>
                  </AcceptJobRow>
                ) : null}
              </AcceptJobInfo>

              {/* ── Danh sách vật tư / dịch vụ ── */}
              {!invoiceFetching && (() => {
                const items = invoiceModalRescue.repairItems?.length
                  ? invoiceModalRescue.repairItems.map(i => ({
                      name: i.productName ?? `ID ${i.productId}`,
                      code: i.productCode,
                      qty: i.quantity,
                      unitPrice: i.unitPrice,
                      total: i.lineTotal ?? i.unitPrice * i.quantity,
                    }))
                  : (invoiceModalRescue.suggestedParts ?? []).map(p => ({
                      name: p.partName ?? `ID ${p.partId}`,
                      code: p.partCode,
                      qty: p.quantity,
                      unitPrice: p.unitPrice ?? 0,
                      total: p.estimatedLineAmount ?? ((p.unitPrice ?? 0) * p.quantity),
                    }));
                // const serviceFeeAmt = invoiceModalRescue.serviceFee ?? 0; // TODO: tạm ẩn
                const repairSubtotal = items.reduce((s, i) => s + i.total, 0);
                const grandTotal = invoiceModalRescue.invoice?.total ?? repairSubtotal;
                if (items.length === 0) return null;
                return (
                  <div style={{ marginTop: "1rem", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", tableLayout: "fixed" }}>
                      <colgroup>
                        <col style={{ width: "45%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "22%" }} />
                        <col style={{ width: "23%" }} />
                      </colgroup>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                          <th style={{ padding: "0.4rem 0.75rem", textAlign: "left", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>Tên</th>
                          <th style={{ padding: "0.4rem 0.4rem", textAlign: "center", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>SL</th>
                          <th style={{ padding: "0.4rem 0.4rem", textAlign: "right", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>Đơn giá</th>
                          <th style={{ padding: "0.4rem 0.75rem", textAlign: "right", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "0.4rem 0.75rem", color: "#111827", wordBreak: "break-word" }}>
                              <div style={{ fontWeight: 500, color: "#111827" }}>{item.name}</div>
                              {item.code && <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{item.code}</div>}
                            </td>
                            <td style={{ padding: "0.4rem 0.4rem", textAlign: "center", color: "#374151" }}>{item.qty}</td>
                            <td style={{ padding: "0.4rem 0.4rem", textAlign: "right", color: "#374151", whiteSpace: "nowrap" }}>{item.unitPrice.toLocaleString()}</td>
                            <td style={{ padding: "0.4rem 0.75rem", textAlign: "right", fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>{item.total.toLocaleString()}</td>
                          </tr>
                        ))}
                        {/* TODO: tạm ẩn hàng "Phí dịch vụ cứu hộ" */}
                        {/* {serviceFeeAmt > 0 && (
                          <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
                            <td style={{ padding: "0.4rem 0.75rem", color: "#111827" }}>
                              <div style={{ fontWeight: 500, color: "#111827" }}>Phí dịch vụ cứu hộ</div>
                            </td>
                            <td style={{ padding: "0.4rem 0.4rem", textAlign: "center", color: "#374151" }}>1</td>
                            <td style={{ padding: "0.4rem 0.4rem", textAlign: "right", color: "#374151", whiteSpace: "nowrap" }}>{serviceFeeAmt.toLocaleString()}</td>
                            <td style={{ padding: "0.4rem 0.75rem", textAlign: "right", fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>{serviceFeeAmt.toLocaleString()}</td>
                          </tr>
                        )} */}
                        <tr style={{ background: "#eff6ff", borderTop: "2px solid #bfdbfe" }}>
                          <td colSpan={3} style={{ padding: "0.5rem 0.75rem", fontWeight: 700, color: "#1d4ed8", textAlign: "right" }}>
                            Tổng cộng
                          </td>
                          <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 700, color: "#1d4ed8", whiteSpace: "nowrap", fontSize: "0.9rem" }}>
                            {grandTotal.toLocaleString()} đ
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* ── Payment form ── */}
              <div style={{ borderTop: "2px dashed #e5e7eb", marginTop: "1.25rem", paddingTop: "1.25rem" }}>
                {(() => {
                  const repairSubtotal = (invoiceModalRescue.repairItems ?? []).reduce(
                    (s, i) => s + Number(i.lineTotal ?? i.totalPrice ?? i.unitPrice * i.quantity),
                    0,
                  );
                  const total = Number(
                    invoiceModalRescue.invoice?.total ??
                      invoiceModalRescue.serviceFee ??
                      repairSubtotal,
                  );
                  const depositAmount = Number(invoiceModalRescue.depositAmount ?? 0);
                  const requiresDeposit =
                    invoiceModalRescue.requiresDeposit === true || depositAmount > 0;
                  if (!requiresDeposit) return null;
                  const refundAmount = Math.max(depositAmount - total, 0);
                  const payableAmount = Math.max(total - depositAmount, 0);
                  return (
                    <div style={{ marginBottom: "0.875rem" }}>
                      <FormLabel>{t("rescuePaymentDepositAmountLabel")}</FormLabel>
                      <FormInput type="number" value={depositAmount} readOnly />
                      <div style={{ marginTop: "0.375rem", fontSize: "0.8125rem", color: "#1d4ed8", fontWeight: 600 }}>
                        {refundAmount > 0
                          ? t("rescuePaymentRefundHint", {
                              amount: refundAmount.toLocaleString("vi-VN"),
                            })
                          : t("rescuePaymentRemainingHint", {
                              amount: payableAmount.toLocaleString("vi-VN"),
                            })}
                      </div>
                    </div>
                  );
                })()}

                {/* Phương thức thanh toán */}
                <div style={{ marginBottom: "0.875rem" }}>
                  <FormLabel>Phương thức thanh toán *</FormLabel>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {(["TRANSFER", "CASH"] as const).map((m) => (
                      <PaymentMethodBtn
                        key={m}
                        $active={paymentMethod === m}
                        onClick={() => setPaymentMethod(m)}
                      >
                        {m === "TRANSFER" ? "Chuyển khoản" : "Tiền mặt"}
                      </PaymentMethodBtn>
                    ))}
                  </div>
                </div>

                {/* QR khi chuyển khoản */}
                {paymentMethod === "TRANSFER" && (
                  <div style={{ textAlign: "center", margin: "0.75rem 0" }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`Thanh toan RESCUE-${invoiceModalRescue.rescueId} | So tien: ${paymentAmount || "0"} VND | Ma GD: ${paymentRef}`)}`}
                      alt="QR thanh toán"
                      style={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                    />
                    <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.375rem" }}>
                      Quét mã QR để thanh toán
                    </p>
                  </div>
                )}

                {/* Số tiền */}
                <div style={{ marginBottom: "0.875rem" }}>
                  <FormLabel>Số tiền (VND) *</FormLabel>
                  <FormInput
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Nhập số tiền"
                    readOnly={
                      invoiceModalRescue.requiresDeposit === true ||
                      Number(invoiceModalRescue.depositAmount ?? 0) > 0
                    }
                  />
                </div>

                {/* Mã giao dịch — chỉ khi chuyển khoản */}
                {paymentMethod === "TRANSFER" && (
                  <div>
                    <FormLabel>Mã giao dịch</FormLabel>
                    <FormInput
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      style={{ fontFamily: "monospace", letterSpacing: "0.03em" }}
                    />
                  </div>
                )}
              </div>
            </PaymentBody>
            <PaymentFooter>
              <PaymentCancelBtn
                onClick={() => setInvoiceModalRescue(null)}
                disabled={paymentSubmitting}
              >
                Đóng
              </PaymentCancelBtn>
              <PaymentConfirmBtn
                onClick={handlePaymentSubmit}
                disabled={!paymentAmount || paymentSubmitting}
              >
                {paymentSubmitting ? "Đang xử lý..." : "Xác nhận thanh toán"}
              </PaymentConfirmBtn>
            </PaymentFooter>
          </PaymentCard>
        </PaymentOverlay>
      )}

      {/* ── Deposit Modal ── */}
      {depositModalRescue && (
        <PaymentOverlay onClick={() => !depositPaying && setDepositModalRescue(null)}>
          <PaymentCard onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <PaymentHeader>
              <PaymentTitle>{t("rescueDepositModalTitle")}</PaymentTitle>
              <CloseModalBtn onClick={() => !depositPaying && setDepositModalRescue(null)}>
                <FaTimes size={18} />
              </CloseModalBtn>
            </PaymentHeader>
            <PaymentBody>
              {depositFetching ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                  {t("loading")}
                </div>
              ) : (
                <>
                  {/* ── Thông tin đơn hàng ── */}
                  <AcceptJobInfo>
                    <AcceptJobRow>
                      <AcceptJobLabel>{t("rescueDepositOrderId")}</AcceptJobLabel>
                      <AcceptJobValue>#RESCUE-{depositModalRescue.rescueId}</AcceptJobValue>
                    </AcceptJobRow>
                    <AcceptJobRow>
                      <AcceptJobLabel>{t("rescueDepositCar")}</AcceptJobLabel>
                      <AcceptJobValue>
                        {depositModalRescue.brand} {depositModalRescue.model} — {depositModalRescue.licensePlate}
                      </AcceptJobValue>
                    </AcceptJobRow>
                    {depositModalRescue.problemDescription && (
                      <AcceptJobRow>
                        <AcceptJobLabel>{t("rescueDepositProblem")}</AcceptJobLabel>
                        <AcceptJobValue>{depositModalRescue.problemDescription}</AcceptJobValue>
                      </AcceptJobRow>
                    )}
                    <AcceptJobRow style={{ borderTop: "1px solid #e5e7eb", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                      <AcceptJobLabel style={{ fontWeight: 700, color: "#111827" }}>
                        {t("rescueDepositDueLabel")}
                      </AcceptJobLabel>
                      <AcceptJobValue style={{ fontWeight: 700, fontSize: "1.1rem", color: "#ea580c" }}>
                        {depositModalRescue.depositAmount != null
                          ? depositModalRescue.depositAmount.toLocaleString("vi-VN") + " đ"
                          : "—"}
                      </AcceptJobValue>
                    </AcceptJobRow>
                  </AcceptJobInfo>

                  {/* ── QR chuyển khoản ── */}
                  <div style={{ borderTop: "2px dashed #e5e7eb", marginTop: "1.25rem", paddingTop: "1.25rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=RESCUE-${depositModalRescue.rescueId}|DEPOSIT|${depositModalRescue.depositAmount ?? 0}VND`}
                        alt={t("rescueDepositQRTitle")}
                        style={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                      <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{t("rescueDepositQRScanHint")}</span>
                    </div>
                    <div>
                      <FormLabel>{t("rescueDepositTransactionRef")}</FormLabel>
                      <FormInput
                        value={depositRef}
                        onChange={(e) => setDepositRef(e.target.value)}
                        placeholder="VD: VCB20260411001234"
                      />
                    </div>
                  </div>
                </>
              )}
            </PaymentBody>
            <PaymentFooter>
              <PaymentCancelBtn onClick={() => !depositPaying && setDepositModalRescue(null)} disabled={depositPaying}>
                {t("cancel")}
              </PaymentCancelBtn>
              <PaymentConfirmBtn
                onClick={handlePayDeposit}
                disabled={depositFetching || depositPaying || !depositModalRescue.depositAmount}
              >
                {depositPaying ? t("rescueMgrProcessing") : t("rescueConfirmDepositBtn")}
              </PaymentConfirmBtn>
            </PaymentFooter>
          </PaymentCard>
        </PaymentOverlay>
      )}

    </PageWrapper>
  );
};

export default AppointmentsPage;

// Styled Components
const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem 1rem;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
  }
`;

const Container = styled.div`
  max-width: 1080px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const HeaderContent = styled.div``;

const HeaderTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.375rem;
`;

const HeaderSubtitle = styled.p`
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
`;

const NewBookingButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #1d4ed8;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;

  &:hover {
    background: #1e40af;
  }
`;

const ToolBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const MainTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const MainTabButton = styled.button<{ $active: boolean }>`
  padding: 0.625rem 1rem;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => ($active ? "#1d4ed8" : "#e5e7eb")};
  background: ${({ $active }) => ($active ? "#eff6ff" : "#ffffff")};
  color: ${({ $active }) => ($active ? "#1d4ed8" : "#6b7280")};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #1d4ed8;
    color: #1d4ed8;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 0.25rem;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 0.25rem;
`;

const FilterTab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? "white" : "transparent")};
  color: ${({ $active }) => ($active ? "#111827" : "#6b7280")};
  font-size: 0.8125rem;
  font-weight: ${({ $active }) => ($active ? "600" : "500")};
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${({ $active }) =>
    $active ? "0 1px 3px rgba(0,0,0,0.08)" : "none"};

  &:hover {
    color: #111827;
  }
`;

const TabCount = styled.span<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? "#1d4ed8" : "#d1d5db")};
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-width: 220px;

  &:focus-within {
    border-color: #1d4ed8;
    box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  font-size: 0.875rem;
  color: #111827;
  width: 100%;
  background: transparent;

  &::placeholder {
    color: #9ca3af;
  }
`;

const ContentSection = styled.div`
  min-height: 400px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 0.9375rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
`;

const EmptyTitle = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
`;

const EmptyDesc = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 320px;
`;

const EmptyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #1d4ed8;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;

  &:hover {
    background: #1e40af;
  }
`;

const AppointmentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AppointmentCard = styled.div`
  display: flex;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const CardLeft = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  min-width: 240px;
  max-width: 280px;
  border-right: 1px solid #f3f4f6;
  background: #fafafa;

  @media (max-width: 640px) {
    padding: 1rem 1.25rem;
    border-right: none;
    border-bottom: 1px solid #f3f4f6;
    max-width: none;
  }
`;

const CarIconWrapper = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const CarInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const CarName = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CarPlate = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
`;

const CardRight = styled.div`
  flex: 1;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CardTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const BadgeGroup = styled.div`
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $color: string; $bg: string }>`
  padding: 0.2rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
  border: 1px solid ${({ $bg }) => $bg};
  white-space: nowrap;
`;

const MoreButton = styled.button`
  margin-left: auto;
  background: none;
  border: none;
  padding: 0.375rem;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;

  &:hover {
    background: #f3f4f6;
  }
`;

const CardDesc = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const InfoText = styled.span`
  font-size: 0.8125rem;
  color: #6b7280;
`;

const SymptomRow = styled.div`
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
`;

const SymptomTag = styled.span`
  font-size: 0.75rem;
  color: #374151;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 0.2rem 0.625rem;
  border-radius: 6px;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding-top: 0.5rem;
  margin-top: auto;
  flex-wrap: wrap;
`;

const FooterItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #9ca3af;
`;

const PriceTag = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1d4ed8;
`;

const MoreButtonWrapper = styled.div`
  position: relative;
  margin-left: auto;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 20;
  min-width: 160px;
  overflow: hidden;
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 1rem;
  border: none;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f9fafb;
  }
`;

const CustomerActionRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const CustomerActionBtn = styled.button<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: ${({ $color }) => $color};
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ApproveItemsBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
  padding: 0.35rem 0.875rem;
  border: 1.5px solid #2563eb;
  border-radius: 7px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: #2563eb;
    color: #fff;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ViewDetailBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-left: auto;
  padding: 0.25rem 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
`;

const PaymentOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;

  @media (min-height: 600px) {
    align-items: center;
  }
`;

const PaymentCard = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

const PaymentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const PaymentTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const PaymentBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PaymentFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.375rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  box-sizing: border-box;
  color: #111827;
  background: #fff;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #1d4ed8;
  }
`;

const PaymentCancelBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }
`;

const PaymentConfirmBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: #1d4ed8;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #1e40af;
  }

  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
`;

const CloseModalBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;

  &:hover {
    color: #111827;
  }
`;

const PaymentMethodBtn = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.625rem;
  border: 2px solid ${({ $active }) => ($active ? "#1d4ed8" : "#e5e7eb")};
  border-radius: 8px;
  background: ${({ $active }) => ($active ? "#eff6ff" : "white")};
  color: ${({ $active }) => ($active ? "#1d4ed8" : "#374151")};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #1d4ed8;
  }
`;

const AcceptJobInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const AcceptJobRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const AcceptJobLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const AcceptJobValue = styled.span`
  font-size: 0.875rem;
  color: #111827;
  line-height: 1.4;
`;

const RespondRescheduleBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  margin-top: 0.25rem;
  &:hover {
    background: linear-gradient(135deg, #d97706, #b45309);
    box-shadow: 0 2px 8px rgba(180,83,9,0.3);
  }
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.5rem;
  padding: 1rem 0;
  
  .ant-pagination {
    font-family: inherit;
  }
`;
