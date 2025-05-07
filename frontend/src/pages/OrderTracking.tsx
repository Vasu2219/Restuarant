import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';

interface Order {
  id: string;
  items: { name: string; quantity: number }[];
  status: 'Preparing' | 'Out for Delivery' | 'Delivered';
  total: number;
}

const OrderTracking = () => {
  const { db } = useFirebase();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(ordersData);
      },
      (err) => {
        console.error('Error fetching orders:', err);
      }
    );

    return () => unsubscribe();
  }, [db]);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Order Tracking
      </Typography>

      <Paper sx={{ p: 2 }}>
        <List>
          {orders.map((order) => (
            <ListItem key={order.id} divider>
              <ListItemText
                primary={`Order #${order.id}`}
                secondary={
                  <>
                    <Typography component="span" variant="body2">
                      Items: {order.items.map((item) => `${item.name} (${item.quantity})`).join(', ')}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2">
                      Total: ${order.total}
                    </Typography>
                  </>
                }
              />
              <Chip
                label={order.status}
                color={
                  order.status === 'Delivered'
                    ? 'success'
                    : order.status === 'Out for Delivery'
                    ? 'warning'
                    : 'primary'
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default OrderTracking; 