import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Nav, Tab } from 'react-bootstrap';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'customer' | 'restaurant_owner' | 'admin';
  isApproved?: boolean;
  createdAt: Date;
}

interface Restaurant {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
}

interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
}

const AdminDashboard = () => {
  const { db } = useFirebase();
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as User[];
      setUsers(usersData);

      // Fetch restaurants
      const restaurantsRef = collection(db, 'restaurants');
      const restaurantsSnapshot = await getDocs(restaurantsRef);
      const restaurantsData = restaurantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Restaurant[];
      setRestaurants(restaurantsData);

      // Fetch recent orders
      const ordersRef = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Order[];
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleApproveRestaurant = async (restaurantId: string) => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId), {
        status: 'active',
      });
      await fetchData();
    } catch (error) {
      console.error('Error approving restaurant:', error);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: User['role']) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
      });
      await fetchData();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleApproveOwner = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isApproved: true });
      await fetchData();
    } catch (error) {
      console.error('Error approving owner:', error);
    }
  };

  const handleRejectOwner = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isApproved: false });
      await fetchData();
    } catch (error) {
      console.error('Error rejecting owner:', error);
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Admin Dashboard</h1>

      {/* Quick Stats */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Subtitle className="text-muted mb-2">Total Users</Card.Subtitle>
              <Card.Title>{users.length}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Subtitle className="text-muted mb-2">Total Restaurants</Card.Subtitle>
              <Card.Title>{restaurants.length}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card className="h-100">
            <Card.Body>
              <Card.Subtitle className="text-muted mb-2">Total Orders</Card.Subtitle>
              <Card.Title>{orders.length}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card>
        <Card.Body>
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'users')}>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="users">Users</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="restaurants">Restaurants</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="orders">Orders</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* Users Tab */}
              <Tab.Pane eventKey="users">
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.uid}>
                        <td>{user.displayName}</td>
                        <td>{user.email}</td>
                        <td>
                          <Badge bg={
                            user.role === 'admin' ? 'danger' :
                            user.role === 'restaurant_owner' ? 'primary' :
                            'success'
                          }>
                            {user.role}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={user.isApproved ? 'success' : 'warning'}>
                            {user.isApproved ? 'Approved' : 'Pending'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleViewUserDetails(user)}
                          >
                            View Details
                          </Button>
                          <Form.Select
                            size="sm"
                            style={{ width: 'auto', display: 'inline-block' }}
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.uid, e.target.value as User['role'])}
                          >
                            <option value="customer">Customer</option>
                            <option value="restaurant_owner">Restaurant Owner</option>
                            <option value="admin">Admin</option>
                          </Form.Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab.Pane>

              {/* Restaurants Tab */}
              <Tab.Pane eventKey="restaurants">
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Owner</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.map((restaurant) => (
                      <tr key={restaurant.id}>
                        <td>{restaurant.name}</td>
                        <td>{restaurant.ownerName}</td>
                        <td>
                          <Badge bg={
                            restaurant.status === 'active' ? 'success' :
                            restaurant.status === 'inactive' ? 'danger' :
                            'warning'
                          }>
                            {restaurant.status}
                          </Badge>
                        </td>
                        <td>{restaurant.createdAt.toLocaleDateString()}</td>
                        <td>
                          {restaurant.status === 'pending' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleApproveRestaurant(restaurant.id)}
                            >
                              Approve
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab.Pane>

              {/* Orders Tab */}
              <Tab.Pane eventKey="orders">
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Restaurant</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.restaurantId}</td>
                        <td>{order.customerId}</td>
                        <td>${order.totalAmount.toFixed(2)}</td>
                        <td>
                          <Badge bg={
                            order.status === 'delivered' ? 'success' :
                            order.status === 'cancelled' ? 'danger' :
                            'primary'
                          }>
                            {order.status}
                          </Badge>
                        </td>
                        <td>{order.createdAt.toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab.Pane>

              {/* Pending Restaurant Owner Approvals */}
              {activeTab === 'users' && (
                <div className="mb-4">
                  <h5>Pending Restaurant Owner Approvals</h5>
                  <Table responsive bordered size="sm">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role === 'restaurant_owner' && !u.isApproved).length === 0 ? (
                        <tr><td colSpan={4} className="text-center">No pending requests</td></tr>
                      ) : (
                        users.filter(u => u.role === 'restaurant_owner' && !u.isApproved).map(user => (
                          <tr key={user.uid}>
                            <td>{user.displayName}</td>
                            <td>{user.email}</td>
                            <td>{user.createdAt ? user.createdAt.toLocaleDateString() : ''}</td>
                            <td>
                              <Button variant="success" size="sm" className="me-2" onClick={() => handleApproveOwner(user.uid)}>Approve</Button>
                              <Button variant="danger" size="sm" onClick={() => handleRejectOwner(user.uid)}>Reject</Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>

      {/* User Details Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p><strong>Name:</strong> {selectedUser.displayName}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Created At:</strong> {selectedUser.createdAt.toLocaleDateString()}</p>
              <p><strong>Status:</strong> {selectedUser.isApproved ? 'Approved' : 'Pending'}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard; 