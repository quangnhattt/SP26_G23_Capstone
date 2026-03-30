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
  FaPlus,
} from "react-icons/fa";
import type { ICar } from "@/apis/cars/types";
import { getServices, type IService } from "@/services/admin/serviceService";
import { getUsers, type IUser } from "@/services/admin/userService";
import { getTechnicians, type ITechnician } from "@/apis/technicians";
import { getCars } from "@/apis/cars";
import { getSymptoms, type ISymptom } from "@/apis/symptoms";
import { createRepairRequest } from "@/apis/repairRequests";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { AddCarModal } from "./components";
import {
  getAvailableSlots,
  getAvailableTechnicians,
  type ISlotAvailability,
  type ISlotTechnician,
} from "@/apis/appointments";

type BookingStep = 1 | 2 | 3 | 4;

interface BookingData {
  selectedVehicle: ICar | null;
  phoneNumber: string;
  issueTitle: string;
  issueDescription: string;
  symptoms: number[];
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
  const [availableServices, setAvailableServices] = useState<IService[]>([]);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const isCustomer = user?.roleID === 4;
  const [technicians, setTechnicians] = useState<ITechnician[]>([]);
  const [symptomList, setSymptomList] = useState<ISymptom[]>([]);

  // === Scheduling state ===
  const [availableSlots, setAvailableSlots] = useState<ISlotAvailability[]>([]);
  const [slotTechnicians, setSlotTechnicians] = useState<ISlotTechnician[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingSlotTechs, setIsLoadingSlotTechs] = useState(false);

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

