import { ROUTER_PAGE } from "@/routes/contants";
import {
  IconCalendar,
  IconClock,
  IconInfoCircle,
  IconMail,
  IconMapPin,
  IconPhone,
  IconSend,
  IconTool,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";

const ContactPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    requestType: "",
    subject: "",
    content: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with API
    console.log("Contact form submitted:", formData);
  };

  const handleBookOnline = () => {
    navigate(ROUTER_PAGE.home);
    setTimeout(() => {
      document
        .getElementById("services")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <PageWrapper>
      {/* Hero Section */}
      <SectionBlock $variant="white">
        <HeroSection>
          <HeroTitle>
            {t("contactHeroTitle")}{" "}
            <Highlight>{t("contactHeroTitleHighlight")}</Highlight>
          </HeroTitle>
          <HeroSubtitle>{t("contactHeroSubtitle")}</HeroSubtitle>
          <HeroButtons>
            <PrimaryButton href="tel:19001234">
              <IconPhone size={20} stroke={2} />
              {t("callNow")}
            </PrimaryButton>
            <SecondaryButton onClick={handleBookOnline}>
              <IconCalendar size={20} stroke={2} />
              {t("bookOnline")}
            </SecondaryButton>
          </HeroButtons>
        </HeroSection>
      </SectionBlock>

      {/* Contact Info Grid */}
      <SectionBlock $variant="light">
        <ContactInfoGrid>
          <InfoCard>
            <CardHeader>
              <IconWrapper>
                <IconMapPin size={28} stroke={2} color="#007bff" />
              </IconWrapper>
              <CardTitle>{t("address")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t("branch1Address")}</p>
              <p>{t("branch2Address")}</p>
              <p>{t("branch3Address")}</p>
            </CardContent>
          </InfoCard>
          <InfoCard>
            <CardHeader>
              <IconWrapper>
                <IconPhone size={28} stroke={2} color="#007bff" />
              </IconWrapper>
              <CardTitle>{t("phone")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t("hotline247")}</p>
              <p>{t("consultationPhone")}</p>
            </CardContent>
          </InfoCard>
          <InfoCard>
            <CardHeader>
              <IconWrapper>
                <IconMail size={28} stroke={2} color="#007bff" />
              </IconWrapper>
              <CardTitle>{t("email")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>info@autocarepro.vn</p>
              <p>support@autocarepro.vn</p>
              <p>booking@autocarepro.vn</p>
            </CardContent>
          </InfoCard>
          <InfoCard>
            <CardHeader>
              <IconWrapper>
                <IconClock size={28} stroke={2} color="#007bff" />
              </IconWrapper>
              <CardTitle>{t("workingHours")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t("workingHoursMonFri")}</p>
              <p>{t("workingHoursSat")}</p>
              <p>{t("workingHoursSun")}</p>
            </CardContent>
          </InfoCard>
        </ContactInfoGrid>
      </SectionBlock>

      {/* Main Content: Form + Map */}
      <SectionBlock $variant="white">
        <MainContentSection>
          <FormColumn>
            <FormTitle>{t("sendMessageTitle")}</FormTitle>
            <FormSubtitle>{t("sendMessageSubtitle")}</FormSubtitle>
            <ContactForm onSubmit={handleSubmit}>
              <FormGroup>
                <Label>
                  {t("fullName")} <Required>*</Required>
                </Label>
                <Input
                  type="text"
                  name="fullName"
                  placeholder={t("fullNamePlaceholder")}
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>
                  {t("phoneNumber")} <Required>*</Required>
                </Label>
                <Input
                  type="tel"
                  name="phone"
                  placeholder={t("phoneNumberPlaceholder")}
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>
                  {t("email")} <Required>*</Required>
                </Label>
                <Input
                  type="email"
                  name="email"
                  placeholder={t("emailPlaceholder")}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>
                  {t("requestType")} <Required>*</Required>
                </Label>
                <Select
                  name="requestType"
                  value={formData.requestType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t("requestTypePlaceholder")}</option>
                  <option value="consultation">Tư vấn / Consultation</option>
                  <option value="booking">Đặt lịch / Booking</option>
                  <option value="complaint">Khiếu nại / Complaint</option>
                  <option value="other">Khác / Other</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>
                  {t("subject")} <Required>*</Required>
                </Label>
                <Input
                  type="text"
                  name="subject"
                  placeholder={t("subjectPlaceholder")}
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>
                  {t("content")} <Required>*</Required>
                </Label>
                <Textarea
                  name="content"
                  placeholder={t("contentPlaceholder")}
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={5}
                  required
                />
              </FormGroup>
              <SubmitButton type="submit">
                <IconSend size={20} stroke={2} />
                {t("sendMessage")}
              </SubmitButton>
            </ContactForm>
          </FormColumn>

          <SideColumn>
            <MapCard>
              <CardHeader>
                <IconMapPin size={32} stroke={2} color="#007bff" />
                <MapTitle>{t("locationMap")}</MapTitle>
              </CardHeader>

              <MapAddress>{t("addressQ7Short")}</MapAddress>
            </MapCard>
            <EmergencyCard>
              <CardHeader>
                <IconInfoCircle size={28} stroke={2} color="white" />
                <EmergencyTitle>{t("needUrgentSupport")}</EmergencyTitle>
              </CardHeader>

              <EmergencySubtitle>{t("callHotline247")}</EmergencySubtitle>
              <EmergencyButton href="tel:0901234567">
                <IconPhone size={18} stroke={2} />
                0901 234 567
              </EmergencyButton>
            </EmergencyCard>
            <SocialCard>
              <SocialTitle>{t("connectWithUs")}</SocialTitle>
              <SocialIcons>
                <SocialIcon href="#" aria-label="Facebook">
                  <FaFacebookF size={20} />
                </SocialIcon>
                <SocialIcon href="#" aria-label="Instagram">
                  <FaInstagram size={20} />
                </SocialIcon>
                <SocialIcon href="#" aria-label="YouTube">
                  <FaYoutube size={20} />
                </SocialIcon>
                <SocialIcon href="#" aria-label="Twitter">
                  <FaTwitter size={20} />
                </SocialIcon>
                <SocialIcon href="#" aria-label="LinkedIn">
                  <FaLinkedinIn size={20} />
                </SocialIcon>
              </SocialIcons>
            </SocialCard>
          </SideColumn>
        </MainContentSection>
      </SectionBlock>

      {/* Branch System */}
      <SectionBlock $variant="light">
        <BranchSection>
          <SectionTitle>{t("branchSystem")}</SectionTitle>
          <SectionSubtitle>{t("branchSystemSubtitle")}</SectionSubtitle>
          <BranchGrid>
            <BranchCard>
              <BranchHeader>
                <BranchName>{t("branchQ7")}</BranchName>
                <ViewDetailsLink>{t("viewDetails")}</ViewDetailsLink>
              </BranchHeader>
              <BranchInfo>
                <InfoRow>
                  <IconMapPin size={18} stroke={2} color="#007bff" />
                  <span>{t("addressQ7Full")}</span>
                </InfoRow>
                <InfoRow>
                  <IconPhone size={18} stroke={2} color="#007bff" />
                  <span>{t("phoneQ7")}</span>
                </InfoRow>
              </BranchInfo>
              <TagGroup>
                <Tag>{t("maintenance")}</Tag>
                <Tag>{t("repair")}</Tag>
                <Tag>{t("paintBodywork")}</Tag>
              </TagGroup>
              <BookButton onClick={handleBookOnline}>
                <IconCalendar size={18} stroke={2} />
                {t("bookHere")}
              </BookButton>
            </BranchCard>

            <BranchCard>
              <BranchHeader>
                <BranchName>{t("branchThuDuc")}</BranchName>
                <ViewDetailsLink>{t("viewDetails")}</ViewDetailsLink>
              </BranchHeader>
              <BranchInfo>
                <InfoRow>
                  <IconMapPin size={18} stroke={2} color="#007bff" />
                  <span>{t("addressThuDucFull")}</span>
                </InfoRow>
                <InfoRow>
                  <IconPhone size={18} stroke={2} color="#007bff" />
                  <span>{t("phoneThuDuc")}</span>
                </InfoRow>
              </BranchInfo>
              <TagGroup>
                <Tag>{t("maintenance")}</Tag>
                <Tag>{t("repair")}</Tag>
                <Tag>{t("electricalElectronics")}</Tag>
              </TagGroup>
              <BookButton onClick={handleBookOnline}>
                <IconCalendar size={18} stroke={2} />
                {t("bookHere")}
              </BookButton>
            </BranchCard>

            <BranchCard>
              <BranchHeader>
                <BranchName>{t("branchQ2")}</BranchName>
                <ViewDetailsLink>{t("viewDetails")}</ViewDetailsLink>
              </BranchHeader>
              <BranchInfo>
                <InfoRow>
                  <IconMapPin size={18} stroke={2} color="#007bff" />
                  <span>{t("addressQ2Full")}</span>
                </InfoRow>
                <InfoRow>
                  <IconPhone size={18} stroke={2} color="#007bff" />
                  <span>{t("phoneQ2")}</span>
                </InfoRow>
              </BranchInfo>
              <TagGroup>
                <Tag>{t("maintenance")}</Tag>
                <Tag>{t("tireInstallation")}</Tag>
                <Tag>{t("premiumCarWash")}</Tag>
              </TagGroup>
              <BookButton onClick={handleBookOnline}>
                <IconCalendar size={18} stroke={2} />
                {t("bookHere")}
              </BookButton>
            </BranchCard>
          </BranchGrid>
        </BranchSection>
      </SectionBlock>

      {/* FAQ Section */}
      <SectionBlock $variant="white">
        <FaqSection>
          <FaqIconWrapper>
            <IconTool size={40} stroke={2} color="#007bff" />
          </FaqIconWrapper>
          <SectionTitle>{t("faqTitle")}</SectionTitle>
          <SectionSubtitle>{t("faqSubtitle")}</SectionSubtitle>
          <FaqButtons>
            <PrimaryButton
              as="button"
              type="button"
              onClick={() => navigate(ROUTER_PAGE.services)}
            >
              {t("viewFaq")}
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate(ROUTER_PAGE.services)}>
              {t("viewServices")}
            </SecondaryButton>
          </FaqButtons>
        </FaqSection>
      </SectionBlock>
    </PageWrapper>
  );
};

export default ContactPage;

// Styled Components
const PageWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #ffffff;
`;

const SectionBlock = styled.section<{ $variant: "white" | "light" }>`
  background: ${({ $variant }) =>
    $variant === "white" ? "#ffffff" : "#f8f9fa"};
  padding: 2.5rem 0;
  border-top: 1px solid #e9ecef;

  &:first-child {
    border-top: none;
  }

  @media (max-width: 768px) {
    padding: 1.5rem 0;
  }
`;

const HeroSection = styled.section`
  padding: 3rem 2rem 2.5rem;
  text-align: center;
  max-width: 900px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 1rem;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const Highlight = styled.span`
  color: #007bff;
`;

const HeroSubtitle = styled.p`
  font-size: 1rem;
  color: #6c757d;
  margin: 0 0 1.5rem;
  line-height: 1.6;
`;

const HeroButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, transform 0.15s;

  &:hover {
    background: #0069d9;
    transform: translateY(-1px);
    color: white;
  }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: #333;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #007bff;
    color: #007bff;
  }
