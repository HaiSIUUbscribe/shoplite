import React from 'react';
import { Button, Container } from 'react-bootstrap';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ShopLite render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <main className="fatal-error-page">
        <Container>
          <div className="fatal-error-content">
            <i className="bi bi-exclamation-triangle" />
            <h1>Trang gặp sự cố</h1>
            <p>Dữ liệu của bạn vẫn an toàn. Hãy tải lại trang để tiếp tục.</p>
            <Button onClick={() => window.location.reload()}><i className="bi bi-arrow-clockwise me-2" />Tải lại trang</Button>
          </div>
        </Container>
      </main>;
    }
    return this.props.children;
  }
}
