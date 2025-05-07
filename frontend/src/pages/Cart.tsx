import React from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { items, addItem, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (item: any, delta: number) => {
    if (item.quantity + delta < 1) return;
    addItem({ ...item, quantity: item.quantity + delta });
  };

  const handleRemove = (itemId: string) => {
    removeItem(itemId);
  };

  const handlePlaceOrder = () => {
    // Simulate order placement
    clearCart();
    alert('Order placed successfully!');
    navigate('/');
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Container className="py-4">
      <h2 className="mb-4">Your Cart</h2>
      {items.length === 0 ? (
        <Alert variant="info">Your cart is empty.</Alert>
      ) : (
        <>
          <Row className="g-3 mb-4">
            {items.map((item: any, idx: number) => (
              <Col key={idx} xs={12} md={6} lg={4}>
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>{item.name}</Card.Title>
                    <div className="mb-2">${item.price.toFixed(2)}</div>
                    <div className="d-flex align-items-center mb-2">
                      <Button variant="outline-secondary" size="sm" onClick={() => handleQuantityChange(item, -1)}>-</Button>
                      <Form.Control type="number" value={item.quantity} min={1} readOnly className="mx-2" style={{ width: 60 }} />
                      <Button variant="outline-secondary" size="sm" onClick={() => handleQuantityChange(item, 1)}>+</Button>
                    </div>
                    <Button variant="outline-danger" size="sm" onClick={() => handleRemove(item.id)}>
                      Remove
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          <h4 className="mb-3">Total: ${total.toFixed(2)}</h4>
          <Button variant="success" size="lg" onClick={handlePlaceOrder}>
            Place Order
          </Button>
        </>
      )}
    </Container>
  );
};

export default Cart; 