    const fetchServices = async () => {
      try {
        const services = await getServices();
        setAvailableServices(services.filter((s) => s.isActive));
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    const fetchUsers = async () => {
      if (isCustomer) {
        return;
      }
      try {
        const users = await getUsers();
        setAllUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchTechnicians = async () => {
      try {
        const data = await getTechnicians();
        setTechnicians(data);
      } catch (error) {
        console.error("Error fetching technicians:", error);
      }
    };

    const fetchSymptoms = async () => {
      try {
        const data = await getSymptoms();
        setSymptomList(data);
      } catch (error) {
        console.error("Error fetching symptoms:", error);
      }
    };

    fetchVehicles();
    fetchServices();
    fetchUsers();
    fetchTechnicians();
    fetchSymptoms();
  }, [user, navigate, isCustomer]);

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

  const fetchVehiclesData = async () => {
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

  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAddCarModal, setShowAddCarModal] = useState(false);

  const handleSubmit = async () => {
    if (!bookingData.selectedVehicle || !bookingData.selectedVehicle.carId) {
      toast.error(t("bookingAlertSelectVehicle"));
      setCurrentStep(1);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        carId: bookingData.selectedVehicle.carId,
        description: `${bookingData.issueTitle}\n${bookingData.issueDescription}`,
        serviceType: bookingData.serviceType,
        requestedPackageId: bookingData.selectedServices[0] ?? 0,
        technicianId: bookingData.selectedTechnician,
        phone: bookingData.phoneNumber,
        preferredDate: bookingData.preferredDate,
        preferredTime: bookingData.preferredTime,
        symptomIds: bookingData.symptoms,
      };


      await createRepairRequest(payload);
      toast.success(t("bookingAlertSuccess"));
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast.error(getApiErrorMessage(error, t("errorOccurred")));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSymptom = (symptomId: number) => {
    setBookingData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptomId)
        ? prev.symptoms.filter((id) => id !== symptomId)
        : [...prev.symptoms, symptomId],
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

  const filteredUsers = phoneSearch.trim().length >= 2
    ? allUsers.filter((u) => u.phone.includes(phoneSearch.trim()))
    : [];

  const handleSelectUser = (selectedUser: IUser) => {
    setBookingData((prev) => ({ ...prev, phoneNumber: selectedUser.phone }));
    setPhoneSearch(selectedUser.phone);
    setShowPhoneDropdown(false);
  };


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
                {isCustomer ? (
                  <Input
                    type="tel"
                    value={bookingData.phoneNumber}
                    disabled
                  />
                ) : (
                  <PhoneSearchWrapper>
                    <Input
                      type="tel"
                      placeholder={t("bookingPhonePlaceholder")}
                      value={phoneSearch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPhoneSearch(val);
                        setBookingData((prev) => ({ ...prev, phoneNumber: val }));
                        setShowPhoneDropdown(val.trim().length >= 2);
                      }}
                      onFocus={() => {
                        if (phoneSearch.trim().length >= 2) setShowPhoneDropdown(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowPhoneDropdown(false), 200);
                      }}
                    />
                    {showPhoneDropdown && filteredUsers.length > 0 && (
                      <PhoneDropdown>
                        {filteredUsers.slice(0, 5).map((u) => (
                          <PhoneDropdownItem
                            key={u.userID}
                            onMouseDown={() => handleSelectUser(u)}
                          >
                            <span>{u.phone}</span>
                            <PhoneDropdownName>{u.fullName}</PhoneDropdownName>
                          </PhoneDropdownItem>
                        ))}
                      </PhoneDropdown>
                    )}
                  </PhoneSearchWrapper>
                )}
              </FormGroup>
              <SectionTitle>{t("bookingSelectVehicle")}</SectionTitle>
              {isLoadingVehicles ? (
                <LoadingMessage>{t("bookingLoadingVehicles")}</LoadingMessage>
              ) : userVehicles.length === 0 ? (
                <EmptyStateWrapper>
                  <EmptyMessage>{t("bookingNoVehicles")}</EmptyMessage>
                  <AddCarButton onClick={() => setShowAddCarModal(true)}>
                    <FaPlus size={16} />
                    {t("addNewVehicle")}
                  </AddCarButton>
                </EmptyStateWrapper>
              ) : (
                <VehicleGrid>
                  {userVehicles.map((vehicle) => {
                    const isSelected = bookingData.selectedVehicle != null && bookingData.selectedVehicle.licensePlate === vehicle.licensePlate;
                    return (
                      <VehicleCard
                        key={vehicle.carId}
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
                  {symptomList.map((symptom) => (
                    <SymptomChip
                      key={symptom.id}
                      $selected={bookingData.symptoms.includes(symptom.id)}
                      onClick={() => toggleSymptom(symptom.id)}
                    >
                      {symptom.name}
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
                <Label>{t("bookingPreferredTime")} <Required>*</Required></Label>
                <TimeGrid>
                  <TimeField>
                    <TimeLabel>{t("bookingDateLabel")}</TimeLabel>
                    <Input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingData.preferredDate}
                      onChange={async (e) => {
                        const selectedDate = e.target.value;
                        setBookingData((prev) => ({
                          ...prev,
                          preferredDate: selectedDate,
                          preferredTime: "",
                          selectedTechnician: null,
                        }));
                        setSlotTechnicians([]);
                        if (selectedDate) {
                          setIsLoadingSlots(true);
                          try {
                            const result = await getAvailableSlots(selectedDate);
                            setAvailableSlots(result.slots);
                          } catch (err) {
                            console.error("Error fetching slots:", err);
                            setAvailableSlots([]);
                          } finally {
                            setIsLoadingSlots(false);
                          }
                        } else {
                          setAvailableSlots([]);
                        }
                      }}
                    />
                  </TimeField>
                </TimeGrid>

                {bookingData.preferredDate && (
                  <>
                    <TimeLabel style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>{t("bookingTimeLabel")}</TimeLabel>
                    {isLoadingSlots ? (
                      <LoadingMessage>Đang tải khung giờ...</LoadingMessage>
                    ) : availableSlots.length === 0 ? (
                      <LoadingMessage>Không có khung giờ khả dụng</LoadingMessage>
                    ) : (
                      <SlotGrid>
                        {availableSlots.map((slot) => {
                          const now = new Date();
                          const isToday = bookingData.preferredDate === now.toISOString().split("T")[0];
                          const slotHour = parseInt(slot.startTime.split(":")[0]);
                          const isPast = isToday && slotHour <= now.getHours();
                          const isDisabled = !slot.isAvailable || isPast;
                          const isSelected = bookingData.preferredTime === slot.startTime;

                          return (
                            <SlotButton
                              key={slot.slotIndex}
                              $selected={isSelected}
                              $disabled={isDisabled}
                              onClick={async () => {
                                if (isDisabled) return;
                                setBookingData((prev) => ({
                                  ...prev,
                                  preferredTime: slot.startTime,
                                  selectedTechnician: null,
                                }));
                                // Fetch KTV rảnh trong slot này
                                setIsLoadingSlotTechs(true);
                                try {
                                  const techs = await getAvailableTechnicians(
                                    bookingData.preferredDate,
                                    slot.startTime
                                  );
                                  setSlotTechnicians(techs);
                                } catch (err) {
                                  console.error("Error fetching slot technicians:", err);
                                  setSlotTechnicians([]);
                                } finally {
                                  setIsLoadingSlotTechs(false);
                                }
                              }}
                            >
                              <SlotTime>{slot.startTime} - {slot.endTime}</SlotTime>
                              <SlotStatus $available={slot.isAvailable && !isPast}>
                                {isPast
                                  ? "Đã qua"
                                  : slot.isAvailable
                                    ? `Còn ${slot.availableCount} chỗ`
                                    : "Hết chỗ"}
                              </SlotStatus>
                            </SlotButton>
                          );
                        })}
                      </SlotGrid>
                    )}
                  </>
                )}
              </FormGroup>

              {bookingData.preferredTime && (
                <FormGroup>
                  <Label>{t("bookingSelectTechnician")}</Label>
                  <TechnicianInfo>
                    Chọn kỹ thuật viên còn rảnh trong khung giờ {bookingData.preferredTime}
                  </TechnicianInfo>
                  {isLoadingSlotTechs ? (
                    <LoadingMessage>Đang tải danh sách KTV...</LoadingMessage>
                  ) : (
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

                      {slotTechnicians
                        .filter((tech) => tech.isAvailableInSlot)
                        .map((tech) => (
                          <TechnicianCard
                            key={tech.technicianId}
                            $selected={bookingData.selectedTechnician === tech.technicianId}
                            onClick={() =>
                              setBookingData((prev) => ({
                                ...prev,
                                selectedTechnician: tech.technicianId,
                              }))
                            }
                          >
                            <TechnicianAvatar $hasImage={false}>
                              {tech.fullName.charAt(0)}
                            </TechnicianAvatar>
                            <TechnicianName>{tech.fullName}</TechnicianName>
                            {tech.skills && <TechnicianBadge>{tech.skills}</TechnicianBadge>}
                          </TechnicianCard>
                        ))}
                    </TechnicianGrid>
                  )}
                </FormGroup>
              )}
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
                      {bookingData.symptoms.map((symptomId) => {
                        const s = symptomList.find((item) => item.id === symptomId);
                        return s ? <SymptomBadge key={s.id}>{s.name}</SymptomBadge> : null;
                      })}
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
                          (t) => t.technicianId === bookingData.selectedTechnician
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
                        )} - ${bookingData.preferredTime} - ${parseInt(bookingData.preferredTime) + 1
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
            <SubmitButton onClick={handleSubmit} disabled={submitting}>
              <FaCheck size={18} />
              {submitting ? t("saving") : t("bookingSubmit")}
            </SubmitButton>
          )}
        </Footer>
      </Container>
      {showSuccessModal && (
        <ModalOverlay onClick={() => { setShowSuccessModal(false); navigate(ROUTER_PAGE.home); }}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <SuccessIcon>
                <FaCheck size={28} />
              </SuccessIcon>
              <ModalTitle>{t("bookingAlertSuccess")}</ModalTitle>
            </ModalHeader>

            <ModalBody>
              <ModalSection>
                <ModalSectionTitle><FaCar size={16} /> {t("bookingVehicleInfo")}</ModalSectionTitle>
                <ModalValue>
                  {bookingData.selectedVehicle?.brand} {bookingData.selectedVehicle?.model} — {bookingData.selectedVehicle?.licensePlate}
                </ModalValue>
              </ModalSection>

              <ModalDivider />

              <ModalSection>
                <ModalSectionTitle><FaUser size={16} /> {t("bookingContactPhone")}</ModalSectionTitle>
                <ModalValue>{bookingData.phoneNumber}</ModalValue>
              </ModalSection>

              <ModalDivider />

              <ModalSection>
                <ModalSectionTitle><FaFileAlt size={16} /> {t("bookingServiceType")}</ModalSectionTitle>
                <ModalValue>
                  {bookingData.serviceType === "repair" && `🔧 ${t("bookingServiceTypeRepair")}`}
                  {bookingData.serviceType === "maintenance" && `🚗 ${t("bookingServiceTypeMaintenance")}`}
                </ModalValue>
              </ModalSection>

              <ModalDivider />

              <ModalSection>
                <ModalSectionTitle><FaFileAlt size={16} /> {t("bookingIssueSummary")}</ModalSectionTitle>
                <ModalValue>{bookingData.issueTitle}</ModalValue>
                {bookingData.issueDescription && (
                  <ModalSubValue>{bookingData.issueDescription}</ModalSubValue>
                )}
                {bookingData.symptoms.length > 0 && (
                  <ModalChips>
                    {bookingData.symptoms.map((symptomId) => {
                      const s = symptomList.find((item) => item.id === symptomId);
                      return s ? <ModalChip key={s.id}>{s.name}</ModalChip> : null;
                    })}
                  </ModalChips>
                )}
              </ModalSection>

              {bookingData.selectedServices.length > 0 && (
                <>
                  <ModalDivider />
                  <ModalSection>
                    <ModalSectionTitle><FaWrench size={16} /> {t("bookingSelectedServices")}</ModalSectionTitle>
                    {bookingData.selectedServices.map((serviceId) => {
                      const service = availableServices.find((s) => s.id === serviceId);
                      if (!service) return null;
                      return (
                        <ModalServiceRow key={serviceId}>
                          <span>{service.name}</span>
                          <span>{service.price.toLocaleString()}đ</span>
                        </ModalServiceRow>
                      );
                    })}
                    <ModalTotalRow>
                      <strong>{t("bookingTotal")}</strong>
                      <strong>{getTotalPrice().toLocaleString()}đ</strong>
                    </ModalTotalRow>
                  </ModalSection>
                </>
              )}

              <ModalDivider />

              <ModalSection>
                <ModalSectionTitle><FaUser size={16} /> {t("bookingTechnician")}</ModalSectionTitle>
                <ModalValue>
                  {bookingData.selectedTechnician === null
                    ? t("bookingAutoAssignSummary")
                    : technicians.find((t) => t.technicianId === bookingData.selectedTechnician)?.fullName}
                </ModalValue>
              </ModalSection>

              <ModalDivider />

              <ModalSection>
                <ModalSectionTitle><FaCalendarAlt size={16} /> {t("bookingPreferredTimeSummary")}</ModalSectionTitle>
                <ModalValue>
                  {bookingData.preferredDate && bookingData.preferredTime
                    ? `${new Date(bookingData.preferredDate).toLocaleDateString("vi-VN")} - ${bookingData.preferredTime} - ${parseInt(bookingData.preferredTime) + 1}:00`
                    : t("bookingNotSpecified")}
                </ModalValue>
              </ModalSection>
            </ModalBody>

            <ModalFooter>
              <ModalCloseButton onClick={() => { setShowSuccessModal(false); navigate(ROUTER_PAGE.home); }}>
                {t("bookingBackToHome")}
              </ModalCloseButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
      <AddCarModal
        isOpen={showAddCarModal}
        onClose={() => setShowAddCarModal(false)}
        onCarAdded={fetchVehiclesData}
      />
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
  background: #1d4ed8;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: background 0.2s;

  &:hover {
    background: #1e40af;
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

const PhoneSearchWrapper = styled.div`
  position: relative;
`;

const PhoneDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
`;

const PhoneDropdownItem = styled.div`
  padding: 0.625rem 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.15s;

  &:hover {
    background: #eff6ff;
  }

  span {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #111827;
  }
`;

const PhoneDropdownName = styled.span`
  font-size: 0.8125rem !important;
  font-weight: 400 !important;
  color: #6b7280 !important;
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

  &:disabled {
    background: #f3f4f6;
    color: #9ca3af !important;
    -webkit-text-fill-color: #9ca3af !important;
    cursor: not-allowed;
    opacity: 0.7;
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

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 2rem 1rem;
`;

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #dcfce7;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  text-align: center;
`;

const ModalBody = styled.div`
  padding: 1rem 2rem;
`;

const ModalSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const ModalSectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const ModalValue = styled.div`
  font-size: 0.9375rem;
  color: #111827;
  padding-left: 1.5rem;
`;

const ModalSubValue = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  padding-left: 1.5rem;
`;

const ModalChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  padding-left: 1.5rem;
  margin-top: 0.25rem;
`;

const ModalChip = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
`;

const ModalServiceRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0 0.375rem 1.5rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const ModalTotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0 0 1.5rem;
  margin-top: 0.25rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.9375rem;
  color: #1d4ed8;
`;

const ModalDivider = styled.div`
  height: 1px;
  background: #f3f4f6;
  margin: 0.75rem 0;
`;

const ModalFooter = styled.div`
  padding: 1rem 2rem 2rem;
  display: flex;
  justify-content: center;
`;

const ModalCloseButton = styled.button`
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  background: #1d4ed8;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;

  &:hover {
    background: #1e40af;
  }
`;

const EmptyStateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem;
`;

const AddCarButton = styled.button`
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

// === Slot Scheduling Components ===

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const SlotButton = styled.button<{ $selected: boolean; $disabled: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.85rem 0.75rem;
  border-radius: 10px;
  border: 2px solid ${({ $selected, $disabled }) =>
    $disabled ? '#e5e7eb' : $selected ? '#1d4ed8' : '#d1d5db'};
  background: ${({ $selected, $disabled }) =>
    $disabled ? '#f9fafb' : $selected ? '#eff6ff' : 'white'};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: all 0.2s;

  &:hover {
    ${({ $disabled, $selected }) =>
      !$disabled &&
      !$selected &&
      `
        border-color: #93c5fd;
        background: #f0f7ff;
      `}
  }
`;

const SlotTime = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
`;

const SlotStatus = styled.span<{ $available: boolean }>`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ $available }) => ($available ? '#059669' : '#dc2626')};
`;
