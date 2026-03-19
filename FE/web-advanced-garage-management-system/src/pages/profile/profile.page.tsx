import useAuth from "@/hooks/useAuth";
import { ROUTER_PAGE } from "@/routes/contants";
import { 
  IconMail, 
  IconPhone, 
  IconMapPin, 
  IconCalendar,
  IconCar,
  IconLock,
  IconLogout
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import AddCarModal from "@/components/modals/AddCarModal";
import EditProfileModal from "@/components/modals/EditProfileModal";
import { carService } from "@/apis/cars";
import type { ICar } from "@/apis/cars/types";

const ProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getUser } = useAuth();
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [cars, setCars] = useState<ICar[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTER_PAGE.home);
    } else if (!user) {
      getUser();
    }
  }, [isAuthenticated, navigate, user, getUser]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCars();
    }
  }, [isAuthenticated]);

  const fetchCars = async () => {
    setLoadingCars(true);
    try {
      const data = await carService.getCars();
      setCars(data);
    } catch (error) {
      console.error("Failed to fetch cars:", error);
    } finally {
      setLoadingCars(false);
    }
  };

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate(ROUTER_PAGE.home);
  };

  const handleAddCarSuccess = () => {
    fetchCars();
    getUser();
  };

  const handleEditProfileSuccess = () => {
    getUser();
  };

  return (
    <Container>

      <Content>
        <ProfileCard>
          <ProfileHeader>
            <AvatarSection>
              <Avatar>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.fullName} />
                ) : (
                  <AvatarPlaceholder>
                    {user.fullName?.charAt(0).toUpperCase() || "N"}
                  </AvatarPlaceholder>
                )}
              </Avatar>
              <UserInfo>
                <FullName>{user.fullName}</FullName>
                <Email>{user.email}</Email>
                <AccountBadge>
                  <StatusDot />
                  {user.accountType || t("")}
                </AccountBadge>
              </UserInfo>
            </AvatarSection>
            <EditButton onClick={() => setShowEditProfileModal(true)}>
              {t("editProfile")}
            </EditButton>
          </ProfileHeader>

          <InfoSection>
            <SectionTitle>{t("securitySettings")}</SectionTitle>
            <InfoGrid>
              <InfoCard>
                <InfoIcon>
                  <IconLock size={20} />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>{t("changePassword")}</InfoLabel>
                  <InfoText>{t("updateYourPassword")}</InfoText>
                </InfoContent>
              </InfoCard>
            </InfoGrid>
          </InfoSection>

          <InfoSection>
            <SectionTitle>{t("contactInfo")}</SectionTitle>
            <InfoGrid>
              <InfoCard>
                <InfoIcon>
                  <IconMail size={20} />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>{t("email")}</InfoLabel>
                  <InfoText>{user.email}</InfoText>
                </InfoContent>
              </InfoCard>
              
              <InfoCard>
                <InfoIcon>
                  <IconPhone size={20} />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>{t("phoneNumber")}</InfoLabel>
                  <InfoText>{user.msisdn || ""}</InfoText>
                </InfoContent>
              </InfoCard>
              
              <InfoCard>
                <InfoIcon>
                  <IconMapPin size={20} />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>{t("address")}</InfoLabel>
                  <InfoText>{user.address || ""}</InfoText>
                </InfoContent>
              </InfoCard>
              
              <InfoCard>
                <InfoIcon>
                  <IconCalendar size={20} />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>{t("joinDate")}</InfoLabel>
                  <InfoText>
                    {user.createdDate ? new Date(user.createdDate).toLocaleDateString('vi-VN') : ""}
                  </InfoText>
                </InfoContent>
              </InfoCard>
            </InfoGrid>
          </InfoSection>

          <VehicleSection>
            <VehicleSectionHeader>
              <div>
                <SectionTitle>{t("yourVehicles")}</SectionTitle>
                <EmptyText>
                  {cars.length > 0
                    ? `${cars.length} ${t("vehicles")}`
                    : t("addVehicleDescription")}
                </EmptyText>
              </div>
              <AddVehicleButton onClick={() => setShowAddCarModal(true)}>
                <IconCar size={20} />
                {t("addYourVehicle")}
              </AddVehicleButton>
            </VehicleSectionHeader>

            {loadingCars ? (
              <EmptyVehicle>
                <EmptyText>{t("loading")}</EmptyText>
              </EmptyVehicle>
            ) : cars.length === 0 ? (
              <EmptyVehicle>
                <IconCar size={64} stroke={1} />
                <EmptyTitle>{t("noVehicles")}</EmptyTitle>
                <EmptyText>{t("addVehicleDescription")}</EmptyText>
                <AddVehicleButtonSecondary
                  onClick={() => setShowAddCarModal(true)}
                >
                  {t("addYourVehicle")}
                </AddVehicleButtonSecondary>
              </EmptyVehicle>
            ) : (
              <VehicleGrid>
                {cars.map((car) => (
                  <VehicleCard key={car.carID}>
                    <VehicleCardHeader>
                      <VehicleLicensePlate>{car.licensePlate}</VehicleLicensePlate>
                      <VehicleBrand>
                        {car.brand} {car.model}
                      </VehicleBrand>
                    </VehicleCardHeader>
                    <VehicleCardBody>
                      <VehicleInfo>
                        <VehicleInfoLabel>{t("year")}:</VehicleInfoLabel>
                        <VehicleInfoValue>{car.year}</VehicleInfoValue>
                      </VehicleInfo>
                      <VehicleInfo>
                        <VehicleInfoLabel>{t("color")}:</VehicleInfoLabel>
                        <VehicleInfoValue>{car.color || "N/A"}</VehicleInfoValue>
                      </VehicleInfo>
                      <VehicleInfo>
                        <VehicleInfoLabel>{t("currentOdometer")}:</VehicleInfoLabel>
                        <VehicleInfoValue>
                          {car.currentOdometer.toLocaleString()} km
                        </VehicleInfoValue>
                      </VehicleInfo>
                    </VehicleCardBody>
                  </VehicleCard>
                ))}
              </VehicleGrid>
            )}
          </VehicleSection>

          <StatsSection>
            <SectionTitle>{t("serviceStats")}</SectionTitle>
            <StatsGrid>
              <StatCard>
                <StatLabel>{t("totalRepairs")}</StatLabel>
                <StatValue>12</StatValue>
              </StatCard>
              
              <StatCard>
                <StatLabel>{t("totalSpending")}</StatLabel>
                <StatValue>45.5M</StatValue>
              </StatCard>
              
              <StatCard>
                <StatLabel>{t("averageRating")}</StatLabel>
                <StatValue>
                  4.8 <StarIcon>⭐</StarIcon>
                </StatValue>
              </StatCard>
              
              <StatCard>
                <StatLabel>{t("favoriteTechnicians")}</StatLabel>
                <StatValue>3</StatValue>
              </StatCard>
            </StatsGrid>
          </StatsSection>

          <ActionSection>
            <ActionButton onClick={handleLogout}>
              <IconLogout size={20} />
              {t("logout")}
            </ActionButton>
          </ActionSection>
        </ProfileCard>
      </Content>

      {showAddCarModal && (
        <AddCarModal
          onClose={() => setShowAddCarModal(false)}
          onSuccess={handleAddCarSuccess}
        />
      )}

      {showEditProfileModal && (
        <EditProfileModal
          onClose={() => setShowEditProfileModal(false)}
          onSuccess={handleEditProfileSuccess}
        />
      )}
    </Container>
  );
};

