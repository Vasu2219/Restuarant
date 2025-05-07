import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Badge, Nav, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useRestaurants } from '../hooks/useFirestoreData';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Home.css';

const vegBadge = <Badge bg="success" className="ms-2">Veg</Badge>;
const nonVegBadge = <Badge bg="danger" className="ms-2">Non-Veg</Badge>;

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { restaurants, loading } = useRestaurants();
  const { currentUser } = useAuth();
  const { addItem } = useCart();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [foodType, setFoodType] = useState<'all' | 'veg' | 'non-veg'>('all');

  // Find the restaurant by id
  const restaurant = useMemo(() => restaurants.find(r => r.id === id), [restaurants, id]);
  const menu: any[] = restaurant?.menu || [];

  // Filter menu by food type
  const filteredMenu = useMemo(() => {
    if (foodType === 'all') return menu;
    return menu.filter(item => item.type === foodType);
  }, [menu, foodType]);

  const handleAddToCart = (item: any) => {
    if (!currentUser) {
      setShowLoginAlert(true);
      return;
    }
    setSelectedItem(item);
    setQuantity(1);
    setShowModal(true);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleConfirmOrder = () => {
    if (selectedItem) {
      addItem({ ...selectedItem, quantity });
      setShowModal(false);
    }
  };

  if (loading || !restaurant) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <div>
      <div
        className="position-relative"
        style={{
          height: '300px',
          backgroundImage: `url(${restaurant.image || 'https://via.placeholder.com/800x400?text=Restaurant+Image'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="position-absolute w-100 h-100"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        />
        <Container className="position-relative h-100 d-flex flex-column justify-content-end text-white pb-4">
          <h1 className="display-4 mb-3">{restaurant.name}</h1>
          <div className="d-flex gap-2 align-items-center">
            <div className="text-warning">
              {'★'.repeat(Math.floor(restaurant.rating || 0))}
              {'☆'.repeat(5 - Math.floor(restaurant.rating || 0))}
            </div>
            {restaurant.cuisine && <span className="badge bg-secondary">{restaurant.cuisine}</span>}
            {restaurant.deliveryTime && <span className="badge bg-secondary">{restaurant.deliveryTime}</span>}
            {restaurant.priceRange && <span className="badge bg-secondary">{restaurant.priceRange}</span>}
          </div>
        </Container>
      </div>

      <Container className="py-4">
        <h2 className="mb-4">Menu</h2>
        {showLoginAlert && (
          <Alert variant="warning" onClose={() => setShowLoginAlert(false)} dismissible>
            Please <Button variant="link" className="p-0" onClick={() => navigate('/login')}>login</Button> to add items to your cart.
          </Alert>
        )}
        <Nav variant="tabs" activeKey={foodType} onSelect={k => setFoodType((k as 'all' | 'veg' | 'non-veg') || 'all')} className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="all">All</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="veg">Vegetarian</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="non-veg">Non-Vegetarian</Nav.Link>
          </Nav.Item>
        </Nav>
        <Row className="g-4">
          {filteredMenu.map((item, idx) => (
            <Col key={idx} xs={12} sm={6} md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Img
                  variant="top"
                  src={item.image || 'https://via.placeholder.com/300x200?text=Dish+Image'}
                  alt={item.name}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <Card.Body>
                  <Card.Title>
                    {item.name}
                    {item.type === 'veg' ? vegBadge : item.type === 'non-veg' ? nonVegBadge : null}
                  </Card.Title>
                  <Card.Text className="text-muted">{item.description}</Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <h5 className="text-primary mb-0">${item.price?.toFixed(2)}</h5>
                    <Button variant="primary" onClick={() => handleAddToCart(item)}>
                      Add to Cart
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add to Cart</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <div>
              <h5>{selectedItem.name}</h5>
              <p className="text-muted">{selectedItem.description}</p>
              <div className="d-flex align-items-center mt-3">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                >
                  -
                </Button>
                <Form.Control
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="mx-2"
                  style={{ width: '60px' }}
                />
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                >
                  +
                </Button>
              </div>
              <h5 className="mt-3">
                Total: ${(selectedItem.price * quantity).toFixed(2)}
              </h5>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmOrder}>
            Add to Cart
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RestaurantDetail; 