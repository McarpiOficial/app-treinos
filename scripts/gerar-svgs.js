// Gera as ilustrações SVG autorais de cada exercício em img/ex/<id>.svg.
// Estilo: silhueta humanoide estilizada + equipamento simplificado + região do
// músculo-alvo destacada em laranja — no espírito visual dos prints de treino
// do usuário, porém desenhado do zero (sem copiar nenhuma imagem de terceiros).
// Roda uma única vez em tempo de build: `node scripts/gerar-svgs.js`.
const fs = require('fs');
const path = require('path');

const LARANJA = '#ff5a1f';
const LARANJA_FRACO = 'rgba(255,90,31,0.35)';
const CINZA = '#c9c9d1';
const CINZA_ESCURO = '#57575f';
const FUNDO = '#0e0e11';

function svgWrap(corpo, extra) {
  return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" ' + (extra ? 'aria-label="' + extra + '"' : '') + '>'
    + '<rect x="0" y="0" width="200" height="200" fill="' + FUNDO + '"/>'
    + '<g stroke-linecap="round" stroke-linejoin="round">' + corpo + '</g>'
    + '</svg>';
}

// Silhueta base: cabeça + tronco. Retorna os SVG paths comuns; membros e destaque
// são desenhados por cada pose.
function cabeca(cx, cy) {
  return '<circle cx="' + cx + '" cy="' + cy + '" r="10" fill="' + CINZA + '"/>';
}
function torso(x1, y1, x2, y2, largura) {
  return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + CINZA + '" stroke-width="' + largura + '"/>';
}
function membro(x1, y1, x2, y2, largura) {
  largura = largura || 9;
  return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + CINZA + '" stroke-width="' + largura + '"/>';
}
function destaque(pontosOuCx, cy, r) {
  if (typeof cy === 'number' && typeof r === 'number') {
    return '<circle cx="' + pontosOuCx + '" cy="' + cy + '" r="' + r + '" fill="' + LARANJA + '" opacity="0.85"/>';
  }
  return '<polygon points="' + pontosOuCx + '" fill="' + LARANJA_FRACO + '" stroke="' + LARANJA + '" stroke-width="1.5"/>';
}
function barra(x1, y, x2, comDisco) {
  let s = '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + CINZA_ESCURO + '" stroke-width="5"/>';
  if (comDisco) {
    s += '<circle cx="' + x1 + '" cy="' + y + '" r="9" fill="none" stroke="' + CINZA_ESCURO + '" stroke-width="4"/>';
    s += '<circle cx="' + x2 + '" cy="' + y + '" r="9" fill="none" stroke="' + CINZA_ESCURO + '" stroke-width="4"/>';
  }
  return s;
}
function halter(cx, cy, angulo) {
  const g = '<g transform="rotate(' + angulo + ' ' + cx + ' ' + cy + ')">'
    + '<line x1="' + (cx - 11) + '" y1="' + cy + '" x2="' + (cx + 11) + '" y2="' + cy + '" stroke="' + CINZA_ESCURO + '" stroke-width="4"/>'
    + '<rect x="' + (cx - 14) + '" y="' + (cy - 6) + '" width="6" height="12" rx="1.5" fill="' + CINZA_ESCURO + '"/>'
    + '<rect x="' + (cx + 8) + '" y="' + (cy - 6) + '" width="6" height="12" rx="1.5" fill="' + CINZA_ESCURO + '"/>'
    + '</g>';
  return g;
}
function banco(x, y, w, inclinado) {
  if (inclinado) {
    return '<rect x="' + x + '" y="' + (y - 26) + '" width="' + w + '" height="12" rx="3" fill="' + CINZA_ESCURO + '" transform="rotate(-25 ' + x + ' ' + y + ')"/>';
  }
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="10" rx="3" fill="' + CINZA_ESCURO + '"/>';
}
function maquina(x, y, w, h) {
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="none" stroke="' + CINZA_ESCURO + '" stroke-width="4"/>';
}
function polia(cx, cy) {
  return '<circle cx="' + cx + '" cy="' + cy + '" r="8" fill="none" stroke="' + CINZA_ESCURO + '" stroke-width="4"/>'
    + '<line x1="' + cx + '" y1="' + (cy + 8) + '" x2="' + cx + '" y2="150" stroke="' + CINZA_ESCURO + '" stroke-width="2.5" stroke-dasharray="3,3"/>';
}

