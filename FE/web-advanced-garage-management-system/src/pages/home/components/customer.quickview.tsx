import { useEffect, useState, useContext } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "@/context/AuthContext";
import { ROUTER_PAGE } from "@/routes/contants";
import { getAppointments, type IAppointment } from "@/apis/appointments";
import { getRescueRequests, type IRescueRequest } from "@/apis/rescue";
import { rescueStatusConfig } from "@/pages/appointments/rescueStatusConfig";
import {
  FaCalendarAlt,
  FaPhoneAlt,
  FaChevronRight,
  FaPlus,
  FaCar,
} from "react-icons/fa";

const apptStatusStyle: Record<string, { labelKey: string; color: string; bg: string }> = {
  PENDING:    { labelKey: "apptStatusPending",    color: "#d97706", bg: "#fef3c7" },
  CONFIRMED:  { labelKey: "apptStatusConfirmed",  color: "#2563eb", bg: "#dbeafe" },
  CHECKED_IN: { labelKey: "apptStatusCheckedIn",  color: "#7c3aed", bg: "#ede9fe" },
  DONE:       { labelKey: "apptStatusDone",       color: "#16a34a", bg: "#dcfce7" },
  CANCELLED:  { labelKey: "apptStatusCancelled",  color: "#dc2626", bg: "#fee2e2" },
};

const APPT_IN_PROGRESS = ["PENDING", "CONFIRMED", "CHECKED_IN"];
const RESCUE_TERMINAL   = ["COMPLETED", "CANCELLED", "SPAM"];

