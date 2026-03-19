import { useTranslation } from "react-i18next";
import styled from "styled-components";

interface TestimonialItem {
  id: number;
  rating: number;
  textKey: string;
  nameKey: string;
  roleKey: string;
  authorAvatar: string;
  avatarBgColor: string;
}

const testimonialItems: TestimonialItem[] = [
  {
    id: 1,
    rating: 5,
    textKey: "homeTestimonial1Text",
    nameKey: "homeTestimonial1Name",
    roleKey: "homeTestimonial1Role",
    authorAvatar: "A",
    avatarBgColor: "#3b82f6",
  },
  {
    id: 2,
    rating: 5,
    textKey: "homeTestimonial2Text",
    nameKey: "homeTestimonial2Name",
    roleKey: "homeTestimonial2Role",
    authorAvatar: "L",
    avatarBgColor: "#10b981",
  },
  {
    id: 3,
    rating: 5,
    textKey: "homeTestimonial3Text",
    nameKey: "homeTestimonial3Name",
    roleKey: "homeTestimonial3Role",
    authorAvatar: "T",
    avatarBgColor: "#8b5cf6",
  },
];

const TestimonialsContainer = () => {
  const { t } = useTranslation();

  return (
    <Container>
      <SectionHeader>
        <SectionTitle>{t("homeTestimonialsTitle")}</SectionTitle>
      </SectionHeader>

      <TestimonialsGrid>
        {testimonialItems.map((item) => (
          <TestimonialCard key={item.id}>
            <StarRating>
              {[...Array(item.rating)].map((_, i) => (
                <svg key={i} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </StarRating>
            <TestimonialText>{t(item.textKey)}</TestimonialText>
            <TestimonialAuthor>
              <AuthorAvatar $bgColor={item.avatarBgColor}>
                {item.authorAvatar}
              </AuthorAvatar>
              <AuthorInfo>
                <AuthorName>{t(item.nameKey)}</AuthorName>
                <AuthorRole>{t(item.roleKey)}</AuthorRole>
              </AuthorInfo>
            </TestimonialAuthor>
          </TestimonialCard>
        ))}
      </TestimonialsGrid>
    </Container>
  );
};

export default TestimonialsContainer;

const Container = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  width: 100%;
`;

const TestimonialsGrid = styled.div`
  display: grid;
  gap: 2rem;
  width: 100%;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const TestimonialCard = styled.div`
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  min-width: 0;
`;

const StarRating = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;

  svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: #fbbf24;
  }
`;

const TestimonialText = styled.p`
  color: #6b7280;
  margin-bottom: 1rem;
`;

const TestimonialAuthor = styled.div`
  display: flex;
  align-items: center;
`;

const AuthorAvatar = styled.div<{ $bgColor: string }>`
  width: 2.5rem;
  height: 2.5rem;
  background-color: ${(props) => props.$bgColor};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  margin-right: 0.75rem;
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.p`
  font-weight: 600;
  color: #6b7280;
`;

const AuthorRole = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 1rem;
`;
