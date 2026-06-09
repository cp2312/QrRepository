// carnets.js — Renderizado e impresión de carnets

import { state } from './state.js';
import { agregarAsistencia } from './asistencia.js';
import { showPage } from './navegacion.js';

let carnetFocusId = null;

export function verCarnet(id) { carnetFocusId = id; renderCarnets(); }
export function buscarCarnet() { renderCarnets(); }

export function renderCarnets() {
  const search   = (document.getElementById('carnet-search').value || '').toLowerCase();
  const grado    = document.getElementById('carnet-grado').value;
  const grid     = document.getElementById('carnets-grid');
  const empty    = document.getElementById('empty-carnets');

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
    const initials = (e.nombres[0] + e.apellidos[0]).toUpperCase();
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="carnet-card" id="carnet-${e.id}">
        <div class="carnet-header">
          <span class="carnet-school">I.E.T. Santa Cruz de Motavita</span>
          <span class="carnet-year">2026</span>
        </div>
        <div class="carnet-body">
          <div style="display:flex;align-items:center;gap:14px">
            <div class="carnet-photo">${initials}</div>
            <div>
              <div class="carnet-name">${e.nombres} ${e.apellidos}</div>
              <div class="carnet-info"><i class="ti ti-id-badge" style="font-size:11px"></i> ${e.documento}</div>
              <div class="carnet-info"><i class="ti ti-book" style="font-size:11px"></i> Grado ${e.grado} – Grupo ${e.grupo}</div>
              ${e.acudiente ? `<div class="carnet-info" style="font-size:10px">Acudiente: ${e.acudiente}</div>` : ''}
            </div>
          </div>
          <div class="carnet-barcode-area">
            <svg id="svg-${e.id}" style="width:100%;max-height:50px"></svg>
            <div class="carnet-id">${e.codigo}</div>
          </div>
        </div>
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
          format: 'CODE128', width: 1.5, height: 38,
          displayValue: false, margin: 2, background: 'transparent'
        });
      } catch (ex) {}
    }, 50);
  });
}

export function imprimirCarnet(id) {
  const e = state.estudiantes.find(s => s.id === id);
  if (!e) return;
  const initials = (e.nombres[0] + e.apellidos[0]).toUpperCase();
  const w = window.open('', '_blank', 'width=500,height=400');
  w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Carnet - ${e.nombres} ${e.apellidos}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js"><\/script>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#f0f0f0; display:flex; align-items:center; justify-content:center; min-height:100vh; font-family:'Segoe UI',sans-serif; }
  .carnet-card { width:320px; background:linear-gradient(135deg,#0F6E56 0%,#085041 60%,#04342C 100%); border-radius:14px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.25); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .carnet-header { background:rgba(255,255,255,0.12); padding:12px 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.1); }
  .carnet-school { color:white; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; }
  .carnet-year   { color:rgba(255,255,255,0.7); font-size:10px; }
  .carnet-body   { padding:16px; }
  .carnet-photo  { width:60px; height:60px; border-radius:50%; background:rgba(255,255,255,0.2); border:2px solid rgba(255,255,255,0.4); display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:700; color:white; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .carnet-name   { color:white; font-size:15px; font-weight:700; margin-bottom:2px; }
  .carnet-info   { color:rgba(255,255,255,0.8); font-size:11px; margin-bottom:4px; }
  .carnet-barcode-area { background:white; border-radius:8px; padding:10px 12px 6px; margin-top:12px; display:flex; flex-direction:column; align-items:center; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .carnet-id { color:#444; font-size:10px; margin-top:3px; letter-spacing:0.05em; font-family:monospace; }
  @media print { body { background:white; min-height:unset; } .carnet-card { box-shadow:none; margin:0 auto; } }
</style>
</head>
<body>
  <div class="carnet-card">
    <div class="carnet-header">
      <span class="carnet-school">I.E.T. Santa Cruz de Motavita</span>
      <span class="carnet-year">2026</span>
    </div>
    <div class="carnet-body">
      <div style="display:flex;align-items:center;gap:14px">
        <div class="carnet-photo">${initials}</div>
        <div>
          <div class="carnet-name">${e.nombres} ${e.apellidos}</div>
          <div class="carnet-info">📄 ${e.documento}</div>
          <div class="carnet-info">📚 Grado ${e.grado} – Grupo ${e.grupo}</div>
          ${e.acudiente ? `<div class="carnet-info" style="font-size:10px">Acudiente: ${e.acudiente}</div>` : ''}
        </div>
      </div>
      <div class="carnet-barcode-area">
        <svg id="barcode" style="width:100%;max-height:50px"></svg>
        <div class="carnet-id">${e.codigo}</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      JsBarcode('#barcode','${e.codigo}',{format:'CODE128',width:1.5,height:38,displayValue:false,margin:2,background:'transparent'});
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