import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { AuthContext } from "@/context/AuthContext";
import { ROUTER_PAGE } from "@/routes/contants";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  FaCar,
  FaFileAlt,
  FaCalendarAlt,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaWrench,
  FaUser,
  FaExclamationCircle,
} from "react-icons/fa";
import type { ICar } from "@/apis/cars/types";
import type { IService } from "@/services/admin/serviceService";
import type { IUser } from "@/services/admin/userService";
import { getCars } from "@/apis/cars";

type BookingStep = 1 | 2 | 3 | 4;

interface BookingData {
  selectedVehicle: ICar | null;
  phoneNumber: string;
  issueTitle: string;
  issueDescription: string;
  symptoms: string[];
  urgencyLevel: string;
  serviceType: string;
  selectedServices: number[];
  selectedTechnician: number | null;
  preferredDate: string;
  preferredTime: string;
}

const BookingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [userVehicles, setUserVehicles] = useState<ICar[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [availableServices] = useState<IService[]>([
    {
      id: 1,
      code: "maintenance",
      name: "Thay dầu máy",
      price: 500000,
      unit: "phút",
      category: "Bảo dưỡng",
      estimatedDurationHours: 0.5,
      description: "Thay dầu máy và lọc dầu định kỳ",
      image: null,
      isActive: true,
    },
    {
      id: 2,
      code: "inspection",
      name: "Kiểm tra tổng quát",
      price: 300000,
      unit: "phút",
      category: "Bảo dưỡng",
      estimatedDurationHours: 0.75,
      description: "Kiểm tra 20 điểm an toàn xe",
      image: null,
      isActive: true,
    },
    {
      id: 3,
      code: "repair",
      name: "Thay má phanh",
      price: 1200000,
      unit: "phút",
      category: "Sửa chữa",
      estimatedDurationHours: 1.5,
      description: "Thay má phanh trước-hoặc-sau",
      image: null,
      isActive: true,
    },
    {
      id: 4,
      code: "electrical",
      name: "Sửa điều hòa",
      price: 800000,
      unit: "phút",
      category: "Điện",
      estimatedDurationHours: 2,
      description: "Kiểm tra và sửa chữa hệ thống điều hòa",
      image: null,
      isActive: true,
    },
    {
      id: 5,
      code: "tires",
      name: "Cân chỉnh lốp",
      price: 400000,
      unit: "phút",
      category: "Lốp",
      estimatedDurationHours: 0.75,
      description: "Cân bằng và chỉnh góc lái",
      image: null,
      isActive: true,
    },
    {
      id: 6,
      code: "bodywork",
      name: "Sơn xe",
      price: 5000000,
      unit: "phút",
      category: "Sơn",
      estimatedDurationHours: 7.67,
      description: "Sơn phục hồi hoặc thay đổi màu xe",
      image: null,
      isActive: true,
    },
  ]);
  const [technicians] = useState<IUser[]>([
    {
      userID: 10,
      userCode: "TECH001",
      fullName: "Phạm Đức Dũng",
      username: "ducdung",
      email: "ducdung@garage.vn",
      phone: "0912345678",
      gender: "Nam",
      dateOfBirth: "1990-05-15",
      image: "",
      roleID: 3,
      roleName: "Kỹ thuật viên",
      isActive: true,
      createdDate: "2024-01-01",
    },
    {
      userID: 11,
      userCode: "TECH002",
      fullName: "Nguyễn Hoàng Long",
      username: "hoanglong",
      email: "hoanglong@garage.vn",
      phone: "0923456789",
      gender: "Nam",
      dateOfBirth: "1988-08-20",
      image: "",
      roleID: 3,
      roleName: "Kỹ thuật viên",
      isActive: true,
      createdDate: "2024-01-01",
    },
    {
      userID: 12,
      userCode: "TECH003",
      fullName: "Lê Văn Minh",
      username: "vanminh",
      email: "vanminh@garage.vn",
      phone: "0934567890",
      gender: "Nam",
      dateOfBirth: "1992-03-10",
      image: "",
      roleID: 3,
      roleName: "Kỹ thuật viên",
      isActive: true,
      createdDate: "2024-01-01",
    },
  ]);

  const [bookingData, setBookingData] = useState<BookingData>({
    selectedVehicle: null,
    phoneNumber: user?.msisdn || "",
    issueTitle: "",
    issueDescription: "",
    symptoms: [],
    urgencyLevel: "",
    serviceType: "",
    selectedServices: [],
    selectedTechnician: null,
    preferredDate: "",
    preferredTime: "",
  });

  useEffect(() => {
    if (!user) {
      navigate(ROUTER_PAGE.home);
      return;
    }

    const fetchVehicles = async () => {
      try {
        setIsLoadingVehicles(true);
        const cars = await getCars();
        setUserVehicles(cars);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, [user, navigate]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!bookingData.selectedVehicle) {
        toast.warn(t("bookingAlertSelectVehicle"));
        return;
      }
      if (!bookingData.phoneNumber || bookingData.phoneNumber.trim() === "") {
        toast.warn(t("bookingAlertEnterPhone"));
        return;
      }
    }
    if (currentStep === 2 && (!bookingData.issueTitle || !bookingData.issueDescription)) {
      toast.warn(t("bookingAlertFillIssue"));
      return;
    }
    if (currentStep === 3 && bookingData.selectedServices.length === 0) {
      toast.warn(t("bookingAlertSelectService"));
      return;
    }
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as BookingStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as BookingStep);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = () => {
    console.log("Booking data:", bookingData);
    toast.success(t("bookingAlertSuccess"));
    navigate(ROUTER_PAGE.home);
  };

  const toggleSymptom = (symptom: string) => {
    setBookingData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const toggleService = (serviceId: number) => {
    setBookingData((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter((id) => id !== serviceId)
        : [...prev.selectedServices, serviceId],
    }));
  };

  const getTotalPrice = () => {
    return bookingData.selectedServices.reduce((total, serviceId) => {
      const service = availableServices.find((s) => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const symptoms = [
    { key: "bookingSymptomStrangeNoise", label: t("bookingSymptomStrangeNoise") },
    { key: "bookingSymptomVibration", label: t("bookingSymptomVibration") },
    { key: "bookingSymptomWarningLight", label: t("bookingSymptomWarningLight") },
    { key: "bookingSymptomHardStart", label: t("bookingSymptomHardStart") },
    { key: "bookingSymptomHighFuel", label: t("bookingSymptomHighFuel") },
    { key: "bookingSymptomACNotCool", label: t("bookingSymptomACNotCool") },
    { key: "bookingSymptomBrakeFail", label: t("bookingSymptomBrakeFail") },
    { key: "bookingSymptomGearJerk", label: t("bookingSymptomGearJerk") },
    { key: "bookingSymptomOilLeak", label: t("bookingSymptomOilLeak") },
    { key: "bookingSymptomSmoke", label: t("bookingSymptomSmoke") },
  ];

  return (
    <PageWrapper>
      <Container>
        <Header>
          <BackButton onClick={handleBack}>
            <FaChevronLeft size={20} />
          </BackButton>
          <HeaderContent>
            <HeaderTitle>{t("bookingHeaderTitle")}</HeaderTitle>
            <HeaderSubtitle>
              {t("bookingHeaderSubtitle")}
            </HeaderSubtitle>
          </HeaderContent>
        </Header>

        <StepIndicator>
          <Step $active={currentStep >= 1} $completed={currentStep > 1}>
            <StepNumber $active={currentStep >= 1} $completed={currentStep > 1}>
              {currentStep > 1 ? <FaCheck size={16} /> : "1"}
            </StepNumber>
            <StepLabel $active={currentStep === 1}>
              <StepTitle>{t("bookingStep1Title")}</StepTitle>
              <StepDescription>{t("bookingStep1Desc")}</StepDescription>
            </StepLabel>
          </Step>

          <StepLine $active={currentStep >= 2} />

          <Step $active={currentStep >= 2} $completed={currentStep > 2}>
            <StepNumber $active={currentStep >= 2} $completed={currentStep > 2}>
              {currentStep > 2 ? <FaCheck size={16} /> : "2"}
            </StepNumber>
            <StepLabel $active={currentStep === 2}>
              <StepTitle>{t("bookingStep2Title")}</StepTitle>
              <StepDescription>{t("bookingStep2Desc")}</StepDescription>
            </StepLabel>
          </Step>

          <StepLine $active={currentStep >= 3} />

          <Step $active={currentStep >= 3} $completed={currentStep > 3}>
            <StepNumber $active={currentStep >= 3} $completed={currentStep > 3}>
              {currentStep > 3 ? <FaCheck size={16} /> : "3"}
            </StepNumber>
            <StepLabel $active={currentStep === 3}>
              <StepTitle>{t("bookingStep3Title")}</StepTitle>
              <StepDescription>{t("bookingStep3Desc")}</StepDescription>
            </StepLabel>
          </Step>

          <StepLine $active={currentStep >= 4} />

          <Step $active={currentStep >= 4} $completed={false}>
            <StepNumber $active={currentStep >= 4} $completed={false}>
              4
            </StepNumber>
            <StepLabel $active={currentStep === 4}>
              <StepTitle>{t("bookingStep4Title")}</StepTitle>
              <StepDescription>{t("bookingStep4Desc")}</StepDescription>
            </StepLabel>
          </Step>
        </StepIndicator>

        <ContentSection>
          {currentStep === 1 && (
            <StepContent>
              <FormGroup style={{ marginTop: "1.5rem" }}>
                <Label>
                  {t("bookingPhoneLabel")} <Required>*</Required>
                </Label>
                <Input
                  type="tel"
                  placeholder={t("bookingPhonePlaceholder")}
                  value={bookingData.phoneNumber}
                  onChange={(e) =>
                    setBookingData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                  }
                />
              </FormGroup>
              <SectionTitle>{t("bookingSelectVehicle")}</SectionTitle>
              {isLoadingVehicles ? (
                <LoadingMessage>{t("bookingLoadingVehicles")}</LoadingMessage>
              ) : userVehicles.length === 0 ? (
                <EmptyMessage>{t("bookingNoVehicles")}</EmptyMessage>
              ) : (
                <VehicleGrid>
                  {userVehicles.map((vehicle) => {
                    const isSelected = bookingData.selectedVehicle != null && bookingData.selectedVehicle.licensePlate === vehicle.licensePlate;
                    
                    return (
                      <VehicleCard
                        key={vehicle.carID}
                        $selected={isSelected}
                        onClick={() => {
                          setBookingData((prev) => ({
                            ...prev,
                            selectedVehicle: isSelected ? null : vehicle,
                          }));
                        }}
                      >
                        <VehicleIcon>
                          <FaCar size={32} />
                        </VehicleIcon>
                        <VehicleInfo>
                          <VehicleName>
                            {vehicle.brand} {vehicle.model}
                          </VehicleName>
                          <VehicleDetails>
                            {vehicle.licensePlate} - {vehicle.year}
                          </VehicleDetails>
                          <VehicleOdometer>{vehicle.currentOdometer.toLocaleString()} km</VehicleOdometer>
                        </VehicleInfo>
                        {isSelected && (
                          <CheckmarkIcon>
                            <FaCheck />
                          </CheckmarkIcon>
                        )}
                      </VehicleCard>
                    );
                  })}
                </VehicleGrid>
              )}
            </StepContent>
          )}

          {currentStep === 2 && (
            <StepContent>
              <SectionTitle>{t("bookingDescribeIssue")}</SectionTitle>

              <FormGroup>
                <Label>
                  {t("bookingIssueTitleLabel")} <Required>*</Required>
                </Label>
                <Input
                  type="text"
                  placeholder={t("bookingIssueTitlePlaceholder")}
                  value={bookingData.issueTitle}
                  onChange={(e) =>
                    setBookingData((prev) => ({ ...prev, issueTitle: e.target.value }))
                  }
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  {t("bookingIssueDescLabel")} <Required>*</Required>
                </Label>
                <Textarea
                  placeholder={t("bookingIssueDescPlaceholder")}
                  rows={5}
                  value={bookingData.issueDescription}
                  onChange={(e) =>
                    setBookingData((prev) => ({
                      ...prev,
                      issueDescription: e.target.value,
                    }))
                  }
                />
              </FormGroup>

              <FormGroup>
                <Label>{t("bookingSymptomLabel")}</Label>
                <SymptomGrid>
                  {symptoms.map((symptom) => (
                    <SymptomChip
                      key={symptom.key}
                      $selected={bookingData.symptoms.includes(symptom.key)}
                      onClick={() => toggleSymptom(symptom.key)}
                    >
                      {symptom.label}
                    </SymptomChip>
                  ))}
                </SymptomGrid>
              </FormGroup>

              <FormGroup>
                <Label>{t("bookingServiceTypeLabel")} <Required>*</Required></Label>
                <ServiceTypeGrid>
                  <ServiceTypeCard
                    $selected={bookingData.serviceType === "repair"}
                    onClick={() =>
                      setBookingData((prev) => ({ ...prev, serviceType: "repair" }))
                    }
                  >
                    <ServiceTypeIcon>
                      <FaWrench size={24} />
                    </ServiceTypeIcon>
                    <ServiceTypeName>{t("bookingServiceTypeRepair")}</ServiceTypeName>
                    <ServiceTypeDesc>{t("bookingServiceTypeRepairDesc")}</ServiceTypeDesc>
                  </ServiceTypeCard>

                  <ServiceTypeCard
                    $selected={bookingData.serviceType === "maintenance"}
                    onClick={() =>
                      setBookingData((prev) => ({ ...prev, serviceType: "maintenance" }))
                    }
                  >
                    <ServiceTypeIcon>
                      <FaCar size={24} />
                    </ServiceTypeIcon>
                    <ServiceTypeName>{t("bookingServiceTypeMaintenance")}</ServiceTypeName>
                    <ServiceTypeDesc>{t("bookingServiceTypeMaintenanceDesc")}</ServiceTypeDesc>
                  </ServiceTypeCard>
                </ServiceTypeGrid>
              </FormGroup>
            </StepContent>
          )}

          {currentStep === 3 && (
            <StepContent>
              <SectionTitle>{t("bookingSelectService")}</SectionTitle>
              <SectionSubtitle>
                {t("bookingSelectServiceSubtitle")}
              </SectionSubtitle>

              <ServiceList>
                {availableServices.map((service) => (
                  <ServiceItem key={service.id}>
                    <ServiceCheckbox
                      type="checkbox"
                      checked={bookingData.selectedServices.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                    />
                    <ServiceDetails>
                      <ServiceName>{service.name}</ServiceName>
                      <ServiceTag>{service.category}</ServiceTag>
                      <ServiceDescription>{service.description}</ServiceDescription>
                    </ServiceDetails>
                    <ServicePricing>
                      <ServicePrice>{service.price.toLocaleString()}đ</ServicePrice>
                      <ServiceDuration>~{Math.round(service.estimatedDurationHours * 60)} {t("bookingMinutes")}</ServiceDuration>
                    </ServicePricing>
                  </ServiceItem>
                ))}
              </ServiceList>

              <FormGroup>
                <Label>{t("bookingSelectTechnician")}</Label>
                <TechnicianInfo>
                  {t("bookingTechnicianInfo")}
                </TechnicianInfo>
                <TechnicianGrid>
                  <TechnicianCard
                    $selected={bookingData.selectedTechnician === null}
                    onClick={() =>
                      setBookingData((prev) => ({ ...prev, selectedTechnician: null }))
                    }
                  >
                    <TechnicianAvatar>
                      <FaUser size={24} />
                    </TechnicianAvatar>
                    <TechnicianName>{t("bookingAutoAssign")}</TechnicianName>
                    <TechnicianSubtext>{t("bookingAutoAssignDesc")}</TechnicianSubtext>
                  </TechnicianCard>

                  {technicians.map((tech) => (
                    <TechnicianCard
                      key={tech.userID}
                      $selected={bookingData.selectedTechnician === tech.userID}
                      onClick={() =>
                        setBookingData((prev) => ({
                          ...prev,
                          selectedTechnician: tech.userID,
                        }))
                      }
                    >
                      <TechnicianAvatar $hasImage={false}>
                        {tech.fullName.charAt(0)}
                      </TechnicianAvatar>
                      <TechnicianName>{tech.fullName}</TechnicianName>
                      <TechnicianBadge>{t("bookingTechRepair")}</TechnicianBadge>
                      <TechnicianStats>
                        <TechnicianRating>
                          ⭐ {t("bookingTechStats")}
                        </TechnicianRating>
                      </TechnicianStats>
                    </TechnicianCard>
                  ))}
                </TechnicianGrid>
              </FormGroup>

              <FormGroup>
                <Label>{t("bookingPreferredTime")}</Label>
                <TimeGrid>
                  <TimeField>
                    <TimeLabel>{t("bookingDateLabel")}</TimeLabel>
                    <Input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingData.preferredDate}
                      onChange={(e) =>
                        setBookingData((prev) => ({
                          ...prev,
                          preferredDate: e.target.value,
                          preferredTime: "",
                        }))
                      }
                    />
                  </TimeField>
                  <TimeField>
                    <TimeLabel>{t("bookingTimeLabel")}</TimeLabel>
                    <Select
                      value={bookingData.preferredTime}
                      onChange={(e) =>
                        setBookingData((prev) => ({
                          ...prev,
                          preferredTime: e.target.value,
                        }))
                      }
                    >
                      <option value="">{t("bookingSelectTime")}</option>
                      {Array.from({ length: 9 }, (_, i) => {
                        const hour = 8 + i;
                        const now = new Date();
                        const isToday = bookingData.preferredDate === now.toISOString().split("T")[0];
                        if (isToday && hour <= now.getHours()) return null;
                        return (
                          <option key={hour} value={`${hour}:00`}>
                            {`${hour}:00 - ${hour + 1}:00`}
                          </option>
                        );
                      })}
                    </Select>
                  </TimeField>
                </TimeGrid>
              </FormGroup>
            </StepContent>
          )}

          {currentStep === 4 && (
            <StepContent>
              <SectionTitle>{t("bookingConfirmTitle")}</SectionTitle>

              <ConfirmationCard>
                <CardSection>
                  <CardSectionTitle>
                    <FaCar size={20} />
                    {t("bookingVehicleInfo")}
                  </CardSectionTitle>
                  {bookingData.selectedVehicle && (
                    <InfoItem>
                      <InfoLabel>
                        {bookingData.selectedVehicle.brand}{" "}
                        {bookingData.selectedVehicle.model}
                      </InfoLabel>
                      <InfoValue>
                        {bookingData.selectedVehicle.licensePlate} -{" "}
                        {bookingData.selectedVehicle.year}
                      </InfoValue>
                    </InfoItem>
                  )}
                </CardSection>

                <Divider />

                <CardSection>
                  <CardSectionTitle>
                    <FaUser size={20} />
                    {t("bookingContactPhone")}
                  </CardSectionTitle>
                  <InfoItem>
                    <InfoValue>{bookingData.phoneNumber}</InfoValue>
                  </InfoItem>
                </CardSection>

                <Divider />

                <CardSection>
                  <CardSectionTitle>
                    <FaFileAlt size={20} />
                    {t("bookingServiceType")}
                  </CardSectionTitle>
                  <InfoItem>
                    <ServiceTypeBadge>
                      {bookingData.serviceType === "repair" && `🔧 ${t("bookingServiceTypeRepair")}`}
                      {bookingData.serviceType === "maintenance" && `🚗 ${t("bookingServiceTypeMaintenance")}`}
                    </ServiceTypeBadge>
                    <ServiceTypeDescription>
                      {bookingData.serviceType === "repair" && t("bookingServiceTypeRepairDesc")}
                      {bookingData.serviceType === "maintenance" && t("bookingServiceTypeMaintenanceDesc")}
                    </ServiceTypeDescription>
                  </InfoItem>
                </CardSection>

                <Divider />

                <CardSection>
                  <CardSectionTitle>
                    <FaFileAlt size={20} />
                    {t("bookingIssueSummary")}
                  </CardSectionTitle>
                  <InfoItem>
                    <InfoLabel>{bookingData.issueTitle}</InfoLabel>
                    <InfoValue>{bookingData.issueDescription}</InfoValue>
                  </InfoItem>
                  {bookingData.symptoms.length > 0 && (
                    <SymptomList>
                      {bookingData.symptoms.map((symptomKey) => (
                        <SymptomBadge key={symptomKey}>{t(symptomKey)}</SymptomBadge>
                      ))}
                    </SymptomList>
                  )}
                </CardSection>

                {bookingData.selectedServices.length > 0 && (
                  <>
                    <Divider />
                    <CardSection>
                      <CardSectionTitle>
                        <FaWrench size={20} />
                        {t("bookingSelectedServices")}
                      </CardSectionTitle>
                      {bookingData.selectedServices.map((serviceId) => {
                        const service = availableServices.find(
                          (s) => s.id === serviceId
                        );
                        if (!service) return null;
                        return (
                          <ServiceSummaryItem key={serviceId}>
                            <ServiceSummaryName>{service.name}</ServiceSummaryName>
                            <ServiceSummaryPrice>
                              {service.price.toLocaleString()}đ
                            </ServiceSummaryPrice>
                          </ServiceSummaryItem>
                        );
                      })}
                      <TotalPrice>
                        <TotalLabel>{t("bookingTotal")}</TotalLabel>
                        <TotalValue>{getTotalPrice().toLocaleString()}đ</TotalValue>
                      </TotalPrice>
                    </CardSection>
                  </>
                )}

                <Divider />

                <CardSection>
                  <CardSectionTitle>
                    <FaUser size={20} />
                    {t("bookingTechnician")}
                  </CardSectionTitle>
                  <InfoItem>
                    <InfoValue>
                      {bookingData.selectedTechnician === null
                        ? t("bookingAutoAssignSummary")
                        : technicians.find(
                            (t) => t.userID === bookingData.selectedTechnician
                          )?.fullName}
                    </InfoValue>
                  </InfoItem>
                </CardSection>

                <Divider />

                <CardSection>
                  <CardSectionTitle>
                    <FaCalendarAlt size={20} />
                    {t("bookingPreferredTimeSummary")}
                  </CardSectionTitle>
                  <InfoItem>
                    <InfoValue>
                      {bookingData.preferredDate && bookingData.preferredTime
                        ? `${new Date(bookingData.preferredDate).toLocaleDateString(
                            "vi-VN"
                          )} - ${bookingData.preferredTime} - ${
                            parseInt(bookingData.preferredTime) + 1
                          }:00`
                        : t("bookingNotSpecified")}
                    </InfoValue>
                  </InfoItem>
                </CardSection>

                <NoteCard>
                  <FaExclamationCircle size={20} color="#1d4ed8" />
                  <NoteText>
                    {t("bookingNote")}
                  </NoteText>
                </NoteCard>
              </ConfirmationCard>
            </StepContent>
          )}
        </ContentSection>

        <Footer>
          <BackButtonFooter onClick={handleBack}>
            <FaChevronLeft size={18} />
            {t("bookingBack")}
          </BackButtonFooter>

          {currentStep < 4 ? (
            <NextButton onClick={handleNext}>
              {t("bookingNext")}
              <FaChevronRight size={18} />
            </NextButton>
          ) : (
            <SubmitButton onClick={handleSubmit}>
              <FaCheck size={18} />
              {t("bookingSubmit")}
            </SubmitButton>
          )}
        </Footer>
      </Container>
    </PageWrapper>
  );
};

export default BookingPage;

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem 1rem;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
  }
`;

const Container = styled.div`
  max-width: 920px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;

  @media (max-width: 768px) {
    padding: 1rem 1.25rem;
  }
`;

const BackButton = styled.button`
  background: #f8f9fa;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #e9ecef;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const HeaderSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 2rem;
  background: #f8f9fa;
  gap: 0.5rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
    gap: 0.25rem;
  }
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: ${({ $active, $completed }) => ($active || $completed ? 1 : 0.5)};
`;

const StepNumber = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  background: ${({ $active, $completed }) =>
    $completed ? "#1d4ed8" : $active ? "#1d4ed8" : "#e5e7eb"};
  color: ${({ $active, $completed }) =>
    $active || $completed ? "white" : "#6b7280"};
  transition: all 0.3s;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }
`;

const StepLabel = styled.div<{ $active: boolean }>`
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const StepTitle = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: #111827;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const StepDescription = styled.div`
  font-size: 0.75rem;
  color: #6b7280;

  @media (max-width: 768px) {
    font-size: 0.65rem;
  }
`;

const StepLine = styled.div<{ $active: boolean }>`
  width: 60px;
  height: 2px;
  background: ${({ $active }) => ($active ? "#1d4ed8" : "#e5e7eb")};
  transition: background 0.3s;

  @media (max-width: 768px) {
    width: 20px;
  }
`;

const ContentSection = styled.div`
  padding: 2rem;
  min-height: 400px;

  @media (max-width: 768px) {
    padding: 1.5rem 1.25rem;
  }
`;

const StepContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const SectionSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const VehicleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 0.9375rem;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 0.9375rem;
`;

const VehicleCard = styled.div<{ $selected: boolean }>`
  border: 2px solid ${({ $selected }) => ($selected ? "#1d4ed8" : "#e5e7eb")};
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $selected }) => ($selected ? "#eff6ff" : "white")};
  position: relative;

  &:hover {
    border-color: ${({ $selected }) => ($selected ? "#1d4ed8" : "#cbd5e1")};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const CheckmarkIcon = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1d4ed8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(29, 78, 216, 0.3);
`;

const VehicleIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  flex-shrink: 0;
`;

const VehicleInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const VehicleName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
`;

const VehicleDetails = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const VehicleOdometer = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
`;

const Required = styled.span`
  color: #dc2626;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #111827 !important;
  background: white;
  -webkit-text-fill-color: #111827 !important;

  &:focus {
    outline: none;
    border-color: #1d4ed8;
    box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
    -webkit-text-fill-color: #9ca3af;
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-text-fill-color: #111827 !important;
    -webkit-box-shadow: 0 0 0 1000px white inset !important;
    transition: background-color 5000s ease-in-out 0s;
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #111827 !important;
  background: white;
  resize: vertical;
  font-family: inherit;
  -webkit-text-fill-color: #111827 !important;

  &:focus {
    outline: none;
    border-color: #1d4ed8;
    box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
    -webkit-text-fill-color: #9ca3af;
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #111827 !important;
  background: white;
  -webkit-text-fill-color: #111827 !important;

  &:focus {
    outline: none;
    border-color: #1d4ed8;
    box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
  }

  option {
    color: #111827;
  }
`;

const SymptomGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SymptomChip = styled.button<{ $selected: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${({ $selected }) => ($selected ? "#1d4ed8" : "#d1d5db")};
  border-radius: 20px;
  background: ${({ $selected }) => ($selected ? "#eff6ff" : "white")};
  color: ${({ $selected }) => ($selected ? "#1d4ed8" : "#6b7280")};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #1d4ed8;
    background: #eff6ff;
  }
`;

const ServiceTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ServiceTypeCard = styled.div<{ $selected: boolean }>`
  border: 2px solid ${({ $selected }) => ($selected ? "#1d4ed8" : "#e5e7eb")};
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $selected }) => ($selected ? "#eff6ff" : "white")};

  &:hover {
    border-color: #1d4ed8;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const ServiceTypeIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #1d4ed8;
`;

const ServiceTypeName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
`;

const ServiceTypeDesc = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const ServiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ServiceItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e1;
    background: #f8f9fa;
  }
`;

const ServiceCheckbox = styled.input`
  width: 20px;
  height: 20px;
  margin-top: 0.25rem;
  cursor: pointer;
  accent-color: #1d4ed8;
`;

const ServiceDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ServiceName = styled.div`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
`;

const ServiceTag = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  width: fit-content;
`;

const ServiceDescription = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ServicePricing = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`;

const ServicePrice = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #1d4ed8;
`;

const ServiceDuration = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const TechnicianInfo = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const TechnicianGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const TechnicianCard = styled.div<{ $selected: boolean }>`
  border: 2px solid ${({ $selected }) => ($selected ? "#1d4ed8" : "#e5e7eb")};
  border-radius: 12px;
  padding: 1.25rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $selected }) => ($selected ? "#eff6ff" : "white")};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    border-color: #1d4ed8;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const TechnicianAvatar = styled.div<{ $hasImage?: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #e0f2fe;
  color: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
`;

const TechnicianName = styled.div`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
`;

const TechnicianSubtext = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const TechnicianBadge = styled.div`
  font-size: 0.75rem;
  color: #0284c7;
  background: #e0f2fe;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
`;

const TechnicianStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const TechnicianRating = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TimeField = styled.div`
  min-width: 450px;
  width: 450px;
`;

const TimeLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  display: block;
  margin-bottom: 0.25rem;
`;

const ConfirmationCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  background: white;
`;

const CardSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CardSectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
`;

const Divider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 0.5rem 0;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.div`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
`;

const InfoValue = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ServiceTypeBadge = styled.div`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1d4ed8;
  background: #eff6ff;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  width: fit-content;
`;

const ServiceTypeDescription = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const SymptomList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SymptomBadge = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
`;

const ServiceSummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const ServiceSummaryName = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ServiceSummaryPrice = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;

const TotalPrice = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  margin-top: 0.5rem;
  border-top: 2px solid #e5e7eb;
`;

const TotalLabel = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
`;

const TotalValue = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1d4ed8;
`;

const NoteCard = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  margin-top: 1rem;
`;

const NoteText = styled.p`
  font-size: 0.875rem;
  color: #1e40af;
  margin: 0;
  line-height: 1.5;
`;

const Footer = styled.div`
  padding: 1.5rem 2rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;

  @media (max-width: 768px) {
    padding: 1rem 1.25rem;
  }
`;

const BackButtonFooter = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #9ca3af;
    background: #f9fafb;
  }
`;

const NextButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #1d4ed8;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1e40af;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #1d4ed8;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1e40af;
  }
`;
