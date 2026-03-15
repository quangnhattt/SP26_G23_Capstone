import styled from "styled-components";
import {
  HiCurrencyDollar,
  HiCheckCircle,
  HiClipboardList,
  HiUsers,
  HiClock,
  HiCalendar,
} from "react-icons/hi";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { useTranslation } from "react-i18next";
import SideBarMenu from "./components/sideBarMenu/side.bar.menu";

const AdminDashboard = () => {
  const { t } = useTranslation();

  // Mock data
  const stats = [
    {
      title: t("adminRevenueThisMonth"),
      value: "125M",
      change: "+12.5%",
      subtitle: t("adminVsLastMonths"),
      icon: HiCurrencyDollar,
      iconColor: "#10b981",
      trend: "up",
    },
    {
      title: t("adminOngoingJobs"),
      value: "8",
      change: "-20%",
      subtitle: t("adminVsLastWeek"),
      icon: HiWrenchScrewdriver,
      iconColor: "#f59e0b",
      trend: "down",
    },
    {
      title: t("adminCompletedToday"),
      value: "5",
      change: "+25%",
      subtitle: t("adminCompletionRate"),
      icon: HiCheckCircle,
      iconColor: "#3b82f6",
      trend: "up",
    },
    {
      title: t("adminRequestsPending"),
      value: "12",
      change: "-8%",
      subtitle: t("adminVsLastWeek"),
      icon: HiClipboardList,
      iconColor: "#ef4444",
      trend: "down",
    },
  ];

  const chartData = [
    { month: "T1", value: 85 },
    { month: "T2", value: 92 },
    { month: "T3", value: 78 },
    { month: "T4", value: 105 },
    { month: "T5", value: 95 },
    { month: "T6", value: 115 },
  ];

  const workshopBays = [
    { name: "Khoang A1", status: "using", icon: "🚗" },
    { name: "Khoang A2", status: "empty", icon: "🚗" },
    { name: "Khoang B1", status: "using", icon: "🚗" },
    { name: "Khoang C1", status: "empty", icon: "🚗" },
    { name: "Khoang D1", status: "empty", icon: "🚗" },
  ];

  const staffDistribution = [
    { label: t("adminWaiting"), count: 12, color: "#9CA3AF" },
    { label: t("adminInProgress"), count: 8, color: "#3B82F6" },
    { label: t("adminPendingApproval"), count: 3, color: "#F59E0B" },
    { label: t("adminCompleted"), count: 25, color: "#10B981" },
  ];

  const urgentRequests = [
    {
      title: "Xe phát tiếng kêu lạ khi phanh",
      plate: "30A-12345",
      customer: "Nguyễn Văn An",
      status: "high",
      priority: t("adminUrgent"),
      progress: 65,
    },
    {
      title: "Đèn check engine sáng",
      plate: "29B-22222",
      customer: "Trần Thị Bình",
      status: "medium",
      priority: t("adminMedium"),
      progress: 40,
    },
  ];

  const ongoingJobs = [
    {
      title: "Sửa điều hòa Honda CR-V",
      car: "Honda CR-V - 30A-67890",
      tech: "KTV: Phạm Đức Dũng",
      status: "in-progress",
      statusText: t("adminInProgress"),
      priority: t("adminUrgent"),
      progress: 65,
    },
    {
      title: "Kiểm tra và thay má phanh Toyota Camry",
      car: "Toyota Camry - 30A-12345",
      tech: "KTV: Phạm Đức Dũng",
      status: "pending",
      statusText: t("adminPendingApproval"),
      priority: t("adminHigh"),
      progress: 40,
    },
  ];

  const todayStats = [
    {
      label: t("adminCustomersToday"),
      value: "12",
      icon: HiUsers,
      color: "#3B82F6",
    },
    {
      label: t("adminAvgServiceTime"),
      value: "3.5h",
      icon: HiClock,
      color: "#10B981",
    },
    {
      label: t("adminUpcomingAppointments"),
      value: "8",
      icon: HiCalendar,
      color: "#F59E0B",
    },
  ];

  const maxChartValue = Math.max(...chartData.map((d) => d.value));

  return (
    <DashboardContainer>
      <Sidebar>
        <SideBarMenu />
      </Sidebar>

      <MainContent>
        <PageHeader>
          <HeaderLeft>
            <HeaderTitle>{t("adminDashboard")}</HeaderTitle>
            <HeaderSubtitle>{t("adminOverviewToday")}</HeaderSubtitle>
          </HeaderLeft>
          <HeaderRight>
            <StatusBadge status="active">
              <StatusDot />
              {t("adminActive")}
            </StatusBadge>
            <DateText>
              {t("adminSunday")}, {t("adminMarch15")}, 2026
            </DateText>
          </HeaderRight>
        </PageHeader>

        <ContentArea>
          <StatsGrid>
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <StatCard key={index}>
                  <StatHeader>
                    <StatTitle>{stat.title}</StatTitle>
                    <StatIconWrapper color={stat.iconColor}>
                      <IconComponent size={24} />
                    </StatIconWrapper>
                  </StatHeader>
                  <StatValue>{stat.value}</StatValue>
                  <StatFooter>
                    <StatChange trend={stat.trend}>{stat.change}</StatChange>
                    <StatSubtitle>{stat.subtitle}</StatSubtitle>
                  </StatFooter>
                </StatCard>
              );
            })}
          </StatsGrid>

          <ChartsRow>
            <ChartCard>
              <CardHeader>
                <CardTitle>{t("adminRevenueByWeek")}</CardTitle>
                <CardSubtitle>
                  {t("adminTotalRevenue6RecentWeeks")}
                </CardSubtitle>
              </CardHeader>
              <ChartContainer>
                <Chart>
                  {chartData.map((item, index) => (
                    <ChartBar key={index}>
                      <BarFill
                        height={(item.value / maxChartValue) * 100}
                      ></BarFill>
                    </ChartBar>
                  ))}
                </Chart>
                <ChartLabels>
                  {chartData.map((item, index) => (
                    <ChartLabel key={index}>{item.month}</ChartLabel>
                  ))}
                </ChartLabels>
              </ChartContainer>
            </ChartCard>

            <ChartCard>
              <CardHeader>
                <CardTitle>{t("adminStaffDistribution")}</CardTitle>
                <CardSubtitle>{t("adminByCurrentStatus")}</CardSubtitle>
              </CardHeader>
              <DonutChartContainer>
                <DonutChart>
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="30"
                      strokeDasharray="125.6 376.8"
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="30"
                      strokeDasharray="62.8 439.6"
                      strokeDashoffset="-125.6"
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="30"
                      strokeDasharray="31.4 470.9"
                      strokeDashoffset="-188.4"
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="30"
                      strokeDasharray="157 345.2"
                      strokeDashoffset="-219.8"
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                </DonutChart>
                <DonutLegend>
                  {staffDistribution.map((item, index) => (
                    <LegendItem key={index}>
                      <LegendColor color={item.color} />
                      <LegendLabel>{item.label}</LegendLabel>
                      <LegendValue>{item.count}</LegendValue>
                    </LegendItem>
                  ))}
                </DonutLegend>
              </DonutChartContainer>
            </ChartCard>
          </ChartsRow>

          <TwoColumnRow>
            <WorkshopCard>
              <CardHeader>
                <div>
                  <CardTitle>{t("adminWorkshopStatus")}</CardTitle>
                  <CardSubtitle>{t("adminBayStatusNow")}</CardSubtitle>
                </div>
                <ViewAllLink>{t("adminViewAll")} →</ViewAllLink>
              </CardHeader>
              <WorkshopStats>
                <WorkshopStatItem>
                  <WorkshopStatValue>75%</WorkshopStatValue>
                  <WorkshopStatLabel>{t("adminUtilization")}</WorkshopStatLabel>
                </WorkshopStatItem>
                <WorkshopStatDivider />
                <WorkshopStatItem>
                  <WorkshopStatValue>3/5</WorkshopStatValue>
                  <WorkshopStatLabel>
                    {t("adminBaysAvailable")}
                  </WorkshopStatLabel>
                </WorkshopStatItem>
              </WorkshopStats>
              <WorkshopBays>
                {workshopBays.map((bay, index) => (
                  <BayItem key={index} status={bay.status}>
                    <BayIcon>{bay.icon}</BayIcon>
                    <BayName>{bay.name}</BayName>
                    <BayStatus status={bay.status}>
                      {bay.status === "using"
                        ? t("adminUsing")
                        : t("adminEmpty")}
                    </BayStatus>
                  </BayItem>
                ))}
              </WorkshopBays>
            </WorkshopCard>

            <UrgentCard>
              <CardHeader>
                <div>
                  <UrgentBadge>⚠️</UrgentBadge>
                  <CardTitle>{t("adminUrgentRequests")}</CardTitle>
                  <CardSubtitle>{t("adminHighPriorityUrgent")}</CardSubtitle>
                </div>
                <ViewAllLink>{t("adminViewAll")} →</ViewAllLink>
              </CardHeader>
              {urgentRequests.map((request, index) => (
                <RequestItem key={index}>
                  <RequestIcon>🚗</RequestIcon>
                  <RequestContent>
                    <RequestTitle>{request.title}</RequestTitle>
                    <RequestMeta>
                      {request.plate} - {request.customer}
                    </RequestMeta>
                  </RequestContent>
                  <RequestActions>
                    <PriorityBadge status={request.status}>
                      {request.priority}
                    </PriorityBadge>
                    <ActionButton status={request.status}>
                      {t("adminViewDetail")}
                    </ActionButton>
                  </RequestActions>
                </RequestItem>
              ))}
            </UrgentCard>
          </TwoColumnRow>

          <JobsCard>
            <CardHeader>
              <CardTitle>{t("adminOngoingJobsNow")}</CardTitle>
              <CardSubtitle>{t("adminCurrentJobsStatus")}</CardSubtitle>
              <ViewAllLink>{t("adminViewAll")} →</ViewAllLink>
            </CardHeader>
            {ongoingJobs.map((job, index) => (
              <JobItem key={index}>
                <JobIcon>🔧</JobIcon>
                <JobContent>
                  <JobTitle>{job.title}</JobTitle>
                  <JobMeta>
                    {job.car} | {job.tech}
                  </JobMeta>
                  <ProgressBar>
                    <ProgressText>{t("adminProgress")}</ProgressText>
                    <ProgressValue>{job.progress}%</ProgressValue>
                  </ProgressBar>
                  <ProgressBarFill>
                    <ProgressFill width={job.progress} />
                  </ProgressBarFill>
                </JobContent>
                <JobActions>
                  <StatusBadge status={job.status}>
                    {job.statusText}
                  </StatusBadge>
                  <ActionButton>{t("adminViewDetail")}</ActionButton>
                </JobActions>
              </JobItem>
            ))}
          </JobsCard>

          <BottomStatsRow>
            {todayStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <BottomStatCard key={index} color={stat.color}>
                  <BottomStatIcon color={stat.color}>
                    <IconComponent size={28} />
                  </BottomStatIcon>
                  <BottomStatContent>
                    <BottomStatLabel>{stat.label}</BottomStatLabel>
                    <BottomStatValue>{stat.value}</BottomStatValue>
                  </BottomStatContent>
                </BottomStatCard>
              );
            })}
          </BottomStatsRow>
        </ContentArea>
      </MainContent>
    </DashboardContainer>
  );
};

