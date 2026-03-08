import styled from "styled-components";

const PricingContainer = () => {
  return (
    <Container>
      <SectionHeader>
        <SectionTitle>Dịch vụ sửa chữa & bảo dưỡng</SectionTitle>
        <SectionDescription>
          Lựa chọn gói dịch vụ phù hợp với nhu cầu của bạn
        </SectionDescription>
      </SectionHeader>

      <PricingGrid>
        <PricingCard $featured>
          <PricingCardContent>
            <PricingTitle>Bảo dưỡng định kỳ</PricingTitle>
            <PricingPrice $color="#2563eb">Từ 500,000đ</PricingPrice>
            <PricingSubtitle>Gói cơ bản</PricingSubtitle>
            <PricingFeatures>
              <li>• Thay dầu máy</li>
              <li>• Kiểm tra hệ thống</li>
              <li>• Vệ sinh xe</li>
            </PricingFeatures>
            <PricingButton $primary>Chọn gói</PricingButton>
          </PricingCardContent>
        </PricingCard>

        <PricingCard>
          <PricingCardContent>
            <PricingTitle>Sửa chữa chung</PricingTitle>
            <PricingPrice>Liên hệ</PricingPrice>
            <PricingSubtitle>Theo yêu cầu</PricingSubtitle>
            <PricingFeatures>
              <li>• Sửa chữa động cơ</li>
              <li>• Thay thế phụ tụng</li>
              <li>• Bảo hành 6 tháng</li>
            </PricingFeatures>
            <PricingButton>Tư vấn</PricingButton>
          </PricingCardContent>
        </PricingCard>

        <PricingCard>
          <PricingCardContent>
            <PricingTitle>Hệ thống phanh</PricingTitle>
            <PricingPrice>Từ 800,000đ</PricingPrice>
            <PricingSubtitle>Chuyên sâu</PricingSubtitle>
            <PricingFeatures>
              <li>• Kiểm tra phanh</li>
              <li>• Thay má phanh</li>
              <li>• Bảo hành 1 năm</li>
            </PricingFeatures>
            <PricingButton>Đặt lịch</PricingButton>
          </PricingCardContent>
        </PricingCard>

        <PricingCard>
          <PricingCardContent>
            <PricingTitle>Bảo hiểm - Bảo hành</PricingTitle>
            <PricingPrice>Từ 300,000đ</PricingPrice>
            <PricingSubtitle>Dài hạn</PricingSubtitle>
            <PricingFeatures>
              <li>• Bảo hiểm toàn diện</li>
              <li>• Hỗ trợ khẩn cấp</li>
              <li>• Ưu đãi đặc biệt</li>
            </PricingFeatures>
            <PricingButton>Tìm hiểu</PricingButton>
          </PricingCardContent>
        </PricingCard>
      </PricingGrid>
    </Container>
  );
};

export default PricingContainer;

const Container = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  width: 100%;
`;

const PricingGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  width: 100%;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const PricingCard = styled.div<{ $featured?: boolean }>`
  border: 1px solid ${(props) => (props.$featured ? "#bfdbfe" : "#e5e7eb")};
  border-radius: 0.5rem;
  padding: 1.5rem;
  background-color: ${(props) => (props.$featured ? "#eff6ff" : "white")};
  min-width: 0;
`;

const PricingCardContent = styled.div`
  text-align: center;
`;

const PricingTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #6b7280;
`;

const PricingPrice = styled.div<{ $color?: string }>`
  font-size: 1.875rem;
  font-weight: bold;
  color: ${(props) => props.$color || "#111827"};
  margin-bottom: 1rem;
`;

const PricingSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

const PricingFeatures = styled.ul`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
  text-align: left;

  li {
    margin-bottom: 0.5rem;
  }
`;

const PricingButton = styled.button<{ $primary?: boolean }>`
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: ${(props) => (props.$primary ? "none" : "1px solid #d1d5db")};
  background-color: ${(props) => (props.$primary ? "#2563eb" : "transparent")};
  color: ${(props) => (props.$primary ? "white" : "#374151")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.$primary ? "#1d4ed8" : "#f9fafb")};
  }
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

const SectionDescription = styled.p`
  color: #6b7280;
`;
