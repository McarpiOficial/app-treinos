// Estimador de calorias a partir de uma descrição livre em português (ex.:
// "2 ovos e uma banana"). Não há internet nem API paga aqui — é um
// dicionário local de alimentos comuns com a caloria média de UMA porção
// típica, casado por palavra-chave no texto digitado (ou ditado por voz).
//
// É deliberadamente uma ESTIMATIVA: o valor calculado sempre aparece antes
// de salvar, e pode ser ajustado à mão — nunca é feito às cegas.
const Alimentos = (function () {
  // kcal = valor médio de UMA porção/unidade típica da coluna "porção".
  const DICIONARIO = [
    { nome: 'Arroz branco', kcal: 130, porcao: '100g (1 escumadeira)', sin: ['arroz branco', 'arroz'] },
    { nome: 'Arroz integral', kcal: 120, porcao: '100g', sin: ['arroz integral'] },
    { nome: 'Feijão', kcal: 90, porcao: '1 concha (100g)', sin: ['feijao', 'feijao preto', 'feijao carioca'] },
    { nome: 'Frango grelhado', kcal: 165, porcao: '100g', sin: ['frango grelhado', 'frango', 'peito de frango', 'filé de frango'] },
    { nome: 'Frango frito/empanado', kcal: 290, porcao: '100g', sin: ['frango frito', 'frango empanado', 'nuggets'] },
    { nome: 'Bife/carne bovina', kcal: 250, porcao: '100g', sin: ['bife', 'carne', 'carne bovina', 'carne vermelha', 'picanha', 'alcatra'] },
    { nome: 'Carne moída', kcal: 250, porcao: '100g', sin: ['carne moida'] },
    { nome: 'Bacon', kcal: 160, porcao: '2 fatias', sin: ['bacon'] },
    { nome: 'Linguiça', kcal: 300, porcao: '1 unidade/gomo', sin: ['linguica', 'salsicha'] },
    { nome: 'Ovo', kcal: 70, porcao: '1 unidade', sin: ['ovo', 'ovos', 'ovo frito', 'ovo cozido', 'omelete'] },
    { nome: 'Pão francês', kcal: 150, porcao: '1 unidade', sin: ['pao frances', 'paes frances', 'paes franceses', 'pao'] },
    { nome: 'Pão de forma', kcal: 70, porcao: '1 fatia', sin: ['pao de forma', 'paes de forma', 'pao integral', 'paes integrais'] },
    { nome: 'Pão de queijo', kcal: 100, porcao: '1 unidade média', sin: ['pao de queijo', 'paes de queijo'] },
    { nome: 'Tapioca', kcal: 150, porcao: '1 unidade média', sin: ['tapioca'] },
    { nome: 'Batata frita', kcal: 310, porcao: 'porção pequena', sin: ['batata frita'] },
    { nome: 'Batata doce', kcal: 90, porcao: '100g', sin: ['batata doce'] },
    { nome: 'Batata cozida/purê', kcal: 80, porcao: '100g', sin: ['batata cozida', 'pure de batata', 'batata'] },
    { nome: 'Mandioca/aipim', kcal: 125, porcao: '100g', sin: ['mandioca', 'aipim', 'macaxeira'] },
    { nome: 'Macarrão', kcal: 150, porcao: '100g cozido', sin: ['macarrao', 'massa', 'espaguete'] },
    { nome: 'Lasanha', kcal: 350, porcao: '1 fatia/pedaço', sin: ['lasanha'] },
    { nome: 'Pizza', kcal: 270, porcao: '1 fatia', sin: ['pizza'] },
    { nome: 'Hambúrguer', kcal: 350, porcao: '1 unidade', sin: ['hamburguer', 'burguer', 'x-burguer', 'xburguer'] },
    { nome: 'Sanduíche natural', kcal: 250, porcao: '1 unidade', sin: ['sanduiche natural', 'sanduiche'] },
    { nome: 'Salgado (coxinha/pastel)', kcal: 260, porcao: '1 unidade', sin: ['coxinha', 'pastel', 'salgado', 'esfirra', 'kibe'] },
    { nome: 'Sopa/caldo', kcal: 150, porcao: '1 prato', sin: ['sopa', 'caldo', 'canja'] },
    { nome: 'Feijoada', kcal: 600, porcao: '1 prato', sin: ['feijoada'] },
    { nome: 'Salada verde', kcal: 25, porcao: 'porção', sin: ['salada', 'alface', 'rúcula', 'rucula'] },
    { nome: 'Tomate', kcal: 20, porcao: '1 unidade', sin: ['tomate'] },
    { nome: 'Legumes cozidos', kcal: 50, porcao: 'porção (100g)', sin: ['legumes', 'cenoura', 'abobrinha', 'chuchu', 'brócolis', 'brocolis'] },
    { nome: 'Banana', kcal: 90, porcao: '1 unidade', sin: ['banana'] },
    { nome: 'Maçã', kcal: 80, porcao: '1 unidade', sin: ['maca'] },
    { nome: 'Laranja', kcal: 60, porcao: '1 unidade', sin: ['laranja'] },
    { nome: 'Mamão', kcal: 60, porcao: '1 fatia', sin: ['mamao'] },
    { nome: 'Abacate', kcal: 320, porcao: '1 unidade', sin: ['abacate'] },
    { nome: 'Abacaxi', kcal: 50, porcao: '1 fatia', sin: ['abacaxi'] },
    { nome: 'Uva', kcal: 70, porcao: 'punhado (100g)', sin: ['uva', 'uvas'] },
    { nome: 'Melancia', kcal: 45, porcao: 'fatia (150g)', sin: ['melancia'] },
    { nome: 'Manga', kcal: 100, porcao: '1 unidade', sin: ['manga'] },
    { nome: 'Leite', kcal: 120, porcao: '1 copo (200ml)', sin: ['leite'] },
    { nome: 'Iogurte', kcal: 100, porcao: '1 unidade (170g)', sin: ['iogurte', 'yogurte'] },
    { nome: 'Queijo', kcal: 80, porcao: '1 fatia', sin: ['queijo', 'queijo minas', 'muçarela', 'mucarela'] },
    { nome: 'Requeijão', kcal: 50, porcao: '1 colher de sopa', sin: ['requeijao'] },
    { nome: 'Presunto', kcal: 40, porcao: '1 fatia', sin: ['presunto'] },
    { nome: 'Manteiga/margarina', kcal: 100, porcao: '1 colher de sopa', sin: ['manteiga', 'margarina'] },
    { nome: 'Azeite/óleo', kcal: 120, porcao: '1 colher de sopa', sin: ['azeite', 'oleo'] },
    { nome: 'Café (puro)', kcal: 5, porcao: '1 xícara', sin: ['cafe puro', 'cafe sem acucar', 'cafe'] },
    { nome: 'Café com açúcar', kcal: 30, porcao: '1 xícara', sin: ['cafe com acucar'] },
    { nome: 'Café com leite', kcal: 80, porcao: '1 xícara', sin: ['cafe com leite', 'cafe au lait'] },
    { nome: 'Suco natural', kcal: 110, porcao: '1 copo (200ml)', sin: ['suco natural', 'suco de laranja', 'suco de uva', 'suco'] },
    { nome: 'Refrigerante', kcal: 140, porcao: '1 lata', sin: ['refrigerante', 'coca cola', 'guarana'] },
    { nome: 'Água de coco', kcal: 45, porcao: '1 copo', sin: ['agua de coco'] },
    { nome: 'Cerveja', kcal: 150, porcao: '1 lata', sin: ['cerveja'] },
    { nome: 'Vinho', kcal: 125, porcao: '1 taça', sin: ['vinho'] },
    { nome: 'Achocolatado', kcal: 180, porcao: '1 copo', sin: ['achocolatado', 'chocolate quente'] },
    { nome: 'Chocolate', kcal: 150, porcao: 'barra pequena (30g)', sin: ['chocolate', 'bombom'] },
    { nome: 'Bolo', kcal: 300, porcao: '1 fatia', sin: ['bolo'] },
    { nome: 'Biscoito/bolacha', kcal: 30, porcao: '1 unidade', sin: ['biscoito', 'bolacha', 'cookie'] },
    { nome: 'Barra de cereal', kcal: 100, porcao: '1 unidade', sin: ['barra de cereal'] },
    { nome: 'Sorvete', kcal: 200, porcao: '1 bola/casquinha', sin: ['sorvete', 'picole'] },
    { nome: 'Pipoca', kcal: 150, porcao: 'porção média', sin: ['pipoca'] },
    { nome: 'Aveia', kcal: 40, porcao: '1 colher de sopa', sin: ['aveia'] },
    { nome: 'Granola', kcal: 120, porcao: 'porção (30g)', sin: ['granola'] },
    { nome: 'Whey protein', kcal: 120, porcao: '1 dose (scoop)', sin: ['whey', 'whey protein'] },
    { nome: 'Amendoim/castanhas', kcal: 170, porcao: 'punhado (30g)', sin: ['amendoim', 'castanha', 'castanha de caju', 'castanha do para', 'noz', 'nozes'] },
    { nome: 'Peixe grelhado', kcal: 140, porcao: '100g', sin: ['peixe grelhado', 'peixe', 'tilapia', 'merluza'] },
    { nome: 'Salmão', kcal: 210, porcao: '100g', sin: ['salmao'] },
    { nome: 'Atum (lata)', kcal: 180, porcao: '1 lata', sin: ['atum'] },
    { nome: 'Torrada', kcal: 30, porcao: '1 unidade', sin: ['torrada'] }
  ];

  function normalizar(texto) {
    return (texto || '').toString().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      // Vírgula vira um token isolado (não é removida como as outras
      // pontuações): é o que marca a fronteira entre itens da lista, para a
      // quantidade de um item não vazar para o próximo (ver quantidadeAntesDe).
      .replace(/,/g, ' , ')
      .replace(/[^a-z0-9,\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const NUMEROS_POR_EXTENSO = {
    um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5,
    seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, meio: 0.5, meia: 0.5
  };

  // Plural regular simples (banana->bananas, torrada->torradas): só a última
  // palavra do termo ganha um "s". Terminações irregulares (pão->pães etc.)
  // não seguem essa regra — essas têm a forma no plural escrita à mão no
  // próprio "sin" de cada item acima, então aqui é seguro pular.
  function pluralSimples(termo) {
    const partes = termo.split(' ');
    const ultima = partes[partes.length - 1];
    if (!ultima || /(s|ao|m|r|l|z)$/.test(ultima)) return null;
    partes[partes.length - 1] = ultima + 's';
    return partes.join(' ');
  }

  // Estima as calorias de uma descrição livre. Retorna os itens reconhecidos
  // (para mostrar "entendi: 2 ovos, 1 pão francês...") e o total somado —
  // sempre um palpite para o usuário conferir/ajustar, nunca a palavra final.
  //
  // Trabalha com ÍNDICES de token (não com corte/substituição de string):
  // uma primeira versão apagava o trecho já casado sobrescrevendo com
  // espaços, mas isso confundia a contagem de posição dos itens seguintes
  // (o "3" de "3 pães de forma" vazava pro requeijão da frase seguinte).
  // Marcar os tokens usados num array paralelo evita esse problema de raiz.
  function estimar(descricao) {
    const tokens = normalizar(descricao).split(' ').filter(Boolean);
    const usado = new Array(tokens.length).fill(false);
    const itens = [];

    // Termos com mais palavras primeiro, para "pão de forma" não ser
    // consumido antes pelo "pão" genérico.
    const candidatos = [];
    DICIONARIO.forEach(function (item) {
      item.sin.forEach(function (termo) {
        candidatos.push({ item: item, palavras: termo.split(' ') });
        const plural = pluralSimples(termo);
        if (plural) candidatos.push({ item: item, palavras: plural.split(' ') });
      });
    });
    candidatos.sort(function (a, b) { return b.palavras.length - a.palavras.length; });

    candidatos.forEach(function (c) {
      const n = c.palavras.length;
      for (let i = 0; i + n <= tokens.length; i++) {
        if (usado[i]) continue;
        let bate = true;
        for (let k = 0; k < n; k++) {
          if (usado[i + k] || tokens[i + k] !== c.palavras[k]) { bate = false; break; }
        }
        if (!bate) continue;

        // Achou o termo em tokens[i..i+n) — procura quantidade nas até 3
        // palavras antes, parando na vírgula/"e" (fronteira de item da lista)
        // ou num token já usado por outro item.
        let qtd = 1;
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          if (usado[j]) break;
          const t = tokens[j];
          if (t === ',' || t === 'e') break;
          if (/^\d+([.,]\d+)?$/.test(t)) { qtd = parseFloat(t.replace(',', '.')); usado[j] = true; break; }
          if (NUMEROS_POR_EXTENSO[t] != null) { qtd = NUMEROS_POR_EXTENSO[t]; usado[j] = true; break; }
        }

        for (let k = 0; k < n; k++) usado[i + k] = true;
        itens.push({ nome: c.item.nome, porcao: c.item.porcao, qtd: qtd, kcal: Math.round(c.item.kcal * qtd) });
        break; // uma ocorrência por sinônimo já basta
      }
    });

    const total = itens.reduce(function (s, i) { return s + i.kcal; }, 0);
    return { calorias: total, itens: itens };
  }

  return { estimar: estimar, DICIONARIO: DICIONARIO };
})();
