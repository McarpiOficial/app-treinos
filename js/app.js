// Navegação e renderização das telas: Semana, Treino, Aeróbico (ver js/aerobico.js),
// Progresso. Tudo renderizado via JS puro (sem framework), lendo/gravando pelo
// módulo Dados (js/dados.js) — que é a única fonte de verdade dos dados salvos.
const App = (function () {
  let telaAtual = 'semana';
  let diaEmVisualizacao = null;
  // Toque que virou arraste (pela alça ou por segurar o card) não deve também
  // abrir o dia ou o editor — o clique seguinte ao soltar consome esta flag.
  let ignorarProximoCliqueDia = false;

  function el(id) { return document.getElementById(id); }
  function fmtPeso(v) {
    if (v == null) return '—';
    return (Math.round(v * 10) / 10).toString().replace('.', ',');
  }
  function fmtData(iso) {
    const p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  // ---- Toast ----
  let toastTimer = null;
  function avisar(msg) {
    const t = el('toast');
    t.textContent = msg;
    t.classList.add('mostrar');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('mostrar'); }, 2400);
  }

  // ---- Confirmação genérica (modal) ----
  function confirmar(mensagem, aoConfirmar, textoBotao) {
    const fundo = el('modal-confirmar');
    el('modal-confirmar-texto').textContent = mensagem;
    el('modal-confirmar-ok').textContent = textoBotao || 'Confirmar';
    fundo.classList.add('ativo');
    const ok = el('modal-confirmar-ok');
    const cancelar = el('modal-confirmar-cancelar');
    function limpar() {
      fundo.classList.remove('ativo');
      ok.onclick = null;
      cancelar.onclick = null;
    }
    ok.onclick = function () { limpar(); aoConfirmar(); };
    cancelar.onclick = function () { limpar(); };
  }

  // ---- Navegação ----
  function navegarPara(tela, params) {
    telaAtual = tela;
    document.querySelectorAll('.tela').forEach(function (t) { t.classList.remove('ativa'); });
    document.querySelectorAll('.nav-item').forEach(function (b) { b.classList.remove('ativo'); });
    el('tela-' + tela).classList.add('ativa');
    const navBtn = document.querySelector('.nav-item[data-tela="' + tela + '"]');
    if (navBtn) navBtn.classList.add('ativo');
    window.scrollTo(0, 0);

    if (tela === 'semana') renderSemana();
    else if (tela === 'treino') renderTreino(params && params.diaId != null ? params.diaId : diaEmVisualizacao);
    else if (tela === 'aerobico') Aerobico.render();
    else if (tela === 'progresso') renderProgresso();
  }

  function abrirDia(diaId) {
    diaEmVisualizacao = diaId;
    navegarPara('treino', { diaId: diaId });
  }

  function proximoDiaPendente() {
    const dias = CATALOGO.dias;
    for (let i = 0; i < dias.length; i++) {
      if (!Dados.diaConcluidoNestaSemana(dias[i].id)) return dias[i].id;
    }
    return dias[0].id;
  }

  // ---- Tela Semana ----
  function renderSemana() {
    const e = Dados.getEstado();
    el('semana-numero').textContent = 'SEMANA ' + e.semanaAtual;
    el('semana-desde').textContent = 'iniciada em ' + fmtData(e.semanaIniciadaEm);

    const feitos = Dados.diasConcluidosNaSemana();
    const total = CATALOGO.dias.length;
    el('semana-progresso-barra').style.width = (feitos / total * 100) + '%';
    el('semana-progresso-legenda').textContent = feitos + '/' + total + ' treinos concluídos';

    const grade = el('grade-dias');
    grade.innerHTML = '';
    // O número mostrado ("DIA 2") é a POSIÇÃO na semana, não o id interno:
    // assim, arrastar um treino para outro lugar renumera a semana sozinho.
    CATALOGO.dias.forEach(function (dia, indice) {
      const concluido = Dados.diaConcluidoNestaSemana(dia.id);
      const prog = Dados.progressoDia(dia.id);
      const card = document.createElement('div');
      card.className = 'dia-card' + (concluido ? ' concluido' : '');
      card.dataset.diaId = dia.id;
      card.innerHTML =
        '<span class="dia-pegar" data-acao="arrastar" title="Arraste para reordenar">⠿</span>'
        + (concluido ? '<span class="check">✔</span>' : '')
        + '<div class="dia-num">DIA ' + (indice + 1) + '</div>'
        + '<div class="dia-foco">' + dia.foco + '</div>'
        + '<div class="dia-status">' + (concluido ? 'Concluído' : prog.feitas + '/' + prog.total + ' séries') + '</div>'
        + '<button type="button" class="dia-editar" data-acao="editar-dia" title="Editar dia">✏️</button>';

      card.onclick = function (ev) {
        if (ignorarProximoCliqueDia) { ignorarProximoCliqueDia = false; return; }
        if (ev.target.closest('[data-acao="editar-dia"]')) { abrirModalDia(dia.id); return; }
        if (ev.target.closest('[data-acao="arrastar"]')) return;
        abrirDia(dia.id);
      };
      grade.appendChild(card);
    });

    const btnConcluirSemana = el('btn-concluir-semana');
    const podeConcluir = Dados.podeConcluirSemana();
    btnConcluirSemana.disabled = !podeConcluir;
    btnConcluirSemana.textContent = podeConcluir
      ? 'Concluir Semana ' + e.semanaAtual
      : 'Complete os ' + total + ' treinos para concluir a semana';

    const hoje = Dados.hoje();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
    const inicioISO = seteDiasAtras.toISOString().slice(0, 10);
    const resumo = Dados.resumoAerobicoEntre(inicioISO, hoje);
    el('semana-aerobico-sessoes').textContent = resumo.sessoes;
    el('semana-aerobico-minutos').textContent = resumo.minutos;
    el('semana-aerobico-calorias').textContent = resumo.calorias;
  }

  // ---- Reordenar treinos arrastando ----
  // O arraste começa só pela alça (⠿), que tem touch-action:none. Fosse o card
  // inteiro, o navegador rolaria a página junto no celular.
  //
  // Enquanto arrasta, o card vira position:fixed e sai do fluxo — os outros
  // se reacomodam sozinhos, mostrando onde ele vai cair. A ordem final é lida
  // do próprio DOM ao soltar.
  function configurarArrasteDias() {
    const grade = el('grade-dias');
    const LIMIAR_MOVIMENTO = 10; // px de tolerância antes de considerar "é rolagem, não arraste"
    const ESPERA_TOQUE_LONGO = 380; // ms segurando o card (fora da alça) até iniciar o arraste

    let card = null;
    let arrastando = false;
    let deslocX = 0;
    let deslocY = 0;
    let alvoAtual = null; // card sob o dedo agora — só ele recebe destaque

    let timerToqueLongo = null;
    let pressCard = null;
    let pressX = 0;
    let pressY = 0;

    function limparDestaque() {
      if (alvoAtual) { alvoAtual.classList.remove('dia-card-alvo'); alvoAtual = null; }
    }

    function cancelarEsperaToqueLongo() {
      if (timerToqueLongo) { clearTimeout(timerToqueLongo); timerToqueLongo = null; }
      pressCard = null;
    }

    function iniciarArraste(alvoCard, x, y) {
      card = alvoCard;
      const r = card.getBoundingClientRect();
      deslocX = x - r.left;
      deslocY = y - r.top;
      card.style.width = r.width + 'px';
      card.style.height = r.height + 'px';
      card.style.left = r.left + 'px';
      card.style.top = r.top + 'px';
      card.classList.add('arrastando');
      arrastando = true;
      ignorarProximoCliqueDia = true; // o toque que vira arraste não deve também abrir o dia
      // Vibração é só uma confirmação tátil; alguns navegadores recusam a
      // chamada dependendo do contexto, e isso não pode atrapalhar o arraste.
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* opcional */ }
    }

    function aoPressionar(ev) {
      if (ev.target.closest('[data-acao="editar-dia"]')) return; // editar é toque imediato, sem espera
      const alvo = ev.target.closest('.dia-card');
      if (!alvo || alvo.parentNode !== grade || grade.children.length < 2) return;

      if (ev.target.closest('[data-acao="arrastar"]')) {
        ev.preventDefault();
        iniciarArraste(alvo, ev.clientX, ev.clientY);
        return;
      }

      // Segurar em qualquer parte do card também arrasta, depois de um instante
      // — evita ter que acertar o ícone pequeno com o dedo. Sem preventDefault
      // aqui: se o gesto for na verdade uma rolagem, o navegador segue livre.
      pressCard = alvo;
      pressX = ev.clientX;
      pressY = ev.clientY;
      timerToqueLongo = setTimeout(function () {
        timerToqueLongo = null;
        if (pressCard) { iniciarArraste(pressCard, pressX, pressY); pressCard = null; }
      }, ESPERA_TOQUE_LONGO);
    }

    function aoMover(ev) {
      if (arrastando) {
        ev.preventDefault();
        card.style.left = (ev.clientX - deslocX) + 'px';
        card.style.top = (ev.clientY - deslocY) + 'px';

        // O card arrastado tem pointer-events:none, então isso pega o que está embaixo.
        const embaixo = document.elementFromPoint(ev.clientX, ev.clientY);
        const vizinho = embaixo && embaixo.closest ? embaixo.closest('.dia-card') : null;
        const valido = (vizinho && vizinho !== card && vizinho.parentNode === grade) ? vizinho : null;
        if (valido !== alvoAtual) {
          limparDestaque();
          alvoAtual = valido;
          if (alvoAtual) alvoAtual.classList.add('dia-card-alvo');
        }
        return;
      }

      if (pressCard) {
        const dx = ev.clientX - pressX, dy = ev.clientY - pressY;
        if (Math.hypot(dx, dy) > LIMIAR_MOVIMENTO) cancelarEsperaToqueLongo();
      }
    }

    // A troca de posição é calculada e aplicada UMA VEZ, aqui — não a cada
    // movimento. O card arrastado fica position:fixed (fora do grid), então os
    // outros não se reacomodam visualmente durante o arraste; recalcular e
    // reinserir no DOM a cada pointermove causava uma oscilação (troca e
    // desfaz a cada leve tremor do dedo) cujo resultado final era instável —
    // era esse o "não aconteceu nada, voltou pro lugar".
    function aoSoltar() {
      cancelarEsperaToqueLongo();
      if (!arrastando) { card = null; return; }
      arrastando = false;
      card.classList.remove('arrastando');
      card.removeAttribute('style');

      const destino = alvoAtual;
      limparDestaque();
      const cardSolto = card;
      card = null;

      // Rede de segurança: se por algum motivo o clique-fantasma do toque não
      // disparar (ex.: pointercancel), a flag não fica travada em "true" para sempre.
      setTimeout(function () { ignorarProximoCliqueDia = false; }, 400);

      if (!destino) return; // soltou fora de outro card: mantém a ordem original

      grade.insertBefore(cardSolto, destino);
      const idsNaNovaOrdem = Array.from(grade.children).map(function (c) { return Number(c.dataset.diaId); });
      Dados.reordenarDias(idsNaNovaOrdem);
      renderSemana();
      avisar('Ordem dos treinos atualizada.');
    }

    grade.addEventListener('pointerdown', aoPressionar);
    document.addEventListener('pointermove', aoMover, { passive: false });
    document.addEventListener('pointerup', aoSoltar);
    document.addEventListener('pointercancel', aoSoltar);
  }

  // ---- Modal de dia de treino ----
  let diaEmEdicao = null;

  function abrirModalDia(diaId) {
    diaEmEdicao = diaId;
    const criando = diaId == null;
    const dia = criando ? null : diaPorId(diaId);

    el('modal-dia-titulo').textContent = criando ? 'Novo dia de treino' : 'Editar dia de treino';
    el('modal-dia-foco').value = dia ? dia.foco : '';
    el('modal-dia-ajuda').textContent = criando
      ? 'Depois de criar, o dia abre para você adicionar os exercícios.'
      : 'Excluir o dia remove os exercícios que só existiam nele. O histórico já registrado é mantido.';
    // Precisa sobrar pelo menos um treino na rotina.
    el('modal-dia-excluir').style.display = (criando || CATALOGO.dias.length <= 1) ? 'none' : 'block';
    el('modal-dia').classList.add('ativo');
    el('modal-dia-foco').focus();
  }

  function fecharModalDia() {
    el('modal-dia').classList.remove('ativo');
    diaEmEdicao = null;
  }

  function configurarModalDia() {
    el('btn-novo-dia').onclick = function () { abrirModalDia(null); };
    el('modal-dia-cancelar').onclick = fecharModalDia;

    el('modal-dia-salvar').onclick = function () {
      const foco = el('modal-dia-foco').value.trim();
      if (!foco) { avisar('Dê um nome ao treino (ex.: Peito e Tríceps).'); return; }

      if (diaEmEdicao == null) {
        const novoId = Dados.adicionarDia(foco);
        fecharModalDia();
        avisar('Dia criado. Agora adicione os exercícios.');
        abrirDia(novoId);
      } else {
        Dados.editarDia(diaEmEdicao, { foco: foco });
        fecharModalDia();
        renderSemana();
      }
    };

    el('modal-dia-excluir').onclick = function () {
      const id = diaEmEdicao;
      const dia = diaPorId(id);
      if (!dia) return;
      confirmar('Excluir o treino "' + dia.foco + '" da rotina?', function () {
        if (!Dados.removerDia(id)) { avisar('A rotina precisa ter pelo menos um treino.'); return; }
        fecharModalDia();
        navegarPara('semana');
        avisar('Treino removido da rotina.');
      }, 'Excluir');
    };
  }

  function aoClicarConcluirSemana() {
    if (!Dados.podeConcluirSemana()) return;
    const e = Dados.getEstado();
    confirmar('Concluir a Semana ' + e.semanaAtual + ' e começar a Semana ' + (e.semanaAtual + 1) + '?', function () {
      Dados.concluirSemana();
      avisar('Semana concluída! Bora pra próxima 💪');
      renderSemana();
    }, 'Concluir semana');
  }

  // ---- Tela Treino ----
  function renderTreino(diaId) {
    diaId = Number(diaId);
    diaEmVisualizacao = diaId;
    const dia = diaPorId(diaId);
    if (!dia) return;

    el('treino-dia-num').textContent = 'DIA ' + posicaoDoDia(dia.id) + ' DE ' + CATALOGO.dias.length;
    el('treino-dia-foco').textContent = dia.foco.toUpperCase();
    const prog = Dados.progressoDia(diaId);
    el('treino-dia-sub').textContent = prog.feitas + ' de ' + prog.total + ' séries feitas nesta semana';

    const lista = el('lista-exercicios');
    lista.innerHTML = '';
    dia.exercicios.forEach(function (exId) {
      lista.appendChild(criarCardExercicio(diaId, exId));
    });

    const btnConcluir = el('btn-concluir-treino');
    const jaConcluido = Dados.diaConcluidoNestaSemana(diaId);
    btnConcluir.textContent = jaConcluido ? 'Treino já concluído nesta semana ✔' : 'Concluir treino do dia';
    btnConcluir.disabled = jaConcluido;
  }

  function criarCardExercicio(diaId, exId) {
    const info = CATALOGO.exercicios[exId];
    const card = document.createElement('div');
    card.className = 'card exercicio-card';

    const pesoAtual = Dados.getPeso(diaId, exId);
    const historico = Dados.historicoPorExercicio(exId).filter(function (p) { return p.dia === diaId; });
    const pesoAnterior = historico.length ? historico[historico.length - 1].peso : null;
    const passo = Dados.getEstado().passoPeso;

    const frames = Dados.framesExercicio(exId);
    const temMovimento = frames.length > 1;

    card.innerHTML =
      '<button class="exercicio-foto" data-acao="zoom">'
      + '  <img src="' + frames[0] + '" alt="' + info.nome + '" loading="lazy">'
      + '  <span class="exercicio-foto-dica">' + (temMovimento ? '▶ ver movimento' : '🔍 ampliar') + '</span>'
      + '</button>'
      + '<div class="exercicio-cabecalho">'
      + '  <div class="exercicio-info">'
      + '    <div class="nome">' + info.nome + '</div>'
      + '    <div class="series-alvo">' + info.series + '× ' + info.reps + '</div>'
      + '  </div>'
      + '  <button class="icone-botao" data-acao="editar-exercicio" title="Editar exercício">✏️</button>'
      + '</div>'
      + '<div class="bloco-peso">'
      + '  <button class="btn-peso" data-acao="menos">−</button>'
      + '  <div>'
      + '    <input class="valor-peso" data-acao="valor" type="number" inputmode="decimal" step="0.5" value="' + (pesoAtual != null ? pesoAtual : '') + '" placeholder="0">'
      + '    <div class="valor-peso-unidade">kg</div>'
      + '  </div>'
      + '  <button class="btn-peso" data-acao="mais">+</button>'
      + '</div>'
      + '<div class="dica-peso" data-acao="dica"></div>'
      + '<div class="serie-bolinhas" data-acao="bolinhas"></div>';

    function pesoInput() { return card.querySelector('[data-acao="valor"]'); }

    function atualizarDica() {
      const el2 = card.querySelector('[data-acao="dica"]');
      if (pesoAnterior == null) { el2.textContent = 'Primeiro registro deste exercício'; return; }
      const atual = parseFloat(pesoInput().value) || 0;
      const delta = Math.round((atual - pesoAnterior) * 10) / 10;
      const sinal = delta > 0 ? '▲ +' + fmtPeso(delta) : (delta < 0 ? '▼ ' + fmtPeso(delta) : '＝ igual');
      const classe = delta > 0 ? 'delta-pos' : (delta < 0 ? 'delta-neg' : '');
      el2.innerHTML = 'Semana passada: ' + fmtPeso(pesoAnterior) + ' kg &nbsp;·&nbsp; <span class="' + classe + '">' + sinal + '</span>';
    }

    function salvarPeso() {
      const v = parseFloat(pesoInput().value);
      Dados.setPeso(diaId, exId, isNaN(v) ? null : v);
      atualizarDica();
    }

    card.querySelector('[data-acao="menos"]').onclick = function () {
      const v = (parseFloat(pesoInput().value) || 0) - passo;
      pesoInput().value = Math.max(0, Math.round(v * 10) / 10);
      salvarPeso();
    };
    card.querySelector('[data-acao="mais"]').onclick = function () {
      const v = (parseFloat(pesoInput().value) || 0) + passo;
      pesoInput().value = Math.round(v * 10) / 10;
      salvarPeso();
    };
    pesoInput().oninput = salvarPeso;
    card.querySelector('[data-acao="zoom"]').onclick = function () {
      abrirZoom(Dados.framesExercicio(exId), info.nome);
    };
    card.querySelector('[data-acao="editar-exercicio"]').onclick = function () {
      abrirModalExercicio(diaId, exId);
    };

    function renderBolinhas() {
      const cont = card.querySelector('[data-acao="bolinhas"]');
      cont.innerHTML = '';
      const feitas = Dados.getSeries(diaId, exId);
      feitas.forEach(function (feita, i) {
        const b = document.createElement('button');
        b.className = 'bolinha-serie' + (feita ? ' feita' : '');
        b.textContent = feita ? '✓' : (i + 1);
        b.onclick = function () {
          Dados.toggleSerie(diaId, exId, i);
          renderBolinhas();
          atualizarProgressoCabecalho();
        };
        cont.appendChild(b);
      });
    }

    renderBolinhas();
    atualizarDica();
    return card;
  }

  function atualizarProgressoCabecalho() {
    const diaId = diaEmVisualizacao;
    const prog = Dados.progressoDia(diaId);
    el('treino-dia-sub').textContent = prog.feitas + ' de ' + prog.total + ' séries feitas nesta semana';
  }

  function aoClicarConcluirTreino() {
    const diaId = diaEmVisualizacao;
    if (Dados.diaConcluidoNestaSemana(diaId)) return;
    const dia = diaPorId(diaId);
    const prog = Dados.progressoDia(diaId);
    const mensagem = prog.feitas < prog.total
      ? 'Ainda faltam séries para marcar (' + prog.feitas + '/' + prog.total + '). Concluir o Dia ' + dia.id + ' mesmo assim?'
      : 'Concluir o Dia ' + dia.id + ' — ' + dia.foco + '?';
    confirmar(mensagem, function () {
      Dados.concluirDia(diaId);
      avisar('Treino do Dia ' + dia.id + ' registrado!');
      renderTreino(diaId);
    }, 'Concluir treino');
  }

  // ---- Modal: adicionar/editar exercício ----
  // A rotina muda com o tempo, então cada exercício pode ser renomeado, ter as
  // séries/reps ajustadas, trocar de imagem (ilustração da biblioteca ou foto
  // própria) ou ser removido do dia — e novos exercícios podem ser adicionados.
  let modalExContexto = null; // { diaId, exId } — exId null = criando um novo
  let modalExImagem = null;   // { tipo: 'padrao'|'biblioteca'|'foto', valor }

  function abrirModalExercicio(diaId, exId) {
    modalExContexto = { diaId: diaId, exId: exId };
    const criando = !exId;
    const info = exId ? CATALOGO.exercicios[exId] : null;

    el('modal-exercicio-titulo').textContent = criando ? 'Adicionar exercício' : 'Editar exercício';
    el('modal-ex-nome').value = info ? info.nome : '';
    el('modal-ex-series').value = info ? info.series : 3;
    el('modal-ex-reps').value = info ? info.reps : '10 a 12';
    el('modal-ex-excluir').style.display = criando ? 'none' : 'block';

    if (info && info.imagem && info.imagem.valor) modalExImagem = info.imagem;
    else if (info && info.lib) modalExImagem = { tipo: 'auto', valor: info.lib };
    else modalExImagem = { tipo: 'auto', valor: info ? Imagens.buscarSlug(info.nome) : null };

    el('modal-ex-busca').value = '';
    el('modal-ex-foto-input').value = '';
    preencherGridBibliotecaExercicio();
    atualizarModoImagemExercicio();
    el('modal-exercicio').classList.add('ativo');
  }

  function fecharModalExercicio() {
    el('modal-exercicio').classList.remove('ativo');
    modalExContexto = null;
  }

  // Grade da biblioteca: por padrão mostra os exercícios mais parecidos com o
  // nome digitado; o campo de busca permite procurar qualquer um dos 136.
  function preencherGridBibliotecaExercicio(termoBusca) {
    const grid = el('modal-ex-biblioteca-grid');
    const termo = termoBusca != null ? termoBusca : (el('modal-ex-nome').value || '');
    const resultados = Imagens.procurar(termo, 24);
    grid.innerHTML = '';
    if (!resultados.length) {
      grid.innerHTML = '<div class="vazio" style="grid-column:1/-1;">Nada encontrado. Tente outro termo ou use uma foto sua.</div>';
      return;
    }
    resultados.forEach(function (item) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-secundario';
      btn.style.padding = '4px';
      btn.dataset.id = item.slug;
      btn.innerHTML = '<img src="./img/lib/' + item.slug + '/0.jpg" alt="' + item.nome + '" loading="lazy" style="width:100%; height:64px; object-fit:cover; border-radius:6px; display:block;">'
        + '<div style="font-size:10px; margin-top:4px; line-height:1.2;">' + item.nome + '</div>';
      btn.onclick = function () {
        modalExImagem = { tipo: 'biblioteca', valor: item.slug };
        marcarSelecaoGridBiblioteca();
      };
      grid.appendChild(btn);
    });
    marcarSelecaoGridBiblioteca();
  }

  function marcarSelecaoGridBiblioteca() {
    const grid = el('modal-ex-biblioteca-grid');
    Array.from(grid.children).forEach(function (btn) {
      if (!btn.dataset.id) return;
      const selecionado = (modalExImagem.tipo === 'biblioteca' || modalExImagem.tipo === 'auto')
        && btn.dataset.id === modalExImagem.valor;
      btn.style.borderColor = selecionado ? 'var(--laranja)' : 'var(--borda)';
    });
  }

  function atualizarModoImagemExercicio() {
    const modo = modalExImagem.tipo === 'padrao' ? 'auto' : modalExImagem.tipo;
    Array.from(el('modal-ex-imagem-opcoes').children).forEach(function (chip) {
      chip.classList.toggle('selecionado', chip.dataset.modo === modo);
    });
    el('modal-ex-area-biblioteca').style.display = modo === 'biblioteca' ? 'block' : 'none';
    el('modal-ex-foto-area').style.display = modo === 'foto' ? 'block' : 'none';
    el('modal-ex-preview-auto').style.display = modo === 'auto' ? 'flex' : 'none';

    if (modo === 'auto') {
      const slug = modalExImagem.valor || Imagens.buscarSlug(el('modal-ex-nome').value);
      const item = slug ? Imagens.porSlug(slug) : null;
      el('modal-ex-preview-auto-img').src = item ? './img/lib/' + item.slug + '/0.jpg' : Imagens.generico;
      el('modal-ex-preview-auto-nome').textContent = item
        ? 'Encontrado: ' + item.nome
        : 'Nenhuma foto encontrada para esse nome — será usado o ícone genérico.';
    }

    marcarSelecaoGridBiblioteca();
    const preview = el('modal-ex-foto-preview');
    if (modo === 'foto' && modalExImagem.valor) {
      preview.src = modalExImagem.valor;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  }

  // Reduz a foto escolhida (câmera/galeria costuma gerar arquivos enormes)
  // antes de guardar como data URL no localStorage — senão a cota do
  // navegador esgota rápido.
  function redimensionarImagem(dataUrlOriginal, ladoMaximo, aoTerminar) {
    const img = new Image();
    img.onload = function () {
      const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * escala));
      const h = Math.max(1, Math.round(img.height * escala));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      aoTerminar(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = function () { avisar('Não foi possível ler essa imagem.'); };
    img.src = dataUrlOriginal;
  }

  function configurarModalExercicio() {
    Array.from(el('modal-ex-imagem-opcoes').children).forEach(function (chip) {
      chip.onclick = function () {
        const modo = chip.dataset.modo;
        if (modo === 'auto') {
          // volta a deixar o app escolher a foto pelo nome
          modalExImagem = { tipo: 'auto', valor: Imagens.buscarSlug(el('modal-ex-nome').value) };
        } else if (modo === 'biblioteca') {
          modalExImagem = { tipo: 'biblioteca', valor: modalExImagem.valor || null };
          preencherGridBibliotecaExercicio();
        } else {
          modalExImagem = { tipo: 'foto', valor: modalExImagem.tipo === 'foto' ? modalExImagem.valor : null };
        }
        atualizarModoImagemExercicio();
      };
    });

    // Digitou outro nome: se a imagem está no automático, já reflete a nova foto.
    el('modal-ex-nome').oninput = function () {
      if (modalExImagem.tipo === 'auto' || modalExImagem.tipo === 'padrao') {
        modalExImagem = { tipo: 'auto', valor: Imagens.buscarSlug(el('modal-ex-nome').value) };
        atualizarModoImagemExercicio();
      }
    };

    el('modal-ex-busca').oninput = function (e) {
      preencherGridBibliotecaExercicio(e.target.value);
    };

    el('modal-ex-foto-input').onchange = function (e) {
      const arquivo = e.target.files && e.target.files[0];
      if (!arquivo) return;
      const leitor = new FileReader();
      leitor.onload = function () {
        redimensionarImagem(leitor.result, 480, function (dataUrlReduzida) {
          modalExImagem = { tipo: 'foto', valor: dataUrlReduzida };
          atualizarModoImagemExercicio();
        });
      };
      leitor.readAsDataURL(arquivo);
    };

    el('modal-ex-salvar').onclick = function () {
      const nome = el('modal-ex-nome').value.trim();
      if (!nome) { avisar('Informe o nome do exercício.'); return; }
      const series = parseInt(el('modal-ex-series').value, 10) || 3;
      const reps = el('modal-ex-reps').value.trim() || '10 a 12';
      const ctx = modalExContexto;
      if (ctx.exId) {
        Dados.editarExercicio(ctx.exId, { nome: nome, series: series, reps: reps, imagem: modalExImagem });
        avisar('Exercício atualizado.');
      } else {
        Dados.adicionarExercicio(ctx.diaId, { nome: nome, series: series, reps: reps, imagem: modalExImagem });
        avisar('Exercício adicionado ao treino.');
      }
      fecharModalExercicio();
      renderTreino(ctx.diaId);
    };

    el('modal-ex-excluir').onclick = function () {
      const ctx = modalExContexto;
      const nomeEx = CATALOGO.exercicios[ctx.exId] ? CATALOGO.exercicios[ctx.exId].nome : 'este exercício';
      confirmar('Remover "' + nomeEx + '" deste treino? O histórico de pesos já registrado não será apagado.', function () {
        Dados.removerExercicioDoDia(ctx.diaId, ctx.exId);
        fecharModalExercicio();
        renderTreino(ctx.diaId);
        avisar('Exercício removido do treino.');
      }, 'Remover');
    };

    el('modal-ex-cancelar').onclick = fecharModalExercicio;
  }

  // ---- Zoom de imagem ----
  // A biblioteca traz 2 quadros por exercício (início e fim do movimento).
  // Em tela cheia eles se alternam sozinhos, o que mostra a execução —
  // é o que serve para tirar dúvida de como fazer.
  let zoomEscala = 1;
  let zoomFrames = [];
  let zoomIndice = 0;
  let zoomTimer = null;

  function abrirZoom(srcOuFrames, titulo) {
    const overlay = el('zoom-overlay');
    const img = el('zoom-img');
    zoomFrames = Array.isArray(srcOuFrames) ? srcOuFrames : [srcOuFrames];
    zoomIndice = 0;
    img.src = zoomFrames[0];
    img.style.transform = 'scale(1)';
    zoomEscala = 1;

    pararAnimacaoZoom();
    if (zoomFrames.length > 1) {
      el('zoom-legenda').textContent = titulo + ' — mostrando o movimento; belisque para ampliar';
      zoomTimer = setInterval(function () {
        zoomIndice = (zoomIndice + 1) % zoomFrames.length;
        img.src = zoomFrames[zoomIndice];
      }, 900);
    } else {
      el('zoom-legenda').textContent = titulo + ' — toque duas vezes ou belisque para ampliar';
    }
    overlay.classList.add('ativo');
  }

  function pararAnimacaoZoom() {
    if (zoomTimer) { clearInterval(zoomTimer); zoomTimer = null; }
  }

  function fecharZoom() {
    pararAnimacaoZoom();
    el('zoom-overlay').classList.remove('ativo');
  }
  function configurarZoomGestos() {
    const overlay = el('zoom-overlay');
    const img = el('zoom-img');
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) fecharZoom();
    });
    img.addEventListener('dblclick', function () {
      zoomEscala = zoomEscala > 1 ? 1 : 2.4;
      img.style.transform = 'scale(' + zoomEscala + ')';
    });
    // Pinça (pinch-to-zoom) simples com dois toques.
    let distanciaInicial = null;
    let escalaInicial = 1;
    img.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        distanciaInicial = distanciaEntreToques(e.touches);
        escalaInicial = zoomEscala;
      }
    });
    img.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2 && distanciaInicial) {
        const nova = distanciaEntreToques(e.touches);
        zoomEscala = Math.min(4, Math.max(1, escalaInicial * (nova / distanciaInicial)));
        img.style.transform = 'scale(' + zoomEscala + ')';
      }
    });
  }
  function distanciaEntreToques(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ---- Tela Progresso ----
  function renderProgresso() {
    // A lista de exercícios é reconstruída a cada visita (não é cara: no máximo
    // algumas dezenas de itens) porque o catálogo é editável — exercícios podem
    // ter sido adicionados/removidos/renomeados desde a última vez.
    const seletor = el('seletor-exercicio-progresso');
    const valorAnterior = seletor.value;
    seletor.innerHTML = '';
    Object.keys(CATALOGO.exercicios).forEach(function (id) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = CATALOGO.exercicios[id].nome;
      seletor.appendChild(opt);
    });
    if (Object.prototype.hasOwnProperty.call(CATALOGO.exercicios, valorAnterior)) seletor.value = valorAnterior;
    seletor.onchange = renderGraficoProgresso;
    renderGraficoProgresso();

    const e = Dados.getEstado();
    const listaSemanas = el('lista-semanas-concluidas');
    listaSemanas.innerHTML = '';
    if (!e.historico.length) {
      listaSemanas.innerHTML = '<li>Nenhum treino concluído ainda.</li>';
    } else {
      const porSemanaEDia = {};
      e.historico.forEach(function (h) {
        const chave = h.semana + ':' + h.dia;
        porSemanaEDia[chave] = h;
      });
      Object.keys(porSemanaEDia).sort().reverse().slice(0, 20).forEach(function (chave) {
        const h = porSemanaEDia[chave];
        const dia = diaPorId(h.dia);
        // O treino é identificado pelo nome, não pelo número: a posição na
        // semana muda quando você reordena, e o dia pode até ter sido removido.
        const nome = (dia && dia.foco) || h.foco || 'Treino removido';
        const li = document.createElement('li');
        li.innerHTML = '<span>Semana ' + h.semana + ' · ' + nome + '</span><span>' + fmtData(h.data) + '</span>';
        listaSemanas.appendChild(li);
      });
    }
  }

  function renderGraficoProgresso() {
    const exId = el('seletor-exercicio-progresso').value;
    const pontos = Dados.historicoPorExercicio(exId).sort(function (a, b) { return a.semana - b.semana; });
    const svg = el('grafico-progresso');
    if (pontos.length < 2) {
      svg.innerHTML = '<text x="10" y="90" fill="#9a9aa2" font-size="13">Registre pesos em pelo menos 2 semanas para ver o gráfico.</text>';
      return;
    }
    const largura = 300, altura = 160, margem = 20;
    const pesos = pontos.map(function (p) { return p.peso; });
    const min = Math.min.apply(null, pesos), max = Math.max.apply(null, pesos);
    const faixa = max - min || 1;
    const passoX = (largura - margem * 2) / (pontos.length - 1);
    const coords = pontos.map(function (p, i) {
      const x = margem + i * passoX;
      const y = altura - margem - ((p.peso - min) / faixa) * (altura - margem * 2);
      return [x, y];
    });
    const linha = coords.map(function (c, i) { return (i === 0 ? 'M' : 'L') + c[0] + ',' + c[1]; }).join(' ');
    const pontosSvg = coords.map(function (c, i) {
      return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="3.5" fill="#ff5a1f"></circle>'
        + '<text x="' + c[0] + '" y="' + (c[1] - 10) + '" font-size="10" fill="#f2f2f2" text-anchor="middle">' + fmtPeso(pontos[i].peso) + '</text>';
    }).join('');
    svg.setAttribute('viewBox', '0 0 ' + largura + ' ' + altura);
    svg.innerHTML = '<path d="' + linha + '" fill="none" stroke="#ff5a1f" stroke-width="2.5"/>' + pontosSvg;
  }

  // ---- Ajustes / Backup ----
  function exportarBackup() {
    const json = Dados.exportarJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dataArq = Dados.hoje();
    a.href = url;
    a.download = 'backup-treinos-' + dataArq + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    avisar('Backup exportado.');
  }

  function importarBackup(arquivo) {
    const leitor = new FileReader();
    leitor.onload = function () {
      try {
        Dados.importarJSON(leitor.result);
        avisar('Backup importado com sucesso.');
        renderSemana();
        renderProgresso();
      } catch (e) {
        console.error(e);
        avisar('Arquivo inválido. Verifique o backup.');
      }
    };
    leitor.readAsText(arquivo);
  }

  function aoClicarApagarTudo() {
    confirmar('Apagar TODOS os dados do app (pesos, semanas, histórico e aeróbicos)? Isso não pode ser desfeito.', function () {
      confirmar('Tem certeza mesmo? Essa é a última confirmação.', function () {
        Dados.apagarTudo();
        avisar('Todos os dados foram apagados.');
        navegarPara('semana');
      }, 'Sim, apagar tudo');
    }, 'Continuar');
  }

  // ---- Inicialização ----
  function init() {
    document.querySelectorAll('.nav-item').forEach(function (btn) {
      btn.onclick = function () {
        if (btn.dataset.tela === 'treino') abrirDia(proximoDiaPendente());
        else navegarPara(btn.dataset.tela);
      };
    });
    el('btn-concluir-semana').onclick = aoClicarConcluirSemana;
    el('btn-concluir-treino').onclick = aoClicarConcluirTreino;
    el('btn-voltar-treino').onclick = function () { navegarPara('semana'); };
    el('zoom-fechar').onclick = fecharZoom;
    el('btn-exportar-backup').onclick = exportarBackup;
    el('input-importar-backup').onchange = function (e) {
      if (e.target.files && e.target.files[0]) importarBackup(e.target.files[0]);
      e.target.value = '';
    };
    el('btn-apagar-tudo').onclick = aoClicarApagarTudo;
    el('input-passo-peso').value = Dados.getEstado().passoPeso;
    el('input-passo-peso').onchange = function (e) {
      const v = parseFloat(e.target.value) || 2.5;
      Dados.ajustarPassoPeso(v);
      avisar('Incremento de peso ajustado para ' + fmtPeso(v) + ' kg.');
    };
    el('input-semana-manual').value = Dados.getEstado().semanaAtual;
    el('btn-ajustar-semana').onclick = function () {
      const v = parseInt(el('input-semana-manual').value, 10);
      if (v >= 1) {
        Dados.ajustarSemanaManualmente(v);
        avisar('Semana ajustada para ' + v + '.');
        renderSemana();
      }
    };

    configurarZoomGestos();
    configurarModalDia();
    configurarArrasteDias();
    configurarModalExercicio();
    el('btn-adicionar-exercicio').onclick = function () { abrirModalExercicio(diaEmVisualizacao, null); };
    Aerobico.init();

    if ('serviceWorker' in navigator) {
      // Quando sai uma versão nova do app, o service worker novo assume o
      // controle da página. Sem isso aqui, a tela continuaria mostrando a
      // versão velha até o app ser aberto de novo — recarregamos na hora.
      const jaTinhaControlador = !!navigator.serviceWorker.controller;
      let recarregando = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        // Na primeira instalação também há troca de controlador, mas aí a tela
        // já está atualizada: recarregar só faria piscar à toa.
        if (!jaTinhaControlador || recarregando) return;
        recarregando = true;
        window.location.reload();
      });

      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').then(function (registro) {
          // Procura atualização assim que abre e também ao voltar para o app.
          registro.update().catch(function () {});
          document.addEventListener('visibilitychange', function () {
            if (!document.hidden) registro.update().catch(function () {});
          });
        }).catch(function (e) { console.warn('SW não registrado:', e); });
      });
    }

    navegarPara('semana');
  }

  return {
    init: init,
    navegarPara: navegarPara,
    abrirDia: abrirDia,
    abrirZoom: abrirZoom,
    fecharZoom: fecharZoom,
    avisar: avisar,
    confirmar: confirmar,
    fmtPeso: fmtPeso,
    fmtData: fmtData,
    proximoDiaPendente: proximoDiaPendente
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
