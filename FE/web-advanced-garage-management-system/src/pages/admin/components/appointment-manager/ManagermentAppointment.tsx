import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { FaCar, FaSearch, FaEye, FaCheck, FaTimes, FaUser, FaCalendarAlt, FaPhoneAlt } from "react-icons/fa";
import { getAppointments, getAppointmentById, approveAppointment, rejectAppointment, proposeReschedule, checkInAppointment, type IAppointment, type IAppointmentDetail } from "@/apis/appointments";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import AppointmentDetailModal from "@/pages/appointments/AppointmentDetailModal";
import useAuth from "@/hooks/useAuth";

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  PENDING: { color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  CONFIRMED: { color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  CHECKED_IN: { color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  DONE: { color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  CANCELLED: { color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  RESCHEDULED: { color: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
};

const ManagermentAppointment = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSA = user?.roleID === 2;
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterServiceType, setFilterServiceType] = useState("all");

  // Detail modal
  const [detailData, setDetailData] = useState<IAppointmentDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Propose Reschedule modal
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposeAppointmentId, setProposeAppointmentId] = useState<number | null>(null);
  const [proposeReason, setProposeReason] = useState("");

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleViewDetail = async (id: number) => {
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

  const handleApprove = async (id: number) => {
    if (!isSA) return;
    try {
      setIsSubmitting(true);
      await approveAppointment(id);
      toast.success(t("mgrAppointmentApproveSuccess"));
      await fetchAppointments();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("mgrAppointmentApproveError")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckIn = async (id: number) => {
    if (!isSA) return;
    try {
      setIsSubmitting(true);
      await checkInAppointment(id);
      toast.success("Tiếp nhận xe thành công!");
      await fetchAppointments();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Tiếp nhận xe thất bại!"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = (id: number) => {
    if (!isSA) return;
    setSelectedAppointmentId(id);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedAppointmentId) return;

    try {
      setIsSubmitting(true);
      await rejectAppointment(selectedAppointmentId, rejectionReason.trim() || undefined);
      toast.success(t("mgrAppointmentRejectSuccess"));
      setShowRejectModal(false);
      setSelectedAppointmentId(null);
      setRejectionReason("");
      await fetchAppointments();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("mgrAppointmentRejectError")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedAppointmentId(null);
    setRejectionReason("");
  };

  const handleProposeClick = (id: number) => {
    if (!isSA) return;
    setProposeAppointmentId(id);
    setProposeReason("");
    setShowProposeModal(true);
  };

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split("T")[0];
    return dateStr.startsWith(today);
  };

  const handleProposeConfirm = async () => {
    if (!proposeAppointmentId) return;
    if (!proposeReason.trim()) {
      toast.warn("Vui lòng nhập lý do dời lịch.");
      return;
    }
    try {
      setIsSubmitting(true);
      await proposeReschedule(proposeAppointmentId, proposeReason.trim());
      toast.success("Đã gửi yêu cầu dời lịch cho khách hàng!");
      setShowProposeModal(false);
      setProposeAppointmentId(null);
      setProposeReason("");
      await fetchAppointments();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Đề xuất dời lịch thất bại!"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Counts
  const totalCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
  const checkedInCount = appointments.filter((a) => a.status === "CHECKED_IN").length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;

  const filteredAppointments = appointments
    .filter((a) => {
      if (filterStatus === "all") return true;
      return a.status === filterStatus;
    })
    .filter((a) => {
      if (filterServiceType === "all") return true;
      return a.serviceType?.toUpperCase() === filterServiceType;
    })
    .filter((a) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        a.customerFullName?.toLowerCase().includes(q) ||
        a.licensePlate?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q) ||
        `${a.carBrand} ${a.carModel}`.toLowerCase().includes(q) ||
        `appointment-${a.appointmentId}`.includes(q)
      );
    });

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      const date = d.toLocaleDateString("vi-VN");
      return `${time} ${date}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusInfo = (status: string) =>
    statusConfig[status] || { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" };

  const getServiceTypeLabel = (type: string) => {
    switch (type?.toUpperCase()) {
      case "REPAIR": return t("bookingServiceTypeRepair");
      case "MAINTENANCE": return t("bookingServiceTypeMaintenance");
      default: return type;
    }
  };

  const getServiceTypeBadge = (type: string) => {
    switch (type?.toUpperCase()) {
      case "REPAIR": return { color: "#d97706", bg: "#fef3c7" };
      case "MAINTENANCE": return { color: "#2563eb", bg: "#dbeafe" };
      default: return { color: "#6b7280", bg: "#f3f4f6" };
    }
  };

  return (
    <PageWrapper>
      {/* Header */}
      <Header>
        <HeaderLeft>
          <FaCar size={24} color="#1d4ed8" />
          <div>
            <HeaderTitle>{t("mgrAppointmentTitle")}</HeaderTitle>
            <HeaderSubtitle>{t("mgrAppointmentSubtitle")}</HeaderSubtitle>
          </div>
        </HeaderLeft>
      </Header>

      {/* Stats */}
      <StatsRow>
        <StatCard $borderColor="#e5e7eb" onClick={() => setFilterStatus("all")}>
          <StatNumber $color="#111827">{totalCount}</StatNumber>
          <StatLabel>{t("mgrAppointmentTotal")}</StatLabel>
        </StatCard>
        <StatCard $borderColor="#fcd34d" onClick={() => setFilterStatus("PENDING")}>
          <StatNumber $color="#d97706">{pendingCount}</StatNumber>
          <StatLabel>{t("mgrAppointmentPending")}</StatLabel>
        </StatCard>
        <StatCard $borderColor="#93c5fd" onClick={() => setFilterStatus("CHECKED_IN")}>
          <StatNumber $color="#2563eb">{checkedInCount}</StatNumber>
          <StatLabel>{t("mgrAppointmentCheckedIn")}</StatLabel>
        </StatCard>
        <StatCard $borderColor="#86efac" onClick={() => setFilterStatus("CONFIRMED")}>
          <StatNumber $color="#16a34a">{confirmedCount}</StatNumber>
          <StatLabel>{t("mgrAppointmentConfirmed")}</StatLabel>
        </StatCard>
        <StatCard $borderColor="#fca5a5" onClick={() => setFilterStatus("CANCELLED")}>
          <StatNumber $color="#dc2626">{cancelledCount}</StatNumber>
          <StatLabel>{t("mgrAppointmentCancelled")}</StatLabel>
        </StatCard>
      </StatsRow>

      {/* Filters */}
      <FilterRow>
        <SearchBox>
          <FaSearch size={14} color="#9ca3af" />
          <SearchInput
            placeholder={t("mgrAppointmentSearchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>
        <FilterSelect value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">{t("appointmentsAll")}</option>
          {Object.entries(statusConfig).map(([key]) => (
            <option key={key} value={key}>
              {t(`mgrAppointmentStatus_${key}`)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect value={filterServiceType} onChange={(e) => setFilterServiceType(e.target.value)}>
          <option value="all">{t("appointmentsAll")}</option>
          <option value="REPAIR">{t("bookingServiceTypeRepair")}</option>
          <option value="MAINTENANCE">{t("bookingServiceTypeMaintenance")}</option>
        </FilterSelect>
      </FilterRow>

      {/* List */}
      <ListSection>
        {loading ? (
          <LoadingMessage>{t("loading")}</LoadingMessage>
        ) : filteredAppointments.length === 0 ? (
          <EmptyMessage>{t("mgrAppointmentEmpty")}</EmptyMessage>
        ) : (
          filteredAppointments.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            const serviceTypeBadge = getServiceTypeBadge(item.serviceType);
            const carName = `${item.carBrand} ${item.carModel}`;
            const appointmentIsToday = isToday(item.appointmentDate);
            return (
              <RequestCard key={item.appointmentId} $borderColor={statusInfo.border}>
                <CardLeft>
                  <CardTopRow>
                    <LicensePlate>{item.licensePlate}</LicensePlate>
                    <BadgeGroup>
                      <Badge $color={statusInfo.color} $bg={statusInfo.bg}>
                        {t(`mgrAppointmentStatus_${item.status}`)}
                      </Badge>
                      <Badge $color={serviceTypeBadge.color} $bg={serviceTypeBadge.bg}>
                        {getServiceTypeLabel(item.serviceType)}
                      </Badge>
                      {appointmentIsToday && (
                        <TodayBadge>📅 Hôm nay</TodayBadge>
                      )}
                    </BadgeGroup>
                  </CardTopRow>

                  <CardInfoRow>
                    <InfoChip>
                      <FaUser size={12} />
                      {item.customerFullName}
                    </InfoChip>
                    <InfoChip>
                      <FaPhoneAlt size={12} />
                      {item.phone}
                    </InfoChip>
                    <InfoChip>
                      <FaCar size={12} />
                      {carName} • {item.carColor}
                    </InfoChip>
                    {item.appointmentDate && (
                      <InfoChip $highlight={appointmentIsToday}>
                        <FaCalendarAlt size={12} />
                        {formatDateTime(item.appointmentDate)}
                      </InfoChip>
                    )}
                  </CardInfoRow>
                </CardLeft>

                <CardRight>
                  <DateText>REQ-{item.appointmentId}</DateText>
                  <ActionButton onClick={() => handleViewDetail(item.appointmentId)}>
                    <FaEye size={14} />
                    {t("appointmentsViewDetail")}
                  </ActionButton>

                  {/* SA only: action buttons */}
                  {isSA && item.status === "PENDING" && (
                    <>
                      <AcceptButton onClick={() => handleApprove(item.appointmentId)} disabled={isSubmitting}>
                        <FaCheck size={14} />
                        {t("mgrAppointmentAccept")}
                      </AcceptButton>
                      <RejectButton onClick={() => handleRejectClick(item.appointmentId)} disabled={isSubmitting}>
                        <FaTimes size={14} />
                        {t("mgrAppointmentReject")}
                      </RejectButton>
                      <ProposeButton onClick={() => handleProposeClick(item.appointmentId)} disabled={isSubmitting}>
                        📅 Dời lịch
                      </ProposeButton>
                    </>
                  )}

                  {/* SA only: check-in button — only for CONFIRMED on today's date */}
                  {isSA && item.status === "CONFIRMED" && appointmentIsToday && (
                    <CheckInButton onClick={() => handleCheckIn(item.appointmentId)} disabled={isSubmitting}>
                      🔑 Tiếp nhận xe
                    </CheckInButton>
                  )}
                </CardRight>
              </RequestCard>
            );
          })
        )}
      </ListSection>

      {showModal && (
        <AppointmentDetailModal
          data={detailData}
          loading={loadingDetail}
          onClose={closeModal}
        />
      )}

      {showRejectModal && (
        <ModalOverlay onClick={closeRejectModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{t("mgrAppointmentRejectTitle")}</ModalTitle>
              <CloseBtn onClick={closeRejectModal}><FaTimes /></CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormLabel>{t("mgrAppointmentRejectReason")}</FormLabel>
              <FormTextarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t("mgrAppointmentRejectPlaceholder")}
                rows={4}
              />
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={closeRejectModal} disabled={isSubmitting}>{t("cancel")}</CancelButton>
              <ConfirmRejectButton onClick={handleRejectConfirm} disabled={isSubmitting}>
                <FaTimes size={14} />
                {isSubmitting ? t("processing") : t("mgrAppointmentReject")}
              </ConfirmRejectButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {showProposeModal && (
        <ModalOverlay onClick={() => setShowProposeModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>📅 Đề xuất dời lịch</ModalTitle>
              <CloseBtn onClick={() => setShowProposeModal(false)}><FaTimes /></CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormLabel>Lý do yêu cầu dời lịch</FormLabel>
              <FormTextarea
                value={proposeReason}
                onChange={(e) => setProposeReason(e.target.value)}
                placeholder="Nhập lý do yêu cầu khách hàng dời lịch..."
                rows={4}
              />
              <ProposeNote>
                Khách hàng sẽ thấy lý do này và tự chọn lịch mới phù hợp.
              </ProposeNote>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={() => setShowProposeModal(false)} disabled={isSubmitting}>Hủy</CancelButton>
              <ProposeSendButton onClick={handleProposeConfirm} disabled={isSubmitting}>
                {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </ProposeSendButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageWrapper>
  );
};

export default ManagermentAppointment;

// Styled Components
const PageWrapper = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
`;

const HeaderSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div<{ $borderColor: string }>`
  background: white;
  border: 1px solid #e5e7eb;
  border-left: 4px solid ${({ $borderColor }) => $borderColor};
  border-radius: 10px;
  padding: 1.25rem;
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

const StatNumber = styled.div<{ $color: string }>`
  font-size: 2rem;
  font-weight: 800;
  color: ${({ $color }) => $color};
`;

const StatLabel = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  background: white;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;

  &:focus-within {
    border-color: #1d4ed8;
    box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  font-size: 0.875rem;
  width: 100%;
  color: #111827;

  &::placeholder {
    color: #9ca3af;
  }
`;

const FilterSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #374151;
  background: white;
  min-width: 120px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #1d4ed8;
  }
`;

const ListSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  background: white;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
`;

const RequestCard = styled.div<{ $borderColor: string }>`
  display: flex;
  background: white;
  border: 1px solid #e5e7eb;
  border-left: 4px solid ${({ $borderColor }) => $borderColor};
  border-radius: 10px;
  overflow: hidden;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CardLeft = styled.div`
  flex: 1;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CardTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const LicensePlate = styled.span`
  font-size: 1.0625rem;
  font-weight: 900;
  color: #1e293b;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.15rem 0.6rem;
  letter-spacing: 0.5px;
  font-family: monospace;
`;

const TodayBadge = styled.span`
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 700;
  background: #dcfce7;
  color: #16a34a;
  white-space: nowrap;
  animation: pulse 2s infinite;
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const BadgeGroup = styled.div`
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
`;

const Badge = styled.span<{ $color: string; $bg: string }>`
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
  white-space: nowrap;
`;

const CardInfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
`;

const InfoChip = styled.span<{ $highlight?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: ${({ $highlight }) => $highlight ? "#16a34a" : "#6b7280"};
  font-weight: ${({ $highlight }) => $highlight ? "700" : "400"};
`;

const CardRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 1.25rem 1.5rem;
  min-width: 160px;

  @media (max-width: 768px) {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid #f3f4f6;
  }
`;

const DateText = styled.span`
  font-size: 0.8125rem;
  color: #9ca3af;
  white-space: nowrap;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

const AcceptButton = styled(ActionButton)`
  color: #16a34a;
  border-color: #86efac;

  &:hover {
    background: #f0fdf4;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RejectButton = styled(ActionButton)`
  color: #dc2626;
  border-color: #fca5a5;

  &:hover {
    background: #fef2f2;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #111827;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  color: #111827;

  &:focus {
    outline: none;
    border-color: #1d4ed8;
    box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
  padding: 0.5rem 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #f9fafb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConfirmRejectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #b91c1c;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ProposeButton = styled(RejectButton)`
  color: #b45309;
  border-color: #fcd34d;
  background: #fffbeb;
  &:hover {
    background: #fef3c7;
  }
`;

const ProposeNote = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0.5rem 0 0;
  line-height: 1.5;
`;

const ProposeSendButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: #d97706;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: #b45309; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

// Re-export RejectButton to extend it above

const CheckInButton = styled(ActionButton)`
  color: #1d4ed8;
  border-color: #93c5fd;
  background: #eff6ff;
  font-weight: 700;

  &:hover {
    background: #dbeafe;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