export default AdminDashboard;

const DashboardContainer = styled.div`
  display: flex;
  min-height: calc(100vh - 70px);
  background-color: #ffffff;
  width: 100%;
`;

const Sidebar = styled.aside`
  width: 260px;
  background: linear-gradient(180deg, #0f1419 0%, #1a1f2e 100%);
  color: white;
  padding: 10px 0;
  overflow-y: auto;
  position: fixed;
  height: calc(100vh - 70px);
  left: 0;
  top: 70px;
  z-index: 5;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f7;
`;

const PageHeader = styled.div`
  background-color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
`;

const HeaderLeft = styled.div``;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
`;

const HeaderSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
`;

const StatusBadge = styled.div<{ status?: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  background-color: ${(props) => {
    if (props.status === "active") return "#dcfce7";
    if (props.status === "in-progress") return "#dbeafe";
    if (props.status === "pending") return "#fef3c7";
    return "#e5e7eb";
  }};
  color: ${(props) => {
    if (props.status === "active") return "#15803d";
    if (props.status === "in-progress") return "#1e40af";
    if (props.status === "pending") return "#92400e";
    return "#374151";
  }};
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #22c55e;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const DateText = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ContentArea = styled.div`
  padding: 2rem;
  flex: 1;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const StatTitle = styled.h3`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  flex: 1;
`;

const StatIconWrapper = styled.div<{ color?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.color || "#3b82f6"}15;
  color: ${(props) => props.color || "#3b82f6"};
  flex-shrink: 0;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 4px 12px ${(props) => props.color || "#3b82f6"}40;
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
`;

const StatFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatChange = styled.span<{ trend: string }>`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => (props.trend === "up" ? "#10b981" : "#ef4444")};
`;

const StatSubtitle = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const CardHeader = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
`;

const CardSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ChartContainer = styled.div``;

const Chart = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
  gap: 1rem;
  margin-bottom: 0.75rem;
`;

const ChartBar = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
`;

const BarFill = styled.div<{ height: number }>`
  background-color: #1a1d29;
  border-radius: 6px 6px 0 0;
  height: ${(props) => props.height}%;
  transition: height 0.3s ease;
`;

const ChartLabels = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ChartLabel = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  flex: 1;
  text-align: center;
`;

const DonutChartContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const DonutChart = styled.div`
  flex-shrink: 0;
`;

const DonutLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LegendColor = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  flex-shrink: 0;
`;

const LegendLabel = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  flex: 1;
`;

const LegendValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;

const TwoColumnRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const WorkshopCard = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const ViewAllLink = styled.a`
  font-size: 0.875rem;
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const WorkshopStats = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem;
  background-color: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const WorkshopStatItem = styled.div`
  text-align: center;
  flex: 1;
`;

const WorkshopStatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.25rem;
`;

const WorkshopStatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const WorkshopStatDivider = styled.div`
  width: 1px;
  height: 40px;
  background-color: #e5e7eb;
`;

const WorkshopBays = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const BayItem = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: ${(props) =>
    props.status === "using" ? "#fef3c7" : "#f3f4f6"};
  border-radius: 8px;
  border: 1px solid
    ${(props) => (props.status === "using" ? "#fbbf24" : "#e5e7eb")};
`;