const CustomerQuickView = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [rescues, setRescues] = useState<IRescueRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.roleID !== 4) return;
    let cancelled = false;

    void (async () => {
      // Defer setState out of the synchronous effect phase (react-hooks/set-state-in-effect)
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      try {
        const [apptResult, rescueResult] = await Promise.allSettled([
          getAppointments(),
          getRescueRequests(),
        ]);
        if (cancelled) return;
        if (apptResult.status === "fulfilled") {
          const inProgress = apptResult.value
            .filter((a) => APPT_IN_PROGRESS.includes(a.status))
            .sort(
              (a, b) =>
                new Date(b.createdDate).getTime() -
                new Date(a.createdDate).getTime(),
            );
          setAppointments(inProgress.slice(0, 3));
        }
        if (rescueResult.status === "fulfilled") {
          const inProgress = rescueResult.value
            .filter((r) => !RESCUE_TERMINAL.includes(r.status))
            .sort(
              (a, b) =>
                new Date(b.createdDate).getTime() -
                new Date(a.createdDate).getTime(),
            );
          setRescues(inProgress.slice(0, 3));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || user.roleID !== 4) return null;

  const hasAppt = appointments.length > 0;
  const hasRescue = rescues.length > 0;
  const isEmpty = !hasAppt && !hasRescue && !loading;

  return (
    <Section>
      <Inner>
        <TopRow>
          <SectionTitle>{t("homeCustomerRecentTitle")}</SectionTitle>
          <ViewAllBtn onClick={() => navigate(ROUTER_PAGE.appointments)}>
            {t("homeCustomerViewAll")} <FaChevronRight size={11} />
          </ViewAllBtn>
        </TopRow>

        {loading ? (
          <SkeletonRow>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </SkeletonRow>
        ) : isEmpty ? (
          <EmptyBox>
            <FaCar size={32} color="#d1d5db" />
            <EmptyText>{t("homeCustomerEmptyText")}</EmptyText>
            <EmptyActions>
              <ActionBtn $primary onClick={() => navigate(ROUTER_PAGE.booking)}>
                <FaCalendarAlt size={13} /> {t("homeCustomerBookNow")}
              </ActionBtn>
              <ActionBtn onClick={() => navigate(ROUTER_PAGE.rescue)}>
                <FaPhoneAlt size={13} /> {t("homeCustomerCallRescue")}
              </ActionBtn>
            </EmptyActions>
          </EmptyBox>
        ) : (
          <TwoCol>
            {/* ── Appointments column ── */}
            <ColCard>
              <ColHeader>
                <ColIcon $color="#2563eb">
                  <FaCalendarAlt size={14} />
                </ColIcon>
                <ColTitle>{t("homeCustomerApptColTitle")}</ColTitle>
                <AddBtn
                  onClick={() => navigate(ROUTER_PAGE.booking)}
                  title={t("homeCustomerApptNewBtn")}
                >
                  <FaPlus size={11} />
                </AddBtn>
              </ColHeader>

              {hasAppt ? (
                <ItemList>
                  {appointments.map((a) => {
                    const st = apptStatusStyle[a.status] ?? {
                      labelKey: a.status,
                      color: "#6b7280",
                      bg: "#f3f4f6",
                    };
                    return (
                      <Item
                        key={a.appointmentId}
                        onClick={() =>
                          navigate(`${ROUTER_PAGE.appointments}?openAppt=${a.appointmentId}`)
                        }
                      >
                        <ItemLeft>
                          <ItemTitle>
                            {a.carBrand} {a.carModel}
                          </ItemTitle>
                          <ItemSub>
                            {a.licensePlate} &middot;{" "}
                            {new Date(a.appointmentDate).toLocaleDateString("vi-VN")}
                          </ItemSub>
                        </ItemLeft>
                        <Badge $color={st.color} $bg={st.bg}>
                          {t(st.labelKey)}
                        </Badge>
                      </Item>
                    );
                  })}
                </ItemList>
              ) : (
                <ColEmpty>
                  <ColEmptyText>{t("homeCustomerApptEmpty")}</ColEmptyText>
                  <ColEmptyBtn onClick={() => navigate(ROUTER_PAGE.booking)}>
                    {t("homeCustomerBookNow")}
                  </ColEmptyBtn>
                </ColEmpty>
              )}
            </ColCard>

            {/* ── Rescue column ── */}
            <ColCard>
              <ColHeader>
                <ColIcon $color="#dc2626">
                  <FaPhoneAlt size={14} />
                </ColIcon>
                <ColTitle>{t("homeCustomerRescueColTitle")}</ColTitle>
                <AddBtn
                  $danger
                  onClick={() => navigate(ROUTER_PAGE.rescue)}
                  title={t("homeCustomerRescueNewBtn")}
                >
                  <FaPlus size={11} />
                </AddBtn>
              </ColHeader>

              {hasRescue ? (
                <ItemList>
                  {rescues.map((r) => {
                    const cfg = rescueStatusConfig[r.status] ?? {
                      color: "#6b7280",
                      bg: "#f3f4f6",
                      labelKey: r.status,
                    };
                    return (
                      <Item
                        key={r.rescueId}
                        onClick={() =>
                          navigate(
                            `${ROUTER_PAGE.appointments}?tab=RESCUE&openRescue=${r.rescueId}`,
                          )
                        }
                      >
                        <ItemLeft>
                          <ItemTitle>
                            {r.problemDescription || t("homeCustomerRescueFallback")}
                          </ItemTitle>
                          <ItemSub>
                            {r.licensePlate} &middot;{" "}
                            {new Date(r.createdDate).toLocaleDateString("vi-VN")}
                          </ItemSub>
                        </ItemLeft>
                        <Badge $color={cfg.color} $bg={cfg.bg}>
                          {t(cfg.labelKey)}
                        </Badge>
                      </Item>
                    );
                  })}
                </ItemList>
              ) : (
                <ColEmpty>
                  <ColEmptyText>{t("homeCustomerRescueEmpty")}</ColEmptyText>
                  <ColEmptyBtn $danger onClick={() => navigate(ROUTER_PAGE.rescue)}>
                    {t("homeCustomerCallRescue")}
                  </ColEmptyBtn>
                </ColEmpty>
              )}
            </ColCard>
          </TwoCol>
        )}
      </Inner>
    </Section>
  );
};

export default CustomerQuickView;

// ─── Styled Components ───────────────────────────────────────

const Section = styled.section`
  background: linear-gradient(135deg, #f0f7ff 0%, #f8f9ff 100%);
  border-top: 1px solid #e0eaff;
  border-bottom: 1px solid #e0eaff;
  padding: 2rem 1rem;
  width: 100%;
  box-sizing: border-box;
`;

const Inner = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  width: 100%;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const ViewAllBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const ColCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

const ColHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f3f4f6;
`;

const ColIcon = styled.div<{ $color: string }>`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${({ $color }) => $color + "18"};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ColTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;
  flex: 1;
`;

const AddBtn = styled.button<{ $danger?: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid ${({ $danger }) => ($danger ? "#fecaca" : "#dbeafe")};
  background: ${({ $danger }) => ($danger ? "#fee2e2" : "#eff6ff")};
  color: ${({ $danger }) => ($danger ? "#dc2626" : "#2563eb")};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: ${({ $danger }) => ($danger ? "#fecaca" : "#dbeafe")};
  }
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f9fafb;
  transition: background 0.12s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f9fafb;
  }
`;

const ItemLeft = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemTitle = styled.div`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemSub = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.1rem;
`;

const Badge = styled.span<{ $color: string; $bg: string }>`
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
  white-space: nowrap;
`;

const ColEmpty = styled.div`
  padding: 1.5rem 1rem;
  text-align: center;
`;

const ColEmptyText = styled.p`
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0 0 0.75rem;
`;

const ColEmptyBtn = styled.button<{ $danger?: boolean }>`
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.4rem 0.875rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: ${({ $danger }) => ($danger ? "#dc2626" : "#2563eb")};
  color: white;

  &:hover {
    opacity: 0.9;
  }
`;

const EmptyBox = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2.5rem 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const EmptyActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionBtn = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid ${({ $primary }) => ($primary ? "#2563eb" : "#e5e7eb")};
  background: ${({ $primary }) => ($primary ? "#2563eb" : "white")};
  color: ${({ $primary }) => ($primary ? "white" : "#374151")};
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const SkeletonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 639px) {
    grid-template-columns: 1fr;
  }
`;

const SkeletonCard = styled.div`
  height: 160px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  border-radius: 12px;
  animation: shimmer 1.4s infinite;

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