// --- Poses (deitado no banco: supino) ---
function poseSupinoReto() {
  return banco(50, 150, 100)
    + torso(75, 140, 130, 140, 16)
    + cabeca(70, 140)
    + membro(90, 140, 90, 96) + membro(120, 140, 120, 96)
    + barra(72, 90, 138, true)
    + destaque('75,128 130,128 130,150 75,150', null, null);
}
function poseSupinoInclinado() {
  return banco(45, 160, 95, true)
    + torso(70, 128, 118, 150, 16)
    + cabeca(63, 122)
    + membro(90, 138, 90, 92) + membro(112, 145, 112, 96)
    + barra(75, 88, 135, true)
    + destaque('75,120 122,142 118,150 72,132');
}
function poseFly() {
  return maquina(60, 60, 80, 110)
    + torso(100, 90, 100, 150, 16)
    + cabeca(100, 78)
    + membro(100, 100, 60, 118) + membro(100, 100, 140, 118)
    + polia(60, 100) + polia(140, 100)
    + membro(100, 140, 82, 190, 11) + membro(100, 140, 118, 190, 11)
    + destaque('80,92 120,92 128,116 72,116');
}
// --- Tríceps ---
function poseTricepsCorda() {
  return maquina(96, 20, 8, 40) + polia(100, 30)
    + torso(100, 70, 100, 145, 16)
    + cabeca(100, 58)
    + membro(100, 85, 78, 110) + membro(78, 110, 100, 132)
    + membro(100, 85, 122, 110) + membro(122, 110, 100, 132)
    + membro(100, 145, 84, 190, 11) + membro(100, 145, 116, 190, 11)
    + destaque(89, 118, 12) + destaque(111, 118, 12);
}
function poseTricepsFrances() {
  return torso(100, 90, 100, 150, 16) + cabeca(100, 78)
    + membro(100, 95, 96, 55) + membro(96, 55, 118, 40)
    + halter(118, 40, -20)
    + membro(100, 150, 84, 190, 11) + membro(100, 150, 116, 190, 11)
    + destaque(107, 50, 13);
}
function poseTricepsTesta() {
  return banco(50, 150, 100)
    + torso(75, 140, 130, 140, 16) + cabeca(70, 140)
    + membro(95, 140, 95, 95) + membro(95, 95, 78, 78)
    + membro(120, 140, 120, 95) + membro(120, 95, 103, 78)
    + barra(70, 74, 108, true)
    + destaque('85,100 122,100 122,120 85,120');
}
// --- Costas / Bíceps ---
function poseRemadaCurvada() {
  return torso(70, 120, 130, 90, 16) + cabeca(140, 84)
    + membro(90, 105, 90, 150) + membro(110, 112, 110, 150)
    + membro(75, 122, 100, 140) + membro(75, 122, 100, 105)
    + barra(88, 145, 112, true)
    + destaque('72,95 132,88 128,112 76,118');
}
function poseRemadaAberta() {
  return maquina(150, 90, 10, 40) + polia(155, 100)
    + torso(90, 90, 60, 130, 16) + cabeca(96, 78)
    + membro(75, 100, 130, 100) + membro(60, 130, 44, 170, 11) + membro(60, 130, 76, 170, 11)
    + destaque('60,80 100,72 96,102 62,104');
}
function poseCostasPuxada() {
  return maquina(96, 15, 8, 35) + polia(100, 22)
    + torso(100, 70, 100, 145, 16) + cabeca(100, 58)
    + membro(100, 78, 72, 60) + membro(100, 78, 128, 60)
    + membro(100, 145, 84, 190, 11) + membro(100, 145, 116, 190, 11)
    + destaque('76,72 124,72 132,110 68,110');
}
function poseRoscaScott() {
  return banco(70, 150, 60, false)
    + torso(70, 148, 100, 100, 16) + cabeca(105, 90)
    + membro(75, 118, 75, 150) + membro(60, 130, 60, 150)
    + barra(58, 118, 92, true)
    + destaque(67, 128, 13);
}
function poseRoscaMartelo() {
  return torso(100, 90, 100, 150, 16) + cabeca(100, 78)
    + membro(100, 100, 78, 130) + halter(78, 138, 0)
    + membro(100, 100, 122, 130) + halter(122, 138, 0)
    + destaque(78, 118, 12) + destaque(122, 118, 12);
}
function poseRoscaDireta() {
  return torso(100, 90, 100, 150, 16) + cabeca(100, 78)
    + membro(100, 100, 82, 135) + membro(100, 100, 118, 135)
    + barra(72, 140, 128, false)
    + destaque(82, 118, 12) + destaque(118, 118, 12);
}
// --- Pernas (máquinas sentado/deitado) ---
function poseAgachamentoHack() {
  return maquina(50, 40, 100, 130)
    + torso(100, 60, 100, 110, 16) + cabeca(100, 48)
    + membro(100, 110, 78, 165, 13) + membro(100, 110, 122, 165, 13)
    + membro(78, 165, 78, 185, 11) + membro(122, 165, 122, 185, 11)
    + destaque('66,150 134,150 128,180 72,180');
}
function poseCadeiraExtensora() {
  return maquina(40, 70, 130, 60)
    + torso(60, 80, 60, 130, 16) + cabeca(60, 68)
    + membro(60, 130, 100, 130, 13) + membro(100, 130, 140, 105, 10)
    + destaque('60,118 118,118 128,138 60,142');
}
function poseAdutora() {
  return maquina(45, 90, 110, 55)
    + torso(60, 90, 60, 140, 16) + cabeca(60, 78)
    + membro(60, 140, 44, 185, 12) + membro(60, 140, 92, 185, 12)
    + destaque('44,155 92,155 86,180 50,180');
}
function poseMesaFlexora() {
  return maquina(40, 130, 130, 20)
    + torso(60, 145, 130, 145, 16) + cabeca(148, 145)
    + membro(60, 145, 60, 185, 13) + membro(60, 185, 90, 160, 10)
    + destaque('50,160 90,160 84,182 46,182');
}
function poseCadeiraFlexora() {
  return maquina(40, 80, 120, 65)
    + torso(60, 90, 60, 140, 16) + cabeca(60, 78)
    + membro(60, 140, 100, 140, 13) + membro(100, 140, 120, 118, 10)
    + destaque('60,150 100,150 104,168 56,168');
}
function poseLegPress() {
  return maquina(30, 40, 140, 130)
    + torso(45, 120, 90, 120, 16) + cabeca(35, 112)
    + membro(90, 112, 130, 90, 13) + membro(90, 128, 130, 150, 13)
    + destaque('92,84 134,84 138,110 96,116');
}
// --- Ombro ---
function poseCrucifixoInverso() {
  return maquina(55, 60, 90, 100)
    + torso(100, 90, 100, 150, 16) + cabeca(100, 78)
    + membro(100, 100, 55, 90) + membro(100, 100, 145, 90)
    + destaque(70, 92, 12) + destaque(130, 92, 12);
}
function poseElevacaoFrontal() {
  return torso(100, 90, 100, 155, 16) + cabeca(100, 78)
    + membro(100, 105, 100, 60) + halter(100, 55, 90)
    + membro(100, 105, 100, 150, 10)
    + destaque(100, 84, 12);
}
function poseElevacaoLateral() {
  return torso(100, 90, 100, 155, 16) + cabeca(100, 78)
    + membro(100, 105, 62, 90) + halter(58, 88, 0)
    + membro(100, 105, 138, 90) + halter(142, 88, 0)
    + destaque(76, 86, 12) + destaque(124, 86, 12);
}
function poseDesenvolvimento() {
  return banco(75, 165, 50)
    + torso(100, 110, 100, 160, 16) + cabeca(100, 98)
    + membro(100, 115, 68, 70) + halter(64, 62, -20)
    + membro(100, 115, 132, 70) + halter(136, 62, 20)
    + destaque(78, 88, 12) + destaque(122, 88, 12);
}

