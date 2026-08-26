// Gera os ícones do PWA (img/icone-192.png e img/icone-512.png) desenhando os
// pixels manualmente e codificando um PNG com o zlib nativo do Node — sem
// nenhuma dependência externa (sem canvas, sem libs de imagem).
// Roda uma única vez em tempo de build: `node scripts/gerar-icones.js`.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c, crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xFF;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(tipo, dados) {
  const tipoBuf = Buffer.from(tipo, 'ascii');
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length, 0);
  const corpo = Buffer.concat([tipoBuf, dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo), 0);
  return Buffer.concat([tamanho, corpo, crc]);
}

function escreverPNG(caminho, largura, altura, pixels) {
  const assinatura = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Cada linha precisa de um byte de filtro (0 = nenhum) antes dos pixels.
  const bruto = Buffer.alloc((largura * 4 + 1) * altura);
  for (let y = 0; y < altura; y++) {
    const inicioLinha = y * (largura * 4 + 1);
    bruto[inicioLinha] = 0;
    pixels.copy(bruto, inicioLinha + 1, y * largura * 4, (y + 1) * largura * 4);
  }
  const idatDados = zlib.deflateSync(bruto, { level: 9 });

  const png = Buffer.concat([
    assinatura,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatDados),
    chunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(caminho, png);
  console.log('gerado:', caminho, largura + 'x' + altura);
}

function hexParaRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, alpha == null ? 255 : alpha];
}

const FUNDO = hexParaRGBA('#0b0b0d');
const LARANJA = hexParaRGBA('#ff5a1f');
const BRANCO = hexParaRGBA('#f2f2f2');

function desenharIcone(tamanho) {
  const pixels = Buffer.alloc(tamanho * tamanho * 4);
  function set(x, y, cor) {
    if (x < 0 || y < 0 || x >= tamanho || y >= tamanho) return;
    const i = (y * tamanho + x) * 4;
    pixels[i] = cor[0]; pixels[i + 1] = cor[1]; pixels[i + 2] = cor[2]; pixels[i + 3] = cor[3];
  }

  const centro = tamanho / 2;
  const raioFundo = tamanho * 0.5;
  const raioAnel = tamanho * 0.38;

  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      const dx = x - centro, dy = y - centro;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= raioFundo) set(x, y, FUNDO);
    }
  }

  // Ícone: um "halter" (dumbbell) estilizado — barra central + discos nas pontas,
  // representando musculação; combina com o laranja usado no resto do app.
  const barraAltura = tamanho * 0.09;
  const barraLargura = tamanho * 0.46;
  const discoLado = tamanho * 0.16;

  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      const dx = x - centro, dy = y - centro;
      // barra horizontal central
      if (Math.abs(dy) <= barraAltura / 2 && Math.abs(dx) <= barraLargura / 2) {
        set(x, y, LARANJA);
      }
      // discos (quadrados arredondados aproximados por círculos) nas duas pontas
      const cxEsq = centro - barraLargura / 2;
      const cxDir = centro + barraLargura / 2;
      const distEsq = Math.sqrt((x - cxEsq) * (x - cxEsq) + dy * dy);
      const distDir = Math.sqrt((x - cxDir) * (x - cxDir) + dy * dy);
      if (distEsq <= discoLado) set(x, y, BRANCO);
      if (distDir <= discoLado) set(x, y, BRANCO);
      // furo central dos discos, para dar aspecto de anilha
      if (distEsq <= discoLado * 0.45) set(x, y, LARANJA);
      if (distDir <= discoLado * 0.45) set(x, y, LARANJA);
    }
  }

  return pixels;
}

const destino = path.join(__dirname, '..', 'img');
fs.mkdirSync(destino, { recursive: true });
escreverPNG(path.join(destino, 'icone-192.png'), 192, 192, desenharIcone(192));
escreverPNG(path.join(destino, 'icone-512.png'), 512, 512, desenharIcone(512));
