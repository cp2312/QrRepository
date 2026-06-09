// main.js — Punto de entrada

import { state }                                                      from './state.js';
import { initListeners }                                              from './db.js';
import { showPage }                                                   from './navegacion.js';
import { renderTabla }                                                from './estudiantes.js';
import { renderDashboard }                                            from './reportes.js';
import { renderAsistencia, initScannerListeners }                     from './asistencia.js';
import { openModal, closeModal, guardarEstudiante, eliminarEstudiante } from './estudiantes.js';
import { buscarCarnet, verCarnet, imprimirCarnet, registrarEntradaDirecta } from './carnets.js';
import { registrarAsistencia, registrarManual, limpiarAsistenciaHoy, focusScanInput } from './asistencia.js';
import { exportarCSV }                                                from './reportes.js';

// Exponer al scope global para los onclick del HTML
window.showPage                = showPage;
window.openModal               = openModal;
window.closeModal              = closeModal;
window.guardarEstudiante       = guardarEstudiante;
window.eliminarEstudiante      = eliminarEstudiante;
window.buscarCarnet            = buscarCarnet;
window.verCarnet               = verCarnet;
window.imprimirCarnet          = imprimirCarnet;
window.registrarEntradaDirecta = registrarEntradaDirecta;
window.registrarAsistencia     = registrarAsistencia;
window.registrarManual         = registrarManual;
window.limpiarAsistenciaHoy    = limpiarAsistenciaHoy;
window.focusScanInput          = focusScanInput;
window.exportarCSV             = exportarCSV;
window.renderTabla             = renderTabla;

window.addEventListener('firebase-ready', () => {
  initListeners(
    (datos) => {
      state.estudiantes = datos;
      renderTabla();
      renderDashboard();
    },
    (datos) => {
      state.asistencia = datos;
      renderDashboard();
      if (document.getElementById('page-asistencia')?.classList.contains('active')) {
        renderAsistencia();
      }
    }
  );
  renderDashboard();
});

document.addEventListener('DOMContentLoaded', () => {
  initScannerListeners();
});