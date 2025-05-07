import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Customer' | 'Restaurant Owner' | 'Admin';
  status: 'Active' | 'Inactive' | 'Pending';
}

interface Restaurant {
  id: string;
  name: string;
  owner: string;
  status: 'Active' | 'Pending' | 'Suspended';
  rating: number;
  menu?: any[];
  image?: string;
  cuisine?: string;
  deliveryTime?: string;
  priceRange?: string;
}

export const useUsers = () => {
  const { db } = useFirebase();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db]);

  return { users, loading, error };
};

export const useRestaurants = () => {
  const { db } = useFirebase();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restaurantsRef = collection(db, 'restaurants');
    const q = query(restaurantsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const restaurantsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Restaurant[];
        setRestaurants(restaurantsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db]);

  return { restaurants, loading, error };
}; 