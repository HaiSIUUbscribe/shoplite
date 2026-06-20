import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Col, Container, Form, InputGroup, Pagination, Row, Spinner } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productService } from '../services/api';

const PAGE_SIZE = 12;
const initialFilters = { search: '', category: '', minPrice: '', maxPrice: '', sort: 'newest' };

export default function Products() {
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';
  const queryCategory = searchParams.get('category') || '';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    search: querySearch,
    category: queryCategory,
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const loadProducts = () => {
    setLoading(true);
    setError('');
    Promise.all([productService.list(), productService.categories()])
      .then(([productData, categoryData]) => {
        setProducts(productData);
        setCategories(categoryData);
      })
      .catch(() => setError('Không thể tải danh sách sản phẩm.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadProducts, []);
  useEffect(() => {
    setFilters((current) => (
      current.search === querySearch && current.category === queryCategory
        ? current
        : { ...current, search: querySearch, category: queryCategory }
    ));
  }, [querySearch, queryCategory]);
  useEffect(() => setPage(1), [filters]);

  const filtered = useMemo(() => {
    const keyword = filters.search.trim().toLocaleLowerCase('vi');
    const minPrice = filters.minPrice === '' ? null : Number(filters.minPrice);
    const maxPrice = filters.maxPrice === '' ? null : Number(filters.maxPrice);
    const result = products.filter((product) => {
      const price = Number(product.price);
      const matchesCategory = !filters.category || product.category === filters.category;
      const matchesSearch = !keyword || `${product.title} ${product.description || ''}`.toLocaleLowerCase('vi').includes(keyword);
      const matchesMinPrice = minPrice === null || price >= minPrice;
      const matchesMaxPrice = maxPrice === null || price <= maxPrice;
      return matchesCategory && matchesSearch && matchesMinPrice && matchesMaxPrice;
    });

    return result.sort((a, b) => {
      if (filters.sort === 'price-asc') return Number(a.price) - Number(b.price);
      if (filters.sort === 'price-desc') return Number(b.price) - Number(a.price);
      if (filters.sort === 'name') return a.title.localeCompare(b.title, 'vi');
      return Number(b.id) - Number(a.id);
    });
  }, [products, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  const clearFilters = () => setFilters(initialFilters);

  return (
    <main className="catalog-page">
      <Container>
        <div className="catalog-header">
          <span>Danh mục</span>
          <h1>Tất cả sản phẩm</h1>
          <p>Khám phá sản phẩm phù hợp theo nhu cầu và ngân sách của bạn.</p>
        </div>

        <div className="search-layout catalog-layout">
          <aside className="search-filters">
            <div className="filter-heading">
              <h2>Bộ lọc</h2>
              <Button type="button" variant="link" onClick={clearFilters}>Xóa tất cả</Button>
            </div>

            <Form.Group>
              <Form.Label>Từ khóa</Form.Label>
              <InputGroup>
                <InputGroup.Text><i className="bi bi-search" /></InputGroup.Text>
                <Form.Control
                  value={filters.search}
                  onChange={(event) => updateFilter('search', event.target.value)}
                  placeholder="Tên hoặc mô tả sản phẩm"
                  aria-label="Tìm sản phẩm"
                />
              </InputGroup>
            </Form.Group>

            <Form.Group>
              <Form.Label>Danh mục</Form.Label>
              <Form.Select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Khoảng giá</Form.Label>
              <div className="price-range">
                <Form.Control
                  type="number"
                  min="0"
                  step="1000"
                  value={filters.minPrice}
                  onChange={(event) => updateFilter('minPrice', event.target.value)}
                  placeholder="Từ"
                  aria-label="Giá tối thiểu"
                />
                <span>-</span>
                <Form.Control
                  type="number"
                  min="0"
                  step="1000"
                  value={filters.maxPrice}
                  onChange={(event) => updateFilter('maxPrice', event.target.value)}
                  placeholder="Đến"
                  aria-label="Giá tối đa"
                />
              </div>
            </Form.Group>

            <Form.Group>
              <Form.Label>Sắp xếp</Form.Label>
              <Form.Select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
                <option value="name">Tên A-Z</option>
              </Form.Select>
            </Form.Group>
          </aside>

          <section className="search-results">
            <div className="results-heading">
              <div><strong>{filtered.length}</strong> sản phẩm</div>
              {filters.search && <span>Kết quả cho “{filters.search}”</span>}
            </div>

            {loading && <div className="page-loader"><Spinner animation="border" /><span>Đang tải sản phẩm...</span></div>}
            {error && <Alert variant="danger" className="d-flex justify-content-between align-items-center">{error}<Button size="sm" variant="outline-danger" onClick={loadProducts}>Thử lại</Button></Alert>}
            {!loading && !error && visibleProducts.length === 0 && <div className="empty-state"><i className="bi bi-search" /><h2>Không tìm thấy sản phẩm</h2><p>Thử mở rộng khoảng giá hoặc chọn danh mục khác.</p><Button type="button" onClick={clearFilters}>Xóa bộ lọc</Button></div>}

            <Row className="g-4">
              {visibleProducts.map((product) => <Col key={product.id} xl={4} sm={6}><ProductCard product={product} /></Col>)}
            </Row>

            {!loading && totalPages > 1 && <Pagination className="justify-content-center mt-5">
              <Pagination.Prev disabled={page === 1} onClick={() => setPage((value) => value - 1)} />
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <Pagination.Item key={number} active={number === page} onClick={() => setPage(number)}>{number}</Pagination.Item>)}
              <Pagination.Next disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} />
            </Pagination>}
          </section>
        </div>
      </Container>
    </main>
  );
}
