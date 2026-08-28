// Catálogo padrão (semente) da rotina: dias de treino, exercícios e séries.
// Extraído dos prints de treino do usuário (5 dias, 3x10 a 12 em cada exercício).
// Cada exercício tem um "id" e um "lib" (slug da foto em img/lib/<slug>/) e é
// referenciado por múltiplos dias — a carga, porém, é registrada por DIA+exercício
// (chave "diaId:exercicioId"), pois o mesmo movimento pode ter pesos diferentes
// em treinos diferentes da semana (ex.: Dia 1 e Dia 5 repetem tríceps).
//
// A rotina muda com o tempo (novos exercícios substituem antigos), então o app
// permite editar/adicionar/remover exercícios em tempo de uso — ver Dados.editarExercicio
// e cia. em js/dados.js. Este objeto é só a SEMENTE: nunca é modificado depois que o
// app carrega; quem o usuário de fato vê e edita é o objeto CATALOGO (abaixo), que
// começa como uma cópia desta semente e é sobrescrito pelas customizações salvas.
const CATALOGO_PADRAO = {
  dias: [
    {
      id: 1,
      foco: 'Peito e Tríceps',
      exercicios: ['supino', 'supino-inclinado', 'fly', 'triceps-corda', 'triceps-frances', 'triceps-testa']
    },
    {
      id: 2,
      foco: 'Costas e Bíceps',
      exercicios: ['remada-curvada', 'remada-aberta', 'puxada-aberta', 'rosca-scott', 'rosca-martelo', 'rosca-direta']
    },
    {
      id: 3,
      foco: 'Perna Completo',
      exercicios: ['agachamento-hack', 'cadeira-extensora', 'adutora', 'mesa-flexora', 'cadeira-flexora', 'leg-press']
    },
    {
      id: 4,
      foco: 'Ombro Isolado',
      exercicios: ['crucifixo-inverso', 'elevacao-frontal', 'elevacao-lateral', 'desenvolvimento']
    },
    {
      id: 5,
      foco: 'Bíceps e Tríceps',
      exercicios: ['triceps-corda', 'triceps-frances', 'triceps-testa', 'rosca-direta', 'rosca-martelo', 'rosca-scott']
    }
  ],
  exercicios: {
    'supino': { nome: 'Supino', series: 3, reps: '10 a 12', lib: 'supino-reto' },
    'supino-inclinado': { nome: 'Supino Inclinado', series: 3, reps: '10 a 12', lib: 'supino-inclinado' },
    'fly': { nome: 'Fly', series: 3, reps: '10 a 12', lib: 'voador-peck-deck' },
    'triceps-corda': { nome: 'Tríceps Corda', series: 3, reps: '10 a 12', lib: 'triceps-corda' },
    'triceps-frances': { nome: 'Tríceps Francês', series: 3, reps: '10 a 12', lib: 'triceps-frances' },
    'triceps-testa': { nome: 'Tríceps Testa', series: 3, reps: '10 a 12', lib: 'triceps-testa' },
    'remada-curvada': { nome: 'Remada Curvada', series: 3, reps: '10 a 12', lib: 'remada-curvada' },
    'remada-aberta': { nome: 'Remada Aberta', series: 3, reps: '10 a 12', lib: 'remada-sentada-baixa' },
    'puxada-aberta': { nome: 'Puxada Aberta', series: 3, reps: '10 a 12', lib: 'puxada-aberta' },
    'rosca-scott': { nome: 'Rosca Scott', series: 3, reps: '10 a 12', lib: 'rosca-scott' },
    'rosca-martelo': { nome: 'Rosca Martelo', series: 3, reps: '10 a 12', lib: 'rosca-martelo' },
    'rosca-direta': { nome: 'Rosca Direta', series: 3, reps: '10 a 12', lib: 'rosca-direta' },
    'agachamento-hack': { nome: 'Agachamento Hack', series: 3, reps: '10 a 12', lib: 'agachamento-hack' },
    'cadeira-extensora': { nome: 'Cadeira Extensora', series: 3, reps: '10 a 12', lib: 'cadeira-extensora' },
    'adutora': { nome: 'Adutora', series: 3, reps: '10 a 12', lib: 'cadeira-adutora' },
    'mesa-flexora': { nome: 'Mesa Flexora', series: 3, reps: '10 a 12', lib: 'mesa-flexora' },
    'cadeira-flexora': { nome: 'Cadeira Flexora', series: 3, reps: '10 a 12', lib: 'cadeira-flexora' },
    'leg-press': { nome: 'Leg Press', series: 3, reps: '10 a 12', lib: 'leg-press' },
    'crucifixo-inverso': { nome: 'Crucifixo Inverso', series: 3, reps: '10 a 12', lib: 'crucifixo-inverso-na-maquina' },
    'elevacao-frontal': { nome: 'Elevação Frontal', series: 3, reps: '10 a 12', lib: 'elevacao-frontal' },
    'elevacao-lateral': { nome: 'Elevação Lateral', series: 3, reps: '10 a 12', lib: 'elevacao-lateral' },
    'desenvolvimento': { nome: 'Desenvolvimento', series: 3, reps: '10 a 12', lib: 'desenvolvimento-com-halteres' }
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