`;

const ContactInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }
`;

const InfoCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  white-space: nowrap;
`;

const CardContent = styled.div`
  flex: 1;
  min-width: 0;
  overflow-x: auto;

  p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    color: #6c757d;
    line-height: 1.5;
    white-space: nowrap;
  }
`;

const MainContentSection = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }
`;

const FormColumn = styled.div`
  background: white;
`;

const FormTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem;
`;

const FormSubtitle = styled.p`
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0 0 1.5rem;
`;

const ContactForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
`;

const Required = styled.span`
  color: #dc3545;
`;

const Input = styled.input`
  padding: 0.6rem 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;

  &::placeholder {
    color: #adb5bd;
  }

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const Select = styled.select`
  padding: 0.6rem 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  color: #6c757d;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const Textarea = styled.textarea`
  padding: 0.6rem 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  resize: vertical;
  font-family: inherit;

  &::placeholder {
    color: #adb5bd;
  }

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const SubmitButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s, transform 0.15s;

  &:hover {
    background: #0069d9;
    transform: translateY(-1px);
  }
`;

const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const MapCard = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const MapTitle = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
`;

const MapAddress = styled.span`
  font-size: 0.9rem;
  color: #6c757d;
`;

const EmergencyCard = styled.div`
  background: #007bff;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
`;

const EmergencyTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin: 0;
`;

const EmergencySubtitle = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
`;

const EmergencyButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: #007bff;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  width: fit-content;
  transition: transform 0.15s;

  &:hover {
    transform: translateY(-1px);
    color: #007bff;
  }
`;

const SocialCard = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const SocialTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem;
`;

const SocialIcons = styled.div`
  display: flex;
  gap: 1rem;
`;

const SocialIcon = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f8f9fa;
  color: #6c757d;
  transition: all 0.2s;

  &:hover {
    background: #007bff;
    color: white;
  }
`;

const BranchSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem;
  text-align: center;
`;

const SectionSubtitle = styled.p`
  font-size: 0.95rem;
  color: #6c757d;
  margin: 0 0 2rem;
  text-align: center;
`;

const BranchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const BranchCard = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const BranchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const BranchName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const ViewDetailsLink = styled.button`
  background: none;
  border: none;
  color: #007bff;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

const BranchInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.4;

  span {
    flex: 1;
  }
`;

const TagGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.span`
  background: #f8f9fa;
  color: #6c757d;
  font-size: 0.8rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
`;

const BookButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: white;
  color: #333;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #007bff;
    color: #007bff;
  }
`;

const FaqSection = styled.section`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`;

const FaqIconWrapper = styled.div`
  margin-bottom: 1rem;
`;

const FaqButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1rem;
`;
