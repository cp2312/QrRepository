// firebase.js — Inicialización de Firebase y autenticación

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAqpx-Aaou8XBWhAKb3BTKADJ9T6TeJqFE",
  authDomain: "iet-santacruz-motavita.firebaseapp.com",
  projectId: "iet-santacruz-motavita",
  storageBucket: "iet-santacruz-motavita.firebasestorage.app",
  messagingSenderId: "1094145004611",
  appId: "1:1094145004611:web:97e298617f2bf5148a70f6",
  measurementId: "G-VVJRFESWY9"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

// Mantener sesión aunque se recargue la página
await setPersistence(
  auth,
  browserLocalPersistence
);

const provider = new GoogleAuthProvider();

window._db = db;
window._auth = auth;

window._fs = {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
};

const ADMIN_EMAIL = 'juanjos2621@gmail.com';

// Estado global para main.js
window.firebaseReady = false;

let loginEnProceso = false;

window.loginGoogle = async () => {

  if (loginEnProceso) return;

  loginEnProceso = true;

  const btn = document.getElementById('btn-google');

  try {

    btn.disabled = true;

    await signInWithPopup(auth, provider);

  } catch (e) {

    console.error(e);

    if (e.code !== 'auth/cancelled-popup-request') {
      alert('Error al iniciar sesión: ' + e.message);
    }

  } finally {

    loginEnProceso = false;

    btn.disabled = false;
  }
};

window.cerrarSesion = async () => {

  if (!confirm('¿Cerrar sesión?')) return;

  await signOut(auth);
};

onAuthStateChanged(
  auth,
  async (user) => {

    try {

      if (user) {

        if (user.email !== ADMIN_EMAIL) {

          await signOut(auth);

          document.getElementById(
            'login-error'
          ).style.display = 'block';

          return;
        }

        window.firebaseReady = true;

        document.getElementById(
          'login-error'
        ).style.display = 'none';

        document.getElementById(
          'login-screen'
        ).style.display = 'none';

        document.getElementById(
          'main-app'
        ).style.display = 'flex';

        document.getElementById(
          'user-name'
        ).textContent =
          user.displayName || user.email;

        document.getElementById(
          'user-avatar'
        ).textContent =
          (user.displayName || user.email)[0]
            .toUpperCase();

        document.getElementById(
          'fb-status'
        ).style.display = 'block';

        console.log(
          '✅ Usuario autenticado:',
          user.email
        );

        window.dispatchEvent(
          new Event('firebase-ready')
        );

      } else {

        window.firebaseReady = false;

        document.getElementById(
          'login-screen'
        ).style.display = 'flex';

        document.getElementById(
          'main-app'
        ).style.display = 'none';

        document.getElementById(
          'fb-status'
        ).style.display = 'none';

        console.log(
          '⚠️ Usuario no autenticado'
        );
      }

    } catch (error) {

      console.error(
        'Error en onAuthStateChanged:',
        error
      );
    }
  }
);

document
  .getElementById('btn-google')
  .addEventListener(
    'click',
    window.loginGoogle
  );