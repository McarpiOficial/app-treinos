// Catálogo padrão (semente) da rotina: dias de treino, exercícios e séries.
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
// ---- Perfis ----
// O mesmo app serve a mais de uma pessoa: cada perfil tem a sua rotina padrão
// (abaixo) E o seu próprio espaço no localStorage (chave própria), então um
// nunca enxerga nem altera os dados do outro. O perfil ativo fica guardado em
// 'treinos.perfilAtivo' e a troca é feita em App.trocarPerfil (recarrega o app).
// ROTINA_VERSAO é por perfil: sobe quando a rotina padrão DAQUELE perfil muda —
// Dados.carregar() aplica a rotina nova uma única vez em quem já tinha dados.
const PERFIS = {
  marcio: { id: 'marcio', nome: 'Meu treino', titulo: 'Meus Treinos', rotulo: '', chave: 'treinos.v1', rotinaVersao: 2 },
  simone: { id: 'simone', nome: 'Treino Simone', titulo: 'Treino Simone', rotulo: 'Simone', chave: 'treinos.simone.v1', rotinaVersao: 1 },
  andre: { id: 'andre', nome: 'Treino André', titulo: 'Treino André', rotulo: 'André', chave: 'treinos.andre.v1', rotinaVersao: 4 }
};
const CHAVE_PERFIL_ATIVO = 'treinos.perfilAtivo';

function lerPerfilAtivoId() {
  try {
    const id = localStorage.getItem(CHAVE_PERFIL_ATIVO);
    if (id && PERFIS[id]) return id;
  } catch (e) { /* armazenamento indisponível: cai no padrão */ }
  return 'marcio';
}
const PERFIL_ID = lerPerfilAtivoId();
const PERFIL = PERFIS[PERFIL_ID];
const ROTINA_VERSAO = PERFIL.rotinaVersao;

