// carnets.js — Renderizado e impresión de carnets

import { state } from './state.js';
import { agregarAsistencia } from './asistencia.js';
import { showPage } from './navegacion.js';

// Pega aquí el base64 del escudo (contenido del archivo escudo_b64.txt)
const ESCUDO = '../escudo.png';

let carnetFocusId = null;

export function verCarnet(id) { carnetFocusId = id; renderCarnets(); }
export function buscarCarnet() { renderCarnets(); }

export function renderCarnets() {
  const search = (document.getElementById('carnet-search').value || '').toLowerCase();
  const grado  = document.getElementById('carnet-grado').value;
  const grid   = document.getElementById('carnets-grid');
  const empty  = document.getElementById('empty-carnets');

  let filtered = state.estudiantes.filter(e => {
    const texto = (e.nombres + ' ' + e.apellidos + ' ' + e.documento).toLowerCase();
    return texto.includes(search) && (!grado || e.grado === grado);
  });

  if (carnetFocusId) {
    const idx = filtered.findIndex(e => e.id === carnetFocusId);
    if (idx > 0) { const [item] = filtered.splice(idx, 1); filtered.unshift(item); }
  }

  grid.innerHTML = '';
  if (!filtered.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  filtered.forEach(e => {
    const initials   = (e.nombres[0] + e.apellidos[0]).toUpperCase();
    const generoIcon = e.genero === 'Femenino' ? '♀' : e.genero === 'Masculino' ? '♂' : '⚧';
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="carnet-card" id="carnet-${e.id}">
        <div class="carnet-top-stripe"></div>
        <div class="carnet-header">
          <img src="${ESCUDO}" class="carnet-escudo" alt="Escudo">
          <div class="carnet-header-text">
            <div class="carnet-school-name">I.E.T. Santa Cruz</div>
            <div class="carnet-school-sub">de Motavita</div>
            <div class="carnet-school-type">Educativa Técnica</div>
          </div>
          <div class="carnet-year-badge">2026</div>
        </div>
        <div class="carnet-divider"></div>
        <div class="carnet-body">
          <div class="carnet-photo-area">
            <div class="carnet-photo">${initials}</div>
            <div class="carnet-gender">${generoIcon} ${e.genero || ''}</div>
          </div>
          <div class="carnet-data">
            <div class="carnet-name">${e.nombres}</div>
            <div class="carnet-lastname">${e.apellidos}</div>
            <div class="carnet-info-row">
              <span class="carnet-label">CC/TI</span>
              <span class="carnet-value">${e.documento}</span>
            </div>
            <div class="carnet-info-row">
              <span class="carnet-label">Grado</span>
              <span class="carnet-value">${e.grado} – ${e.grupo}</span>
            </div>
          </div>
        </div>
        <div class="carnet-barcode-area">
          <svg id="svg-${e.id}" style="width:100%;max-height:44px"></svg>
          <div class="carnet-id">${e.codigo}</div>
        </div>
        <div class="carnet-footer-stripe"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn btn-secondary btn-sm" style="flex:1" onclick="imprimirCarnet('${e.id}')">
          <i class="ti ti-printer"></i> Imprimir
        </button>
        <button class="btn btn-primary btn-sm" style="flex:1" onclick="registrarEntradaDirecta('${e.id}')">
          <i class="ti ti-scan"></i> Registrar
        </button>
      </div>`;
    grid.appendChild(div);
    setTimeout(() => {
      try {
        JsBarcode('#svg-' + e.id, e.codigo, {
          format: 'CODE128', width: 1.5, height: 36,
          displayValue: false, margin: 2, background: 'transparent'
        });
      } catch (ex) {}
    }, 50);
  });
}

export function imprimirCarnet(id) {
  const e = state.estudiantes.find(s => s.id === id);
  if (!e) return;
  const initials   = (e.nombres[0] + e.apellidos[0]).toUpperCase();
  const generoIcon = e.genero === 'Femenino' ? '♀' : e.genero === 'Masculino' ? '♂' : '⚧';
  const w = window.open('', '_blank', 'width=480,height=580');
  w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Carnet - ${e.nombres} ${e.apellidos}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js"><\/script>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#e8e8e4;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Segoe UI',sans-serif;}
  .carnet-card{width:320px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.22);-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .carnet-top-stripe{height:7px;background:linear-gradient(90deg,#C41E3A 0%,#C41E3A 25%,#D4A017 25%,#D4A017 50%,#1B4F8A 50%,#1B4F8A 75%,#1a3a1a 75%);-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .carnet-header{background:linear-gradient(135deg,#1a3a1a 0%,#2d5a2d 100%);padding:12px 14px;display:flex;align-items:center;gap:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .carnet-escudo{width:50px;height:50px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));}
  .carnet-header-text{flex:1;}
  .carnet-school-name{color:#FFD700;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;line-height:1.15;}
  .carnet-school-sub{color:#FFD700;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;}
  .carnet-school-type{color:rgba(255,255,255,0.7);font-size:9px;text-transform:uppercase;letter-spacing:0.1em;margin-top:3px;}
  .carnet-year-badge{background:#C41E3A;color:white;font-size:11px;font-weight:700;padding:4px 8px;border-radius:6px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .carnet-divider{height:3px;background:linear-gradient(90deg,#C41E3A,#D4A017,#1B4F8A);-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .carnet-body{padding:14px;display:flex;gap:12px;align-items:flex-start;}
  .carnet-photo-area{display:flex;flex-direction:column;align-items:center;flex-shrink:0;}
  .carnet-photo{width:68px;height:68px;border-radius:10px;background:linear-gradient(135deg,#2d5a2d,#1a3a1a);border:2px solid #D4A017;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .carnet-gender{font-size:9px;color:#666;margin-top:4px;text-align:center;}
  .carnet-data{flex:1;min-width:0;}
  .carnet-name{font-size:14px;font-weight:700;color:#1a3a1a;line-height:1.2;}
  .carnet-lastname{font-size:13px;font-weight:600;color:#2d5a2d;margin-bottom:7px;}
  .carnet-info-row{display:flex;gap:6px;align-items:center;margin-bottom:4px;}
  .carnet-label{font-size:9px;font-weight:700;color:white;background:#1a3a1a;padding:1px 5px;border-radius:3px;text-transform:uppercase;flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .carnet-value{font-size:11px;color:#333;font-weight:500;}
  .carnet-barcode-area{background:#f8f8f5;margin:0 12px;border-radius:8px;padding:8px 10px 4px;display:flex;flex-direction:column;align-items:center;border:1px solid #e0ddd5;}
  .carnet-id{color:#666;font-size:9px;margin-top:2px;letter-spacing:0.06em;font-family:monospace;}
  .carnet-footer-stripe{height:6px;margin-top:10px;background:linear-gradient(90deg,#1B4F8A 0%,#1B4F8A 33%,#D4A017 33%,#D4A017 66%,#C41E3A 66%);-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  @media print{body{background:white;min-height:unset;}.carnet-card{box-shadow:none;margin:0 auto;}}
</style>
</head>
<body>
<div class="carnet-card">
  <div class="carnet-top-stripe"></div>
  <div class="carnet-header">
    <img src="${ESCUDO}" class="carnet-escudo" alt="Escudo">
    <div class="carnet-header-text">
      <div class="carnet-school-name">I.E.T. Santa Cruz</div>
      <div class="carnet-school-sub">de Motavita</div>
      <div class="carnet-school-type">Educativa Técnica</div>
    </div>
    <div class="carnet-year-badge">2026</div>
  </div>
  <div class="carnet-divider"></div>
  <div class="carnet-body">
    <div class="carnet-photo-area">
      <div class="carnet-photo">${initials}</div>
      <div class="carnet-gender">${generoIcon} ${e.genero || ''}</div>
    </div>
    <div class="carnet-data">
      <div class="carnet-name">${e.nombres}</div>
      <div class="carnet-lastname">${e.apellidos}</div>
      <div class="carnet-info-row">
        <span class="carnet-label">CC/TI</span>
        <span class="carnet-value">${e.documento}</span>
      </div>
      <div class="carnet-info-row">
        <span class="carnet-label">Grado</span>
        <span class="carnet-value">${e.grado} – ${e.grupo}</span>
      </div>
    </div>
  </div>
  <div class="carnet-barcode-area">
    <svg id="barcode" style="width:100%;max-height:44px"></svg>
    <div class="carnet-id">${e.codigo}</div>
  </div>
  <div class="carnet-footer-stripe"></div>
</div>
<script>
  window.onload = function() {
    JsBarcode('#barcode','${e.codigo}',{format:'CODE128',width:1.5,height:36,displayValue:false,margin:2,background:'transparent'});
    setTimeout(() => window.print(), 400);
  };
<\/script>
</body>
</html>`);
  w.document.close();
}

export function registrarEntradaDirecta(id) {
  const e = state.estudiantes.find(s => s.id === id);
  if (!e) return;
  agregarAsistencia(e, 'entrada');
  showPage('asistencia');
}