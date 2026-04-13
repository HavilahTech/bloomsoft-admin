import "@/styles/globals.css";
import { FirebaseProvider } from "@/lib/firebaseContext";
import { ToastProvider } from "@/toast/ToastProvider";

export default function App({ Component, pageProps }) {
  return (
    <FirebaseProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </FirebaseProvider>
  );
}
