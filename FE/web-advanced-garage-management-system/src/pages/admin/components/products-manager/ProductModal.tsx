import { HiX } from "react-icons/hi";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import type { ICategory } from "@/services/admin/categoryService";
import type { IUnit } from "@/services/admin/unitService";
import type { IProduct } from "@/services/admin/productService";

interface ProductModalFormData {
  code: string;
  name: string;
  price: number;
  unitId: number;
  categoryId: number;
  warranty: number;
  minStockLevel: number;
  description: string;
  image: string;
  isActive: boolean;
}

interface ProductModalProps {
  isOpen: boolean;
  editingProduct: IProduct | null;
  loadingModal: boolean;
  submitting: boolean;
  formData: ProductModalFormData;
  units: IUnit[];
  categories: ICategory[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
}

const ProductModal = ({
  isOpen,
  editingProduct,
  loadingModal,
  submitting,
  formData,
  units,
  categories,
  onClose,
  onSubmit,
  onInputChange,
}: ProductModalProps) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <Modal>
      <ModalOverlay onClick={onClose} />
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {editingProduct ? t("updateProduct") : t("createNewProduct")}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <HiX size={24} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {loadingModal ? (
            <LoadingModalContent>{t("loadingData")}</LoadingModalContent>
          ) : (
            <Form onSubmit={onSubmit}>
              <FormRow>
                <FormGroup>
                  <Label>{t("code")} *</Label>
                  <Input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={onInputChange}
                    placeholder="P1161200016"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{t("name")} *</Label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={onInputChange}
                    placeholder="Test tien postman"
                    required
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label>{t("price")} *</Label>
                  <Input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={onInputChange}
                    placeholder="9999999"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{t("unitID")} *</Label>
                  <Select
                    name="unitId"
                    value={formData.unitId || ""}
                    onChange={onInputChange}
                    required
                  >
                    <option value="">{t("selectUnit")}</option>
                    {units.map((unit) => (
                      <option key={unit.unitID} value={unit.unitID}>
                        {unit.name}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label>{t("categoryID")} *</Label>
                  <Select
                    name="categoryId"
                    value={formData.categoryId || ""}
                    onChange={onInputChange}
                    required
                  >
                    <option value="">{t("selectCategory")}</option>
                    {categories
                      .filter((c) => c.type === "Part")
                      .map((cat) => (
                        <option key={cat.categoryID} value={cat.categoryID}>
                          {cat.name}
                        </option>
                      ))}
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>{t("warrantyMonths")} *</Label>
                  <Input
                    type="number"
                    name="warranty"
                    value={formData.warranty}
                    onChange={onInputChange}
                    placeholder="9"
                    required
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label>{t("minStockLevel")} *</Label>
                  <Input
                    type="number"
                    name="minStockLevel"
                    value={formData.minStockLevel}
                    onChange={onInputChange}
                    placeholder="0"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>{t("imageURL")}</Label>
                  <Input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={onInputChange}
                    placeholder="string"
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label>{t("description")} *</Label>
                <TextArea
                  name="description"
                  value={formData.description}
                  onChange={onInputChange}
                  placeholder="Test tien post man cho anh nhat"
                  rows={3}
                  required
                />
              </FormGroup>

              <FormGroup>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={onInputChange}
                  />
                  <span>{t("active")}</span>
                </CheckboxLabel>
              </FormGroup>

              <ModalFooter>
                <CancelButton type="button" onClick={onClose}>
                  {t("cancel")}
                </CancelButton>
                <SubmitButton type="submit" disabled={submitting}>
                  {submitting
                    ? t("saving")
                    : editingProduct
                      ? t("updateProduct")
                      : t("createProduct")}
                </SubmitButton>
              </ModalFooter>
            </Form>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ProductModal;

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
  max-width: 800px;
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

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
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

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  span {
    font-size: 0.875rem;
    color: #374151;
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

const LoadingModalContent = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7590;
  font-size: 1rem;
`;