export default ProfilePage;

const Container = styled.div`
  min-height: 100vh;
  background: #f5f7fa;
`;

const Content = styled.main`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
`;

const ProfileCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const ProfileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid #f0f0f0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-start;
  }
`;

const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e9ecef;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarPlaceholder = styled.div`
  font-size: 2rem;
  font-weight: 600;
  color: #007bff;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FullName = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0;
`;

const Email = styled.p`
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
`;

const AccountBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #e7f3ff;
  color: #007bff;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  width: fit-content;
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #28a745;
`;

const EditButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #0069d9;
  }
`;

const InfoSection = styled.div`
  padding: 2rem;
  border-bottom: 1px solid #f0f0f0;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1.5rem 0;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const InfoCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const InfoIcon = styled.div`
  color: #007bff;
  flex-shrink: 0;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const InfoText = styled.div`
  font-size: 0.95rem;
  color: #333;
  font-weight: 500;
`;

const VehicleSection = styled.div`
  padding: 2rem;
  border-bottom: 1px solid #f0f0f0;
`;

const VehicleSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const AddVehicleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #0069d9;
  }
`;

const EmptyVehicle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
  color: #9ca3af;
`;

const EmptyTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #6b7280;
  margin: 1rem 0 0.5rem 0;
`;

const EmptyText = styled.p`
  font-size: 0.9rem;
  color: #9ca3af;
  margin: 0 0 1.5rem 0;
  text-align: center;
`;

const AddVehicleButtonSecondary = styled.button`
  background: white;
  color: #007bff;
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #007bff;
    color: white;
  }
`;

const StatsSection = styled.div`
  padding: 2rem;
  border-bottom: 1px solid #f0f0f0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const StarIcon = styled.span`
  font-size: 1.25rem;
`;

const ActionSection = styled.div`
  padding: 2rem;
  display: flex;
  justify-content: center;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  color: #dc3545;
  border: 2px solid #dc3545;
  border-radius: 8px;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #dc3545;
    color: white;
  }
`;

const VehicleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const VehicleCard = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #e9ecef;
  transition: all 0.2s;

  &:hover {
    border-color: #007bff;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
  }
`;

const VehicleCardHeader = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
`;

const VehicleLicensePlate = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 0.25rem;
`;

const VehicleBrand = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
`;

const VehicleCardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const VehicleInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VehicleInfoLabel = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

const VehicleInfoValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;
