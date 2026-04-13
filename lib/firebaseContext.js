import { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot, collection, query } from "firebase/firestore";
import db, { auth } from "./firebaseConfig";

const FirebaseContext = createContext(null);
export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  // New state for categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({
    products: true,
    categories: true,
    customers: true,
    orders: true,
  });

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setUserId(user.uid);
          setUserToken(token);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Error getting user token:", error);
          setUserId(null);
          setIsAuthenticated(false);
        }
      } else {
        setUserId(null);
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch user data from USERS/{userId}
  useEffect(() => {
    if (userId) {
      const userDocRef = doc(db, "USERS", userId);

      const unsubscribeSnapshot = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            setUserData(docSnapshot.data());
          } else {
            setUserData(null);
          }
        },
        (error) => {
          console.error("Error fetching user data:", error);
        }
      );

      return () => unsubscribeSnapshot();
    } else {
      console.log("No userId yet, skipping Firestore listener");
    }
  }, [userId]);

  // Fetch PRODUCTS collection
  useEffect(() => {
    const productsCollectionRef = collection(db, "PRODUCTS");
    const productsQuery = query(productsCollectionRef);

    const unsubscribeProducts = onSnapshot(
      productsQuery,
      (querySnapshot) => {
        const productsData = [];
        querySnapshot.forEach((doc) => {
          productsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setProducts(productsData);
        setLoading((prev) => ({ ...prev, products: false }));
        console.log("Products data fetched:", productsData.length, "products");
      },
      (error) => {
        console.error("Error fetching PRODUCTS collection:", error);
        setLoading((prev) => ({ ...prev, products: false }));
      }
    );

    return () => unsubscribeProducts();
  }, []);

  // Fetch CATEGORIES collection
  useEffect(() => {
    const categoriesCollectionRef = collection(db, "CATEGORIES");
    const categoriesQuery = query(categoriesCollectionRef);

    const unsubscribeCategories = onSnapshot(
      categoriesQuery,
      (querySnapshot) => {
        const categoriesData = [];
        querySnapshot.forEach((doc) => {
          categoriesData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setCategories(categoriesData);
        setLoading((prev) => ({ ...prev, categories: false }));
        console.log(
          "Categories data fetched:",
          categoriesData.length,
          "categories"
        );
      },
      (error) => {
        console.error("Error fetching CATEGORIES collection:", error);
        setLoading((prev) => ({ ...prev, categories: false }));
      }
    );

    return () => unsubscribeCategories();
  }, []);

  // Fetch CUSTOMERS collection
  useEffect(() => {
    const customersCollectionRef = collection(db, "CUSTOMERS");
    const customersQuery = query(customersCollectionRef);

    const unsubscribeCustomers = onSnapshot(
      customersQuery,
      (querySnapshot) => {
        const customersData = [];
        querySnapshot.forEach((doc) => {
          customersData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setCustomers(customersData);
        setLoading((prev) => ({ ...prev, customers: false }));
        console.log(
          "Customers data fetched:",
          customersData.length,
          "customers"
        );
      },
      (error) => {
        console.error("Error fetching CUSTOMERS collection:", error);
        setLoading((prev) => ({ ...prev, customers: false }));
      }
    );

    return () => unsubscribeCustomers();
  }, []);

  // Fetch ORDERS collection
  useEffect(() => {
    const ordersCollectionRef = collection(db, "ORDERS");
    const ordersQuery = query(ordersCollectionRef);

    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (querySnapshot) => {
        const ordersData = [];
        querySnapshot.forEach((doc) => {
          ordersData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setOrders(ordersData);
        setLoading((prev) => ({ ...prev, orders: false }));
        console.log("Orders data fetched:", ordersData.length, "orders");
      },
      (error) => {
        console.error("Error fetching ORDERS collection:", error);
        setLoading((prev) => ({ ...prev, orders: false }));
      }
    );

    return () => unsubscribeOrders();
  }, []);

  // Helper function to check if all data is loaded
  const isDataLoaded =
    !loading.products &&
    !loading.categories &&
    !loading.customers &&
    !loading.orders;

  return (
    <FirebaseContext.Provider
      value={{
        userId,
        userToken,
        isAuthenticated,
        userData,
        // Categories data
        products,
        categories,
        customers,
        orders,
        // Loading states
        loading,
        isDataLoaded,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};