const ROTINAS_PADRAO = {
  marcio: {
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
    }
  },
  simone: {
    dias: [
      {
        id: 1,
        foco: 'Glúteos e Posteriores',
        exercicios: ['agachamento-sumo', 'elevacao-pelvica', 'stiff', 'gluteo-maquina', 'cadeira-abdutora']
      },
      {
        id: 2,
        foco: 'Peito, Ombro e Tríceps',
        exercicios: ['supino-reto', 'desenvolvimento', 'elevacao-lateral', 'peck-deck', 'triceps-pulley', 'triceps-testa']
      },
      {
        id: 3,
        foco: 'Pernas (Quadríceps)',
        exercicios: ['leg-press', 'agachamento-hack', 'cadeira-extensora', 'agachamento-bulgaro', 'cadeira-flexora', 'gemeos-plantar']
      },
      {
        id: 4,
        foco: 'Costas e Bíceps',
        exercicios: ['pulldown', 'remada-baixa', 'remada-curvada', 'rosca-direta', 'rosca-alternada', 'rosca-martelo']
      }
    ],
    exercicios: {
      'agachamento-sumo': { nome: 'Agachamento Sumo', series: 4, reps: '15', lib: 'agachamento-sumo' },
      'elevacao-pelvica': { nome: 'Elevação Pélvica', series: 4, reps: '20', lib: 'elevacao-pelvica' },
      'stiff': { nome: 'Stiff', series: 3, reps: '15', lib: 'stiff-com-barra' },
      'gluteo-maquina': { nome: 'Glúteo Máquina', series: 3, reps: '15', lib: 'gluteo-na-polia' },
      'cadeira-abdutora': { nome: 'Cadeira Abdutora', series: 3, reps: '15', lib: 'cadeira-abdutora' },
      'supino-reto': { nome: 'Supino Reto', series: 4, reps: '12', lib: 'supino-reto' },
      'desenvolvimento': { nome: 'Desenvolvimento com Halteres', series: 3, reps: '12', lib: 'desenvolvimento-com-halteres' },
      'elevacao-lateral': { nome: 'Elevação Lateral', series: 3, reps: '15', lib: 'elevacao-lateral' },
      'peck-deck': { nome: 'Peck Deck', series: 3, reps: '15', lib: 'voador-peck-deck' },
      'triceps-pulley': { nome: 'Tríceps Pulley', series: 3, reps: '15', lib: 'triceps-pulley' },
      'triceps-testa': { nome: 'Tríceps Testa', series: 3, reps: '12', lib: 'triceps-testa' },
      'leg-press': { nome: 'Leg Press 45°', series: 4, reps: '15', lib: 'leg-press' },
      'agachamento-hack': { nome: 'Agachamento Hack', series: 3, reps: '12', lib: 'agachamento-hack' },
      'cadeira-extensora': { nome: 'Cadeira Extensora', series: 3, reps: '15', lib: 'cadeira-extensora' },
      'agachamento-bulgaro': { nome: 'Agachamento Búlgaro', series: 3, reps: '12', lib: 'agachamento-bulgaro' },
      'cadeira-flexora': { nome: 'Cadeira Flexora', series: 3, reps: '15', lib: 'cadeira-flexora' },
      'gemeos-plantar': { nome: 'Gêmeos Plantar', series: 3, reps: '15', lib: 'panturrilha-em-pe' },
      'pulldown': { nome: 'Pulldown', series: 4, reps: '12', lib: 'puxada-aberta' },
      'remada-baixa': { nome: 'Remada Baixa', series: 3, reps: '15', lib: 'remada-sentada-baixa' },
      'remada-curvada': { nome: 'Remada Curvada', series: 3, reps: '12', lib: 'remada-curvada' },
      'rosca-direta': { nome: 'Rosca Direta com Barra', series: 3, reps: '15', lib: 'rosca-direta' },
      'rosca-alternada': { nome: 'Rosca Alternada', series: 3, reps: '12', lib: 'rosca-alternada' },
      'rosca-martelo': { nome: 'Rosca Martelo', series: 3, reps: '12', lib: 'rosca-martelo' }
    }
  },
  // André (iniciante): 4 dias, sempre 2 exercícios por grupo muscular, 3 séries
  // de 10 a 12 (abdômen 3x15). Foco em MÁQUINAS e polias, que guiam o movimento
  // e são mais fáceis de executar com segurança; peso livre só no bíceps.
  andre: {
    dias: [
      {
        id: 1,
        foco: 'Peito e Tríceps',
        exercicios: ['supino-maquina', 'peck-deck', 'triceps-banco-maquina', 'triceps-pulley']
      },
      {
        id: 2,
        foco: 'Costas e Bíceps',
        exercicios: ['puxada-aberta', 'remada-maquina', 'rosca-scott-maquina', 'rosca-martelo']
      },
      {
        id: 3,
        foco: 'Pernas',
        exercicios: ['leg-press', 'cadeira-extensora', 'mesa-flexora', 'cadeira-flexora']
      },
      {
        id: 4,
        foco: 'Ombros e Abdômen',
        exercicios: ['desenvolvimento-maquina', 'crucifixo-inverso', 'abdominal-maquina', 'abdominal-supra']
      }
    ],
    exercicios: {
      'supino-maquina': { nome: 'Supino na Máquina', series: 3, reps: '10 a 12', lib: 'supino-na-maquina' },
      'peck-deck': { nome: 'Peck Deck (Voador)', series: 3, reps: '10 a 12', lib: 'voador-peck-deck' },
      'triceps-banco-maquina': { nome: 'Tríceps no Banco Máquina', series: 3, reps: '10 a 12', lib: 'triceps-no-banco-maquina' },
      'triceps-pulley': { nome: 'Tríceps Pulley', series: 3, reps: '10 a 12', lib: 'triceps-pulley' },
      'puxada-aberta': { nome: 'Puxada Aberta', series: 3, reps: '10 a 12', lib: 'puxada-aberta' },
      'remada-maquina': { nome: 'Remada na Máquina', series: 3, reps: '10 a 12', lib: 'remada-articulada' },
      'rosca-scott-maquina': { nome: 'Rosca Scott na Máquina', series: 3, reps: '10 a 12', lib: 'rosca-scott-na-maquina' },
      'rosca-martelo': { nome: 'Rosca Martelo com Halteres', series: 3, reps: '10 a 12', lib: 'rosca-martelo' },
      'leg-press': { nome: 'Leg Press 45°', series: 3, reps: '10 a 12', lib: 'leg-press' },
      'cadeira-extensora': { nome: 'Cadeira Extensora', series: 3, reps: '10 a 12', lib: 'cadeira-extensora' },
      'mesa-flexora': { nome: 'Mesa Flexora', series: 3, reps: '10 a 12', lib: 'mesa-flexora' },
      'cadeira-flexora': { nome: 'Cadeira Flexora', series: 3, reps: '10 a 12', lib: 'cadeira-flexora' },
      'desenvolvimento-maquina': { nome: 'Desenvolvimento na Máquina', series: 3, reps: '10 a 12', lib: 'desenvolvimento-na-maquina' },
      'crucifixo-inverso': { nome: 'Crucifixo Inverso na Máquina', series: 3, reps: '10 a 12', lib: 'crucifixo-inverso-na-maquina' },
      'abdominal-maquina': { nome: 'Abdominal na Máquina', series: 3, reps: '15', lib: 'abdominal-na-maquina' },
      'abdominal-supra': { nome: 'Abdominal Supra', series: 3, reps: '15', lib: 'abdominal-supra' }
    }
  }
};

// Tipos de aeróbico/abdômen são iguais para todos os perfis.
const TIPOS_PADRAO = {
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

const CATALOGO_PADRAO = Object.assign({}, ROTINAS_PADRAO[PERFIL_ID], TIPOS_PADRAO);

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
