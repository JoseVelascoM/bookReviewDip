// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: '<API_KEY>',
  authDomain: '<AUTH_DOMAIN>',
  projectId: '<PROJECT_ID>',
  storageBucket: '<STORAGE_BUCKET>',
  messagingSenderId: '<MESSAGING_SENDER_ID>',
  appId: '<APP_ID>',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

if (__DEV__) {
  console.log('Modo desarrollo detectado.');
  try {
    console.log('Conectando a Firebase Emulators...');
    // Para Auth
    connectAuthEmulator(auth, 'http://192.168.26.8:9099'); // Usar IP o 127.0.0.1

    // Para Firestore
    connectFirestoreEmulator(db, '192.168.26.8', 8080); // Usar IP o 127.0.0.1

    // Para Storage
    connectStorageEmulator(storage, '192.168.26.8', 9199); // Usar IP o 127.0.0.1

    console.log('Conectado a Firebase Emulators.');
  } catch (e) {
    console.error('Error al conectar a los emuladores de Firebase:', e);
  }
} else {
  console.log('Usando Firebase en la nube.');
}

export { app, auth, db, storage };

