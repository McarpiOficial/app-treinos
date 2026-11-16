// Catálogo padrão (semente) da rotina: dias de treino, exercícios e séries.
// Rotina atual: 4 dias (A Peito/Tríceps, B Costas/Bíceps, C Pernas, D Ombros/Abdômen).
// ROTINA_VERSAO sobe sempre que esta semente muda — Dados.carregar() aplica a
// rotina nova uma única vez em quem já tinha dados salvos.
// Cada exercício tem um "id" e um "lib" (slug da foto em img/lib/<slug>/) e é
// referenciado por múltiplos dias — a carga, porém, é registrada por DIA+exercício
// (chave "diaId:exercicioId"), pois o mesmo movimento pode ter pesos diferentes
// em treinos diferentes da semana (ex.: o mesmo movimento em dois dias).
//
// A rotina muda com o tempo (novos exercícios substituem antigos), então o app
// permite editar/adicionar/remover exercícios em tempo de uso — ver Dados.editarExercicio
// e cia. em js/dados.js. Este objeto é só a SEMENTE: nunca é modificado depois que o
// app carrega; quem o usuário de fato vê e edita é o objeto CATALOGO (abaixo), que
// começa como uma cópia desta semente e é sobrescrito pelas customizações salvas.
const ROTINA_VERSAO = 2;

const CATALOGO_PADRAO = {
  dias: [
    {
      id: 1,
      foco: 'Peito e Tríceps',
      exercicios: ['supino', 'supino-inclinado-halteres', 'fly', 'crossover-polia-alta', 'triceps-pulley', 'triceps-testa']
    },
    {
      id: 2,
      foco: 'Costas e Bíceps',
      exercicios: ['puxada-aberta', 'remada-curvada', 'remada-baixa-triangulo', 'pulldown-polia', 'rosca-direta', 'rosca-martelo']
    },
    {
      id: 3,
      foco: 'Pernas Completas',
      exercicios: ['agachamento-livre', 'leg-press', 'cadeira-extensora', 'stiff-barra', 'mesa-flexora', 'panturrilha-em-pe']
    },
    {
      id: 4,
      foco: 'Ombros e Abdômen',
      exercicios: ['desenvolvimento', 'elevacao-lateral', 'elevacao-frontal-polia', 'crucifixo-inverso', 'encolhimento-halteres', 'abdominal-supra-polia']
    }
  ],
  exercicios: {
    'supino': { nome: 'Supino Reto com Barra', series: 4, reps: '8 a 10', lib: 'supino-reto' },
    'supino-inclinado-halteres': { nome: 'Supino Inclinado com Halteres', series: 4, reps: '8 a 12', lib: 'supino-inclinado-com-halteres' },
    'fly': { nome: 'Crucifixo na Máquina', series: 3, reps: '12 a 15', lib: 'voador-peck-deck' },
    'crossover-polia-alta': { nome: 'Crossover na Polia Alta', series: 3, reps: '12 a 15', lib: 'crossover-na-polia' },
    'triceps-pulley': { nome: 'Tríceps Pulley', series: 4, reps: '10 a 12', lib: 'triceps-pulley' },
    'triceps-testa': { nome: 'Tríceps Testa', series: 3, reps: '10 a 12', lib: 'triceps-testa' },
    'puxada-aberta': { nome: 'Puxada Frontal Aberta', series: 4, reps: '8 a 10', lib: 'puxada-aberta' },
    'remada-curvada': { nome: 'Remada Curvada com Barra', series: 4, reps: '8 a 10', lib: 'remada-curvada' },
    'remada-baixa-triangulo': { nome: 'Remada Baixa no Triângulo', series: 3, reps: '10 a 12', lib: 'remada-sentada-baixa' },
    'pulldown-polia': { nome: 'Pulldown na Polia', series: 3, reps: '12 a 15', lib: 'pulldown-com-braco-estendido' },
    'rosca-direta': { nome: 'Rosca Direta com Barra', series: 4, reps: '8 a 10', lib: 'rosca-direta' },
    'rosca-martelo': { nome: 'Rosca Martelo', series: 3, reps: '10 a 12', lib: 'rosca-martelo' },
    'agachamento-livre': { nome: 'Agachamento Livre', series: 4, reps: '8 a 10', lib: 'agachamento-livre' },
    'leg-press': { nome: 'Leg Press 45°', series: 4, reps: '10 a 12', lib: 'leg-press' },
    'cadeira-extensora': { nome: 'Cadeira Extensora', series: 3, reps: '12 a 15', lib: 'cadeira-extensora' },
    'stiff-barra': { nome: 'Stiff com Barra', series: 4, reps: '8 a 10', lib: 'stiff-com-barra' },
    'mesa-flexora': { nome: 'Mesa Flexora', series: 3, reps: '12 a 15', lib: 'mesa-flexora' },
    'panturrilha-em-pe': { nome: 'Panturrilha em Pé', series: 4, reps: '15', lib: 'panturrilha-em-pe' },
    'desenvolvimento': { nome: 'Desenvolvimento com Halteres', series: 4, reps: '8 a 10', lib: 'desenvolvimento-com-halteres' },
    'elevacao-lateral': { nome: 'Elevação Lateral com Halteres', series: 4, reps: '12 a 15', lib: 'elevacao-lateral' },
    'elevacao-frontal-polia': { nome: 'Elevação Frontal na Polia', series: 3, reps: '10 a 12', lib: 'elevacao-frontal-na-polia' },
    'crucifixo-inverso': { nome: 'Crucifixo Inverso na Máquina', series: 4, reps: '12 a 15', lib: 'crucifixo-inverso-na-maquina' },
    'encolhimento-halteres': { nome: 'Encolhimento com Halteres', series: 3, reps: '12 a 15', lib: 'encolhimento-com-halteres' },
    'abdominal-supra-polia': { nome: 'Abdominal Supra na Polia', series: 4, reps: '15', lib: 'abdominal-na-polia' }
  },
  tiposAerobico: ['Spinning', 'Esteira', 'Bike', 'Elíptico', 'Corrida', 'Caminhada', 'Escada', 'Natação', 'Outro'],
  // Exercícios de abdômen: "modo" é só o padrão sugerido ao escolher — o
  // usuário pode registrar qualquer um deles por repetições ou por tempo.
  tiposAbdominal: [
    { nome: 'Prancha', modo: 'tempo' },
    { nome: 'Prancha Lateral', modo: 'tempo' },
    { nome: 'Abdominal Reto', modo: 'reps' },
    { nome: 'Abdominal Infra', modo: 'reps' },
    { nome: 'Abdominal Bicicleta', modo: 'reps' },
    { nome: 'Abdominal Oblíquo', modo: 'reps' },
    { nome: 'Abdominal Canivete', modo: 'reps' },
    { nome: 'Elevação de Pernas', modo: 'reps' },
    { nome: 'Polichinelo', modo: 'tempo' },
    { nome: 'Mountain Climber', modo: 'tempo' },
    { nome: 'Outro', modo: 'reps' }
  ]
};

