import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { CartProvider } from './contexts/CartContext';
import { initializeDatabase } from './utils/initDb';
import CustomerDashboard from './pages/CustomerDashboard';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import AppNavbar from './components/Navbar';
import Cart from './pages/Cart';
import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  useEffect(() => {
    // Initialize the database with sample data
    initializeDatabase();
  }, []);

  return (
    <FirebaseProvider>
      <CartProvider>
        <Router>
          <AppNavbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
            <Route path="/" element={<PrivateRoute><CustomerDashboard /></PrivateRoute>} />
            <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
            <Route path="/tracking" element={<PrivateRoute><OrderTracking /></PrivateRoute>} />
          </Routes>
        </Router>
      </CartProvider>
    </FirebaseProvider>
  );
};

export default App;
