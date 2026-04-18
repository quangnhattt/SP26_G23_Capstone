import { useState, useEffect, useCallback, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { useTranslation } from "react-i18next";
import {
  FaCar, FaSearch, FaEye, FaCheck, FaTimes, FaUser,
  FaCalendarAlt, FaPhoneAlt, FaTools, FaWrench, FaKey
} from "react-icons/fa";
import {
  getAppointments, getAppointmentById, approveAppointment,
  rejectAppointment, proposeReschedule, checkInAppointment,
  type IAppointment, type IAppointmentDetail
} from "@/apis/appointments";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import AppointmentDetailModal from "@/pages/appointments/AppointmentDetailModal";
import useAuth from "@/hooks/useAuth";
import { Pagination } from "antd";

// ─── Status Config ──────────────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  PENDING:     { color: "#d97706", bg: "#fef3c7", border: "#fcd34d", label: "Chờ duyệt" },
  CONFIRMED:   { color: "#16a34a", bg: "#dcfce7", border: "#86efac", label: "Đã xác nhận" },
  CHECKED_IN:  { color: "#2563eb", bg: "#dbeafe", border: "#93c5fd", label: "Đã tiếp nhận" },
  DONE:        { color: "#059669", bg: "#ecfdf5", border: "#6ee7b7", label: "Hoàn thành" },
  CANCELLED:   { color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", label: "Đã hủy" },
  RESCHEDULED: { color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", label: "Đã dời lịch" },
};

const STATUSES = Object.keys(statusConfig);

// ─── Component ──────────────────────────────────────────────────────────────
const ManagermentAppointment = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSA = user?.roleID === 2;

  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterServiceType, setFilterServiceType] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

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
      const data = await getAppointments({
        page: currentPage,
        pageSize: pageSize,
        status: filterStatus !== "all" ? filterStatus : undefined,
        serviceType: filterServiceType !== "all" ? filterServiceType : undefined,
        searchTerm: searchTerm.trim() || undefined,
      });
      setAppointments(data.items);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Không thể tải danh sách lịch hẹn.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filterStatus, filterServiceType, searchTerm]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Handle Search Input directly on Enter key or debounce (here we just use button if they had one, or useEffect)
  // To avoid refetching on every keystroke, let's keep useEffect but use a timeout debounce if needed, or just let users click it.
  // Actually, since it triggers on [searchTerm], we can debounce it natively or let it fetch.
  // For simplicity since we added searchTerm as dependency it will fetch on every stroke. Let's rely on standard debounce later if needed.
  // In the current layout, it searches on render.

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

  const handleProposeClick = (id: number) => {
    if (!isSA) return;
    setProposeAppointmentId(id);
    setProposeReason("");
    setShowProposeModal(true);
  };

  const handleProposeConfirm = async () => {
    if (!proposeAppointmentId) return;
    if (!proposeReason.trim()) { toast.warn("Vui lòng nhập lý do dời lịch."); return; }
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

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    return dateStr.startsWith(new Date().toISOString().split("T")[0]);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
    } catch { return dateStr; }
  };

  // ─── Stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     appointments.length,
    pending:   appointments.filter(a => a.status === "PENDING").length,
    confirmed: appointments.filter(a => a.status === "CONFIRMED").length,
    checkedIn: appointments.filter(a => a.status === "CHECKED_IN").length,
    cancelled: appointments.filter(a => a.status === "CANCELLED").length,
    today:     appointments.filter(a => isToday(a.appointmentDate)).length,
  }), [appointments]);

  const filteredAppointments = appointments;

  return (
    <PageWrapper>
      {/* ── HEADER ── */}
      <PageHeader>
        <HeaderContent>
          <HeaderIcon><FaCar size={22} /></HeaderIcon>
          <HeaderText>
            <PageTitle>{t("mgrAppointmentTitle")}</PageTitle>
            <PageSubtitle>{t("mgrAppointmentSubtitle")}</PageSubtitle>
          </HeaderText>
        </HeaderContent>
      </PageHeader>

      {/* ── STATS ── */}
      <StatsGrid>
        <StatCard $accent="#e5e7eb" onClick={() => setFilterStatus("all")}>
          <StatNum>{stats.total}</StatNum>
          <StatLbl>Tổng lịch hẹn</StatLbl>
        </StatCard>
        <StatCard $accent="#fcd34d" onClick={() => setFilterStatus("PENDING")}>
          <StatNum $color="#d97706">{stats.pending}</StatNum>
          <StatLbl>Chờ duyệt</StatLbl>
        </StatCard>
        <StatCard $accent="#86efac" onClick={() => setFilterStatus("CONFIRMED")}>
          <StatNum $color="#16a34a">{stats.confirmed}</StatNum>
          <StatLbl>Đã xác nhận</StatLbl>
        </StatCard>
        <StatCard $accent="#93c5fd" onClick={() => setFilterStatus("CHECKED_IN")}>
          <StatNum $color="#2563eb">{stats.checkedIn}</StatNum>
          <StatLbl>Đã tiếp nhận</StatLbl>
        </StatCard>
        <StatCard $accent="#6ee7b7" onClick={() => setFilterStatus("all")}>
          <StatNum $color="#059669">{stats.today}</StatNum>
          <StatLbl>Lịch hôm nay</StatLbl>
        </StatCard>
        <StatCard $accent="#fca5a5" onClick={() => setFilterStatus("CANCELLED")}>
          <StatNum $color="#dc2626">{stats.cancelled}</StatNum>
          <StatLbl>Đã hủy</StatLbl>
        </StatCard>
      </StatsGrid>

      {/* ── FILTERS ── */}
      <FilterBar>
        <SearchBox>
          <FaSearch size={14} color="#94a3b8" />
          <SearchInput
            placeholder="Tìm biển số, khách hàng, SĐT..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </SearchBox>
        <FilterSelect value={filterServiceType} onChange={e => setFilterServiceType(e.target.value)}>
          <option value="all">Tất cả loại</option>
          <option value="REPAIR">Sửa chữa</option>
          <option value="MAINTENANCE">Bảo dưỡng</option>
        </FilterSelect>
        <FilterSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{statusConfig[s].label}</option>
          ))}
        </FilterSelect>
      </FilterBar>

      {/* ── LIST ── */}
      <CardGrid>
        {loading ? (
          <LoadingWrapper>
            <Spinner />
            <p>Đang tải dữ liệu...</p>
          </LoadingWrapper>
        ) : filteredAppointments.length === 0 ? (
          <EmptyWrapper>
            <FaCalendarAlt size={48} color="#cbd5e1" />
            <EmptyTitle>Không có lịch hẹn nào</EmptyTitle>
            <EmptyDesc>Thay đổi bộ lọc hoặc thử tìm kiếm khác.</EmptyDesc>
          </EmptyWrapper>
        ) : (
          filteredAppointments.map(item => {
            const sc = statusConfig[item.status] || statusConfig.PENDING;
            const appointmentIsToday = isToday(item.appointmentDate);
            const isRepair = item.serviceType?.toUpperCase() === "REPAIR";

            return (
              <AppCard key={item.appointmentId} $borderColor={sc.border}>
                {/* Top strip */}
                <CardStrip $color={sc.border} />

                <CardBody>
                  {/* Row 1: Plate + badges */}
                  <CardRow1>
                    <PlateTag>{item.licensePlate}</PlateTag>
                    <BadgeRow>
                      <StatusPill $color={sc.color} $bg={sc.bg}>{sc.label}</StatusPill>
                      <ServicePill $isRepair={isRepair}>
                        {isRepair ? <><FaWrench size={10} /> Sửa chữa</> : <><FaTools size={10} /> Bảo dưỡng</>}
                      </ServicePill>
                      {appointmentIsToday && <TodayPill>📅 Hôm nay</TodayPill>}
                    </BadgeRow>
                  </CardRow1>

                  {/* Row 2: Customer info */}
                  <CardRow2>
                    <InfoItem><FaUser size={12} /><strong>{item.customerFullName}</strong></InfoItem>
                    <InfoItem><FaPhoneAlt size={12} />{item.phone}</InfoItem>
                  </CardRow2>

                  {/* Row 3: Car + Date */}
                  <CardRow3>
                    <InfoItem>
                      <FaCar size={12} />
                      {item.carBrand} {item.carModel}
                      {item.carColor && <ColorDot $color={item.carColor} title={item.carColor} />}
                    </InfoItem>
                    {item.appointmentDate && (
                      <InfoItem $highlight={appointmentIsToday}>
                        <FaCalendarAlt size={12} />
                        {formatDateTime(item.appointmentDate)}
                      </InfoItem>
                    )}
                  </CardRow3>

                  {/* Actions */}
                  <ActionsRow>
                    <IdLabel>REQ-{item.appointmentId}</IdLabel>
                    <BtnGroup>
                      <BtnView onClick={() => handleViewDetail(item.appointmentId)}>
                        <FaEye size={13} /> Chi tiết
                      </BtnView>

                      {/* SA: Pending actions */}
                      {isSA && item.status === "PENDING" && (
                        <>
                          <BtnApprove onClick={() => handleApprove(item.appointmentId)} disabled={isSubmitting}>
                            <FaCheck size={13} /> Duyệt
                          </BtnApprove>
                          <BtnReject onClick={() => handleRejectClick(item.appointmentId)} disabled={isSubmitting}>
                            <FaTimes size={13} /> Từ chối
                          </BtnReject>
                          <BtnPropose onClick={() => handleProposeClick(item.appointmentId)} disabled={isSubmitting}>
                            📅 Dời lịch
                          </BtnPropose>
                        </>
                      )}

                      {/* SA: Check-in for confirmed */}
                      {isSA && item.status === "CONFIRMED" && (
                        <BtnCheckIn onClick={() => handleCheckIn(item.appointmentId)} disabled={isSubmitting}>
                          <FaKey size={13} /> Tiếp nhận xe
                        </BtnCheckIn>
                      )}
                    </BtnGroup>
                  </ActionsRow>
                </CardBody>
              </AppCard>
            );
          })
        )}
      </CardGrid>

      {/* ── PAGINATION ── */}
      {!loading && totalCount > 0 && (
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

      {/* ── MODALS ── */}
      {showModal && (
        <AppointmentDetailModal data={detailData} loading={loadingDetail} onClose={() => { setShowModal(false); setDetailData(null); }} />
      )}

      {showRejectModal && (
        <ModalOverlay onClick={() => setShowRejectModal(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>{t("mgrAppointmentRejectTitle")}</ModalTitle>
              <CloseBtn onClick={() => setShowRejectModal(false)}><FaTimes /></CloseBtn>
            </ModalHead>
            <ModalBody>
              <FormLabel>{t("mgrAppointmentRejectReason")}</FormLabel>
              <FormTextarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                placeholder={t("mgrAppointmentRejectPlaceholder")} rows={4} />
            </ModalBody>
            <ModalFoot>
              <BtnCancel onClick={() => setShowRejectModal(false)} disabled={isSubmitting}>{t("cancel")}</BtnCancel>
              <BtnConfirmReject onClick={handleRejectConfirm} disabled={isSubmitting}>
                <FaTimes size={14} /> {isSubmitting ? t("processing") : t("mgrAppointmentReject")}
              </BtnConfirmReject>
            </ModalFoot>
          </ModalBox>
        </ModalOverlay>
      )}

      {showProposeModal && (
        <ModalOverlay onClick={() => setShowProposeModal(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>📅 Đề xuất dời lịch</ModalTitle>
              <CloseBtn onClick={() => setShowProposeModal(false)}><FaTimes /></CloseBtn>
            </ModalHead>
            <ModalBody>
              <FormLabel>Lý do yêu cầu dời lịch</FormLabel>
              <FormTextarea value={proposeReason} onChange={e => setProposeReason(e.target.value)}
                placeholder="Nhập lý do yêu cầu khách hàng dời lịch..." rows={4} />
              <ProposeNote>Khách hàng sẽ thấy lý do này và tự chọn lịch mới phù hợp.</ProposeNote>
            </ModalBody>
            <ModalFoot>
              <BtnCancel onClick={() => setShowProposeModal(false)} disabled={isSubmitting}>Hủy</BtnCancel>
              <BtnProposeSend onClick={handleProposeConfirm} disabled={isSubmitting}>
                {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </BtnProposeSend>
            </ModalFoot>
          </ModalBox>
        </ModalOverlay>
      )}
    </PageWrapper>
  );
};

export default ManagermentAppointment;

// ─── Animations ──────────────────────────────────────────────────────────────
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const pulse = keyframes`0%,100% { opacity:1; } 50% { opacity:0.65; }`;
const fadeUp = keyframes`from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); }`;

// ─── Layout ──────────────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #f8fafc;
  min-height: 100vh;
`;

// ─── Header ──────────────────────────────────────────────────────────────────
const PageHeader = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.875rem;
`;

const HeaderIcon = styled.div`
  color: #1d4ed8;
  display: flex;
  align-items: center;
`;

const HeaderText = styled.div``;

const PageTitle = styled.h1`
  font-size: 1.375rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
`;

const PageSubtitle = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0.1rem 0 0;
`;

// ─── Stats ────────────────────────────────────────────────────────────────────
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  @media (max-width: 1200px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 640px)  { grid-template-columns: repeat(2, 1fr); }
`;

const StatCard = styled.div<{ $accent: string }>`
  background: white;
  border: 1px solid #e5e7eb;
  border-top: 3px solid ${p => p.$accent};
  border-radius: 10px;
  padding: 1.125rem 1.25rem;
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.07); }
`;

const StatNum = styled.div<{ $color?: string }>`
  font-size: 2rem;
  font-weight: 800;
  color: ${p => p.$color || "#111827"};
  line-height: 1;
`;

const StatLbl = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  margin-top: 0.35rem;
`;

// ─── Filter Bar ───────────────────────────────────────────────────────────────
const FilterBar = styled.div`
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 1rem 1.25rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex: 1;
  min-width: 200px;
  padding: 0.625rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s;
  &:focus-within { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); background: white; }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.875rem;
  width: 100%;
  color: #1e293b;
  &::placeholder { color: #94a3b8; }
`;

const FilterSelect = styled.select`
  padding: 0.625rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background-color: #f8fafc;
  color: #1e293b;
  font-size: 0.875rem;
  outline: none;
  cursor: pointer;
  min-width: 160px;
  transition: all 0.2s;
  &:focus {
    border-color: #6366f1;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
`;

// ─── Card Grid ────────────────────────────────────────────────────────────────
const CardGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
  color: #64748b;
  background: white;
  border-radius: 14px;
`;

const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const EmptyWrapper = styled.div`
  background: white;
  border-radius: 14px;
  padding: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  border: 1px dashed #cbd5e1;
`;
const EmptyTitle = styled.p`font-size:1.125rem;font-weight:700;color:#475569;margin:0;`;
const EmptyDesc  = styled.p`font-size:0.875rem;color:#94a3b8;margin:0;`;

// ─── Appointment Card ─────────────────────────────────────────────────────────
const AppCard = styled.div<{ $borderColor: string }>`
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  transition: box-shadow 0.2s, transform 0.2s;
  animation: ${fadeUp} 0.25s ease both;
  &:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.07); transform: translateY(-1px); }
`;

const CardStrip = styled.div<{ $color: string }>`
  width: 5px;
  background: ${p => p.$color};
  flex-shrink: 0;
`;

const CardBody = styled.div`
  flex: 1;
  padding: 1.125rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

const CardRow1 = styled.div`
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex-wrap: wrap;
`;

const PlateTag = styled.span`
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.125rem;
  font-weight: 900;
  color: #0f172a;
  background: #f8fafc;
  border: 2px solid #334155;
  border-radius: 6px;
  padding: 0.125rem 0.875rem;
  letter-spacing: 1.5px;
`;

const BadgeRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
`;

const StatusPill = styled.span<{ $color: string; $bg: string }>`
  padding: 0.2rem 0.625rem;
  border-radius: 99px;
  font-size: 0.6875rem;
  font-weight: 700;
  color: ${p => p.$color};
  background: ${p => p.$bg};
`;

const ServicePill = styled.span<{ $isRepair: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.625rem;
  border-radius: 99px;
  font-size: 0.6875rem;
  font-weight: 700;
  background: ${p => p.$isRepair ? "#fff7ed" : "#eff6ff"};
  color: ${p => p.$isRepair ? "#c2410c" : "#1d4ed8"};
`;

const TodayPill = styled.span`
  padding: 0.2rem 0.625rem;
  border-radius: 99px;
  font-size: 0.6875rem;
  font-weight: 700;
  background: #dcfce7;
  color: #15803d;
  animation: ${pulse} 2s infinite;
`;

const CardRow2 = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const CardRow3 = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const InfoItem = styled.span<{ $highlight?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  color: ${p => p.$highlight ? "#15803d" : "#475569"};
  font-weight: ${p => p.$highlight ? "700" : "500"};
`;

const ColorDot = styled.span<{ $color: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${p => p.$color};
  border: 1px solid #e2e8f0;
  margin-left: 2px;
`;

const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.75rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const IdLabel = styled.span`
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 700;
  font-family: monospace;
`;

const BtnGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const BaseBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.875rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  border: 1.5px solid transparent;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const BtnView = styled(BaseBtn)`
  background: #f8fafc; color: #475569; border-color: #e2e8f0;
  &:hover { background: #f1f5f9; border-color: #cbd5e1; }
`;
const BtnApprove = styled(BaseBtn)`
  background: #dcfce7; color: #15803d; border-color: #86efac;
  &:hover:not(:disabled) { background: #bbf7d0; }
`;
const BtnReject = styled(BaseBtn)`
  background: #fee2e2; color: #dc2626; border-color: #fca5a5;
  &:hover:not(:disabled) { background: #fecaca; }
`;
const BtnPropose = styled(BaseBtn)`
  background: #fef3c7; color: #b45309; border-color: #fcd34d;
  &:hover:not(:disabled) { background: #fde68a; }
`;
const BtnCheckIn = styled(BaseBtn)`
  background: #eff6ff; color: #1d4ed8; border-color: #93c5fd;
  font-size: 0.875rem;
  &:hover:not(:disabled) { background: #dbeafe; }
`;

// ─── Modals ───────────────────────────────────────────────────────────────────
const ModalOverlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
`;

const ModalBox = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 520px;
  width: 100%;
  box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  overflow: hidden;
`;

const ModalHead = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
`;
const ModalTitle = styled.h3`
  font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0;
`;
const CloseBtn = styled.button`
  background: #f1f5f9; border: none; border-radius: 8px;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #64748b;
  &:hover { background: #e2e8f0; color: #0f172a; }
`;
const ModalBody = styled.div`padding: 1.5rem;`;
const ModalFoot = styled.div`
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding: 1rem 1.5rem; border-top: 1px solid #f1f5f9;
`;

const FormLabel = styled.label`
  display: block; font-size: 0.875rem; font-weight: 700;
  color: #334155; margin-bottom: 0.625rem;
`;
const FormTextarea = styled.textarea`
  width: 100%; box-sizing: border-box;
  padding: 0.875rem; border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-size: 0.875rem; font-family: inherit; resize: vertical;
  color: #1e293b; background: #f8fafc;
  &:focus { outline: none; border-color: #6366f1; background: white; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  &::placeholder { color: #94a3b8; }
`;
const ProposeNote = styled.p`
  font-size: 0.8rem; color: #64748b; margin: 0.625rem 0 0; line-height: 1.5;
`;

const BtnCancel = styled(BaseBtn)`
  background: white; color: #475569; border-color: #e2e8f0;
  &:hover { background: #f8fafc; }
`;
const BtnConfirmReject = styled(BaseBtn)`
  background: #dc2626; color: white; border-color: #dc2626;
  &:hover:not(:disabled) { background: #b91c1c; }
`;
const BtnProposeSend = styled(BaseBtn)`
  background: #6366f1; color: white; border-color: #6366f1;
  &:hover:not(:disabled) { background: #4f46e5; }
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
