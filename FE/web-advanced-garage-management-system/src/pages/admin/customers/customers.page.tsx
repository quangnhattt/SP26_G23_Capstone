import styled from "styled-components";
import { HiSearch, HiPlus, HiEye, HiDotsVertical } from "react-icons/hi";

const CustomersPage = () => {
  const customers = [
    {
      id: "CUS-001",
      name: "Nguyễn Văn Minh",
      phone: "0901234567",
      email: "minh@email.com",
      rank: "Gold",
      points: 4500,
      totalSpent: "45.600.000 đ",
      cars: 2,
      lastVisit: "20/01/2024",
    },
    {
      id: "CUS-002",
      name: "Trần Thị Lan",
      phone: "0912345678",
      email: "lan@email.com",
      rank: "Silver",
      points: 2200,
      totalSpent: "22.000.000 đ",
      cars: 1,
      lastVisit: "19/01/2024",
    },
    {
      id: "CUS-003",
      name: "Phạm Văn Hùng",
      phone: "0923456789",
      email: "hung@email.com",
      rank: "Platinum",
      points: 12500,
      totalSpent: "125.000.000 đ",
      cars: 2,
      lastVisit: "18/01/2024",
    },
    {
      id: "CUS-004",
      name: "Lê Minh Tuấn",
      phone: "0934567890",
      email: "tuan@email.com",
      rank: "Standard",
      points: 800,
      totalSpent: "8.000.000 đ",
      cars: 1,
      lastVisit: "18/01/2024",
    },
    {
      id: "CUS-005",
      name: "Võ Thị Mai",
      phone: "0945678901",
      email: "mai@email.com",
      rank: "Gold",
      points: 5200,
      totalSpent: "52.000.000 đ",
      cars: 1,
      lastVisit: "20/01/2024",
    },
  ];

  const getRankColor = (rank: string) => {
    switch (rank.toLowerCase()) {
      case "platinum":
        return "#64748b";
      case "gold":
        return "#f59e0b";
      case "silver":
        return "#94a3b8";
      default:
        return "#6b7280";
    }
  };

  return (
    <Container>
      <Header>
        <TitleSection>
          <Icon>👥</Icon>
          <div>
            <Title>Quản lý khách hàng</Title>
            <Subtitle>Quản lý thông tin và chương trình thành viên</Subtitle>
          </div>
        </TitleSection>
        <AddButton>
          <HiPlus size={18} />
          Thêm khách hàng
        </AddButton>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatNumber>5</StatNumber>
          <StatLabel>Tổng khách hàng</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>1</StatNumber>
          <StatLabel>
            <RankBadge color="#64748b">⭐ Platinum</RankBadge>
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>2</StatNumber>
          <StatLabel>
            <RankBadge color="#f59e0b">👑 Gold</RankBadge>
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>1</StatNumber>
          <StatLabel>
            <RankBadge color="#94a3b8">🥈 Silver</RankBadge>
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>0.25B</StatNumber>
          <StatLabel>Tổng doanh thu</StatLabel>
        </StatCard>
      </StatsGrid>

      <TableCard>
        <TableHeader>
          <SearchBox>
            <HiSearch size={18} />
            <input type="text" placeholder="Tìm theo tên, SĐT, email..." />
          </SearchBox>
          <FilterButton>
            Tất cả hạng
            <span>▼</span>
          </FilterButton>
        </TableHeader>

        <TableSection>
          <TableTitle>Danh sách khách hàng</TableTitle>
          <TableSubtitle>Hiện thi 5 khách hàng</TableSubtitle>

          <Table>
            <thead>
              <tr>
                <Th>Khách hàng</Th>
                <Th>Liên hệ</Th>
                <Th>Hạng</Th>
                <Th>Điểm</Th>
                <Th>Tổng chi tiêu</Th>
                <Th>Số xe</Th>
                <Th>Lần cuối</Th>
                <Th>Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <Td>
                    <CustomerInfo>
                      <Avatar>{customer.name.charAt(0)}</Avatar>
                      <div>
                        <CustomerName>{customer.name}</CustomerName>
                        <CustomerId>{customer.id}</CustomerId>
                      </div>
                    </CustomerInfo>
                  </Td>
                  <Td>
                    <ContactInfo>
                      <div>{customer.phone}</div>
                      <div>{customer.email}</div>
                    </ContactInfo>
                  </Td>
                  <Td>
                    <RankBadgeTable color={getRankColor(customer.rank)}>
                      {customer.rank}
                    </RankBadgeTable>
                  </Td>
                  <Td>{customer.points.toLocaleString()}</Td>
                  <Td>{customer.totalSpent}</Td>
                  <Td>
                    <CarBadge>🚗 {customer.cars}</CarBadge>
                  </Td>
                  <Td>{customer.lastVisit}</Td>
                  <Td>
                    <ActionButtons>
                      <ActionButton>
                        <HiEye size={18} />
                      </ActionButton>
                      <ActionButton>
                        <HiDotsVertical size={18} />
                      </ActionButton>
                    </ActionButtons>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableSection>
      </TableCard>
    </Container>
  );
};

export default CustomersPage;

const Container = styled.div`
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Icon = styled.div`
  font-size: 2rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1d2e;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7590;
  margin: 0.25rem 0 0 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StatNumber = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1d2e;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7590;
`;

const RankBadge = styled.span<{ color: string }>`
  background: ${(props) => props.color}15;
  color: ${(props) => props.color};
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const TableCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  flex: 1;
  max-width: 400px;
  color: #6b7590;

  input {
    border: none;
    background: transparent;
    outline: none;
    flex: 1;
    font-size: 0.875rem;
    color: #1a1d2e;

    &::placeholder {
      color: #9ca3bf;
    }
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
`;

const TableSection = styled.div`
  padding: 1.5rem;
`;

const TableTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1d2e;
  margin: 0 0 0.25rem 0;
`;

const TableSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7590;
  margin: 0 0 1.5rem 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7590;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  color: #1a1d2e;
`;

const CustomerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
`;

const CustomerName = styled.div`
  font-weight: 600;
  color: #1a1d2e;
`;

const CustomerId = styled.div`
  font-size: 0.75rem;
  color: #9ca3bf;
  margin-top: 0.125rem;
`;

const ContactInfo = styled.div`
  div:first-child {
    font-weight: 500;
  }
  div:last-child {
    font-size: 0.75rem;
    color: #6b7590;
    margin-top: 0.125rem;
  }
`;

const RankBadgeTable = styled.span<{ color: string }>`
  background: ${(props) => props.color};
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;

const CarBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7590;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #3b82f6;
  }
`;