// Ícone genérico: usado quando o usuário cria um exercício novo e ainda não
// escolheu uma foto ou uma ilustração da biblioteca. Sem destaque de músculo
// (cinza neutro), pra deixar claro que é só um placeholder.
function poseGenerica() {
  return torso(100, 90, 100, 150, 16) + cabeca(100, 78)
    + membro(100, 100, 78, 130) + membro(100, 100, 122, 130)
    + barra(70, 135, 130, true);
}

const EXERCICIOS = [
  ['_generico', poseGenerica, 'Exercício genérico'],
  ['supino', poseSupinoReto, 'Supino'],
  ['supino-inclinado', poseSupinoInclinado, 'Supino Inclinado'],
  ['fly', poseFly, 'Fly'],
  ['triceps-corda', poseTricepsCorda, 'Tríceps Corda'],
  ['triceps-frances', poseTricepsFrances, 'Tríceps Francês'],
  ['triceps-testa', poseTricepsTesta, 'Tríceps Testa'],
  ['remada-curvada', poseRemadaCurvada, 'Remada Curvada'],
  ['remada-aberta', poseRemadaAberta, 'Remada Aberta'],
  ['puxada-aberta', poseCostasPuxada, 'Puxada Aberta'],
  ['rosca-scott', poseRoscaScott, 'Rosca Scott'],
  ['rosca-martelo', poseRoscaMartelo, 'Rosca Martelo'],
  ['rosca-direta', poseRoscaDireta, 'Rosca Direta'],
  ['agachamento-hack', poseAgachamentoHack, 'Agachamento Hack'],
  ['cadeira-extensora', poseCadeiraExtensora, 'Cadeira Extensora'],
  ['adutora', poseAdutora, 'Adutora'],
  ['mesa-flexora', poseMesaFlexora, 'Mesa Flexora'],
  ['cadeira-flexora', poseCadeiraFlexora, 'Cadeira Flexora'],
  ['leg-press', poseLegPress, 'Leg Press'],
  ['crucifixo-inverso', poseCrucifixoInverso, 'Crucifixo Inverso'],
  ['elevacao-frontal', poseElevacaoFrontal, 'Elevação Frontal'],
  ['elevacao-lateral', poseElevacaoLateral, 'Elevação Lateral'],
  ['desenvolvimento', poseDesenvolvimento, 'Desenvolvimento']
];

const destino = path.join(__dirname, '..', 'img', 'ex');
fs.mkdirSync(destino, { recursive: true });

EXERCICIOS.forEach(function (item) {
  const id = item[0], gerador = item[1], nome = item[2];
  const svg = svgWrap(gerador(), nome);
  fs.writeFileSync(path.join(destino, id + '.svg'), svg, 'utf8');
  console.log('gerado:', id + '.svg');
});

console.log('Total:', EXERCICIOS.length, 'ilustrações em', destino);
