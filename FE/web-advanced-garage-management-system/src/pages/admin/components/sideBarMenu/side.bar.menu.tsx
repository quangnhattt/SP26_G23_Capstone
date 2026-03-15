import { menuService, type IMenuGroup } from "@/services/admin";
import { useEffect, useState } from "react";
import styled from "styled-components";

const SideBarMenu = () => {
  const [menuGroups, setMenuGroups] = useState<IMenuGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuAccess = async () => {
      try {
        setLoading(true);
        const data = await menuService.getMenuAccess();
        setMenuGroups(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch menu access:", err);
        setError("Failed to load menu");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuAccess();
  }, []);

  if (loading) {
    return <LoadingMessage>Loading menu...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <>
      {menuGroups.map((group) => (
        <NavSection key={group.groupID}>
          <NavTitle>{group.groupName}</NavTitle>
        </NavSection>
      ))}
    </>
  );
};

export default SideBarMenu;

const NavSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 0 0.75rem;
`;

const NavTitle = styled.div`
  font-size: 0.6875rem;
  font-weight: 700;
  color: #6b7590;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.75rem 1rem;
  margin-bottom: 0.25rem;
  user-select: none;
`;

const LoadingMessage = styled.div`
  padding: 1rem;
  text-align: center;
  color: #9ca3bf;
  font-size: 0.875rem;
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  text-align: center;
  color: #ef4444;
  font-size: 0.875rem;
`;

