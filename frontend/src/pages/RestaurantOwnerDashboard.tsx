import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Nav, Tab, Table, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, getDocs, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import { useAuth } from '../contexts/AuthContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TabPanelProps {
  children?: React.ReactNode;
  eventKey: string;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, eventKey } = props;
  return <Tab.Pane eventKey={eventKey}>{children}</Tab.Pane>;
};

const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
const CLOUDINARY_CLOUD_NAME = 'Restaurant';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  status: 'Available' | 'Unavailable';
  image: string;
  type: 'veg' | 'non-veg';
  description: string;
  preparationTime?: number;
  calories?: number;
  ingredients?: string;
  allergens?: string;
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra-hot';
  isPopular?: boolean;
  isSpecial?: boolean;
  restaurantId: string;
  createdAt: Date;
}

interface Order {
  id: string;
  customerId: string;
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

interface Analytics {
  todayOrders: number;
  todayRevenue: number;
  averageOrderValue: number;
  popularItems: { name: string; count: number }[];
  dailyRevenue: { date: string; amount: number }[];
}

const RestaurantOwnerDashboard = () => {
  const navigate = useNavigate();
  const { db } = useFirebase();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('menu');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    todayOrders: 0,
    todayRevenue: 0,
    averageOrderValue: 0,
    popularItems: [],
    dailyRevenue: [],
  });
  const [uploading, setUploading] = useState(false);
  const [newDish, setNewDish] = useState({
    name: '',
    category: '',
    price: '',
    status: 'Available',
    image: '',
    type: 'veg',
    description: '',
    preparationTime: '',
    calories: '',
    ingredients: '',
    allergens: '',
    spiceLevel: 'medium',
    isPopular: false,
    isSpecial: false,
  });

  useEffect(() => {
    if (!currentUser) return;

    // Fetch menu items
    const menuRef = collection(db, 'menuItems');
    const menuQuery = query(menuRef, where('restaurantId', '==', currentUser.uid));
    const menuUnsubscribe = onSnapshot(menuQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
      setMenuItems(items);
    });

    // Fetch orders
    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(
      ordersRef,
      where('restaurantId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const ordersUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Order[];
      setOrders(ordersData);
      calculateAnalytics(ordersData);
    });

    return () => {
      menuUnsubscribe();
      ordersUnsubscribe();
    };
  }, [db, currentUser]);

  const calculateAnalytics = (ordersData: Order[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = ordersData.filter(order => 
      order.createdAt >= today
    );

    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = todayOrders.length > 0 
      ? todayRevenue / todayOrders.length 
      : 0;

    // Calculate popular items
    const itemCounts = new Map<string, number>();
    ordersData.forEach(order => {
      order.items.forEach(item => {
        const count = itemCounts.get(item.name) || 0;
        itemCounts.set(item.name, count + item.quantity);
      });
    });

    const popularItems = Array.from(itemCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate daily revenue for the last 7 days
    const dailyRevenue = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayOrders = ordersData.filter(order => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === date.getTime();
      });

      const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      return {
        date: date.toLocaleDateString(),
        amount: revenue,
      };
    }).reverse();

    setAnalytics({
      todayOrders: todayOrders.length,
      todayRevenue,
      averageOrderValue,
      popularItems,
      dailyRevenue,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview image before upload
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setNewDish((prev) => ({ ...prev, image: data.secure_url }));
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const menuItem = {
      ...newDish,
      price: parseFloat(newDish.price),
      preparationTime: parseInt(newDish.preparationTime),
      calories: parseInt(newDish.calories),
      restaurantId: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await addDoc(collection(db, 'menuItems'), menuItem);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  const handleEditDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItem) return;

    const updatedItem = {
      ...newDish,
      price: parseFloat(newDish.price),
      preparationTime: parseInt(newDish.preparationTime),
      calories: parseInt(newDish.calories),
      updatedAt: new Date(),
    };

    try {
      await updateDoc(doc(db, 'menuItems', selectedMenuItem.id), updatedItem);
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const handleEditClick = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setNewDish({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      status: item.status,
      image: item.image,
      type: item.type,
      description: item.description,
      preparationTime: item.preparationTime?.toString() || '',
      calories: item.calories?.toString() || '',
      ingredients: item.ingredients || '',
      allergens: item.allergens || '',
      spiceLevel: item.spiceLevel || 'medium',
      isPopular: item.isPopular || false,
      isSpecial: item.isSpecial || false,
    });
    setImagePreview(item.image);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setNewDish({
      name: '',
      category: '',
      price: '',
      status: 'Available',
      image: '',
      type: 'veg',
      description: '',
      preparationTime: '',
      calories: '',
      ingredients: '',
      allergens: '',
      spiceLevel: 'medium',
      isPopular: false,
      isSpecial: false,
    });
    setImagePreview(null);
    setSelectedMenuItem(null);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await deleteDoc(doc(db, 'menuItems', itemId));
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  };

  const revenueChartData = {
    labels: analytics.dailyRevenue.map(item => item.date),
    datasets: [
      {
        label: 'Daily Revenue',
        data: analytics.dailyRevenue.map(item => item.amount),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Restaurant Dashboard</h1>

      {/* Quick Stats */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} md={3}>
          <Card className="h-100">
            <Card.Body>
              <Card.Subtitle className="text-muted mb-2">Today's Orders</Card.Subtitle>
              <Card.Title>{analytics.todayOrders}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="h-100">
            <Card.Body>
              <Card.Subtitle className="text-muted mb-2">Today's Revenue</Card.Subtitle>
              <Card.Title>${analytics.todayRevenue.toFixed(2)}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="h-100">
            <Card.Body>
              <Card.Subtitle className="text-muted mb-2">Average Order Value</Card.Subtitle>
              <Card.Title>${analytics.averageOrderValue.toFixed(2)}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="h-100">
            <Card.Body>
              <Card.Subtitle className="text-muted mb-2">Popular Items</Card.Subtitle>
              <Card.Text>
                {analytics.popularItems.map(item => item.name).join(', ')}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card>
        <Card.Body>
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'menu')}>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="menu">Menu</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="orders">Orders</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="analytics">Analytics</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* Menu Tab */}
              <TabPanel eventKey="menu">
                <div className="mb-3">
                  <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    Add Menu Item
                  </Button>
                </div>
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Image</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>
                          <Badge bg={item.status === 'Available' ? 'success' : 'danger'}>
                            {item.status}
                          </Badge>
                        </td>
                        <td>{item.type === 'veg' ? 'Veg' : 'Non-Veg'}</td>
                        <td>
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{ width: 40, height: 40, objectFit: 'cover' }}
                            />
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEditClick(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteMenuItem(item.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TabPanel>

              {/* Orders Tab */}
              <TabPanel eventKey="orders">
                <div className="list-group">
                  {orders.map((order) => (
                    <div key={order.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">Order #{order.id}</h5>
                        <Badge bg={
                          order.status === 'delivered' ? 'success' :
                          order.status === 'cancelled' ? 'danger' :
                          'primary'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="mb-1">Items: {order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}</p>
                      <p className="mb-1">Total: ${order.totalAmount.toFixed(2)}</p>
                      <p className="mb-1">Time: {order.createdAt.toLocaleTimeString()}</p>
                      <div className="mt-2">
                        <Form.Select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                          className="mb-2"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="delivering">Delivering</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </Form.Select>
                      </div>
                    </div>
                  ))}
                </div>
              </TabPanel>

              {/* Analytics Tab */}
              <TabPanel eventKey="analytics">
                <Row className="g-3">
                  <Col xs={12}>
                    <Card>
                      <Card.Body>
                        <Card.Title>Revenue Trend (Last 7 Days)</Card.Title>
                        <div style={{ height: '300px' }}>
                          <Line data={revenueChartData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  callback: (value) => `$${value}`
                                }
                              }
                            }
                          }} />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} md={6}>
                    <Card>
                      <Card.Body>
                        <Card.Title>Popular Items</Card.Title>
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Orders</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.popularItems.map((item, index) => (
                              <tr key={index}>
                                <td>{item.name}</td>
                                <td>{item.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </TabPanel>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>

      {/* Add/Edit Dish Modal */}
      <Modal 
        show={showAddModal || showEditModal} 
        onHide={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{showEditModal ? 'Edit Menu Item' : 'Add Menu Item'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={showEditModal ? handleEditDish : handleAddDish}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newDish.name}
                    onChange={e => setNewDish({ ...newDish, name: e.target.value })}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={newDish.category}
                    onChange={e => setNewDish({ ...newDish, category: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Appetizers">Appetizers</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Sides">Sides</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Price ($)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={newDish.price}
                    onChange={e => setNewDish({ ...newDish, price: e.target.value })}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={newDish.type}
                    onChange={e => setNewDish({ ...newDish, type: e.target.value as 'veg' | 'non-veg' })}
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Preparation Time (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={newDish.preparationTime}
                    onChange={e => setNewDish({ ...newDish, preparationTime: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Calories</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={newDish.calories}
                    onChange={e => setNewDish({ ...newDish, calories: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={newDish.description}
                    onChange={e => setNewDish({ ...newDish, description: e.target.value })}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Ingredients</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={newDish.ingredients}
                    onChange={e => setNewDish({ ...newDish, ingredients: e.target.value })}
                    placeholder="Enter ingredients separated by commas"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Allergens</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={newDish.allergens}
                    onChange={e => setNewDish({ ...newDish, allergens: e.target.value })}
                    placeholder="Enter allergens separated by commas"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Spice Level</Form.Label>
                  <Form.Select
                    value={newDish.spiceLevel}
                    onChange={e => setNewDish({ ...newDish, spiceLevel: e.target.value })}
                  >
                    <option value="mild">Mild</option>
                    <option value="medium">Medium</option>
                    <option value="hot">Hot</option>
                    <option value="extra-hot">Extra Hot</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mb-2"
                  />
                  {uploading && (
                    <div className="text-center">
                      <Spinner animation="border" size="sm" />
                      <span className="ms-2">Uploading...</span>
                    </div>
                  )}
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                      />
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Mark as Popular"
                    checked={newDish.isPopular}
                    onChange={e => setNewDish({ ...newDish, isPopular: e.target.checked })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Mark as Special"
                    checked={newDish.isSpecial}
                    onChange={e => setNewDish({ ...newDish, isSpecial: e.target.checked })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {showEditModal ? 'Update Item' : 'Add Item'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default RestaurantOwnerDashboard; 