const BayIcon = styled.span`
  font-size: 1.25rem;
`;

const BayName = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;

const BayStatus = styled.span<{ status: string }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background-color: ${(props) =>
    props.status === "using" ? "#fbbf24" : "#10b981"};
  color: white;
  font-weight: 600;
`;

const UrgentCard = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const UrgentBadge = styled.span`
  display: inline-block;
  margin-right: 0.5rem;
  font-size: 1.25rem;
`;

const RequestItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #fef2f2;
  border-radius: 8px;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const RequestIcon = styled.span`
  font-size: 1.5rem;
  background-color: white;
  padding: 0.75rem;
  border-radius: 8px;
  flex-shrink: 0;
`;

const RequestContent = styled.div`
  flex: 1;
`;

const RequestTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
`;

const RequestMeta = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
`;

const RequestActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
`;

const PriorityBadge = styled.span<{ status: string }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  background-color: ${(props) =>
    props.status === "high" ? "#fee2e2" : "#fef3c7"};
  color: ${(props) => (props.status === "high" ? "#dc2626" : "#d97706")};
  font-weight: 600;
`;

const ActionButton = styled.button<{ status?: string }>`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  background-color: ${(props) =>
    props.status === "high" ? "#dc2626" : "#3b82f6"};
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) =>
      props.status === "high" ? "#b91c1c" : "#2563eb"};
  }
`;

const JobsCard = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const JobItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background-color: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const JobIcon = styled.span`
  font-size: 1.5rem;
  background-color: white;
  padding: 0.75rem;
  border-radius: 8px;
  flex-shrink: 0;
`;

const JobContent = styled.div`
  flex: 1;
`;

const JobTitle = styled.h4`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
`;

const JobMeta = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
`;

const ProgressBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ProgressText = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const ProgressValue = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #3b82f6;
`;

const ProgressBarFill = styled.div`
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ width: number }>`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
  width: ${(props) => props.width}%;
  transition: width 0.3s ease;
`;

const JobActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
`;

const BottomStatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const BottomStatCard = styled.div<{ color: string }>`
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1.25rem;
`;

const BottomStatIcon = styled.div<{ color?: string }>`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: ${(props) => props.color || "#667eea"}20;
  color: ${(props) => props.color || "#667eea"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px ${(props) => props.color || "#667eea"}40;
  }
`;

const BottomStatContent = styled.div``;

const BottomStatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const BottomStatValue = styled.div`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
`;
