import React from 'react';
import { Container, Typography, Button, List, ListItem, ListItemText, Paper, Divider, Alert } from '@mui/material';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

// Add Razorpay script loader
const loadRazorpayScript = (src: string) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePayment = async () => {
    const res = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }
    const options = {
      key: 'rzp_test_YourKeyHere', // Replace with your Razorpay key
      amount: total * 100, // amount in paise
      currency: 'INR',
      name: 'FoodZone',
      description: 'Payment for your order',
      handler: function (response: any) {
        alert('Payment successful! Payment ID: ' + response.razorpay_payment_id);
        clearCart();
        navigate('/');
      },
      prefill: {
        name: 'Customer Name',
        email: 'customer@example.com',
        contact: '9999999999',
      },
      theme: {
        color: '#F37254',
      },
    };
    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: 40 }}>
      <Paper elevation={3} style={{ padding: 24 }}>
        <Typography variant="h4" gutterBottom>
          Checkout
        </Typography>
        {items.length === 0 ? (
          <Alert severity="info">Your cart is empty.</Alert>
        ) : (
          <>
            <List>
              {items.map((item: any, idx: number) => (
                <ListItem key={idx}>
                  <ListItemText
                    primary={item.name}
                    secondary={`$${item.price} x ${item.quantity}`}
                  />
                </ListItem>
              ))}
            </List>
            <Divider style={{ margin: '16px 0' }} />
            <Typography variant="h6" gutterBottom>
              Total: ${total.toFixed(2)}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handlePayment}
            >
              Pay with Razorpay
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Checkout; 