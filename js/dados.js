// Camada de persistência: tudo fica no localStorage do próprio aparelho (offline-first).
// Nenhum dado sai do celular — não há backend. Exportar/Importar servem como backup manual.
const Dados = (function () {
  const CHAVE = 'treinos.v1';
  const VERSAO = 1;

  function hoje() {
    const d = new Date();
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d - tz).toISOString().slice(0, 10);
  }

  function estadoInicial() {
    return {
      versao: VERSAO,
      semanaAtual: 1,
      semanaIniciadaEm: hoje(),
      passoPeso: 2.5,
      dias: {},
      pesos: {},
      historico: [],
      aerobicos: []
    };
  }

  let estado = null;

  function carregar() {
    if (estado) return estado;
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) {
        estado = estadoInicial();
        return estado;
      }
      const dados = JSON.parse(bruto);
      // migração simples: garante que todos os campos esperados existem,
      // mesmo que uma versão futura adicione algo novo.
      estado = Object.assign(estadoInicial(), dados);
      estado.dias = dados.dias || {};
      estado.pesos = dados.pesos || {};
      estado.historico = dados.historico || [];
      estado.aerobicos = dados.aerobicos || [];
      estado.catalogoPersonalizado = dados.catalogoPersonalizado || null;
      aplicarCatalogoSalvo();
      return estado;
    } catch (e) {
      console.error('Falha ao ler dados salvos, iniciando do zero.', e);
      estado = estadoInicial();
      return estado;
    }
  }

  // ---- Catálogo de exercícios editável ----
  // CATALOGO (definido em js/exercicios.js) é o objeto "vivo" que o resto do app
  // lê. Aqui só sincronizamos esse objeto com o que está salvo/editado.
  function aplicarCatalogoSalvo() {
    if (estado.catalogoPersonalizado) {
      CATALOGO.dias = estado.catalogoPersonalizado.dias;
      CATALOGO.exercicios = estado.catalogoPersonalizado.exercicios;
    }
  }

  function resetarCatalogoParaPadrao() {
    const clone = JSON.parse(JSON.stringify(CATALOGO_PADRAO));
    CATALOGO.dias = clone.dias;
    CATALOGO.exercicios = clone.exercicios;
  }

  function sincronizarCatalogo() {
    const e = carregar();
    e.catalogoPersonalizado = { dias: CATALOGO.dias, exercicios: CATALOGO.exercicios };
    salvar();
  }

  function editarExercicio(exercicioId, dadosNovos) {
    carregar();
    const ex = CATALOGO.exercicios[exercicioId];
    if (!ex) return;
    const nomeMudou = dadosNovos.nome != null && dadosNovos.nome !== ex.nome;

    if (dadosNovos.nome != null) ex.nome = dadosNovos.nome;
    if (dadosNovos.series != null) ex.series = dadosNovos.series;
    if (dadosNovos.reps != null) ex.reps = dadosNovos.reps;
    if ('imagem' in dadosNovos) ex.imagem = dadosNovos.imagem;

    // Trocar o exercício é justamente o caso em que a imagem precisa ser
    // refeita: se ela não foi escolhida à mão (foto ou item da biblioteca),
    // procuramos de novo a partir do nome novo.
    const escolhaManual = ex.imagem && (ex.imagem.tipo === 'foto' || ex.imagem.tipo === 'biblioteca');
    if (nomeMudou && !escolhaManual) {
      ex.lib = null;
      ex.imagem = { tipo: 'auto', valor: Imagens.buscarSlug(ex.nome) };
    }
    sincronizarCatalogo();
  }

  function adicionarExercicio(diaId, dadosNovo) {
    carregar();
    const dia = diaPorId(diaId);
    if (!dia) return null;
    const id = gerarIdExercicio(dadosNovo.nome);
    // Sem escolha manual de imagem, o app procura sozinho na biblioteca.
    const imagem = dadosNovo.imagem && dadosNovo.imagem.valor
      ? dadosNovo.imagem
      : { tipo: 'auto', valor: Imagens.buscarSlug(dadosNovo.nome) };
    CATALOGO.exercicios[id] = {
      nome: dadosNovo.nome,
      series: dadosNovo.series || 3,
      reps: dadosNovo.reps || '10 a 12',
      imagem: imagem
    };
    dia.exercicios.push(id);
    sincronizarCatalogo();
    return id;
  }

  // ---- Dias de treino (agrupamentos) ----
  // A rotina não é fixa em 5 dias: dá para criar, remover e reordenar os
  // treinos. Um dia criado aqui é igual aos outros em tudo — recebe exercícios,
  // registra carga e conta para o fechamento da semana.
  function adicionarDia(foco) {
    carregar();
    const id = proximoIdDia();
    CATALOGO.dias.push({ id: id, foco: foco || 'Novo treino', exercicios: [] });
    sincronizarCatalogo();
    return id;
  }

  function editarDia(diaId, dadosNovos) {
    carregar();
    const dia = diaPorId(diaId);
    if (!dia) return;
    if (dadosNovos.foco != null) dia.foco = dadosNovos.foco;
    sincronizarCatalogo();
  }

  // Remove o treino da rotina. O histórico já registrado é preservado de
  // propósito (é registro do que aconteceu); some apenas da semana em curso.
  function removerDia(diaId) {
    const e = carregar();
    if (CATALOGO.dias.length <= 1) return false; // precisa sobrar pelo menos um treino
    const dia = diaPorId(diaId);
    if (!dia) return false;

    const exerciciosDoDia = dia.exercicios.slice();
    CATALOGO.dias = CATALOGO.dias.filter(function (d) { return d.id !== Number(diaId); });

    // Exercício que só existia neste dia deixa de existir no catálogo.
    exerciciosDoDia.forEach(function (exId) {
      const aindaUsado = CATALOGO.dias.some(function (d) { return d.exercicios.indexOf(exId) !== -1; });
      if (!aindaUsado) delete CATALOGO.exercicios[exId];
    });

    delete e.dias[diaId];
    sincronizarCatalogo();
    return true;
  }

  // Reordena a semana a partir da nova sequência de ids (vinda do arraste).
  function reordenarDias(idsNaNovaOrdem) {
    carregar();
    const porId = {};
    CATALOGO.dias.forEach(function (d) { porId[d.id] = d; });
    const novaLista = [];
    idsNaNovaOrdem.forEach(function (id) {
      const dia = porId[id];
      if (dia) { novaLista.push(dia); delete porId[id]; }
    });
    // Qualquer dia que não veio na lista (não deveria acontecer) fica no fim,
    // para nunca sumir um treino por causa de um erro de reordenação.
    Object.keys(porId).forEach(function (k) { novaLista.push(porId[k]); });
    CATALOGO.dias = novaLista;
    sincronizarCatalogo();
  }

  function removerExercicioDoDia(diaId, exercicioId) {
    carregar();
    const dia = diaPorId(diaId);
    if (!dia) return;
    dia.exercicios = dia.exercicios.filter(function (id) { return id !== exercicioId; });
    // Se o exercício não aparece em nenhum outro dia, remove a definição também.
    // O histórico de pesos já registrado (chave "dia:exercicio") não é apagado.
    const aindaUsadoEmAlgumDia = CATALOGO.dias.some(function (d) { return d.exercicios.indexOf(exercicioId) !== -1; });
    if (!aindaUsadoEmAlgumDia) delete CATALOGO.exercicios[exercicioId];
    sincronizarCatalogo();
  }

  // Descobre qual imagem representa um exercício. A ordem de prioridade é:
  //   1. foto que o usuário anexou (manda sempre)
  //   2. escolha manual na biblioteca
  //   3. slug já resolvido (semente, ou casamento automático salvo)
  //   4. casamento automático pelo nome, na hora
  //   5. ícone genérico
  function framesExercicio(exercicioId) {
    const ex = CATALOGO.exercicios[exercicioId];
    if (!ex) return [Imagens.generico];
    const img = ex.imagem;

    if (img && img.tipo === 'foto' && img.valor) return [img.valor];
    if (img && (img.tipo === 'biblioteca' || img.tipo === 'auto') && img.valor) {
      const frames = Imagens.framesDoSlug(img.valor);
      if (frames) return frames;
    }
    if (ex.lib) {
      const frames = Imagens.framesDoSlug(ex.lib);
      if (frames) return frames;
    }
    const slug = Imagens.buscarSlug(ex.nome);
    if (slug) {
      const frames = Imagens.framesDoSlug(slug);
      if (frames) return frames;
    }
    return [Imagens.generico];
  }

  // Primeiro quadro — usado nas miniaturas.
  function imagemExercicio(exercicioId) {
    return framesExercicio(exercicioId)[0];
  }

  let salvarPendente = null;

  function salvar() {
    if (salvarPendente) clearTimeout(salvarPendente);
    salvarPendente = setTimeout(function () {
      try {
        localStorage.setItem(CHAVE, JSON.stringify(estado));
      } catch (e) {
        console.error('Nao foi possivel salvar (armazenamento indisponivel).', e);
        if (typeof App !== 'undefined' && App.avisar) {
          App.avisar('Não foi possível salvar. Verifique o espaço/modo privado do navegador.');
        }
      }
    }, 150);
  }

  function salvarAgora() {
    if (salvarPendente) { clearTimeout(salvarPendente); salvarPendente = null; }
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // ---- Peso por dia+exercício ----
  function getPeso(diaId, exercicioId) {
    const e = carregar();
    const chave = chaveTreino(diaId, exercicioId);
    if (chave in e.pesos) return e.pesos[chave];
    // Sem registro para este dia: sugere o peso mais recente do mesmo exercício em outro dia.
    let sugestao = null;
    Object.keys(e.pesos).forEach(function (k) {
      if (k.split(':')[1] === exercicioId) sugestao = e.pesos[k];
    });
    return sugestao;
  }

  function setPeso(diaId, exercicioId, valor) {
    const e = carregar();
    e.pesos[chaveTreino(diaId, exercicioId)] = valor;
    salvar();
  }

  // ---- Séries marcadas (progresso do dia dentro da semana atual) ----
  function getSeries(diaId, exercicioId) {
    const e = carregar();
    const dia = e.dias[diaId];
    const chave = chaveTreino(diaId, exercicioId);
    const info = CATALOGO.exercicios[exercicioId];
    const total = info ? info.series : 3;
    if (dia && dia.series && dia.series[chave]) return dia.series[chave].slice(0, total);
    return new Array(total).fill(false);
  }

  function toggleSerie(diaId, exercicioId, indice) {
    const e = carregar();
    if (!e.dias[diaId]) e.dias[diaId] = { series: {} };
    if (!e.dias[diaId].series) e.dias[diaId].series = {};
    const chave = chaveTreino(diaId, exercicioId);
    const atual = getSeries(diaId, exercicioId).slice();
    atual[indice] = !atual[indice];
    e.dias[diaId].series[chave] = atual;
    salvar();
    return atual;
  }

  function progressoDia(diaId) {
    const dia = diaPorId(diaId);
    if (!dia) return { feitas: 0, total: 0 };
    let feitas = 0, total = 0;
    dia.exercicios.forEach(function (exId) {
      const s = getSeries(diaId, exId);
      total += s.length;
      feitas += s.filter(Boolean).length;
    });
    return { feitas: feitas, total: total };
  }

  function diaConcluidoNestaSemana(diaId) {
    const e = carregar();
    return !!(e.dias[diaId] && e.dias[diaId].concluidoEm);
  }

  function concluirDia(diaId) {
    const e = carregar();
    const dia = diaPorId(diaId);
    if (!dia) return;
    if (!e.dias[diaId]) e.dias[diaId] = { series: {} };
    e.dias[diaId].concluidoEm = new Date().toISOString();

    const snapshotPesos = {};
    dia.exercicios.forEach(function (exId) {
      const p = getPeso(diaId, exId);
      if (p != null) snapshotPesos[chaveTreino(diaId, exId)] = p;
    });

    e.historico.push({
      semana: e.semanaAtual,
      dia: diaId,
      // Guardamos o nome do treino junto: se o dia for removido da rotina mais
      // tarde, o histórico continua dizendo o que foi treinado.
      foco: dia.foco,
      data: hoje(),
      pesos: snapshotPesos
    });
    salvar();
  }

  function diasConcluidosNaSemana() {
    const e = carregar();
    return CATALOGO.dias.filter(function (d) { return diaConcluidoNestaSemana(d.id); }).length;
  }

  function podeConcluirSemana() {
    return diasConcluidosNaSemana() >= CATALOGO.dias.length;
  }

  function concluirSemana() {
    const e = carregar();
    e.semanaAtual += 1;
    e.semanaIniciadaEm = hoje();
    e.dias = {};
    salvar();
  }

  function ajustarSemanaManualmente(novoNumero) {
    const e = carregar();
    e.semanaAtual = Math.max(1, Math.round(novoNumero));
    salvar();
  }

  function ajustarPassoPeso(novoPasso) {
    const e = carregar();
    e.passoPeso = novoPasso;
    salvar();
  }

  // ---- Histórico de carga por exercício (para o gráfico de progresso) ----
  function historicoPorExercicio(exercicioId) {
    const e = carregar();
    const pontos = [];
    e.historico.forEach(function (registro) {
      Object.keys(registro.pesos).forEach(function (chave) {
        if (chave.split(':')[1] === exercicioId) {
          pontos.push({ semana: registro.semana, dia: registro.dia, data: registro.data, peso: registro.pesos[chave] });
        }
      });
    });
    return pontos;
  }

  // ---- Aeróbicos ----
  function listarAerobicos() {
    const e = carregar();
    return e.aerobicos.slice().sort(function (a, b) { return (b.data + b.id) < (a.data + a.id) ? -1 : 1; });
  }

  function addAerobico(registro) {
    const e = carregar();
    const novo = Object.assign({ id: Date.now() + '-' + Math.floor(Math.random() * 1000) }, registro);
    e.aerobicos.push(novo);
    salvar();
    return novo;
  }

  function atualizarAerobico(id, dadosNovos) {
    const e = carregar();
    const idx = e.aerobicos.findIndex(function (a) { return a.id === id; });
    if (idx === -1) return;
    e.aerobicos[idx] = Object.assign({}, e.aerobicos[idx], dadosNovos);
    salvar();
  }

  function removerAerobico(id) {
    const e = carregar();
    e.aerobicos = e.aerobicos.filter(function (a) { return a.id !== id; });
    salvar();
  }

  function resumoAerobicoEntre(dataInicioISO, dataFimISO) {
    const e = carregar();
    const itens = e.aerobicos.filter(function (a) { return a.data >= dataInicioISO && a.data <= dataFimISO; });
    return {
      sessoes: itens.length,
      minutos: itens.reduce(function (s, a) { return s + Number(a.minutos || 0); }, 0),
      calorias: itens.reduce(function (s, a) { return s + Number(a.calorias || 0); }, 0)
    };
  }

  // ---- Backup ----
  function exportarJSON() {
    return JSON.stringify(carregar(), null, 2);
  }

  function importarJSON(texto) {
    const novo = JSON.parse(texto);
    if (typeof novo !== 'object' || novo === null) throw new Error('Arquivo inválido.');
    estado = Object.assign(estadoInicial(), novo);
    estado.dias = novo.dias || {};
    estado.pesos = novo.pesos || {};
    estado.historico = novo.historico || [];
    estado.aerobicos = novo.aerobicos || [];
    estado.catalogoPersonalizado = novo.catalogoPersonalizado || null;
    if (estado.catalogoPersonalizado) aplicarCatalogoSalvo();
    else resetarCatalogoParaPadrao();
    return salvarAgora();
  }

  function apagarTudo() {
    estado = estadoInicial();
    resetarCatalogoParaPadrao();
    return salvarAgora();
  }

  function getEstado() { return carregar(); }

  return {
    hoje: hoje,
    getEstado: getEstado,
    getPeso: getPeso,
    setPeso: setPeso,
    getSeries: getSeries,
    toggleSerie: toggleSerie,
    progressoDia: progressoDia,
    diaConcluidoNestaSemana: diaConcluidoNestaSemana,
    concluirDia: concluirDia,
    diasConcluidosNaSemana: diasConcluidosNaSemana,
    podeConcluirSemana: podeConcluirSemana,
    concluirSemana: concluirSemana,
    ajustarSemanaManualmente: ajustarSemanaManualmente,
    ajustarPassoPeso: ajustarPassoPeso,
    historicoPorExercicio: historicoPorExercicio,
    listarAerobicos: listarAerobicos,
    addAerobico: addAerobico,
    atualizarAerobico: atualizarAerobico,
    removerAerobico: removerAerobico,
    resumoAerobicoEntre: resumoAerobicoEntre,
    editarExercicio: editarExercicio,
    adicionarExercicio: adicionarExercicio,
    removerExercicioDoDia: removerExercicioDoDia,
    adicionarDia: adicionarDia,
    editarDia: editarDia,
    removerDia: removerDia,
    reordenarDias: reordenarDias,
    imagemExercicio: imagemExercicio,
    framesExercicio: framesExercicio,
    exportarJSON: exportarJSON,
    importarJSON: importarJSON,
    apagarTudo: apagarTudo
  };
})();
