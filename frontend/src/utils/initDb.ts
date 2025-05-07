import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const initializeDatabase = async () => {
  try {
    // Initialize users collection
    const usersRef = collection(db, 'users');
    const users = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Customer',
        status: 'Active',
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'Restaurant Owner',
        status: 'Active',
      },
      {
        id: '3',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'Admin',
        status: 'Active',
      },
    ];

    // Initialize restaurants collection with menu (veg/non-veg dishes)
    const restaurantsRef = collection(db, 'restaurants');
    const restaurants = [
      {
        id: '1',
        name: 'Spice Garden',
        owner: 'Jane Smith',
        status: 'Active',
        rating: 4.5,
        cuisine: 'Indian',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
        menu: [
          {
            name: 'Butter Chicken',
            image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
            price: 15.99,
            type: 'non-veg',
            description: 'Tender chicken in a rich, creamy tomato sauce.'
          },
          {
            name: 'Vegetable Biryani',
            image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
            price: 12.99,
            type: 'veg',
            description: 'Fragrant basmati rice with mixed vegetables and spices.'
          },
          {
            name: 'Paneer Tikka',
            image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80',
            price: 10.99,
            type: 'veg',
            description: 'Grilled paneer cubes marinated in spices.'
          },
          {
            name: 'Chicken Tikka',
            image: 'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=600&q=80',
            price: 13.99,
            type: 'non-veg',
            description: 'Grilled chicken cubes marinated in spices.'
          },
        ]
      },
      {
        id: '2',
        name: 'Pasta Paradise',
        owner: 'Mike Johnson',
        status: 'Active',
        rating: 4.2,
        cuisine: 'Italian',
        image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80',
        menu: [
          {
            name: 'Margherita Pizza',
            image: 'https://images.unsplash.com/photo-1506089676908-3592f7389d4d?auto=format&fit=crop&w=600&q=80',
            price: 11.99,
            type: 'veg',
            description: 'Classic pizza with tomato, mozzarella, and basil.'
          },
          {
            name: 'Pepperoni Pizza',
            image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
            price: 13.99,
            type: 'non-veg',
            description: 'Pizza topped with pepperoni and cheese.'
          },
          {
            name: 'Pasta Alfredo',
            image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=600&q=80',
            price: 12.49,
            type: 'veg',
            description: 'Creamy Alfredo pasta with parmesan.'
          },
          {
            name: 'Chicken Lasagna',
            image: 'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=600&q=80',
            price: 14.99,
            type: 'non-veg',
            description: 'Layered pasta with chicken, cheese, and sauce.'
          },
        ]
      },
    ];

    // Add users to Firestore
    for (const user of users) {
      await setDoc(doc(usersRef, user.id), user);
    }

    // Add restaurants to Firestore
    for (const restaurant of restaurants) {
      await setDoc(doc(restaurantsRef, restaurant.id), restaurant);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}; 