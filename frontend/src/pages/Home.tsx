import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Carousel } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useRestaurants } from '../hooks/useFirestoreData';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Home.css';

// Example Cloudinary banner images (replace with your own URLs or fetch from Firestore if needed)
const banners = [
  {
    image: 'https://res.cloudinary.com/demo/image/upload/v1680000000/food_banner1.jpg',
    title: "It's Snack Time!",
    subtitle: 'Get 50% OFF & Free Delivery on your first order.',
    cta: 'Order Now',
  },
  {
    image: 'https://res.cloudinary.com/demo/image/upload/v1680000000/food_banner2.jpg',
    title: 'Full Menu At ₹129',
    subtitle: 'On delicious delights from Burger King.',
    cta: 'Order Now',
  },
  {
    image: 'https://res.cloudinary.com/demo/image/upload/v1680000000/food_banner3.jpg',
    title: 'Get 50% OFF*',
    subtitle: 'On 10 new pizzas and more from Pizza Hut.',
    cta: 'Order Now',
  },
];

// Example categories with icons (replace with your own Cloudinary URLs)
const categories = [
  { name: 'Burger', image: 'https://res.cloudinary.com/demo/image/upload/v1680000000/burger_icon.png' },
  { name: 'Pizza', image: 'https://res.cloudinary.com/demo/image/upload/v1680000000/pizza_icon.png' },
  { name: 'Desserts', image: 'https://res.cloudinary.com/demo/image/upload/v1680000000/dessert_icon.png' },
  { name: 'Chinese', image: 'https://res.cloudinary.com/demo/image/upload/v1680000000/chinese_icon.png' },
  { name: 'Rolls', image: 'https://res.cloudinary.com/demo/image/upload/v1680000000/rolls_icon.png' },
  { name: 'Momos', image: 'https://res.cloudinary.com/demo/image/upload/v1680000000/momos_icon.png' },
  { name: 'Noodles', image: 'https://res.cloudinary.com/demo/image/upload/v1680000000/noodles_icon.png' },
  { name: 'Samosas', image: 'https://res.cloudinary.com/demo/image/upload/v1680000000/samosa_icon.png' },
];

const Home = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { restaurants, loading } = useRestaurants();

  // Filter restaurants by selected category
  const filteredRestaurants =
    selectedCategory === 'All'
      ? restaurants
      : restaurants.filter((r) => (r.cuisine || '').toLowerCase() === selectedCategory.toLowerCase());

  const handleRestaurantClick = (restaurantId: string) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  return (
    <div>
      {/* Hero/Banner Carousel */}
      <Container fluid className="p-0 mb-4">
        <Carousel indicators={false} interval={4000} pause={false}>
          {banners.map((banner, idx) => (
            <Carousel.Item key={idx}>
              <div
                style={{
                  height: '320px',
                  backgroundImage: `url(${banner.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '0 0 24px 24px',
                  position: 'relative',
                }}
                className="d-flex align-items-center justify-content-center"
              >
                <div style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 24, padding: 32, color: '#fff', maxWidth: 500 }}>
                  <h2 className="fw-bold mb-2">{banner.title}</h2>
                  <p className="mb-3">{banner.subtitle}</p>
                  <Button variant="warning" size="lg">{banner.cta}</Button>
                </div>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </Container>

      {/* Category Icons */}
      <Container className="mb-4">
        <h4 className="mb-3">What's on your mind?</h4>
        <div className="d-flex overflow-auto pb-2 mb-3" style={{ gap: '1rem' }}>
          <Button
            variant={selectedCategory === 'All' ? 'warning' : 'outline-secondary'}
            className="rounded-circle d-flex flex-column align-items-center justify-content-center"
            style={{ width: 80, height: 80 }}
            onClick={() => setSelectedCategory('All')}
          >
            <img src="https://res.cloudinary.com/demo/image/upload/v1680000000/all_icon.png" alt="All" style={{ width: 40, height: 40, marginBottom: 4 }} />
            <span style={{ fontSize: 14 }}>All</span>
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.name}
              variant={selectedCategory === cat.name ? 'warning' : 'outline-secondary'}
              className="rounded-circle d-flex flex-column align-items-center justify-content-center"
              style={{ width: 80, height: 80 }}
              onClick={() => setSelectedCategory(cat.name)}
            >
              <img src={cat.image} alt={cat.name} style={{ width: 40, height: 40, marginBottom: 4 }} />
              <span style={{ fontSize: 14 }}>{cat.name}</span>
            </Button>
          ))}
        </div>
      </Container>

      {/* Restaurants Near You */}
      <Container>
        <h4 className="mb-4">Restaurants near you</h4>
        {loading ? (
          <div className="text-center my-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <Row className="g-4">
            {filteredRestaurants.map((restaurant) => (
              <Col key={restaurant.id} xs={12} sm={6} md={4} lg={3}>
                <Card className="h-100 shadow-sm hover-shadow" onClick={() => handleRestaurantClick(restaurant.id)} style={{ cursor: 'pointer', borderRadius: 16 }}>
                  <Card.Img
                    variant="top"
                    src={restaurant.image || 'https://res.cloudinary.com/demo/image/upload/v1680000000/placeholder.jpg'}
                    alt={restaurant.name}
                    style={{ height: '180px', objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                  />
                  <Card.Body>
                    <Card.Title className="fw-bold mb-2">{restaurant.name}</Card.Title>
                    <div className="d-flex align-items-center mb-2">
                      <div className="text-warning">
                        {'★'.repeat(Math.floor(restaurant.rating || 0))}
                        {'☆'.repeat(5 - Math.floor(restaurant.rating || 0))}
                      </div>
                      <small className="text-muted ms-2">{restaurant.rating ?? 'N/A'}</small>
                    </div>
                    <div className="d-flex gap-2 mb-2">
                      {restaurant.cuisine && <Badge bg="secondary">{restaurant.cuisine}</Badge>}
                      {restaurant.deliveryTime && <Badge bg="secondary">{restaurant.deliveryTime}</Badge>}
                      {restaurant.priceRange && <Badge bg="secondary">{restaurant.priceRange}</Badge>}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Home; 