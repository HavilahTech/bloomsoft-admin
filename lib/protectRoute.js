import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useFirebase } from "./firebaseContext";

export default function withAuth(Component) {
  return function ProtectedRoute(props) {
    const [checkingAuth, setCheckingAuth] = useState(true);
    const router = useRouter();
    const { userData } = useFirebase();

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          router.replace("/auth/login");
        } else {

          // block unpaid users from /dashboard/courses/*
          if (
            !userData?.paid &&
            router.pathname.startsWith("/dashboard/courses")
          ) {
            router.replace("/dashboard");
          }
        }
        setCheckingAuth(false);
      });

      return () => unsubscribe();
    }, [router]);

    if (checkingAuth) {
      return null;
    }

    return <Component {...props} />;
  };
}
