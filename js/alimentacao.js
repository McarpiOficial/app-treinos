// Tela de Alimentação: descrição livre (digitada ou ditada por voz) do que
// foi comido, com estimativa automática de calorias (Alimentos.estimar) que
// o usuário sempre pode ajustar antes de salvar. Mostra também o saldo do
// dia (TMB configurado em Progresso menos o que já foi comido hoje).
const Alimentacao = (function () {
  let idEmEdicao = null;
  let reconhecimento = null;
  let ouvindo = false;

  function el(id) { return document.getElementById(id); }

  function vozDisponivel() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function init() {
    el('input-data-alimentacao').value = Dados.hoje();
    el('form-alimentacao').onsubmit = function (e) { e.preventDefault(); salvar(); };
    el('btn-cancelar-edicao-alimentacao').onclick = cancelarEdicao;
    el('input-descricao-alimentacao').oninput = atualizarEstimativa;

    const btnMic = el('btn-microfone-alimentacao');
    if (!vozDisponivel()) {
      btnMic.disabled = true;
      btnMic.title = 'Reconhecimento de voz não é compatível com este navegador — digite normalmente.';
    } else {
      btnMic.onclick = alternarMicrofone;
    }
  }

  // ---- Ditado por voz (Web Speech API) ----
  // Sempre com a opção de digitar por baixo: erro de transcrição não trava nada.
  function alternarMicrofone() {
    if (ouvindo) { pararEscuta(); return; }
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    reconhecimento = new Ctor();
    reconhecimento.lang = 'pt-BR';
    reconhecimento.continuous = false;
    reconhecimento.interimResults = false;

    reconhecimento.onresult = function (ev) {
      const texto = ev.results[0][0].transcript;
      const campo = el('input-descricao-alimentacao');
      campo.value = (campo.value ? campo.value.trim() + ' ' : '') + texto;
      atualizarEstimativa();
    };
    reconhecimento.onerror = function () {
      App.avisar('Não entendi — tente de novo ou digite.');
      pararEscuta();
    };
    reconhecimento.onend = pararEscuta;

    try {
      reconhecimento.start();
      ouvindo = true;
      el('btn-microfone-alimentacao').classList.add('ouvindo');
      el('btn-microfone-alimentacao').textContent = '🔴';
    } catch (e) {
      pararEscuta();
    }
  }

  function pararEscuta() {
    ouvindo = false;
    el('btn-microfone-alimentacao').classList.remove('ouvindo');
    el('btn-microfone-alimentacao').textContent = '🎤';
    if (reconhecimento) { try { reconhecimento.stop(); } catch (e) { /* já parado */ } }
  }

  // ---- Estimativa de calorias ----
  function atualizarEstimativa() {
    const texto = el('input-descricao-alimentacao').value;
    const resultado = Alimentos.estimar(texto);
    el('input-calorias-alimentacao').value = resultado.calorias || '';
    const reconhecidos = el('itens-reconhecidos-alimentacao');
    if (!resultado.itens.length) {
      reconhecidos.textContent = texto.trim() ? 'Não reconheci nenhum alimento — confira/ajuste as calorias à mão.' : '';
      return;
    }
    reconhecidos.textContent = 'Entendi: ' + resultado.itens.map(function (i) {
      return (i.qtd !== 1 ? i.qtd + '× ' : '') + i.nome;
    }).join(', ') + '. Ajuste as calorias abaixo se não bater.';
  }

  function salvar() {
    const descricao = el('input-descricao-alimentacao').value.trim();
    const calorias = parseFloat(el('input-calorias-alimentacao').value) || 0;
    const data = el('input-data-alimentacao').value || Dados.hoje();

    if (!descricao) { App.avisar('Descreva o que você comeu.'); return; }

    if (idEmEdicao) {
      Dados.atualizarAlimentacao(idEmEdicao, { descricao: descricao, calorias: calorias, data: data });
      App.avisar('Registro atualizado.');
    } else {
      Dados.addAlimentacao({ descricao: descricao, calorias: calorias, data: data });
      App.avisar('Alimentação registrada!');
    }
    limparFormulario();
    render();
  }

  function limparFormulario() {
    pararEscuta();
    idEmEdicao = null;
    el('input-descricao-alimentacao').value = '';
    el('input-calorias-alimentacao').value = '';
    el('itens-reconhecidos-alimentacao').textContent = '';
    el('input-data-alimentacao').value = Dados.hoje();
    el('titulo-form-alimentacao').textContent = 'Registrar alimentação';
    el('btn-salvar-alimentacao').textContent = 'Registrar';
    el('btn-cancelar-edicao-alimentacao').style.display = 'none';
  }

  function editar(id) {
    const registro = Dados.listarAlimentacoes().find(function (a) { return a.id === id; });
    if (!registro) return;
    idEmEdicao = id;
    el('input-descricao-alimentacao').value = registro.descricao;
    el('input-calorias-alimentacao').value = registro.calorias;
    el('itens-reconhecidos-alimentacao').textContent = '';
    el('input-data-alimentacao').value = registro.data;
    el('titulo-form-alimentacao').textContent = 'Editar registro';
    el('btn-salvar-alimentacao').textContent = 'Salvar edição';
    el('btn-cancelar-edicao-alimentacao').style.display = 'block';
    el('form-alimentacao').scrollIntoView({ behavior: 'smooth' });
  }

  function cancelarEdicao() { limparFormulario(); }

  function remover(id) {
    App.confirmar('Excluir este registro de alimentação?', function () {
      Dados.removerAlimentacao(id);
      App.avisar('Registro excluído.');
      render();
    }, 'Excluir');
  }

  // ---- Resumo do dia (TMB - consumido) ----
  function renderResumoDia() {
    const perfil = Dados.getPerfil();
    const hoje = Dados.hoje();
    const consumidasHoje = Dados.caloriasNoDia(hoje);
    el('alimentacao-consumidas-hoje').textContent = Math.round(consumidasHoje);

    if (!perfil) {
      el('alimentacao-tmb').textContent = '—';
      el('alimentacao-saldo').textContent = '—';
      el('alimentacao-sem-tmb').style.display = 'block';
      return;
    }
    el('alimentacao-sem-tmb').style.display = 'none';
    el('alimentacao-tmb').textContent = perfil.tmb;
    const saldo = Math.round(perfil.tmb - consumidasHoje);
    const saldoEl = el('alimentacao-saldo');
    saldoEl.textContent = (saldo > 0 ? '+' : '') + saldo;
    saldoEl.classList.toggle('delta-pos', saldo >= 0);
    saldoEl.classList.toggle('delta-neg', saldo < 0);
  }

  function rotuloDia(dataISO) {
    const hoje = Dados.hoje();
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    if (dataISO === hoje) return 'Hoje · ' + App.fmtData(dataISO);
    if (dataISO === ontem.toISOString().slice(0, 10)) return 'Ontem · ' + App.fmtData(dataISO);
    return App.fmtData(dataISO);
  }

  function render() {
    renderResumoDia();

    const registros = Dados.listarAlimentacoes();
    const lista = el('lista-alimentacoes');
    lista.innerHTML = '';
    if (!registros.length) {
      lista.innerHTML = '<div class="vazio">Nenhuma alimentação registrada ainda.</div>';
      return;
    }

    let diaAtualExibido = null;
    registros.forEach(function (r) {
      if (r.data !== diaAtualExibido) {
        diaAtualExibido = r.data;
        const totalDoDia = registros.filter(function (x) { return x.data === r.data; })
          .reduce(function (s, x) { return s + Number(x.calorias || 0); }, 0);
        const titulo = document.createElement('div');
        titulo.className = 'grupo-mes';
        titulo.innerHTML = '<span>' + rotuloDia(r.data) + '</span><span>' + Math.round(totalDoDia) + ' kcal</span>';
        titulo.style.display = 'flex';
        titulo.style.justifyContent = 'space-between';
        lista.appendChild(titulo);
      }
      const item = document.createElement('div');
      item.className = 'card item-aerobico';
      item.innerHTML =
        '<div>'
        + '  <div class="info-principal">' + r.descricao.replace(/</g, '&lt;') + '</div>'
        + '  <div class="info-secundaria">' + Math.round(r.calorias || 0) + ' kcal</div>'
        + '</div>'
        + '<div class="acoes">'
        + '  <button class="icone-botao" data-acao="editar">✏️</button>'
        + '  <button class="icone-botao" data-acao="excluir">🗑️</button>'
        + '</div>';
      item.querySelector('[data-acao="editar"]').onclick = function () { editar(r.id); };
      item.querySelector('[data-acao="excluir"]').onclick = function () { remover(r.id); };
      lista.appendChild(item);
    });
  }

  return { init: init, render: render };
})();
