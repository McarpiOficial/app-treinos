// Navegação e renderização das telas: Semana, Treino, Aeróbico (ver js/aerobico.js),
// Progresso. Tudo renderizado via JS puro (sem framework), lendo/gravando pelo
// módulo Dados (js/dados.js) — que é a única fonte de verdade dos dados salvos.
const App = (function () {
  // Mostrada em Progresso > Ajustes, para o usuário conseguir CONFIRMAR pelo
  // olho que uma atualização chegou, sem depender de nenhum mecanismo
  // automático. Bumpar junto com CACHE em sw.js a cada mudança publicada.
  const VERSAO_APP = 'v22';

  let telaAtual = 'semana';
  let diaEmVisualizacao = null;
  // Toque que virou arraste (segurar o card) não deve também abrir o dia ou
  // o editor — o clique seguinte ao soltar consome esta flag.
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
    else if (tela === 'abdominal') Abdominal.render();
    else if (tela === 'alimentacao') Alimentacao.render();
    else if (tela === 'progresso') renderProgresso();

    atualizarBarraCalorias();
  }

  // Resumo de calorias/TMB/saldo do dia — fica no topo de toda tela (ver
  // #barra-calorias em index.html, fora de qualquer .tela), atualizado a
  // cada troca de aba e a cada mudança em Alimentação ou no TMB.
  function atualizarBarraCalorias() {
    const alvo = el('barra-calorias-texto');
    const hoje = Dados.hoje();
    const consumidas = Math.round(Dados.caloriasNoDia(hoje));
    // Queimadas no treino só aparecem depois de "Concluir treino do dia" (é
    // o momento em que o peso usado fica registrado com a data de hoje) —
    // marcar séries sem concluir ainda não soma aqui.
    const queimadas = Math.round(Dados.caloriasQueimadasNoDia(hoje));
    const perfil = Dados.getPerfil();
    const sufixoQueimadas = queimadas ? ' &nbsp;·&nbsp; 🔥 <strong>' + queimadas + '</strong> kcal treino' : '';
    if (!perfil) {
      alvo.innerHTML = '🍽️ <strong>' + consumidas + '</strong> kcal comidas' + sufixoQueimadas + ' &nbsp;·&nbsp; calcule seu TMB em Progresso';
      return;
    }
    const saldo = Math.round(perfil.tmb + queimadas - consumidas);
    const classe = saldo >= 0 ? 'saldo-pos' : 'saldo-neg';
    alvo.innerHTML = '🍽️ <strong>' + consumidas + '</strong> kcal' + sufixoQueimadas + ' &nbsp;·&nbsp; TMB <strong>' + perfil.tmb + '</strong>'
      + ' &nbsp;·&nbsp; Saldo <span class="' + classe + '">' + (saldo > 0 ? '+' : '') + saldo + '</span>';
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
      const ultimo = indice === CATALOGO.dias.length - 1;
      card.innerHTML =
        '<div class="dia-card-topo">'
        + '  <div class="dia-num">' + (concluido ? '<span class="check">✔</span> ' : '') + 'DIA ' + (indice + 1) + '</div>'
        + '  <div class="dia-mover">'
        + '    <button type="button" class="dia-mover-btn" data-acao="mover-cima" title="Mover para cima"' + (indice === 0 ? ' disabled' : '') + '>▲</button>'
        + '    <button type="button" class="dia-mover-btn" data-acao="mover-baixo" title="Mover para baixo"' + (ultimo ? ' disabled' : '') + '>▼</button>'
        + '  </div>'
        + '</div>'
        + '<div class="dia-foco">' + dia.foco + '</div>'
        + '<div class="dia-status">' + (concluido ? 'Concluído' : prog.feitas + '/' + prog.total + ' séries') + '</div>'
        + '<button type="button" class="dia-editar" data-acao="editar-dia" title="Editar dia">✏️</button>';

      card.onclick = function (ev) {
        if (ignorarProximoCliqueDia) { ignorarProximoCliqueDia = false; return; }
        if (ev.target.closest('[data-acao="editar-dia"]')) { abrirModalDia(dia.id); return; }
        if (ev.target.closest('[data-acao="mover-cima"]')) { moverDia(dia.id, -1); return; }
        if (ev.target.closest('[data-acao="mover-baixo"]')) { moverDia(dia.id, 1); return; }
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

  // Troca discreta de posição (botões ▲▼) — não depende de gesto nenhum,
  // então funciona sempre, em qualquer aparelho.
  function moverDia(diaId, delta) {
    const ids = CATALOGO.dias.map(function (d) { return d.id; });
    const i = ids.indexOf(Number(diaId));
    const j = i + delta;
    if (i === -1 || j < 0 || j >= ids.length) return;
    const tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp;
    Dados.reordenarDias(ids);
    renderSemana();
    avisar('Ordem dos treinos atualizada.');
  }

  // ---- Reordenar treinos arrastando ----
  // Mesma técnica usada em MarretaFC (arraste de jogador no campinho): um
  // CLONE ("fantasma") segue o dedo, enquanto o card original só fica
  // esmaecido no lugar — evita qualquer disputa com o grid (nada precisa
  // sair do fluxo) e evita depender só de CSS pointer-events para o
  // elementFromPoint enxergar o card de baixo (escondemos o fantasma com
  // display:none no instante exato do hit-test, como lá).
  //
  // A decisão "isso é um toque ou um arraste" é por DISTÂNCIA percorrida,
  // não por tempo: assim que o dedo se move um pouco, já vira arraste — sem
  // esperar um long-press. Só entra em modo arraste depois desse limiar, o
  // que preserva o toque normal (abrir o dia) intacto para quem só tocou.
  function configurarArrasteDias() {
    const grade = el('grade-dias');
    const LIMIAR_MOVIMENTO = 6; // px percorridos até virar arraste

    let origemEl = null;   // card original (fica esmaecido no lugar)
    let fantasma = null;   // clone que segue o dedo
    let iniciouArraste = false;
    let pressX = 0, pressY = 0;
    let deslocX = 0, deslocY = 0;
    let alvoAtual = null;

    function limparDestaque() {
      if (alvoAtual) { alvoAtual.classList.remove('dia-card-alvo'); alvoAtual = null; }
    }

    function criarFantasma(x, y) {
      const r = origemEl.getBoundingClientRect();
      fantasma = origemEl.cloneNode(true);
      fantasma.className = 'dia-card dia-card-fantasma';
      fantasma.style.width = r.width + 'px';
      fantasma.style.height = r.height + 'px';
      fantasma.style.left = r.left + 'px';
      fantasma.style.top = r.top + 'px';
      deslocX = x - r.left;
      deslocY = y - r.top;
      document.body.appendChild(fantasma);
      origemEl.classList.add('origem-arrastando');
      document.documentElement.classList.add('trava-scroll');
      ignorarProximoCliqueDia = true; // o toque que virou arraste não deve também abrir o dia
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* opcional */ }
    }

    function moverFantasma(x, y) {
      fantasma.style.left = (x - deslocX) + 'px';
      fantasma.style.top = (y - deslocY) + 'px';
    }

    // Acha o card sob o dedo, ignorando o próprio fantasma no hit-test
    // (escondê-lo é mais confiável entre navegadores do que confiar só em
    // pointer-events:none na hora exata do elementFromPoint).
    function cardSobODedo(x, y) {
      fantasma.style.display = 'none';
      const embaixo = document.elementFromPoint(x, y);
      fantasma.style.display = '';
      const card = embaixo && embaixo.closest ? embaixo.closest('.dia-card') : null;
      return (card && card !== origemEl && card.parentNode === grade) ? card : null;
    }

    function limpezaFinal() {
      if (fantasma) { fantasma.remove(); fantasma = null; }
      if (origemEl) origemEl.classList.remove('origem-arrastando');
      limparDestaque();
      document.documentElement.classList.remove('trava-scroll');
      origemEl = null;
      iniciouArraste = false;
    }

    function aoPressionar(ev) {
      // Editar e os botões ▲▼ são toque normal — não entram no cálculo de arraste.
      if (ev.target.closest('[data-acao="editar-dia"], [data-acao="mover-cima"], [data-acao="mover-baixo"]')) return;
      const alvo = ev.target.closest('.dia-card');
      if (!alvo || alvo.parentNode !== grade || grade.children.length < 2) return;
      // Não faz preventDefault aqui: se isto for só um toque (sem virar
      // arraste), o clique nativo do card precisa disparar normalmente.
      origemEl = alvo;
      pressX = ev.clientX;
      pressY = ev.clientY;
      iniciouArraste = false;
    }

    function aoMover(ev) {
      if (!origemEl) return;

      if (!iniciouArraste) {
        const dx = ev.clientX - pressX, dy = ev.clientY - pressY;
        if (Math.hypot(dx, dy) < LIMIAR_MOVIMENTO) return; // ainda pode ser só um toque
        iniciouArraste = true;
        criarFantasma(pressX, pressY);
      }

      ev.preventDefault();
      moverFantasma(ev.clientX, ev.clientY);

      const valido = cardSobODedo(ev.clientX, ev.clientY);
      if (valido !== alvoAtual) {
        limparDestaque();
        alvoAtual = valido;
        if (alvoAtual) alvoAtual.classList.add('dia-card-alvo');
      }
    }

    function aoSoltar() {
      if (!origemEl) return;
      if (!iniciouArraste) { origemEl = null; return; } // toque simples: deixa o click normal abrir o dia

      const idOrigem = Number(origemEl.dataset.diaId);
      const idDestino = alvoAtual ? Number(alvoAtual.dataset.diaId) : null;
      limpezaFinal();
      // Rede de segurança: se por algum motivo o clique-fantasma do toque não
      // disparar (ex.: pointercancel), a flag não fica travada em "true" para sempre.
      setTimeout(function () { ignorarProximoCliqueDia = false; }, 400);

      if (idDestino == null) return; // soltou fora de outro card: mantém a ordem original

      // TROCA de fato (não "insere antes de"): os dois trocam de posição.
      // insertBefore(origem, destino) parecia funcionar arrastando para longe,
      // mas quando origem já está bem na posição anterior a destino — exatamente
      // o caso de arrastar para o vizinho do lado — "inserir antes" não muda
      // nada, porque já estava lá. Era esse o bug: soltar em cima do vizinho
      // dava a mensagem de sucesso mas a ordem ficava idêntica.
      const ids = CATALOGO.dias.map(function (d) { return d.id; });
      const iOrigem = ids.indexOf(idOrigem);
      const iDestino = ids.indexOf(idDestino);
      if (iOrigem === -1 || iDestino === -1) return;
      const tmp = ids[iOrigem]; ids[iOrigem] = ids[iDestino]; ids[iDestino] = tmp;

      Dados.reordenarDias(ids);
      renderSemana();
      avisar('Ordem dos treinos atualizada.');
    }

    function aoCancelar() {
      if (origemEl && iniciouArraste) limpezaFinal();
      else origemEl = null;
    }

    grade.addEventListener('pointerdown', aoPressionar);
    document.addEventListener('pointermove', aoMover, { passive: false });
    document.addEventListener('pointerup', aoSoltar);
    document.addEventListener('pointercancel', aoCancelar);
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
    atualizarContadorExercicios(diaId);

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
      + '    <input class="valor-peso" data-acao="valor" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" value="' + (pesoAtual != null ? pesoAtual : '') + '" placeholder="Ex.: 40 ou 7 tijolos">'
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
      const atualNum = pesoNumerico(pesoInput().value);
      const anteriorNum = pesoNumerico(pesoAnterior);
      // Um dos dois não é um número puro (ex.: "7 tijolos") — não dá pra
      // calcular diferença, mas o valor anterior continua útil como referência.
      if (atualNum == null || anteriorNum == null) {
        el2.textContent = 'Semana passada: ' + pesoAnterior;
        return;
      }
      const delta = Math.round((atualNum - anteriorNum) * 10) / 10;
      const sinal = delta > 0 ? '▲ +' + fmtPeso(delta) : (delta < 0 ? '▼ ' + fmtPeso(delta) : '＝ igual');
      const classe = delta > 0 ? 'delta-pos' : (delta < 0 ? 'delta-neg' : '');
      el2.innerHTML = 'Semana passada: ' + fmtPeso(pesoAnterior) + ' kg &nbsp;·&nbsp; <span class="' + classe + '">' + sinal + '</span>';
    }

    function salvarPeso() {
      const v = pesoInput().value.trim();
      Dados.setPeso(diaId, exId, v === '' ? null : v);
      atualizarDica();
    }

    // O +/- ajusta só a parte NUMÉRICA no início do texto, preservando o que
    // vem depois — assim "7 tijolos" vira "8 tijolos" num toque, em vez de
    // obrigar a apagar e redigitar tudo.
    function ajustarPeso(delta) {
      const atual = pesoInput().value.trim();
      const m = atual.match(/^(-?\d+(?:[.,]\d+)?)(.*)$/);
      const numeroAtual = m ? parseFloat(m[1].replace(',', '.')) : 0;
      const resto = m ? m[2] : (atual ? ' ' + atual : '');
      const novoNumero = Math.max(0, Math.round((numeroAtual + delta) * 10) / 10);
      pesoInput().value = fmtPeso(novoNumero).replace(',', '.') + resto;
      salvarPeso();
    }

    card.querySelector('[data-acao="menos"]').onclick = function () { ajustarPeso(-passo); };
    card.querySelector('[data-acao="mais"]').onclick = function () { ajustarPeso(passo); };
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
    atualizarContadorExercicios(diaId);
  }

  // Um exercício conta como "feito" quando todas as suas séries estão
  // marcadas — é isso que decresce o contador conforme o treino avança.
  function atualizarContadorExercicios(diaId) {
    const dia = diaPorId(diaId);
    if (!dia) return;
    const restantes = dia.exercicios.filter(function (exId) {
      const s = Dados.getSeries(diaId, exId);
      return !s.length || s.some(function (feita) { return !feita; });
    }).length;
    const badge = el('treino-contador-restantes');
    badge.textContent = restantes === 0
      ? 'Todos os exercícios concluídos ✔'
      : restantes + ' de ' + dia.exercicios.length + ' exercícios restantes';
    badge.classList.toggle('tudo-feito', restantes === 0);
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
      atualizarBarraCalorias();
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

    preencherListaSimples('lista-historico-aerobico', Dados.listarAerobicos().slice(0, 20), function (r) {
      return { esquerda: r.tipo + ' · ' + r.minutos + ' min', direita: fmtData(r.data) };
    }, 'Nenhum aeróbico registrado ainda.');

    preencherListaSimples('lista-historico-abdominal', Dados.listarAbdominais().slice(0, 20), function (r) {
      const valor = r.modo === 'tempo' ? fmtCronometro(r.valor) + ' min' : r.valor + ' repetições';
      return { esquerda: r.exercicio + ' · ' + valor, direita: fmtData(r.data) };
    }, 'Nenhum abdômen registrado ainda.');

    preencherListaSimples('lista-historico-alimentacao', Dados.listarAlimentacoes().slice(0, 20), function (r) {
      return { esquerda: r.descricao, direita: Math.round(r.calorias || 0) + ' kcal · ' + fmtData(r.data) };
    }, 'Nenhuma alimentação registrada ainda.');

    atualizarResultadoTMB();
  }

  function fmtCronometro(seg) {
    const m = Math.floor(seg / 60), s = seg % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // Preenche uma <ul class="lista-simples"> genérica a partir de uma lista de
  // registros — usado pelos 3 históricos de Progresso (aeróbico/abdômen/
  // alimentação), que só diferem no texto de cada linha.
  function preencherListaSimples(idLista, registros, formatar, mensagemVazia) {
    const ul = el(idLista);
    ul.innerHTML = '';
    if (!registros.length) { ul.innerHTML = '<li>' + mensagemVazia + '</li>'; return; }
    registros.forEach(function (r) {
      const f = formatar(r);
      const li = document.createElement('li');
      li.innerHTML = '<span>' + f.esquerda + '</span><span>' + f.direita + '</span>';
      ul.appendChild(li);
    });
  }

  // ---- Calculadora de TMB (Taxa Metabólica Basal) ----
  let sexoSelecionadoTMB = null;

  function configurarCalculadoraTMB() {
    Array.from(el('chips-tmb-sexo').children).forEach(function (chip) {
      chip.onclick = function () {
        sexoSelecionadoTMB = chip.dataset.sexo;
        Array.from(el('chips-tmb-sexo').children).forEach(function (c) { c.classList.remove('selecionado'); });
        chip.classList.add('selecionado');
      };
    });

    const perfil = Dados.getPerfil();
    if (perfil) {
      el('input-tmb-peso').value = perfil.peso;
      el('input-tmb-altura').value = perfil.altura;
      el('input-tmb-idade').value = perfil.idade;
      sexoSelecionadoTMB = perfil.sexo;
      const chip = Array.from(el('chips-tmb-sexo').children).find(function (c) { return c.dataset.sexo === perfil.sexo; });
      if (chip) chip.classList.add('selecionado');
    }

    el('btn-calcular-tmb').onclick = function () {
      const peso = parseFloat(el('input-tmb-peso').value);
      const altura = parseFloat(el('input-tmb-altura').value);
      const idade = parseFloat(el('input-tmb-idade').value);
      if (!peso || !altura || !idade || !sexoSelecionadoTMB) {
        avisar('Preencha peso, altura, idade e sexo.');
        return;
      }
      // O campo de altura é em CENTÍMETROS — digitar em metros (ex.: "1,78",
      // que o campo numérico só lê até a vírgula e vira "1") gerava um TMB
      // muito baixo sem nenhum aviso. Isso avisa em vez de calcular errado.
      if (altura < 3) {
        avisar('Altura muito baixa — o campo é em centímetros (ex.: 178, não 1,78).');
        return;
      }
      Dados.salvarPerfil({ peso: peso, altura: altura, idade: idade, sexo: sexoSelecionadoTMB });
      atualizarResultadoTMB();
      atualizarBarraCalorias();
      avisar('TMB calculado!');
    };
  }

  function atualizarResultadoTMB() {
    const perfil = Dados.getPerfil();
    const resultado = el('tmb-resultado');
    if (!perfil) { resultado.style.display = 'none'; return; }
    resultado.style.display = 'block';
    el('tmb-valor').textContent = perfil.tmb;
  }

  function renderGraficoProgresso() {
    const exId = el('seletor-exercicio-progresso').value;
    // O peso agora aceita texto livre ("7 tijolos") — só dá pra desenhar no
    // gráfico os registros que são um número puro (kg ou qualquer unidade
    // numérica); o resto fica de fora do traçado, mas não quebra o gráfico.
    const pontos = Dados.historicoPorExercicio(exId)
      .filter(function (p) { return pesoNumerico(p.peso) != null; })
      .map(function (p) { return Object.assign({}, p, { peso: pesoNumerico(p.peso) }); })
      .sort(function (a, b) { return a.semana - b.semana; });
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
    Abdominal.init();
    Alimentacao.init();
    configurarCalculadoraTMB();
    configurarChaveGemini();

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
        // updateViaCache:'none' evita que o próprio navegador sirva um sw.js
        // requisitado do cache HTTP local ao checar atualização.
        navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(function (registro) {
          // Procura atualização ao abrir, ao voltar pro app (troca de aba/app
          // recente) e também quando a página volta de um estado congelado
          // pelo navegador (pageshow cobre isso; visibilitychange nem sempre).
          registro.update().catch(function () {});
          document.addEventListener('visibilitychange', function () {
            if (!document.hidden) registro.update().catch(function () {});
          });
          window.addEventListener('pageshow', function () { registro.update().catch(function () {}); });
        }).catch(function (e) { console.warn('SW não registrado:', e); });
      });
    }

    // Chave da API do Gemini (reconhecimento de comida por foto, em
    // Alimentação) — guardada separada do resto dos dados (ver
    // js/reconhecimentoFoto.js), então não aparece no backup exportado.
    function configurarChaveGemini() {
      const campo = el('input-chave-gemini');
      if (ReconhecimentoFoto.temChave()) campo.placeholder = 'Chave já configurada — cole outra pra trocar';

      el('btn-salvar-chave-gemini').onclick = function () {
        const valor = campo.value.trim();
        if (!valor) { avisar('Cole a chave antes de salvar.'); return; }
        ReconhecimentoFoto.salvarChave(valor);
        campo.value = '';
        campo.placeholder = 'Chave já configurada — cole outra pra trocar';
        avisar('Chave do Gemini salva neste aparelho.');
      };

      el('btn-remover-chave-gemini').onclick = function () {
        confirmar('Remover a chave do Gemini deste aparelho? O reconhecimento por foto para de funcionar até você colar uma nova.', function () {
          ReconhecimentoFoto.salvarChave(null);
          campo.placeholder = 'Cole aqui sua chave da API do Gemini';
          avisar('Chave removida.');
        }, 'Remover');
      };
    }

    // Botão manual em Ajustes: não depende de nenhum mecanismo automático —
    // apaga o service worker e os caches deste app e recarrega do zero.
    // É a garantia definitiva de estar na versão mais recente.
    const elVersao = el('versao-app');
    if (elVersao) elVersao.textContent = 'versão ' + VERSAO_APP;

    el('btn-forcar-atualizacao').onclick = function () {
      confirmar(
        'Isso descarta a cópia do app guardada neste aparelho e busca a versão mais recente pela internet. Seus treinos, pesos e aeróbicos não são afetados — ficam guardados em outro lugar.',
        function () {
          const limpezas = [];
          if ('serviceWorker' in navigator) {
            limpezas.push(navigator.serviceWorker.getRegistrations().then(function (rs) {
              return Promise.all(rs.map(function (r) { return r.unregister(); }));
            }));
          }
          if ('caches' in window) {
            limpezas.push(caches.keys().then(function (ks) {
              return Promise.all(ks.map(function (k) { return caches.delete(k); }));
            }));
          }
          Promise.all(limpezas).catch(function () { /* segue mesmo se algo falhar */ }).then(function () {
            window.location.href = window.location.pathname + '?att=' + Date.now();
          });
        },
        'Atualizar agora'
      );
    };

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
    proximoDiaPendente: proximoDiaPendente,
    atualizarBarraCalorias: atualizarBarraCalorias
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
