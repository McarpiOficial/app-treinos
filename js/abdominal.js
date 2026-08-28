// Tela de Abdômen: registro por REPETIÇÕES ou por TEMPO (com cronômetro
// regressivo, útil para prancha/prancha lateral). Mesma arquitetura da tela
// de Aeróbico (chips + lista com histórico por mês).
const Abdominal = (function () {
  let exercicioSelecionado = null;
  let modoAtual = 'reps'; // 'reps' ou 'tempo'
  let segundosSelecionados = null;
  let idEmEdicao = null;

  let timerId = null;
  let segundosRestantes = 0;

  function el(id) { return document.getElementById(id); }

  function init() {
    const chipsEx = el('chips-exercicio-abdominal');
    CATALOGO.tiposAbdominal.forEach(function (t) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = t.nome;
      chip.onclick = function () { selecionarExercicio(t, chip); };
      chipsEx.appendChild(chip);
    });

    const chipsTempo = el('chips-tempo-abdominal');
    [15, 20, 30, 45, 60, 90].forEach(function (seg) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = seg < 60 ? seg + 's' : (seg / 60) + ' min';
      chip.onclick = function () { selecionarSegundos(seg, chip); };
      chipsTempo.appendChild(chip);
    });

    el('modo-reps-abdominal').onclick = function () { selecionarModo('reps'); };
    el('modo-tempo-abdominal').onclick = function () { selecionarModo('tempo'); };

    el('input-data-abdominal').value = Dados.hoje();
    el('form-abdominal').onsubmit = function (e) { e.preventDefault(); salvar(); };
    el('btn-cancelar-edicao-abdominal').onclick = cancelarEdicao;
    el('btn-iniciar-cronometro').onclick = iniciarCronometro;
    el('btn-parar-cronometro').onclick = pararCronometro;

    selecionarModo('reps');
  }

  function selecionarExercicio(tipo, chipEl) {
    exercicioSelecionado = tipo.nome;
    Array.from(el('chips-exercicio-abdominal').children).forEach(function (c) { c.classList.remove('selecionado'); });
    chipEl.classList.add('selecionado');
    if (tipo.nome === 'Outro') {
      el('input-exercicio-outro').style.display = 'block';
      el('input-exercicio-outro').focus();
    } else {
      el('input-exercicio-outro').style.display = 'none';
    }
    selecionarModo(tipo.modo);
  }

  function selecionarModo(modo) {
    pararCronometro();
    modoAtual = modo;
    el('modo-reps-abdominal').classList.toggle('selecionado', modo === 'reps');
    el('modo-tempo-abdominal').classList.toggle('selecionado', modo === 'tempo');
    el('area-reps-abdominal').style.display = modo === 'reps' ? 'block' : 'none';
    el('area-tempo-abdominal').style.display = modo === 'tempo' ? 'block' : 'none';
  }

  function selecionarSegundos(seg, chipEl) {
    segundosSelecionados = seg;
    Array.from(el('chips-tempo-abdominal').children).forEach(function (c) { c.classList.remove('selecionado'); });
    chipEl.classList.add('selecionado');
    el('input-segundos-manual').value = '';
    el('cronometro-mostrador').textContent = fmtCronometro(seg);
  }

  function segundosEscolhidos() {
    const manual = parseFloat(el('input-segundos-manual').value);
    if (!isNaN(manual) && manual > 0) return Math.round(manual);
    return segundosSelecionados;
  }

  function fmtCronometro(seg) {
    const m = Math.floor(seg / 60), s = seg % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ---- Cronômetro regressivo ----
  function iniciarCronometro() {
    const total = segundosEscolhidos();
    if (!total) { App.avisar('Escolha ou digite um tempo primeiro.'); return; }
    if (timerId) return;
    segundosRestantes = total;
    el('cronometro-mostrador').textContent = fmtCronometro(segundosRestantes);
    el('btn-iniciar-cronometro').style.display = 'none';
    el('btn-parar-cronometro').style.display = 'block';
    el('cronometro-mostrador').classList.add('rodando');

    timerId = setInterval(function () {
      segundosRestantes--;
      el('cronometro-mostrador').textContent = fmtCronometro(Math.max(0, segundosRestantes));
      if (segundosRestantes <= 0) {
        pararCronometro();
        try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* opcional */ }
        App.avisar('Tempo! Registrando ' + total + 's de ' + (exercicioSelecionado || 'exercício') + '.');
        salvar();
      }
    }, 1000);
  }

  function pararCronometro() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    el('btn-iniciar-cronometro').style.display = 'block';
    el('btn-parar-cronometro').style.display = 'none';
    el('cronometro-mostrador').classList.remove('rodando');
  }

  function exercicioFinal() {
    if (exercicioSelecionado === 'Outro') return (el('input-exercicio-outro').value || 'Outro').trim();
    return exercicioSelecionado;
  }

  function salvar() {
    const exercicio = exercicioFinal();
    if (!exercicio) { App.avisar('Escolha o exercício.'); return; }

    let valor;
    if (modoAtual === 'reps') {
      valor = parseInt(el('input-repeticoes-abdominal').value, 10);
      if (!valor || valor <= 0) { App.avisar('Informe o número de repetições.'); return; }
    } else {
      valor = segundosEscolhidos();
      if (!valor || valor <= 0) { App.avisar('Escolha ou digite um tempo.'); return; }
    }

    const data = el('input-data-abdominal').value || Dados.hoje();
    const registro = { exercicio: exercicio, modo: modoAtual, valor: valor, data: data };

    if (idEmEdicao) {
      Dados.atualizarAbdominal(idEmEdicao, registro);
      App.avisar('Registro atualizado.');
    } else {
      Dados.addAbdominal(registro);
      App.avisar(exercicio + ' registrado!');
    }
    limparFormulario();
    render();
  }

  function limparFormulario() {
    pararCronometro();
    exercicioSelecionado = null;
    segundosSelecionados = null;
    idEmEdicao = null;
    Array.from(el('chips-exercicio-abdominal').children).forEach(function (c) { c.classList.remove('selecionado'); });
    Array.from(el('chips-tempo-abdominal').children).forEach(function (c) { c.classList.remove('selecionado'); });
    el('input-exercicio-outro').style.display = 'none';
    el('input-exercicio-outro').value = '';
    el('input-repeticoes-abdominal').value = '';
    el('input-segundos-manual').value = '';
    el('cronometro-mostrador').textContent = '0:00';
    el('input-data-abdominal').value = Dados.hoje();
    el('titulo-form-abdominal').textContent = 'Registrar abdômen';
    el('btn-salvar-abdominal').textContent = 'Registrar';
    el('btn-cancelar-edicao-abdominal').style.display = 'none';
    selecionarModo('reps');
  }

  function editar(id) {
    const registro = Dados.listarAbdominais().find(function (a) { return a.id === id; });
    if (!registro) return;
    idEmEdicao = id;
    const chipEx = Array.from(el('chips-exercicio-abdominal').children).find(function (c) { return c.textContent === registro.exercicio; });
    const tipoInfo = CATALOGO.tiposAbdominal.find(function (t) { return t.nome === registro.exercicio; }) || { nome: 'Outro', modo: registro.modo };
    if (chipEx) selecionarExercicio(tipoInfo, chipEx);
    else {
      const chipOutro = Array.from(el('chips-exercicio-abdominal').children).find(function (c) { return c.textContent === 'Outro'; });
      selecionarExercicio({ nome: 'Outro', modo: registro.modo }, chipOutro);
      el('input-exercicio-outro').value = registro.exercicio;
    }
    selecionarModo(registro.modo);
    if (registro.modo === 'reps') {
      el('input-repeticoes-abdominal').value = registro.valor;
    } else {
      const chipTempo = Array.from(el('chips-tempo-abdominal').children).find(function (c) { return c.textContent === (registro.valor < 60 ? registro.valor + 's' : (registro.valor / 60) + ' min'); });
      if (chipTempo) selecionarSegundos(registro.valor, chipTempo);
      else { el('input-segundos-manual').value = registro.valor; el('cronometro-mostrador').textContent = fmtCronometro(registro.valor); }
    }
    el('input-data-abdominal').value = registro.data;
    el('titulo-form-abdominal').textContent = 'Editar registro';
    el('btn-salvar-abdominal').textContent = 'Salvar edição';
    el('btn-cancelar-edicao-abdominal').style.display = 'block';
    el('form-abdominal').scrollIntoView({ behavior: 'smooth' });
  }

  function cancelarEdicao() { limparFormulario(); }

  function remover(id) {
    App.confirmar('Excluir este registro?', function () {
      Dados.removerAbdominal(id);
      App.avisar('Registro excluído.');
      render();
    }, 'Excluir');
  }

  function rotuloValor(r) {
    return r.modo === 'tempo' ? fmtCronometro(r.valor) + ' min' : r.valor + ' repetições';
  }

  function rotuloMes(aaaaMM) {
    const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const partes = aaaaMM.split('-');
    return nomes[parseInt(partes[1], 10) - 1] + ' de ' + partes[0];
  }

  function render() {
    const registros = Dados.listarAbdominais();

    const hoje = Dados.hoje();
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - 6);
    const resumoSemana = Dados.resumoAbdominalEntre(inicioSemana.toISOString().slice(0, 10), hoje);
    el('resumo-abdominal-sessoes').textContent = resumoSemana.sessoes;

    const lista = el('lista-abdominais');
    lista.innerHTML = '';
    if (!registros.length) {
      lista.innerHTML = '<div class="vazio">Nenhum exercício de abdômen registrado ainda.</div>';
      return;
    }

    let mesAtualExibido = null;
    registros.forEach(function (r) {
      const mesRotulo = r.data.slice(0, 7);
      if (mesRotulo !== mesAtualExibido) {
        mesAtualExibido = mesRotulo;
        const titulo = document.createElement('div');
        titulo.className = 'grupo-mes';
        titulo.textContent = rotuloMes(mesRotulo);
        lista.appendChild(titulo);
      }
      const item = document.createElement('div');
      item.className = 'card item-aerobico';
      item.innerHTML =
        '<div>'
        + '  <div class="info-principal">' + r.exercicio + '</div>'
        + '  <div class="info-secundaria">' + App.fmtData(r.data) + ' · ' + rotuloValor(r) + '</div>'
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
