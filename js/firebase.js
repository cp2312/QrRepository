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
  signInWithEmailAndPassword,
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

const MENSAJES_ERROR = {
  'auth/invalid-email':        'Correo inválido.',
  'auth/user-not-found':       'Correo o contraseña incorrectos.',
  'auth/wrong-password':       'Correo o contraseña incorrectos.',
  'auth/invalid-credential':   'Correo o contraseña incorrectos.',
  'auth/too-many-requests':    'Demasiados intentos. Intenta de nuevo más tarde.',
  'auth/user-disabled':        'Esta cuenta está deshabilitada.'
};

window.loginEmail = async () => {

  if (loginEnProceso) return;

  const emailInput    = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const btn           = document.getElementById('btn-login');
  const errorBox       = document.getElementById('login-error');

  const email    = (emailInput.value || '').trim();
  const password = passwordInput.value || '';

  if (!email || !password) return;

  loginEnProceso = true;

  try {

    btn.disabled = true;
    errorBox.style.display = 'none';

    await signInWithEmailAndPassword(auth, email, password);

  } catch (e) {

    console.error(e);

    errorBox.textContent = MENSAJES_ERROR[e.code] || 'Error al iniciar sesión: ' + e.message;
    errorBox.style.display = 'block';
    passwordInput.value = '';
    passwordInput.focus();

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

          const errorBox = document.getElementById('login-error');
          errorBox.textContent = 'Acceso denegado. Solo el administrador autorizado puede ingresar.';
          errorBox.style.display = 'block';

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
  .getElementById('login-form')
  .addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      window.loginEmail();
    }
  );