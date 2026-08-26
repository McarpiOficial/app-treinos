// Monta a biblioteca de imagens de exercícios do app a partir da free-exercise-db
// (https://github.com/yuhonas/free-exercise-db — Unlicense / domínio público).
//
// Para cada entrada de scripts/dicionario-exercicios.js:
//   - baixa as 2 fotos do movimento (início e fim)
//   - reduz para 520px de largura / JPEG q72 (~24 KB cada, legível no celular)
//   - grava em img/lib/<slug>/0.jpg e 1.jpg
// No fim escreve js/biblioteca.js, o índice que o app usa para casar o nome
// digitado pelo usuário com uma imagem (ver js/imagens.js).
//
// Rodar: npm install sharp && node scripts/gerar-biblioteca.js
// Só precisa rodar de novo se o dicionário mudar — as imagens ficam commitadas.
const fs = require('fs');
const path = require('path');
const dicionario = require('./dicionario-exercicios');

const BASE_JSON = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const BASE_IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const LARGURA = 520;
const QUALIDADE = 72;

let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('! sharp não encontrado — as imagens serão gravadas no tamanho original (bem maiores).');
  console.warn('  Para comprimir: npm install sharp');
}

function slugify(texto) {
  return texto.toString().trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

async function baixar(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error('HTTP ' + resposta.status + ' em ' + url);
  return Buffer.from(await resposta.arrayBuffer());
}

async function main() {
  const raizProjeto = path.join(__dirname, '..');
  const destinoImagens = path.join(raizProjeto, 'img', 'lib');
  fs.mkdirSync(destinoImagens, { recursive: true });

  console.log('Baixando catálogo da free-exercise-db...');
  const catalogo = JSON.parse((await baixar(BASE_JSON)).toString('utf8'));
  const porNome = {};
  catalogo.forEach(function (e) { porNome[e.name] = e; });

  const indice = [];
  const naoEncontrados = [];
  let bytesTotais = 0;

  for (let i = 0; i < dicionario.length; i++) {
    const entrada = dicionario[i];
    const origem = porNome[entrada.en];
    if (!origem) {
      naoEncontrados.push(entrada.en);
      continue;
    }

    const slug = slugify(entrada.pt);
    const pastaExercicio = path.join(destinoImagens, slug);
    fs.mkdirSync(pastaExercicio, { recursive: true });

    let quantasImagens = 0;
    for (let j = 0; j < origem.images.length && j < 2; j++) {
      const destinoArquivo = path.join(pastaExercicio, j + '.jpg');
      if (fs.existsSync(destinoArquivo)) {
        // já baixado numa execução anterior: reaproveita
        bytesTotais += fs.statSync(destinoArquivo).size;
        quantasImagens++;
        continue;
      }
      try {
        const bruto = await baixar(BASE_IMG + origem.images[j]);
        const final = sharp
          ? await sharp(bruto).resize({ width: LARGURA }).jpeg({ quality: QUALIDADE, mozjpeg: true }).toBuffer()
          : bruto;
        fs.writeFileSync(destinoArquivo, final);
        bytesTotais += final.length;
        quantasImagens++;
      } catch (e) {
        console.warn('  ! falhou imagem', entrada.en, j, e.message);
      }
    }

    indice.push({
      slug: slug,
      nome: entrada.pt,
      sin: entrada.sin || [],
      grupo: origem.primaryMuscles[0] || '',
      equip: origem.equipment || '',
      imgs: quantasImagens
    });

    process.stdout.write('\r[' + (i + 1) + '/' + dicionario.length + '] ' + entrada.pt.padEnd(42).slice(0, 42));
  }

  console.log('\n');
  if (naoEncontrados.length) {
    console.warn('Não encontrados na base (revisar dicionário):');
    naoEncontrados.forEach(function (n) { console.warn('  - ' + n); });
  }

  const cabecalho = '// GERADO AUTOMATICAMENTE por scripts/gerar-biblioteca.js — não edite à mão.\n'
    + '// Índice da biblioteca de exercícios: liga o nome digitado pelo usuário às fotos\n'
    + '// em img/lib/<slug>/. Fotos da free-exercise-db (Unlicense / domínio público).\n'
    + '// Campos: slug, nome (PT), sin (sinônimos de busca), grupo muscular, equip, imgs (quantas fotos).\n';
  const conteudo = cabecalho + 'const BIBLIOTECA = ' + JSON.stringify(indice) + ';\n';
  fs.writeFileSync(path.join(raizProjeto, 'js', 'biblioteca.js'), conteudo, 'utf8');

  console.log('OK: ' + indice.length + ' exercícios, ' + (bytesTotais / 1048576).toFixed(1) + ' MB de imagens.');
  console.log('Índice gravado em js/biblioteca.js');
}

main().catch(function (e) { console.error(e); process.exit(1); });
