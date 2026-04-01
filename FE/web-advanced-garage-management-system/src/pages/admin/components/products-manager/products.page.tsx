import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil, HiTrash, HiX } from "react-icons/hi";
import { useEffect, useState, useRef } from "react";
import { Pagination } from "antd";
import {
  getProducts,
  createProduct,
  updateProduct,
  getProductById,
} from "@/services/admin/productService";
import type { IProduct } from "@/services/admin/productService";
import { getUnits } from "@/services/admin/unitService";
import type { IUnit } from "@/services/admin/unitService";
import { getCategories } from "@/services/admin/categoryService";
import type { ICategory } from "@/services/admin/categoryService";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface ProductFormData {
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

const ProductsPage = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    code: "",
    name: "",
    price: 0,
    unitId: 1,
    categoryId: 1,
    warranty: 0,
    minStockLevel: 0,
    description: "",
    image: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [units, setUnits] = useState<IUnit[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchProducts(undefined, 1);
    fetchUnits();
    fetchCategories();
  }, []);

  const fetchUnits = async () => {
    try {
      const data = await getUnits();
      setUnits(data);
    } catch (err) {
      console.error("Failed to fetch units:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchProducts = async (search?: string, page = 1) => {
    try {
      setLoading(true);
      const params = {
        ...(search ? { name: search, code: search } : {}),
        page,
        pageSize,
      };
      const res = await getProducts(params);
      setProducts(res.items);
      setTotalCount(res.totalCount);
      setCurrentPage(res.page);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError(t("cannotLoadProducts"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(value.trim() || undefined, 1);
    }, 400);
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      code: "",
      name: "",
      price: 0,
      unitId: 0,
      categoryId: 0,
      warranty: 0,
      minStockLevel: 0,
      description: "",
      image: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (product: IProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
    setLoadingModal(true);

    try {
      const productDetail = await getProductById(product.id);

      setFormData({
        code: productDetail.code,
        name: productDetail.name,
        price: productDetail.price,
        unitId:
          productDetail.unitId ??
          units.find((u) => u.name === productDetail.unit)?.unitID ??
          0,
        categoryId:
          productDetail.categoryId ??
          categories.find(
            (c) => c.name === productDetail.category && c.type === "Part"
          )?.categoryID ??
          0,
        warranty: productDetail.warranty,
        minStockLevel: productDetail.minStockLevel,
        description: productDetail.description,
        image: productDetail.image || "",
        isActive: productDetail.isActive,
      });
    } catch (error) {
      console.error("Failed to fetch product detail:", error);
      setFormData({
        code: product.code,
        name: product.name,
        price: product.price,
        unitId: units.find((u) => u.name === product.unit)?.unitID ?? 0,
        categoryId:
          categories.find(
            (c) => c.name === product.category && c.type === "Part"
          )?.categoryID ?? 0,
        warranty: product.warranty,
        minStockLevel: product.minStockLevel,
        description: product.description,
        image: product.image || "",
        isActive: product.isActive,
      });
    } finally {
      setLoadingModal(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "unitId" || name === "categoryId"
          ? Number(value)
          : type === "number"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }
      await fetchProducts(searchTerm.trim() || undefined, currentPage);
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save product:", err);
      toast.error(getApiErrorMessage(err, t("errorSavingProduct")));
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <Container>
      <Header>
        <TitleSection>
          <Title>{t("productsManagement")}</Title>
          <Subtitle>{t("productsManagementSubtitle")}</Subtitle>
        </TitleSection>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("createNewProduct")}
        </AddButton>
      </Header>

      <TableCard>
        <TableHeader>
          <SearchBox>
            <HiSearch size={18} />
            <input
              type="text"
              placeholder={t("searchByNameCode")}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </SearchBox>
        </TableHeader>

        <TableSection>
          <TableTitle>{t("productList")}</TableTitle>
          <TableSubtitle>
            {loading
              ? t("loadingProducts")
              : t("showingProducts", { total: totalCount })}
          </TableSubtitle>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {loading ? (
            <LoadingMessage>{t("loadingData")}</LoadingMessage>
          ) : (
            <>
            <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>{t("name")}</Th>
                  <Th>{t("price")}</Th>
                  <Th>{t("unit")}</Th>
                  <Th>{t("category")}</Th>
                  <Th>{t("warranty")}</Th>
                  <Th>{t("minStock")}</Th>
                  <Th>{t("stockQty")}</Th>
                  <Th>{t("status")}</Th>
                  <Th>{t("action")}</Th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <Td>
                      <ProductInfo>
                        <div>
                          <ProductName>{product.name}</ProductName>
                          <ProductCode>{product.code}</ProductCode>
                        </div>
                      </ProductInfo>
                    </Td>
                    <Td>
                      <PriceText>{formatPrice(product.price)}</PriceText>
                    </Td>
                    <Td>
                      <UnitBadge>{product.unit || "N/A"}</UnitBadge>
                    </Td>
                    <Td>
                      <CategoryBadge $hasData={!!product.category}>
                        {product.category || "N/A"}
                      </CategoryBadge>
                    </Td>
                    <Td>
                      {product.warranty} {t("months")}
                    </Td>
                    <Td>{product.minStockLevel}</Td>
                    <Td>
                      <StockBadge
                        $isLow={product.stockQty < product.minStockLevel}
                      >
                        {product.stockQty}
                      </StockBadge>
                    </Td>
                    <Td>
                      <StatusBadge $isActive={product.isActive}>
                        {product.isActive ? t("active") : t("inactive")}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <ActionButtons>
                        <EditButton
                          onClick={() => handleOpenEditModal(product)}
                          title="Edit"
                        >
                          <HiPencil size={18} />
                        </EditButton>
                        <DeleteButton
                          onClick={() =>
                            console.log("Delete product:", product.id)
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
            <PaginationWrapper>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalCount}
                showSizeChanger={false}
                onChange={(page) => fetchProducts(searchTerm.trim() || undefined, page)}
              />
            </PaginationWrapper>
            </>
          )}
        </TableSection>
      </TableCard>

      {isModalOpen && (
        <Modal>
          <ModalOverlay onClick={handleCloseModal} />
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingProduct ? t("updateProduct") : t("createNewProduct")}
              </ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <HiX size={24} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              {loadingModal ? (
                <LoadingModalContent>{t("loadingData")}</LoadingModalContent>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <FormRow>
                    <FormGroup>
                      <Label>{t("code")} *</Label>
                      <Input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
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
                        onChange={handleInputChange}
                        placeholder="Test tiền postman"
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
                        onChange={handleInputChange}
                        placeholder="9999999"
                        required
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label>{t("unitID")} *</Label>
                      <Select
                        name="unitId"
                        value={formData.unitId || ""}
                        onChange={handleInputChange}
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
                        onChange={handleInputChange}
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
                        onChange={handleInputChange}
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
                        onChange={handleInputChange}
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
                        onChange={handleInputChange}
                        placeholder="string"
                      />
                    </FormGroup>
                  </FormRow>

                  <FormGroup>
                    <Label>{t("description")} *</Label>
                    <TextArea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Test tiền post man cho anh nhất"
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
                        onChange={handleInputChange}
                      />
                      <span>{t("active")}</span>
                    </CheckboxLabel>
                  </FormGroup>

                  <ModalFooter>
                    <CancelButton type="button" onClick={handleCloseModal}>
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
      )}
    </Container>
  );
};

export default ProductsPage;

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

const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ProductName = styled.div`
  font-weight: 600;
  color: #1a1d2e;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductCode = styled.div`
  font-size: 0.75rem;
  color: #9ca3bf;
  margin-top: 0.125rem;
`;

const PriceText = styled.div`
  font-weight: 600;
  color: #059669;
`;

const UnitBadge = styled.span`
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;

const CategoryBadge = styled.span<{ $hasData: boolean }>`
  background: #fef3c7;
  color: #b45309;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;

const StockBadge = styled.span<{ $isLow: boolean }>`
  background: ${(props) => (props.$isLow ? "#fee2e2" : "#dcfce7")};
  color: ${(props) => (props.$isLow ? "#dc2626" : "#16a34a")};
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;

const StatusBadge = styled.span<{ $isActive: boolean }>`
  background: ${(props) => (props.$isActive ? "#dcfce7" : "#f3f4f6")};
  color: ${(props) => (props.$isActive ? "#16a34a" : "#6b7280")};
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
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

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 1rem 0 0.5rem;
`;
