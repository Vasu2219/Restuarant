import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Spinner, Form, Toast, ToastContainer, Alert } from 'react-bootstrap';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const { db } = useFirebase();
  const { items, addItem, removeItem } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [foodType, setFoodType] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'menuItems'));
        let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (items.length === 0) {
          // Add default items if collection is empty
          const defaultItems = [
            {
              id: '1',
              name: 'Pizza',
              price: 15,
              image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
              description: 'Cheesy Margherita pizza with fresh basil.',
              type: 'veg',
            },
            {
              id: '2',
              name: 'Burger',
              price: 18,
              image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80',
              description: 'Juicy beef burger with lettuce and tomato.',
              type: 'non-veg',
            },
            {
              id: '3',
              name: 'Salad',
              price: 12,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Fresh garden salad with vinaigrette.',
              type: 'veg',
            },
            {
              id: '4',
              name: 'Pasta',
              price: 20,
              image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0723c6f?auto=format&fit=crop&w=400&q=80',
              description: 'Creamy Alfredo pasta with mushrooms.',
              type: 'veg',
            },
            {
              id: '5',
              name: 'Sushi',
              price: 22,
              image: 'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=400&q=80',
              description: 'Assorted sushi platter with wasabi.',
              type: 'non-veg',
            },
            {
              id: '6',
              name: 'Tacos',
              price: 16,
              image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80',
              description: 'Spicy chicken tacos with salsa.',
              type: 'non-veg',
            },
            {
              id: '7',
              name: 'Paneer Tikka',
              price: 17,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Grilled paneer cubes marinated in spices.',
              type: 'veg',
            },
            {
              id: '8',
              name: 'Chicken Biryani',
              price: 19,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Aromatic rice with spicy chicken pieces.',
              type: 'non-veg',
            },
            {
              id: '9',
              name: 'Dosa',
              price: 13,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Crispy South Indian rice crepe.',
              type: 'veg',
            },
            {
              id: '10',
              name: 'Fish Curry',
              price: 21,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Spicy fish curry with coconut milk.',
              type: 'non-veg',
            },
            {
              id: '11',
              name: 'Falafel Wrap',
              price: 15,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Middle Eastern wrap with falafel and veggies.',
              type: 'veg',
            },
            {
              id: '12',
              name: 'Egg Fried Rice',
              price: 16,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Fried rice with eggs and vegetables.',
              type: 'non-veg',
            },
            {
              id: '13',
              name: 'Chole Bhature',
              price: 14,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'North Indian dish with spicy chickpeas and fried bread.',
              type: 'veg',
            },
            {
              id: '14',
              name: 'Momos',
              price: 13,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Steamed dumplings with spicy sauce.',
              type: 'veg',
            },
            {
              id: '15',
              name: 'Lamb Kebab',
              price: 23,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Grilled lamb skewers with spices.',
              type: 'non-veg',
            },
            {
              id: '16',
              name: 'Veggie Pizza',
              price: 17,
              image: 'https://images.unsplash.com/photo-1547592180-8717c3b6c6b5?auto=format&fit=crop&w=400&q=80',
              description: 'Loaded with fresh veggies and mozzarella.',
              type: 'veg',
            },
            {
              id: '17',
              name: 'Butter Chicken',
              price: 20,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Creamy tomato-based chicken curry.',
              type: 'non-veg',
            },
            {
              id: '18',
              name: 'Spring Rolls',
              price: 12,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Crispy rolls stuffed with veggies.',
              type: 'veg',
            },
            {
              id: '19',
              name: 'Pav Bhaji',
              price: 15,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Spicy mashed veggies with buttered buns.',
              type: 'veg',
            },
            {
              id: '20',
              name: 'Chicken Shawarma',
              price: 18,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
              description: 'Middle Eastern wrap with juicy chicken.',
              type: 'non-veg',
            },
          ];
          for (const item of defaultItems) {
            await setDoc(doc(collection(db, 'menuItems'), item.id), item);
          }
          items = defaultItems;
        }
        setMenuItems(items);
      } catch (e) {
        // fallback sample data if Firestore fails
        setMenuItems([
          {
            id: '1',
            name: 'Pizza',
            price: 10,
            image: 'https://res.cloudinary.com/demo/image/upload/pizza.jpg',
          },
          {
            id: '2',
            name: 'Burger',
            price: 8,
            image: 'https://res.cloudinary.com/demo/image/upload/burger.jpg',
          },
          {
            id: '3',
            name: 'Salad',
            price: 6,
            image: 'https://res.cloudinary.com/demo/image/upload/salad.jpg',
          },
        ]);
      }
      setLoading(false);
    };
    fetchMenu();
  }, [db]);

  const handleAddToCart = (item: any) => {
    if (!currentUser) {
      setShowLoginAlert(true);
      return;
    }
    addItem({ ...item, quantity: 1 });
    setToastMsg(`${item.name} added to cart!`);
    setShowToast(true);
  };

  const total = items.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 0), 0);

  // Filtering logic
  const filteredMenu = menuItems.filter(item => {
    const matchesType = foodType === 'all' || item.type === foodType;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const addIndianDishesToFirestore = async () => {
    const newIndianDishes = [
      {
        id: '101',
        name: 'Hyderabadi Biryani',
        price: 22,
        image: 'https://images.unsplash.com/photo-1600628422019-6c3d1b6c9a4b?auto=format&fit=crop&w=400&q=80',
        description: 'Aromatic basmati rice cooked with marinated chicken and spices, served with raita.',
        type: 'non-veg',
      },
      {
        id: '102',
        name: 'Chicken Rice',
        price: 18,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
        description: 'Steamed rice served with spicy chicken curry and boiled eggs.',
        type: 'non-veg',
      },
      {
        id: '103',
        name: 'Mutton Biryani',
        price: 25,
        image: 'https://images.unsplash.com/photo-1506368083636-6defb67639d0?auto=format&fit=crop&w=400&q=80',
        description: 'Tender mutton pieces cooked with fragrant rice and traditional spices.',
        type: 'non-veg',
      },
      {
        id: '104',
        name: 'Veg Pulao',
        price: 15,
        image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80',
        description: 'Basmati rice cooked with fresh vegetables and mild spices.',
        type: 'veg',
      },
      {
        id: '105',
        name: 'Paneer Butter Masala',
        price: 17,
        image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0723c6f?auto=format&fit=crop&w=400&q=80',
        description: 'Cottage cheese cubes in a creamy tomato gravy, served with naan.',
        type: 'veg',
      }
    ];
    for (const item of newIndianDishes) {
      await setDoc(doc(collection(db, 'menuItems'), item.id), item);
    }
    setToastMsg('Indian dishes added!');
    setShowToast(true);
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Welcome, Food Lover!</h2>
      {showLoginAlert && (
        <Alert variant="warning" onClose={() => setShowLoginAlert(false)} dismissible>
          Please <Button variant="link" className="p-0" onClick={() => navigate('/login')}>login</Button> to add items to your cart.
        </Alert>
      )}
      <Row>
        <Col md={8}>
          <h4 className="mb-3">Menu</h4>
          <div className="d-flex flex-wrap align-items-center mb-3 gap-2">
            <Form.Control
              type="search"
              placeholder="Search for food..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 300 }}
            />
            <Button
              variant={foodType === 'all' ? 'success' : 'outline-success'}
              size="sm"
              onClick={() => setFoodType('all')}
            >
              All
            </Button>
            <Button
              variant={foodType === 'veg' ? 'success' : 'outline-success'}
              size="sm"
              onClick={() => setFoodType('veg')}
            >
              Veg
            </Button>
            <Button
              variant={foodType === 'non-veg' ? 'danger' : 'outline-danger'}
              size="sm"
              onClick={() => setFoodType('non-veg')}
            >
              Non-Veg
            </Button>
          </div>
          {/* Add Indian Dishes Button (for demo/admin) */}
          <Button variant="warning" className="mb-3" onClick={addIndianDishesToFirestore}>
            Add Indian Dishes
          </Button>
          {loading ? (
            <div className="text-center my-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <Row className="g-4">
              {filteredMenu.map((item) => (
                <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                  <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 16 }}>
                    <Card.Img
                      variant="top"
                      src={item.image}
                      alt={item.name}
                      style={{ height: 160, objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                    />
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="fw-bold mb-1 d-flex align-items-center gap-2">
                        {item.name}
                        {item.type === 'veg' && <Badge bg="success">Veg</Badge>}
                        {item.type === 'non-veg' && <Badge bg="danger">Non-Veg</Badge>}
                      </Card.Title>
                      <Card.Text className="text-muted mb-2" style={{ fontSize: 14, minHeight: 36 }}>{item.description}</Card.Text>
                      <div className="d-flex align-items-center mb-3">
                        <Badge bg="success" className="me-2" style={{ fontSize: 15 }}>
                          ₹{item.price?.toFixed(2)}
                        </Badge>
                      </div>
                      <Button variant="primary" onClick={() => handleAddToCart(item)} className="mt-auto w-100" style={{ borderRadius: 8 }}>
                        Add to Cart
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={1800} autohide bg="success">
          <Toast.Body className="text-white">{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default CustomerDashboard; 