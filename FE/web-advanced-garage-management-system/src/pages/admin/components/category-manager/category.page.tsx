import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil, HiTrash, HiX } from "react-icons/hi";
import {
  getCategories,
  createCategory,
  updateCategory,
} from "@/services/admin/categoryService";
import type { ICategory } from "@/services/admin/categoryService";

interface CategoryFormData {
  name: string;
  type: string;
  description: string;
}

const CategoryPage = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    type: "Service",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError(t("cannotLoadCategories"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      type: "Service",
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: ICategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.categoryID, formData);
      } else {
        await createCategory(formData);
      }
      handleCloseModal();
      await fetchCategories();
    } catch (err) {
      console.error("Error saving category:", err);
      setError(t("errorSavingCategory"));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <Header>
        <TitleSection>
          <Title>{t("categoriesManagement")}</Title>
          <Subtitle>{t("categoriesManagementSubtitle")}</Subtitle>
        </TitleSection>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("createNewCategory")}
        </AddButton>
      </Header>

      <TableCard>
        <TableHeader>
          <SearchBox>
            <HiSearch size={18} />
            <input
              type="text"
              placeholder={t("searchByNameTypeCategory")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBox>
        </TableHeader>

        <TableSection>
          <TableTitle>{t("categoryList")}</TableTitle>
          <TableSubtitle>
            {loading
              ? t("loadingCategories")
              : t("showingCategories", { count: filteredCategories.length })}
          </TableSubtitle>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {loading ? (
            <LoadingMessage>{t("loadingData")}</LoadingMessage>
          ) : (
            <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>{t("name")}</Th>
                  <Th>{t("type")}</Th>
                  <Th>{t("description")}</Th>
                  <Th>{t("action")}</Th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.categoryID}>
                    <Td>
                      <CategoryInfo>
                        <CategoryName>{category.name}</CategoryName>
                      </CategoryInfo>
                    </Td>
                    <Td>
                      <TypeBadge>{category.type}</TypeBadge>
                    </Td>
                    <Td>
                      <DescriptionText>
                        {category.description || "—"}
                      </DescriptionText>
                    </Td>
                    <Td>
                      <ActionButtons>
                        <EditButton
                          onClick={() => handleOpenEditModal(category)}
                          title="Edit"
                        >
                          <HiPencil size={18} />
                        </EditButton>
                        <DeleteButton
                          onClick={() =>
                            console.log("Delete category:", category.categoryID)
                          }
                          title="Delete"
                        >
                          <HiTrash size={18} />
                        </DeleteButton>
                      </ActionButtons>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            </TableWrapper>
          )}
        </TableSection>
      </TableCard>

      {isModalOpen && (
        <Modal>
          <ModalOverlay onClick={handleCloseModal} />
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingCategory ? t("updateCategory") : t("createNewCategory")}
              </ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <HiX size={24} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>{t("name")} *</Label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Sửa chữa máy gầm"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{t("type")} *</Label>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Service">{t("categoryTypeService")}</option>
                    <option value="Part">{t("categoryTypePart")}</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>{t("description")}</Label>
                  <TextArea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Công kiểm tra, hạ máy, thay phuộc, thay rotuyn.."
                    rows={3}
                  />
                </FormGroup>

                <ModalFooter>
                  <CancelButton type="button" onClick={handleCloseModal}>
                    {t("cancel")}
                  </CancelButton>
                  <SubmitButton type="submit" disabled={submitting}>
                    {submitting
                      ? t("saving")
                      : editingCategory
                      ? t("updateCategory")
                      : t("createCategory")}
                  </SubmitButton>
                </ModalFooter>
              </Form>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default CategoryPage;

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
  flex-direction: column;
  gap: 0.25rem;
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
  margin: 0;
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

const ErrorMessage = styled.div`
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
`;

const LoadingMessage = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7590;
  font-size: 1rem;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.table`
  width: 100%;
  min-width: max-content;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: center;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7590;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;

  &:first-child {
    text-align: left;
  }
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  color: #1a1d2e;
  text-align: center;

  &:first-child {
    text-align: left;
  }
`;

const CategoryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CategoryName = styled.div`
  font-weight: 600;
  color: #1a1d2e;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TypeBadge = styled.span`
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;

const DescriptionText = styled.div`
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #6b7590;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const EditButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: #3b82f6;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #dbeafe;
    color: #2563eb;
  }
`;

const DeleteButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: #ef4444;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #fee2e2;
    color: #dc2626;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled.div`
  position: relative;
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1d2e;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #6b7590;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #1a1d2e;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1a1d2e !important;
  background: white !important;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3bf;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1a1d2e !important;
  background: white !important;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1a1d2e !important;
  background: white !important;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3bf;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3bf;
    cursor: not-allowed;
  }
`;
