import React, { useEffect, useState, useMemo } from "react";
import {Container,Row,Col,Card,Form,InputGroup,Spinner,Breadcrumb,Pagination,ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";

import ProductCard from "../components/ProductCard";

export default function Products() {
  // State quản lý dữ liệu
  const [products, setProducts] = useState([]); 
  const [categories, setCategories] = useState([]); 
  //State quản lý UI và bộ lọc
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(""); 

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('https://dummyjson.com/products?limit=100'),
          fetch('https://dummyjson.com/products/categories')
        ]);
        
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        setProducts(productsData.products);
        setCategories(categoriesData);

      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (search) {
      result = result.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (sort === "low-high") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "high-low") {
      result.sort((a, b) => b.price - a.price);
    }
    
    return result;
  }, [selectedCategory, search, sort, products]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentItems = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderProductList = () => {
    if (loading) {
      return (
        <Row className="g-4">
          {[...Array(8)].map((_, i) => (
            <Col md={4} sm={6} key={i}>
              <Card className="shadow-sm border-0">
                <div className="bg-light ratio ratio-1x1" />
                <Card.Body>
                  <div className="placeholder-glow"><span className="placeholder col-8"></span></div>
                  <div className="placeholder-glow mt-2"><span className="placeholder col-5"></span></div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      );
    }

    if (error) {
      return <div className="alert alert-danger">{error}</div>;
    }

    if (currentItems.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <i className="bi bi-search" style={{fontSize: '3rem'}}></i>
          <h4 className="mt-3">Không tìm thấy sản phẩm nào</h4>
          <p>Vui lòng thử lại với bộ lọc khác.</p>
        </div>
      );
    }

    return (
      <Row className="g-4">
        {currentItems.map((prod) => (
          <Col key={prod.id} lg={4} md={6} sm={6}>
            <ProductCard product={prod} />
          </Col>
        ))}
      </Row>
    );
  };


  return (
    <>
      
      <main className="bg-light py-5">
        <Container>
          <div className="mb-4">
            <h1 className="fw-bold text-primary text-center">Danh sách Sản Phẩm</h1>
          </div>

          <Row>
            {/*CỘT TRÁI (BỘ LỌC) */}
            <Col lg={3}>
              <Card className="p-3 shadow-sm border-0 sticky-top" style={{top: '6rem'}}>
                <h5 className="fw-bold mb-3">Bộ lọc</h5>
                
                {/* Lọc theo Danh mục */}
                <div className="mb-4">
                  <h6 className="fw-semibold">Danh mục</h6>
                  <ListGroup variant="flush">
                    <ListGroup.Item 
                      action 
                      active={selectedCategory === ""} 
                      onClick={() => setSelectedCategory("")}
                      className="py-2"
                    >
                      Tất cả danh mục
                    </ListGroup.Item>
                    {categories.map(cat => (
                      <ListGroup.Item 
                        key={cat.slug} 
                        action
                        active={selectedCategory === cat.slug}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className="py-2 text-capitalize" 
                      >
                        {cat.name}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>

                {/* Sắp xếp */}
                <div className="mb-3">
                  <h6 className="fw-semibold">Sắp xếp theo</h6>
                  <Form.Select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="">Mặc định</option>
                    <option value="low-high">Giá: Thấp đến Cao</option>
                    <option value="high-low">Giá: Cao đến Thấp</option>
                  </Form.Select>
                </div>
              </Card>
            </Col>

            {/*CỘT PHẢI (SẢN PHẨM)*/}
            <Col lg={9}>
              {/* Thanh tìm kiếm */}
              <InputGroup className="mb-4 shadow-sm">
                <Form.Control
                  size="lg"
                  type="text"
                  placeholder="Tìm kiếm sản phẩm bạn muốn..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
              </InputGroup>

              {/* Danh sách sản phẩm */}
              {renderProductList()}

              {/* Thanh phân trang */}
              {totalPages > 1 && !loading && (
                <div className="d-flex justify-content-center mt-5">
                  <Pagination>
                    <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                    {[...Array(totalPages).keys()].map(number => (
                      <Pagination.Item 
                        key={number + 1} 
                        active={number + 1 === currentPage} 
                        onClick={() => paginate(number + 1)}
                      >
                        {number + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}