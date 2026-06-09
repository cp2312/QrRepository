// main.js — Punto de entrada

import { state } from './state.js';
import { initListeners } from './db.js';
import { showPage } from './navegacion.js';
import { renderTabla } from './estudiantes.js';
import { renderDashboard } from './reportes.js';
import { renderAsistencia, initScannerListeners } from './asistencia.js';
import {
  openModal,
  closeModal,
  guardarEstudiante,
  eliminarEstudiante
} from './estudiantes.js';

import {
  buscarCarnet,
  verCarnet,
  imprimirCarnet,
  imprimirTodosCarnets,
  registrarEntradaDirecta
} from './carnets.js';

window.imprimirTodosCarnets = imprimirTodosCarnets;

import {
  registrarAsistencia,
  registrarManual,
  limpiarAsistenciaHoy,
  focusScanInput,
  renderAsistencia,
  filtrarAsistencia,
  exportarAsistenciaCSV
} from './asistencia.js';

import { exportarCSV } from './reportes.js';

/* ==========================================
   FUNCIONES GLOBALES PARA HTML
========================================== */

window.showPage = showPage;
window.openModal = openModal;
window.closeModal = closeModal;
window.guardarEstudiante = guardarEstudiante;
window.eliminarEstudiante = eliminarEstudiante;
window.buscarCarnet = buscarCarnet;
window.verCarnet = verCarnet;
window.imprimirCarnet = imprimirCarnet;
window.imprimirTodosCarnets = imprimirTodosCarnets;
window.registrarEntradaDirecta = registrarEntradaDirecta;
window.registrarAsistencia = registrarAsistencia;
window.renderAsistencia = renderAsistencia;
window.registrarManual = registrarManual;
window.limpiarAsistenciaHoy = limpiarAsistenciaHoy;
window.focusScanInput = focusScanInput;
window.filtrarAsistencia = filtrarAsistencia;
window.exportarAsistenciaCSV = exportarAsistenciaCSV;
window.exportarCSV = exportarCSV;
window.renderTabla = renderTabla;


/* ==========================================
   INICIALIZACIÓN DEL SISTEMA
========================================== */

function iniciarSistema() {

  // Evita registrar listeners dos veces
  if (window._listenersIniciados) return;

  window._listenersIniciados = true;

  console.log('🚀 Iniciando listeners de Firebase...');

  initListeners(

    // Estudiantes
    (datos) => {
      state.estudiantes = datos;

      renderTabla();
      renderDashboard();

      console.log(
        `👨‍🎓 Estudiantes cargados: ${datos.length}`
      );
    },

    // Asistencia
    (datos) => {
      state.asistencia = datos;

      renderDashboard();

      const pageAsistencia =
        document.getElementById('page-asistencia');

      if (
        pageAsistencia &&
        pageAsistencia.classList.contains('active')
      ) {
        renderAsistencia();
      }

      console.log(
        `📋 Registros de asistencia: ${datos.length}`
      );
    }

  );

  renderDashboard();
}

/* ==========================================
   EVENTO FIREBASE LISTO
========================================== */

window.addEventListener(
  'firebase-ready',
  iniciarSistema
);



/* ==========================================
   SI FIREBASE YA ESTÁ LISTO
========================================== */

if (window.firebaseReady === true) {
  iniciarSistema();
}

/* ==========================================
   DOM READY
========================================== */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    initScannerListeners();

    // Seguridad extra:
    // espera Firebase si todavía no llegó
    const esperaFirebase = setInterval(() => {

      if (
        window.firebaseReady === true &&
        !window._listenersIniciados
      ) {

        iniciarSistema();

        clearInterval(esperaFirebase);
      }

    }, 200);

  }
);