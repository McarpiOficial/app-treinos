// Casamento automático entre o nome de um exercício (digitado pelo usuário) e uma
// entrada da biblioteca de fotos (js/biblioteca.js).
//
// É isso que permite a rotina ser dinâmica: quando um exercício é criado ou
// renomeado, o app procura sozinho a foto correspondente — não existe passo
// manual de "arrumar a imagem".
const Imagens = (function () {
  const GENERICO = './img/ex/_generico.svg';
  const NOTA_MINIMA = 45; // abaixo disso preferimos o ícone genérico a mostrar foto errada

  // Palavras que não ajudam a distinguir um exercício do outro.
  const IGNORAR = ['de', 'do', 'da', 'com', 'na', 'no', 'em', 'a', 'o', 'e', 'para', 'pra', 'the', 'of'];

  // Sinônimos de equipamento: gente escreve "halteres", "dumbbell", "cabo",
  // "pulley" para as mesmas coisas. Normalizar aqui melhora muito o acerto.
  const APELIDOS = {
    halteres: 'halter', haltere: 'halter', dumbbell: 'halter', dumbbells: 'halter',
    barras: 'barra', cabos: 'polia', cabo: 'polia', polias: 'polia', pulley: 'polia',
    maquinas: 'maquina', aparelho: 'maquina', pernas: 'perna', bracos: 'braco',
    anilhas: 'anilha', elastico: 'banda'
  };

  function normalizarTexto(texto) {
    return (texto || '').toString().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenizar(texto) {
    return normalizarTexto(texto).split(' ').filter(function (t) {
      return t && IGNORAR.indexOf(t) === -1;
    }).map(function (t) {
      if (APELIDOS[t]) return APELIDOS[t];
      // plural simples: "supinos" -> "supino". Aplicado dos dois lados da
      // comparação, então termos como "triceps" viram "tricep" sem prejuízo.
      if (t.length > 3 && t.charAt(t.length - 1) === 's') return t.slice(0, -1);
      return t;
    });
  }

  function pontuarCandidato(tokensBusca, textoCandidato) {
    const tokensCand = tokenizar(textoCandidato);
    if (!tokensCand.length || !tokensBusca.length) return 0;

    if (tokensBusca.join(' ') === tokensCand.join(' ')) return 1000;

    let comuns = 0;
    const restantes = tokensCand.slice();
    tokensBusca.forEach(function (t) {
      const idx = restantes.indexOf(t);
      if (idx !== -1) { comuns++; restantes.splice(idx, 1); }
    });
    if (!comuns) return 0;

    const cobreCandidato = comuns / tokensCand.length;
    const cobreBusca = comuns / tokensBusca.length;
    let nota = 100 * (2 * cobreCandidato * cobreBusca) / (cobreCandidato + cobreBusca);

    // "Rosca Direta com Halteres" contém inteiramente "Rosca Direta": forte indício.
    if (cobreCandidato === 1) nota += 40;
    if (cobreBusca === 1) nota += 25;
    return nota;
  }

  // Retorna a lista de entradas da biblioteca ordenada por afinidade com o nome.
  function ranquear(nome, limite) {
    const tokensBusca = tokenizar(nome);
    if (!tokensBusca.length) return [];
    const notas = BIBLIOTECA.map(function (item) {
      let melhor = pontuarCandidato(tokensBusca, item.nome);
      for (let i = 0; i < item.sin.length; i++) {
        const n = pontuarCandidato(tokensBusca, item.sin[i]);
        if (n > melhor) melhor = n;
      }
      return { item: item, nota: melhor };
    }).filter(function (r) { return r.nota > 0; });

    notas.sort(function (a, b) { return b.nota - a.nota; });
    return limite ? notas.slice(0, limite) : notas;
  }

  // Melhor palpite para um nome — o que roda quando o usuário cria/renomeia.
  function buscarSlug(nome) {
    const ranking = ranquear(nome, 1);
    if (!ranking.length || ranking[0].nota < NOTA_MINIMA) return null;
    return ranking[0].item.slug;
  }

  function porSlug(slug) {
    for (let i = 0; i < BIBLIOTECA.length; i++) {
      if (BIBLIOTECA[i].slug === slug) return BIBLIOTECA[i];
    }
    return null;
  }

  // Todas as fotos do movimento (a base traz início e fim, o que permite animar).
  function framesDoSlug(slug) {
    const item = porSlug(slug);
    if (!item) return null;
    const lista = [];
    for (let i = 0; i < item.imgs; i++) lista.push('./img/lib/' + slug + '/' + i + '.jpg');
    return lista.length ? lista : null;
  }

  // Busca textual livre, usada pelo seletor manual de imagem.
  function procurar(termo, limite) {
    if (!normalizarTexto(termo)) return BIBLIOTECA.slice(0, limite || 40);
    return ranquear(termo, limite || 40).map(function (r) { return r.item; });
  }

  return {
    generico: GENERICO,
    buscarSlug: buscarSlug,
    porSlug: porSlug,
    framesDoSlug: framesDoSlug,
    ranquear: ranquear,
    procurar: procurar,
    normalizarTexto: normalizarTexto
  };
})();
