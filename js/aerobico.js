// Tela de Aeróbico: registro rápido em lista (tipo, tempo, calorias) — usada
// geralmente terça/quinta/domingo para treinos sem peso (spinning, esteira etc.).
const Aerobico = (function () {
  let tipoSelecionado = null;
  let minutosSelecionados = null;
  let idEmEdicao = null;

  function el(id) { return document.getElementById(id); }

  function init() {
    const chipsTipo = el('chips-tipo-aerobico');
    CATALOGO.tiposAerobico.forEach(function (tipo) {
      const chip = document.createElement('button');
      chip.type = 'button'; // dentro de um <form>, sem isso o botão vira "submit" e envia o formulário sozinho.
      chip.className = 'chip';
      chip.textContent = tipo;
      chip.onclick = function () { selecionarTipo(tipo, chip); };
      chipsTipo.appendChild(chip);
    });

    const chipsTempo = el('chips-tempo-aerobico');
    [20, 30, 40, 50, 60].forEach(function (min) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = min + ' min';
      chip.onclick = function () { selecionarMinutos(min, chip); };
      chipsTempo.appendChild(chip);
    });

    el('input-data-aerobico').value = Dados.hoje();
    el('form-aerobico').onsubmit = function (e) {
      e.preventDefault();
      salvar();
    };
    el('btn-cancelar-edicao-aerobico').onclick = cancelarEdicao;
    el('input-calorias-aerobico').oninput = atualizarEstimativaCalorias;
    el('input-minutos-manual').oninput = atualizarEstimativaCalorias;
  }

  // Se o usuário não informar as calorias, o app estima por MET (tipo de
  // treino + tempo + peso corporal, do TMB se já calculado). Mostrar essa
  // conta antes de salvar evita que o valor usado no saldo pareça "mágico".
  function atualizarEstimativaCalorias() {
    const dica = el('aerobico-calorias-estimativa');
    if (parseFloat(el('input-calorias-aerobico').value) > 0) { dica.textContent = ''; return; }
    const tipo = tipoSelecionado;
    const minutos = minutosFinal();
    if (!tipo || !minutos) { dica.textContent = ''; return; }
    const estimativa = Dados.estimarCaloriasAerobico(tipo, minutos);
    dica.textContent = 'Sem informar, entra como ~' + estimativa + ' kcal (estimativa por tipo e tempo).';
  }

  function selecionarTipo(tipo, chipEl) {
    tipoSelecionado = tipo;
    Array.from(el('chips-tipo-aerobico').children).forEach(function (c) { c.classList.remove('selecionado'); });
    chipEl.classList.add('selecionado');
    if (tipo === 'Outro') {
      el('input-tipo-outro').style.display = 'block';
      el('input-tipo-outro').focus();
    } else {
      el('input-tipo-outro').style.display = 'none';
    }
    atualizarEstimativaCalorias();
  }

  function selecionarMinutos(min, chipEl) {
    minutosSelecionados = min;
    Array.from(el('chips-tempo-aerobico').children).forEach(function (c) { c.classList.remove('selecionado'); });
    chipEl.classList.add('selecionado');
    el('input-minutos-manual').value = '';
    atualizarEstimativaCalorias();
  }

  function tipoFinal() {
    if (tipoSelecionado === 'Outro') return (el('input-tipo-outro').value || 'Outro').trim();
    return tipoSelecionado;
  }

  function minutosFinal() {
    const manual = parseFloat(el('input-minutos-manual').value);
    if (!isNaN(manual) && manual > 0) return manual;
    return minutosSelecionados;
  }

  function salvar() {
    const tipo = tipoFinal();
    const minutos = minutosFinal();
    const calorias = parseFloat(el('input-calorias-aerobico').value) || 0;
    const data = el('input-data-aerobico').value || Dados.hoje();

    if (!tipo) { App.avisar('Escolha o tipo de treino.'); return; }
    if (!minutos) { App.avisar('Informe o tempo (minutos).'); return; }

    if (idEmEdicao) {
      Dados.atualizarAerobico(idEmEdicao, { tipo: tipo, minutos: minutos, calorias: calorias, data: data });
      App.avisar('Registro atualizado.');
    } else {
      Dados.addAerobico({ tipo: tipo, minutos: minutos, calorias: calorias, data: data });
      App.avisar('Aeróbico registrado!');
    }
    limparFormulario();
    render();
  }

  function limparFormulario() {
    tipoSelecionado = null;
    minutosSelecionados = null;
    idEmEdicao = null;
    Array.from(el('chips-tipo-aerobico').children).forEach(function (c) { c.classList.remove('selecionado'); });
    Array.from(el('chips-tempo-aerobico').children).forEach(function (c) { c.classList.remove('selecionado'); });
    el('input-tipo-outro').style.display = 'none';
    el('input-tipo-outro').value = '';
    el('input-minutos-manual').value = '';
    el('input-calorias-aerobico').value = '';
    el('aerobico-calorias-estimativa').textContent = '';
    el('input-data-aerobico').value = Dados.hoje();
    el('titulo-form-aerobico').textContent = 'Registrar aeróbico';
    el('btn-salvar-aerobico').textContent = 'Registrar';
    el('btn-cancelar-edicao-aerobico').style.display = 'none';
  }

  function editar(id) {
    const registro = Dados.listarAerobicos().find(function (a) { return a.id === id; });
    if (!registro) return;
    idEmEdicao = id;
    const chipTipo = Array.from(el('chips-tipo-aerobico').children).find(function (c) { return c.textContent === registro.tipo; });
    if (chipTipo) { selecionarTipo(registro.tipo, chipTipo); }
    else { selecionarTipo('Outro', Array.from(el('chips-tipo-aerobico').children).find(function (c) { return c.textContent === 'Outro'; })); el('input-tipo-outro').value = registro.tipo; }
    const chipTempo = Array.from(el('chips-tempo-aerobico').children).find(function (c) { return c.textContent === registro.minutos + ' min'; });
    if (chipTempo) selecionarMinutos(registro.minutos, chipTempo);
    else el('input-minutos-manual').value = registro.minutos;
    el('input-calorias-aerobico').value = registro.calorias || '';
    el('input-data-aerobico').value = registro.data;
    el('titulo-form-aerobico').textContent = 'Editar registro';
    el('btn-salvar-aerobico').textContent = 'Salvar edição';
    el('btn-cancelar-edicao-aerobico').style.display = 'block';
    el('form-aerobico').scrollIntoView({ behavior: 'smooth' });
  }

  function cancelarEdicao() {
    limparFormulario();
  }

  function remover(id) {
    App.confirmar('Excluir este registro de aeróbico?', function () {
      Dados.removerAerobico(id);
      App.avisar('Registro excluído.');
      render();
    }, 'Excluir');
  }

  function render() {
    App.atualizarBarraCalorias(); // aeróbico de hoje entra no saldo do topo
    const registros = Dados.listarAerobicos();

    const hoje = Dados.hoje();
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - 6);
    const resumoSemana = Dados.resumoAerobicoEntre(inicioSemana.toISOString().slice(0, 10), hoje);
    el('resumo-aerobico-sessoes').textContent = resumoSemana.sessoes;
    el('resumo-aerobico-minutos').textContent = resumoSemana.minutos;
    el('resumo-aerobico-calorias').textContent = resumoSemana.calorias;

    const lista = el('lista-aerobicos');
    lista.innerHTML = '';
    if (!registros.length) {
      lista.innerHTML = '<div class="vazio">Nenhum aeróbico registrado ainda.</div>';
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
        + '  <div class="info-principal">' + r.tipo + '</div>'
        + '  <div class="info-secundaria">' + App.fmtData(r.data) + ' · ' + r.minutos + ' min · ' + (r.calorias || 0) + ' kcal</div>'
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

  function rotuloMes(aaaaMM) {
    const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const partes = aaaaMM.split('-');
    return nomes[parseInt(partes[1], 10) - 1] + ' de ' + partes[0];
  }

  return { init: init, render: render };
})();
