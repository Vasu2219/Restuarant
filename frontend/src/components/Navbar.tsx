import React, { useState } from 'react';
import { Navbar, Nav, Container, Button, Badge, Form, FormControl, NavDropdown, Modal, Row, Col, Card, ListGroup, Spinner, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { updatePassword, signOut } from 'firebase/auth';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const AppNavbar = () => {
  const { items, removeItem, clearCart } = useCart();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [showCart, setShowCart] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [showOrder, setShowOrder] = useState(false);
  const [address, setAddress] = useState('');
  const [orderError, setOrderError] = useState('');

  const total = items.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 0), 0);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    if (!user) return;
    try {
      await updatePassword(user, newPassword);
      setPasswordSuccess('Password updated successfully!');
      setShowChangePassword(false);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
      setNewPassword('');
    }
  };

  // Razorpay payment handler
  const handleRazorpay = () => {
    if (!window.Razorpay) {
      alert('Razorpay SDK not loaded.');
      return;
    }
    const options = {
      key: 'rzp_test_YourKeyHere', // Replace with your Razorpay key
      amount: Math.round(total * 100), // in paise
      currency: 'INR',
      name: 'VHs Resturent',
      description: 'Order Payment',
      handler: function (response: any) {
        setPaymentSuccess('Payment successful! Payment ID: ' + response.razorpay_payment_id);
        setShowPayment(false);
        setShowCart(false);
        clearCart();
      },
      prefill: {
        email: user?.email || '',
      },
      theme: {
        color: '#F37254',
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleOffline = () => {
    setPaymentSuccess('Order placed successfully! Please pay cash on delivery.');
    setShowPayment(false);
    setShowCart(false);
    clearCart();
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm mb-4 py-2">
      <Container>
        {/* Logo and Brand */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src="https://th.bing.com/th/id/OIP.hJ1B9NWepMT0PvY5G0fNlgHaHa?w=195&h=194&c=7&r=0&o=5&dpr=1.3&pid=1.7"
            alt="Logo"
            height="32"
            className="me-2"
          />
          <span style={{ fontWeight: 700, fontSize: 24, fontFamily: 'cursive', color: '#222' }}>
            VHs Resturent
          </span>
        </Navbar.Brand>

        {/* Location Selector (optional) */}
        <Nav className="me-3 d-none d-lg-flex">
          <NavDropdown title="Delhi" id="location-dropdown">
            <NavDropdown.Item>Delhi</NavDropdown.Item>
            <NavDropdown.Item>Mumbai</NavDropdown.Item>
            <NavDropdown.Item>Bangalore</NavDropdown.Item>
          </NavDropdown>
        </Nav>

        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          {/* Search Bar */}
          <Form className="d-flex mx-auto my-2 my-lg-0" style={{ maxWidth: 400, width: '100%' }}>
            <FormControl
              type="search"
              placeholder="Search for dishes or restaurants"
              className="me-2"
              aria-label="Search"
            />
            <Button variant="outline-secondary">Search</Button>
          </Form>

          {/* Navigation Links */}
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/">
              <i className="bi bi-house"></i> Home
            </Nav.Link>
            <Nav.Link as={Link} to="/about">
              <i className="bi bi-info-circle"></i> About
            </Nav.Link>
            <Nav.Link as={Link} to="/contact">
              <i className="bi bi-telephone"></i> Contact
            </Nav.Link>
            {/* Cart Icon */}
            <Nav.Link style={{ position: 'relative' }}>
              <Dropdown align="end" show={showCart} onToggle={() => setShowCart(!showCart)}>
                <Dropdown.Toggle as="span" style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}>
                  {/* Modern cart SVG icon */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-shopping-cart">
                    <circle cx="9" cy="21" r="1.5" />
                    <circle cx="19" cy="21" r="1.5" />
                    <path d="M1.5 1.5h3l2.4 13.2a2 2 0 0 0 2 1.8h7.6a2 2 0 0 0 2-1.6l1.7-8.4H6.1" />
                  </svg>
                  <Badge bg="warning" pill className="ms-1" style={{ position: 'absolute', top: -6, right: -8, fontSize: 13, minWidth: 22, minHeight: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    {items.length}
                  </Badge>
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ minWidth: 350, maxWidth: 400, padding: 0 }}>
                  <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                    {items.length === 0 ? (
                      <div className="text-center text-muted py-4">Your cart is empty.</div>
                    ) : (
                      <ListGroup variant="flush">
                        {items.map((item, idx) => (
                          <ListGroup.Item key={idx} className="d-flex align-items-center">
                            <img
                              src={item.image || 'https://via.placeholder.com/60x60?text=Food'}
                              alt={item.name}
                              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, marginRight: 10 }}
                            />
                            <div style={{ flex: 1 }}>
                              <div className="fw-bold">{item.name}</div>
                              <div className="text-muted" style={{ fontSize: 14 }}>
                                ₹{(item.price ?? 0).toFixed(2)} x {item.quantity}
                              </div>
                            </div>
                            <Button variant="outline-danger" size="sm" onClick={() => removeItem(item.id)}>
                              <i className="bi bi-trash"></i>
                            </Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </div>
                  <div className="border-top p-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="fw-bold">Total:</span>
                      <span className="fw-bold">₹{total.toFixed(2)}</span>
                    </div>
                    <Button
                      variant="success"
                      className="w-100"
                      disabled={items.length === 0}
                      onClick={() => {
                        setShowOrder(true);
                        setShowCart(false);
                      }}
                    >
                      Place Order
                    </Button>
                  </div>
                </Dropdown.Menu>
              </Dropdown>
            </Nav.Link>
            {/* Profile Dropdown */}
            {user ? (
              <NavDropdown
                title={<i className="bi bi-person-circle" style={{ fontSize: 22 }}></i>}
                id="profile-dropdown"
                align="end"
              >
                <NavDropdown.Item disabled>{user.email}</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => setShowProfile(true)}>Profile</NavDropdown.Item>
                <NavDropdown.Item onClick={() => setShowChangePassword(true)}>Change Password</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Button
                variant="warning"
                className="ms-2 px-4 fw-bold"
                style={{ borderRadius: 8 }}
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>

      {/* Order Modal: Address and Payment */}
      <Modal show={showOrder} onHide={() => setShowOrder(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Place Your Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Delivery Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
                placeholder="Enter your delivery address"
              />
            </Form.Group>
            <div className="mb-3">
              <div className="fw-bold mb-2">Billing Summary</div>
              <div className="d-flex justify-content-between">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Delivery Fee</span>
                <span>₹0.00</span>
              </div>
              <div className="d-flex justify-content-between border-top pt-2 mt-2">
                <span className="fw-bold">Total</span>
                <span className="fw-bold">₹{total.toFixed(2)}</span>
              </div>
            </div>
            {orderError && <div className="text-danger mb-2">{orderError}</div>}
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                className="w-100"
                onClick={() => {
                  if (!address.trim()) {
                    setOrderError('Please enter a delivery address.');
                    return;
                  }
                  setOrderError('');
                  setShowOrder(false);
                  setShowPayment(true);
                }}
              >
                Pay Online (Razorpay)
              </Button>
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() => {
                  if (!address.trim()) {
                    setOrderError('Please enter a delivery address.');
                    return;
                  }
                  setOrderError('');
                  handleOffline();
                  setShowOrder(false);
                }}
              >
                Pay Offline (Cash on Delivery)
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Payment Modal */}
      <Modal show={showPayment} onHide={() => setShowPayment(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Choose Payment Method</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <Button variant="primary" className="mb-3 w-100" onClick={handleRazorpay}>
            Pay with Razorpay
          </Button>
          <Button variant="outline-secondary" className="w-100" onClick={handleOffline}>
            Pay Offline (Cash on Delivery)
          </Button>
        </Modal.Body>
      </Modal>

      {/* Payment Success Modal */}
      <Modal show={!!paymentSuccess} onHide={() => setPaymentSuccess('')} centered>
        <Modal.Header closeButton>
          <Modal.Title>Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="text-success fw-bold mb-3">{paymentSuccess}</div>
          <Button variant="primary" onClick={() => setPaymentSuccess('')}>
            Close
          </Button>
        </Modal.Body>
      </Modal>

      {/* Profile Modal */}
      <Modal show={showProfile} onHide={() => setShowProfile(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {user ? (
            <div>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>UID:</strong> {user.uid}</p>
              {/* Add more user details here if needed */}
            </div>
          ) : (
            <Spinner animation="border" />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfile(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Change Password Modal */}
      <Modal show={showChangePassword} onHide={() => setShowChangePassword(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleChangePassword}>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </Form.Group>
            {passwordError && <div className="text-danger mb-2">{passwordError}</div>}
            {passwordSuccess && <div className="text-success mb-2">{passwordSuccess}</div>}
            <Button variant="primary" type="submit" disabled={passwordLoading}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Navbar>
  );
};

export default AppNavbar; 