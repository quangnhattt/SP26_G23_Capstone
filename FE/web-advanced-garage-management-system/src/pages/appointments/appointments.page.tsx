import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
} from "react-icons/fa";
import { getAppointments, getAppointmentById, type IAppointment, type IAppointmentDetail } from "@/apis/appointments";
import { getRescueRequests, getRescueCustomerById, type IRescueRequest } from "@/apis/rescue";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import AppointmentDetailModal from "./AppointmentDetailModal";
import RescueDetailModal from "./RescueDetailModal";
import { rescueStatusConfig } from "./rescueStatusConfig";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "#d97706", bg: "#fef3c7" },
  CONFIRMED: { label: "Đã xác nhận", color: "#2563eb", bg: "#dbeafe" },
  CHECKED_IN: { label: "Đã nhận xe", color: "#7c3aed", bg: "#ede9fe" },
  DONE: { label: "Hoàn thành", color: "#16a34a", bg: "#dcfce7" },
  CANCELLED: { label: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
};

const IN_PROGRESS_STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN"];
const IN_PROGRESS_RESCUE_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "EVALUATING",
  "QUOTE_SENT",
  "CUSTOMER_APPROVED",
  "TECHNICIAN_DISPATCHED",
  "RESCUE_VEHICLE_DISPATCHED",
  "DIAGNOSING",
  "REPAIRING_ON_SITE",
  "NEED_TOWING",
  "TOWING_CONFIRMED",
  "INVOICED",
  "PAID",
];
type MainTab = "BOOKING" | "RESCUE";

const AppointmentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
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
  const [rescueDetailData, setRescueDetailData] = useState<IRescueRequest | null>(null);
  const [showRescueModal, setShowRescueModal] = useState(false);
  const [loadingRescueDetail, setLoadingRescueDetail] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate(ROUTER_PAGE.home);
      return;
    }

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const data = await getAppointments();
        setAppointments(data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

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

    fetchAppointments();
    fetchRescueRequests();
  }, [user, navigate]);

  const filteredAppointments = appointments
    .filter((a) => {
      if (filterStatus === "all") return true;
      if (filterStatus === "IN_PROGRESS") {
        return IN_PROGRESS_STATUSES.includes(a.status);
      }
      return a.status === filterStatus;
    })
    .filter((a) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const carName = `${a.carBrand} ${a.carModel}`.toLowerCase();
      return (
        carName.includes(q) ||
        a.licensePlate?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q) ||
        a.customerFullName?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q)
      );
    });

  const inProgressCount = appointments.filter((a) => IN_PROGRESS_STATUSES.includes(a.status)).length;
  const completedCount = appointments.filter((a) => a.status === "DONE").length;
  const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;
  const rescueInProgressCount = rescueRequests.filter((r) =>
    IN_PROGRESS_RESCUE_STATUSES.includes(r.status),
  ).length;
  const rescueCompletedCount = rescueRequests.filter((r) => r.status === "COMPLETED").length;
  const rescueCancelledCount = rescueRequests.filter((r) => r.status === "CANCELLED").length;

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
  const closeRescueModal = () => {
    setShowRescueModal(false);
    setRescueDetailData(null);
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type?.toUpperCase()) {
      case "REPAIR": return t("bookingServiceTypeRepair");
      case "MAINTENANCE": return t("bookingServiceTypeMaintenance");
      default: return type;
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
            Cứu hộ
          </MainTabButton>
        </MainTabs>

        <ToolBar>
          <FilterTabs>
            <FilterTab
              $active={filterStatus === "all"}
              onClick={() => setFilterStatus("all")}
            >
              {t("appointmentsAll")}
              <TabCount $active={filterStatus === "all"}>
                {activeTab === "BOOKING" ? appointments.length : rescueRequests.length}
              </TabCount>
            </FilterTab>
            <FilterTab
              $active={filterStatus === "IN_PROGRESS"}
              onClick={() => setFilterStatus("IN_PROGRESS")}
            >
              {t("appointmentsInProgress")}
              <TabCount $active={filterStatus === "IN_PROGRESS"}>
                {activeTab === "BOOKING" ? inProgressCount : rescueInProgressCount}
              </TabCount>
            </FilterTab>
            <FilterTab
              $active={filterStatus === "DONE"}
              onClick={() => setFilterStatus("DONE")}
            >
              {t("appointmentsCompleted")}
              <TabCount $active={filterStatus === "DONE"}>
                {activeTab === "BOOKING" ? completedCount : rescueCompletedCount}
              </TabCount>
            </FilterTab>
            <FilterTab
              $active={filterStatus === "CANCELLED"}
              onClick={() => setFilterStatus("CANCELLED")}
            >
              {t("appointmentsCancelled")}
              <TabCount $active={filterStatus === "CANCELLED"}>
                {activeTab === "BOOKING" ? cancelledCount : rescueCancelledCount}
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
          {activeTab === "BOOKING" && loading ? (
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
              <EmptyDesc>Danh sách yêu cầu cứu hộ sẽ hiển thị tại đây.</EmptyDesc>
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
                        <CardTitle>{getServiceTypeLabel(appointment.serviceType)}</CardTitle>
                        <BadgeGroup>
                          <StatusBadge $color={statusInfo.color} $bg={statusInfo.bg}>
                            {statusInfo.label}
                          </StatusBadge>
                        </BadgeGroup>
                        <MoreButtonWrapper>
                          <MoreButton onClick={() => setOpenMenuId(openMenuId === appointment.appointmentId ? null : appointment.appointmentId)}>
                            <FaEllipsisV size={14} color="#9ca3af" />
                          </MoreButton>
                          {openMenuId === appointment.appointmentId && (
                            <DropdownMenu>
                              <DropdownItem onClick={() => handleViewDetail(appointment.appointmentId)}>
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

                      <InfoRow>
                        <FaUser size={13} color="#9ca3af" />
                        <InfoText>{appointment.customerFullName}</InfoText>
                        <FaPhone size={12} color="#9ca3af" style={{ marginLeft: "0.75rem" }} />
                        <InfoText>{appointment.phone || appointment.customerPhone}</InfoText>
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
                          {formatDate(appointment.appointmentDate || appointment.createdDate)}
                        </FooterItem>
                        {appointment.packageFinalPrice != null && appointment.packageFinalPrice > 0 && (
                          <PriceTag>
                            {t("appointmentsQuote")}: {formatPrice(appointment.packageFinalPrice)}
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
                          <CardTitle>{rescue.problemDescription || "Yêu cầu cứu hộ"}</CardTitle>
                          <BadgeGroup>
                            <StatusBadge $color={statusInfo.color} $bg={statusInfo.bg}>
                              {statusInfo.label}
                            </StatusBadge>
                          </BadgeGroup>
                          <MoreButtonWrapper>
                            <MoreButton
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === rescue.rescueId ? null : rescue.rescueId,
                                )
                              }
                            >
                              <FaEllipsisV size={14} color="#9ca3af" />
                            </MoreButton>
                            {openMenuId === rescue.rescueId && (
                              <DropdownMenu>
                                <DropdownItem onClick={() => handleViewRescueDetail(rescue.rescueId)}>
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
                          <FaPhone size={12} color="#9ca3af" style={{ marginLeft: "0.75rem" }} />
                          <InfoText>{rescue.customerPhone}</InfoText>
                        </InfoRow>

                        <InfoRow>
                          <FaMapMarkerAlt size={12} color="#9ca3af" />
                          <InfoText>{rescue.currentAddress}</InfoText>
                        </InfoRow>

                        <CardFooter>
                          <FooterItem>
                            <FaFileAlt size={12} />
                            #rescue-{rescue.rescueId}
                          </FooterItem>
                          <FooterItem>
                            <FaClock size={12} />
                            {formatDate(rescue.createdDate)}
                          </FooterItem>
                        </CardFooter>
                      </CardRight>
                    </AppointmentCard>
                  );
                })}
            </AppointmentList>
          )}
        </ContentSection>
      </Container>

      {showModal && (
        <AppointmentDetailModal
          data={detailData}
          loading={loadingDetail}
          onClose={closeModal}
        />
      )}
      {showRescueModal && (
        <RescueDetailModal
          data={rescueDetailData}
          loading={loadingRescueDetail}
          onClose={closeRescueModal}
        />
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
  box-shadow: ${({ $active }) => ($active ? "0 1px 3px rgba(0,0,0,0.08)" : "none")};

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


