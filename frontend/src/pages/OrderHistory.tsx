import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Table, Button } from 'react-bootstrap';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import { useAuth } from '../contexts/AuthContext';

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

interface Order {
  id: string;
  restaurantId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'online' | 'offline';
  deliveryAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderHistory = () => {
  const { db } = useFirebase();
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('customerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Order[];
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, currentUser]);

  const getStatusBadge = (status: Order['status']) => {
    const statusColors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'primary',
      ready: 'success',
      delivering: 'info',
      delivered: 'success',
      cancelled: 'danger',
    };

    return (
      <Badge bg={statusColors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Order History</h2>
      {orders.length === 0 ? (
        <Card>
          <Card.Body className="text-center">
            <p className="mb-0">No orders found.</p>
          </Card.Body>
        </Card>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Order #{order.id}</strong>
                <span className="ms-2">{getStatusBadge(order.status)}</span>
              </div>
              <div>
                <small className="text-muted">
                  {order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}
                </small>
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-end">
                      <strong>Total Amount:</strong>
                    </td>
                    <td>
                      <strong>${order.totalAmount.toFixed(2)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </Table>
              <Row className="mt-3">
                <Col md={6}>
                  <p className="mb-1">
                    <strong>Delivery Address:</strong>
                  </p>
                  <p className="mb-1">{order.deliveryAddress}</p>
                </Col>
                <Col md={6}>
                  <p className="mb-1">
                    <strong>Payment Method:</strong> {order.paymentMethod}
                  </p>
                  <p className="mb-1">
                    <strong>Payment Status:</strong>{' '}
                    <Badge bg={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                      {order.paymentStatus}
                    </Badge>
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
};

export default OrderHistory;
export {}