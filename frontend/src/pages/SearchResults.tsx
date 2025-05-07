import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRestaurants } from '../hooks/useFirestoreData';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchResults = () => {
  const query = useQuery().get('q')?.toLowerCase() || '';
  const { restaurants, loading } = useRestaurants();
  const navigate = useNavigate();

  // Find matching restaurants and dishes
  const { matchedRestaurants, matchedDishes } = useMemo(() => {
    const matchedRestaurants = restaurants.filter((r: any) =>
      r.name?.toLowerCase().includes(query) ||
      r.cuisine?.toLowerCase().includes(query)
    );
    const matchedDishes: { dish: any; restaurant: any }[] = [];
    for (const r of restaurants) {
      if (Array.isArray((r as any).menu)) {
        for (const dish of (r as any).menu) {
          if (
            dish.name?.toLowerCase().includes(query) ||
            dish.type?.toLowerCase().includes(query) ||
            dish.description?.toLowerCase().includes(query)
          ) {
            matchedDishes.push({ dish, restaurant: r });
          }
        }
      }
    }
    return { matchedRestaurants, matchedDishes };
  }, [restaurants, query]);

  return (
    <Container className="py-4">
      <h2 className="mb-4">Search Results for "{query}"</h2>
      {loading ? (
        <div className="text-center my-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <h4>Restaurants</h4>
          <Row className="g-4 mb-4">
            {matchedRestaurants.length === 0 && <p className="text-muted">No restaurants found.</p>}
            {matchedRestaurants.map((restaurant: any) => (
              <Col key={restaurant.id} xs={12} sm={6} md={4} lg={3}>
                <Card className="h-100 shadow-sm hover-shadow" onClick={() => navigate(`/restaurant/${restaurant.id}`)}>
                  <Card.Img
                    variant="top"
                    src={restaurant.image || 'https://via.placeholder.com/300x200?text=Restaurant+Image'}
                    alt={restaurant.name}
                    style={{ height: '180px', objectFit: 'cover' }}
                  />
                  <Card.Body>
                    <Card.Title>{restaurant.name}</Card.Title>
                    <div className="d-flex align-items-center mb-2">
                      <div className="text-warning">
                        {'★'.repeat(Math.floor(restaurant.rating || 0))}
                        {'☆'.repeat(5 - Math.floor(restaurant.rating || 0))}
                      </div>
                      <small className="text-muted ms-2">({restaurant.rating ?? 'N/A'})</small>
                    </div>
                    <div className="d-flex gap-2 mb-2">
                      {restaurant.cuisine && <Badge bg="secondary">{restaurant.cuisine}</Badge>}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          <h4>Dishes</h4>
          <Row className="g-4">
            {matchedDishes.length === 0 && <p className="text-muted">No dishes found.</p>}
            {matchedDishes.map(({ dish, restaurant }, idx) => (
              <Col key={idx} xs={12} sm={6} md={4} lg={3}>
                <Card className="h-100 shadow-sm">
                  <Card.Img
                    variant="top"
                    src={dish.image || 'https://via.placeholder.com/300x200?text=Dish+Image'}
                    alt={dish.name}
                    style={{ height: '180px', objectFit: 'cover' }}
                  />
                  <Card.Body>
                    <Card.Title>{dish.name}</Card.Title>
                    <div className="mb-2">
                      <Badge bg={dish.type === 'veg' ? 'success' : 'danger'}>{dish.type === 'veg' ? 'Veg' : 'Non-Veg'}</Badge>
                    </div>
                    <Card.Text className="text-muted">{dish.description}</Card.Text>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <h5 className="text-primary mb-0">${dish.price?.toFixed(2)}</h5>
                      <Button variant="primary" onClick={() => navigate(`/restaurant/${restaurant.id}`)}>
                        View Restaurant
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </Container>
  );
};

export default SearchResults; 