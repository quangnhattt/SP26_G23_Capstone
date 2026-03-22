import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { AuthContext } from "@/context/AuthContext";
import { ROUTER_PAGE } from "@/routes/contants";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  FaCar,
  FaFileAlt,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaUser,
  FaExclamationCircle,
  FaPhoneAlt,
  FaCrosshairs,
  FaCamera,
  FaImages,
  FaTrash,
} from "react-icons/fa";
import type { ICar } from "@/apis/cars/types";
import { getCars } from "@/apis/cars";
import { getUsers, type IUser } from "@/services/admin/userService";
import { createRescueRequest } from "@/apis/rescue";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import RescueSuccessModal from "./RescueSuccessModal";

type RescueStep = 1 | 2 | 3;

interface RescueData {
  selectedVehicle: ICar | null;
  phoneNumber: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  problemDescription: string;
  imageEvidence: string;
}

const RescuePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState<RescueStep>(1);
  const [userVehicles, setUserVehicles] = useState<ICar[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const isCustomer = user?.roleID === 4;

  const [rescueData, setRescueData] = useState<RescueData>({
    selectedVehicle: null,
    phoneNumber: user?.msisdn || "",
    address: "",
    latitude: null,
    longitude: null,
    problemDescription: "",
    imageEvidence: "",
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

    const fetchUsers = async () => {
      try {
        const users = await getUsers();
        setAllUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchVehicles();
    if (!isCustomer) {
      fetchUsers();
    }

    // Auto-detect GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setRescueData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
      );
    }
  }, [user, navigate, isCustomer]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!rescueData.selectedVehicle) {
        toast.warn(t("rescueAlertSelectVehicle"));
        return;
      }
      if (!rescueData.phoneNumber || rescueData.phoneNumber.trim() === "") {
        toast.warn(t("rescueAlertEnterPhone"));
        return;
      }
      if (!rescueData.address || rescueData.address.trim() === "") {
        toast.warn(t("rescueAlertEnterAddress"));
        return;
      }
    }
    if (
      currentStep === 2 &&
      !rescueData.problemDescription.trim()
    ) {
      toast.warn(t("rescueAlertFillIssue"));
      return;
    }
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as RescueStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as RescueStep);
    } else {
      navigate(-1);
    }
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    const reader = new FileReader();
    reader.onloadend = () => {
      setRescueData((prev) => ({
        ...prev,
        imageEvidence: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setRescueData((prev) => ({ ...prev, imageEvidence: "" }));
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const pos = await getCurrentPosition();
      setRescueData((prev) => ({
        ...prev,
        latitude: pos.lat,
        longitude: pos.lng,
      }));

      // Reverse geocode to get address
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json&accept-language=vi`,
        );
        const data = await res.json();
        if (data.display_name) {
          setRescueData((prev) => ({
            ...prev,
            address: data.display_name,
          }));
        }
      } catch {
        // Reverse geocode failed, just keep lat/lng
      }

      toast.success(t("rescueLocationSuccess"));
    } catch {
      toast.warn(t("rescueAlertNoLocation"));
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const getCurrentPosition = (): Promise<{ lat: number; lng: number }> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });

  const handleSubmit = async () => {
    if (!rescueData.selectedVehicle) return;

    setIsSubmitting(true);

    // If GPS not yet available, try fetching one more time
    let lat = rescueData.latitude;
    let lng = rescueData.longitude;
    if (lat === null || lng === null) {
      try {
        const pos = await getCurrentPosition();
        lat = pos.lat;
        lng = pos.lng;
        setRescueData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      } catch {
        setIsSubmitting(false);
        toast.warn(t("rescueAlertNoLocation"));
        return;
      }
    }

    try {
      await createRescueRequest({
        carId: rescueData.selectedVehicle.carId,
        phone: rescueData.phoneNumber,
        latitude: lat,
        longitude: lng,
        currentAddress: rescueData.address,
        problemDescription: rescueData.problemDescription,
        imageEvidence: rescueData.imageEvidence || null,
      });
      toast.success(t("rescueAlertSuccess"));
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error creating rescue request:", error);
      toast.error(getApiErrorMessage(error, t("rescueAlertError")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers =
    phoneSearch.trim().length >= 2
      ? allUsers.filter((u) => u.phone.includes(phoneSearch.trim()))
      : [];

  const handleSelectUser = (selectedUser: IUser) => {
    setRescueData((prev) => ({ ...prev, phoneNumber: selectedUser.phone }));
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
            <HeaderTitle>{t("rescueHeaderTitle")}</HeaderTitle>
            <HeaderSubtitle>{t("rescueHeaderSubtitle")}</HeaderSubtitle>
          </HeaderContent>
          <EmergencyBadge>
            <FaPhoneAlt size={14} />
            {t("rescueBadge")}
          </EmergencyBadge>
        </Header>

        <StepIndicator>
          <Step $active={currentStep >= 1} $completed={currentStep > 1}>
            <StepNumber $active={currentStep >= 1} $completed={currentStep > 1}>
              {currentStep > 1 ? <FaCheck size={16} /> : "1"}
            </StepNumber>
            <StepLabel $active={currentStep === 1}>
              <StepTitle>{t("rescueStep1Title")}</StepTitle>
              <StepDescription>{t("rescueStep1Desc")}</StepDescription>
            </StepLabel>
          </Step>

          <StepLine $active={currentStep >= 2} />

          <Step $active={currentStep >= 2} $completed={currentStep > 2}>
            <StepNumber $active={currentStep >= 2} $completed={currentStep > 2}>
              {currentStep > 2 ? <FaCheck size={16} /> : "2"}
            </StepNumber>
            <StepLabel $active={currentStep === 2}>
              <StepTitle>{t("rescueStep2Title")}</StepTitle>
              <StepDescription>{t("rescueStep2Desc")}</StepDescription>
            </StepLabel>
          </Step>

          <StepLine $active={currentStep >= 3} />

          <Step $active={currentStep >= 3} $completed={false}>
            <StepNumber $active={currentStep >= 3} $completed={false}>
              3
            </StepNumber>
            <StepLabel $active={currentStep === 3}>
              <StepTitle>{t("rescueStep3Title")}</StepTitle>
              <StepDescription>{t("rescueStep3Desc")}</StepDescription>
            </StepLabel>
          </Step>
        </StepIndicator>

        <ContentSection>
          {currentStep === 1 && (
            <StepContent>
              <FormGroup style={{ marginTop: "1.5rem" }}>
                <Label>
                  {t("rescueContactPhone")} <Required>*</Required>
                </Label>
                {isCustomer ? (
                  <Input type="tel" value={rescueData.phoneNumber} disabled />
                ) : (
                  <PhoneSearchWrapper>
                    <Input
                      type="tel"
                      placeholder={t("bookingPhonePlaceholder")}
                      value={phoneSearch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPhoneSearch(val);
                        setRescueData((prev) => ({
                          ...prev,
                          phoneNumber: val,
                        }));
                        setShowPhoneDropdown(val.trim().length >= 2);
                      }}
                      onFocus={() => {
                        if (phoneSearch.trim().length >= 2)
                          setShowPhoneDropdown(true);
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

              <FormGroup>
                <Label>
                  <FaMapMarkerAlt
                    style={{ color: "#dc2626", marginRight: "0.5rem" }}
                  />
                  {t("rescueAddressLabel")} <Required>*</Required>
                </Label>
                <AddressRow>
                  <Textarea
                    placeholder={t("rescueAddressPlaceholder")}
                    rows={3}
                    value={rescueData.address}
                    onChange={(e) =>
                      setRescueData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                  <GetLocationButton
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLoadingLocation}
                  >
                    <FaCrosshairs size={16} />
                    {isLoadingLocation
                      ? t("rescueLocationLoading")
                      : t("rescueGetLocation")}
                  </GetLocationButton>
                </AddressRow>
              </FormGroup>

              <SectionTitle>{t("rescueSelectVehicle")}</SectionTitle>
              {isLoadingVehicles ? (
                <LoadingMessage>{t("rescueLoadingVehicles")}</LoadingMessage>
              ) : userVehicles.length === 0 ? (
                <EmptyMessage>{t("rescueNoVehicles")}</EmptyMessage>
              ) : (
                <VehicleGrid>
                  {userVehicles.map((vehicle) => {
                    const isSelected =
                      rescueData.selectedVehicle != null &&
                      rescueData.selectedVehicle.licensePlate ===
                        vehicle.licensePlate;

                    return (
                      <VehicleCard
                        key={vehicle.licensePlate}
                        $selected={isSelected}
                        onClick={() => {
                          setRescueData((prev) => ({
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
                          <VehicleOdometer>
                            {vehicle.currentOdometer.toLocaleString()} km
                          </VehicleOdometer>
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
              <SectionTitle>{t("rescueDescribeIssue")}</SectionTitle>

              <FormGroup>
                <Label>
                  {t("rescueProblemDescLabel")} <Required>*</Required>
                </Label>
                <Textarea
                  placeholder={t("rescueProblemDescPlaceholder")}
                  rows={5}
                  value={rescueData.problemDescription}
                  onChange={(e) =>
                    setRescueData((prev) => ({
                      ...prev,
                      problemDescription: e.target.value,
                    }))
                  }
                />
              </FormGroup>

              <FormGroup>
                <Label>{t("rescueImageEvidenceLabel")}</Label>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                />
                {imagePreview ? (
                  <ImagePreviewWrapper>
                    <ImagePreview src={imagePreview} alt="Evidence" />
                    <RemoveImageButton type="button" onClick={handleRemoveImage}>
                      <FaTrash size={14} />
                      {t("rescueImageRemove")}
                    </RemoveImageButton>
                  </ImagePreviewWrapper>
                ) : (
                  <ImagePickerRow>
                    <ImagePickerButton
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <FaCamera size={20} />
                      {t("rescueImageCamera")}
                    </ImagePickerButton>
                    <ImagePickerButton
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      <FaImages size={20} />
                      {t("rescueImageGallery")}
                    </ImagePickerButton>
                  </ImagePickerRow>
                )}
              </FormGroup>
            </StepContent>
          )}

          {currentStep === 3 && (
            <StepContent>
              <SectionTitle>{t("rescueConfirmTitle")}</SectionTitle>

              <ConfirmationCard>
                <CardSection>
                  <CardSectionTitle>
                    <FaCar size={20} />
                    {t("rescueVehicleInfo")}
                  </CardSectionTitle>
                  {rescueData.selectedVehicle && (
                    <InfoItem>
                      <InfoLabel>
                        {rescueData.selectedVehicle.brand}{" "}
                        {rescueData.selectedVehicle.model}
                      </InfoLabel>
                      <InfoValue>
                        {rescueData.selectedVehicle.licensePlate} -{" "}
                        {rescueData.selectedVehicle.year}
                      </InfoValue>
                    </InfoItem>
                  )}
                </CardSection>

                <Divider />

                <CardSection>
                  <CardSectionTitle>
                    <FaUser size={20} />
                    {t("rescueContactPhone")}
                  </CardSectionTitle>
                  <InfoItem>
                    <InfoValue>{rescueData.phoneNumber}</InfoValue>
                  </InfoItem>
                </CardSection>

                <Divider />

                <CardSection>
                  <CardSectionTitle>
                    <FaMapMarkerAlt size={20} />
                    {t("rescueAddress")}
                  </CardSectionTitle>
                  <InfoItem>
                    <InfoValue>{rescueData.address}</InfoValue>
                  </InfoItem>
                </CardSection>

                <Divider />

                <CardSection>
                  <CardSectionTitle>
                    <FaFileAlt size={20} />
                    {t("rescueIssueSummary")}
                  </CardSectionTitle>
                  <InfoItem>
                    <InfoValue>{rescueData.problemDescription}</InfoValue>
                  </InfoItem>
                  {imagePreview && (
                    <InfoItem>
                      <InfoLabel>{t("rescueImageEvidenceLabel")}</InfoLabel>
                      <ConfirmImagePreview src={imagePreview} alt="Evidence" />
                    </InfoItem>
                  )}
                </CardSection>

                <NoteCard>
                  <FaExclamationCircle size={20} color="#dc2626" />
                  <NoteText $emergency>{t("rescueNote")}</NoteText>
                </NoteCard>
              </ConfirmationCard>
            </StepContent>
          )}
        </ContentSection>

        <Footer>
          <BackButtonFooter onClick={handleBack}>
            <FaChevronLeft size={18} />
            {t("rescueBack")}
          </BackButtonFooter>
          {currentStep < 3 ? (
            <NextButton onClick={handleNext}>
              {t("rescueNext")}
              <FaChevronRight size={18} />
            </NextButton>
          ) : (
            <SubmitButton $emergency onClick={handleSubmit} disabled={isSubmitting}>
              <FaPhoneAlt size={18} />
              {isSubmitting ? t("rescueSubmitting") : t("rescueSubmit")}
            </SubmitButton>
          )}
        </Footer>
      </Container>
      {showSuccessModal && (
        <RescueSuccessModal
          vehicle={rescueData.selectedVehicle}
          phoneNumber={rescueData.phoneNumber}
          address={rescueData.address}
          problemDescription={rescueData.problemDescription}
          imagePreview={imagePreview}
          onClose={() => {
            setShowSuccessModal(false);
            navigate(ROUTER_PAGE.home);
          }}
        />
      )}
    </PageWrapper>
  );
};

export default RescuePage;

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
  background: #dc2626;
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
    background: #b91c1c;
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

const EmergencyBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
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
    $completed ? "#dc2626" : $active ? "#dc2626" : "#e5e7eb"};
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
  background: ${({ $active }) => ($active ? "#dc2626" : "#e5e7eb")};
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
  border: 2px solid ${({ $selected }) => ($selected ? "#dc2626" : "#e5e7eb")};
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${({ $selected }) => ($selected ? "#fef2f2" : "white")};
  position: relative;

  &:hover {
    border-color: ${({ $selected }) => ($selected ? "#dc2626" : "#cbd5e1")};
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
  background: #dc2626;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
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
  display: flex;
  align-items: center;
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
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
    -webkit-text-fill-color: #9ca3af;
  }

  &:disabled {
    background: #f3f4f6;
    color: #9ca3af !important;
    -webkit-text-fill-color: #9ca3af !important;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const AddressRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    
    & > * {
      width: 100%;
    }
  }
`;

const GetLocationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
  min-height: 42px;
  flex-shrink: 0;

  &:hover {
    background: #b91c1c;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const LocationInfo = styled.div`
  font-size: 0.75rem;
  color: #16a34a;
  margin-top: 0.375rem;
  font-family: monospace;
`;

const ImagePickerRow = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ImagePickerButton = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #dc2626;
    color: #dc2626;
    background: #fef2f2;
  }
`;

const ImagePreviewWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const ImagePreview = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  object-fit: cover;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(185, 28, 28, 0.95);
  }
`;

const ConfirmImagePreview = styled.img`
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  object-fit: cover;
`;

const PhoneSearchWrapper = styled.div`
  position: relative;
  width: 100%;
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
    background: #fef2f2;
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
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
    -webkit-text-fill-color: #9ca3af;
  }
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

const NoteCard = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-top: 1rem;
`;

const NoteText = styled.p<{ $emergency?: boolean }>`
  font-size: 0.875rem;
  color: ${({ $emergency }) => ($emergency ? "#991b1b" : "#1e40af")};
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
  background: #dc2626;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #b91c1c;
  }
`;

const SubmitButton = styled.button<{ $emergency?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #b91c1c;
  }
`;