// Catálogo "vivo": o que o app realmente lê e mostra. Começa como uma cópia
// profunda da semente; Dados.carregar() sobrescreve .dias/.exercicios com as
// customizações salvas do usuário, se existirem (ver js/dados.js).
const CATALOGO = JSON.parse(JSON.stringify(CATALOGO_PADRAO));

function chaveTreino(diaId, exercicioId) {
  return diaId + ':' + exercicioId;
}

// O campo de peso aceita texto livre ("7 tijolos", para aparelhos que não
// marcam a carga em kg) — isso só retorna um número quando o valor É
// puramente numérico, para saber quando dá pra fazer conta (delta da semana
// passada, gráfico de progresso, estimativa de calorias) e quando é só
// texto de referência. Compartilhado entre js/app.js e js/dados.js.
function pesoNumerico(v) {
  if (v == null) return null;
  const s = String(v).trim().replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : null;
}

// Extrai um número representativo de um texto de repetições como "10 a 12"
// (média) ou "12" (o próprio valor) — usado na estimativa de calorias.
function mediaRepsDoTexto(reps) {
  const nums = String(reps || '').match(/\d+/g);
  if (!nums || !nums.length) return 10;
  return nums.map(Number).reduce(function (a, b) { return a + b; }, 0) / nums.length;
}

function diaPorId(diaId) {
  return CATALOGO.dias.find(function (d) { return d.id === Number(diaId); });
}

// O id do dia é interno e nunca muda: é ele que amarra o histórico de cargas
// (chave "diaId:exercicioId"). O número que aparece na tela ("DIA 2") vem da
// POSIÇÃO na lista, então reordenar os treinos não embaralha o histórico.
function posicaoDoDia(diaId) {
  return CATALOGO.dias.findIndex(function (d) { return d.id === Number(diaId); }) + 1;
}

function proximoIdDia() {
  let maior = 0;
  CATALOGO.dias.forEach(function (d) { if (Number(d.id) > maior) maior = Number(d.id); });
  return maior + 1;
}

// Gera um id (slug) legível a partir do nome digitado pelo usuário, garantindo
// que não colida com nenhum id já existente no catálogo vivo.
function gerarIdExercicio(nome) {
  const base = (nome || 'exercicio')
    .toString().trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '') || 'exercicio';
  let id = base, contador = 2;
  while (CATALOGO.exercicios[id]) {
    id = base + '-' + contador;
    contador++;
  }
  return id;
}
