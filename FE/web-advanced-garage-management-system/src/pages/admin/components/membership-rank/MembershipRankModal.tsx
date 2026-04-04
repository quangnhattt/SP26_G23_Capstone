import { HiX } from "react-icons/hi";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import type { IMembershipRank } from "@/services/admin/membershipRankService";

interface MembershipRankFormData {
  rankName: string;
  minSpending: number;
  discountPercent: number;
  description: string;
  isActive: boolean;
}

interface MembershipRankModalProps {
  isOpen: boolean;
  editingRank: IMembershipRank | null;
  formData: MembershipRankFormData;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

const MembershipRankModal = ({
  isOpen,
  editingRank,
  formData,
  submitting,
  onClose,
  onSubmit,
  onInputChange,
}: MembershipRankModalProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <Modal>
      <ModalOverlay onClick={onClose} />
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {editingRank ? t("updateMembershipRank") : t("createNewMembershipRank")}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <HiX size={24} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <Form onSubmit={onSubmit}>
            <FormGroup>
              <Label>{t("rankName")} *</Label>
              <Input
                type="text"
                name="rankName"
                value={formData.rankName}
                onChange={onInputChange}
                placeholder="VIP Gold"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("minSpending")} *</Label>
              <Input
                type="number"
                name="minSpending"
                value={formData.minSpending}
                onChange={onInputChange}
                min="0"
                step="1"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("discountPercent")} *</Label>
              <Input
                type="number"
                name="discountPercent"
                value={formData.discountPercent}
                onChange={onInputChange}
                min="0"
                max="100"
                step="0.01"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>{t("description")}</Label>
              <TextArea
                name="description"
                value={formData.description}
                onChange={onInputChange}
                placeholder={t("membershipRankDescriptionPlaceholder")}
                rows={3}
              />
            </FormGroup>

            {editingRank && (
              <FormGroup>
                <CheckboxLabel>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={onInputChange}
                  />
                  <span>{t("isActive")}</span>
                </CheckboxLabel>
              </FormGroup>
            )}

            <ModalFooter>
              <CancelButton type="button" onClick={onClose}>
                {t("cancel")}
              </CancelButton>
              <SubmitButton type="submit" disabled={submitting}>
                {submitting
                  ? t("saving")
                  : editingRank
                    ? t("updateMembershipRank")
                    : t("createMembershipRank")}
              </SubmitButton>
            </ModalFooter>
          </Form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default MembershipRankModal;

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
