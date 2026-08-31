// Reconhecimento de comida por foto, usando a API gratuita do Google Gemini
// diretamente do navegador (sem backend — a chamada sai do próprio celular
// para o Google, com a chave de API que o usuário cria e cola no app).
//
// Privacidade: a foto NUNCA é gravada — nem em localStorage, nem em lugar
// nenhum do app. Ela só existe em memória (como base64) pelo tempo da
// chamada à API, e é descartada assim que a resposta chega. A chave da API
// fica numa chave de localStorage SEPARADA do resto dos dados (ver CHAVE_KEY
// abaixo), de propósito: assim ela nunca entra no backup exportado.
const ReconhecimentoFoto = (function () {
  const CHAVE_KEY = 'treinos.geminiKey'; // separada de "treinos.v1" — nunca vai no backup
  const MODELO = 'gemini-2.0-flash'; // multimodal, tem cota gratuita generosa

  const PROMPT =
    'Analise esta foto de uma refeição ou alimento. Identifique os itens visíveis e estime as ' +
    'calorias totais de forma realista, considerando porções típicas do que aparece na foto. ' +
    'Responda APENAS com um JSON no formato exato, sem texto antes ou depois: ' +
    '{"itens":[{"nome":"nome do alimento em português","calorias":numero}],' +
    '"calorias_total":numero,"descricao":"resumo curto em português, ex.: arroz, feijão e frango grelhado"}. ' +
    'Se não conseguir identificar nenhum alimento na foto, responda com itens vazio e calorias_total 0.';

  function getChave() {
    try { return localStorage.getItem(CHAVE_KEY) || ''; } catch (e) { return ''; }
  }

  function salvarChave(chave) {
    try {
      if (chave) localStorage.setItem(CHAVE_KEY, chave.trim());
      else localStorage.removeItem(CHAVE_KEY);
      return true;
    } catch (e) { return false; }
  }

  function temChave() {
    return !!getChave();
  }

  // Lê um arquivo de imagem (File) e devolve { base64, mimeType } — sem
  // nunca escrever nada em disco/armazenamento, só em memória.
  function arquivoParaBase64(arquivo) {
    return new Promise(function (resolve, reject) {
      const leitor = new FileReader();
      leitor.onload = function () {
        // leitor.result é algo como "data:image/jpeg;base64,AAAA..." — só
        // a parte depois da vírgula interessa pra API.
        const virgula = leitor.result.indexOf(',');
        resolve({ base64: leitor.result.slice(virgula + 1), mimeType: arquivo.type || 'image/jpeg' });
      };
      leitor.onerror = function () { reject(new Error('Não foi possível ler a foto.')); };
      leitor.readAsDataURL(arquivo);
    });
  }

  // Envia a foto ao Gemini e devolve { itens, caloriasTotal, descricao }.
  // Lança um erro com mensagem já pronta pra mostrar ao usuário em caso de
  // falha (sem chave, sem rede, cota estourada, resposta inesperada etc.).
  async function analisarFoto(arquivo) {
    const chave = getChave();
    if (!chave) throw new Error('Configure sua chave da API do Gemini em Progresso > Ajustes primeiro.');

    const { base64, mimeType } = await arquivoParaBase64(arquivo);

    const corpo = {
      contents: [{
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: base64 } }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    };

    let resposta;
    try {
      resposta = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/' + MODELO + ':generateContent?key=' + encodeURIComponent(chave),
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) }
      );
    } catch (e) {
      throw new Error('Falha de conexão ao chamar o Gemini — confira a internet e tente de novo.');
    }

    const dados = await resposta.json().catch(function () { return null; });

    if (!resposta.ok) {
      const msg = dados && dados.error && dados.error.message;
      throw new Error(msg ? 'Gemini: ' + msg : 'Erro ao chamar o Gemini (HTTP ' + resposta.status + ').');
    }

    const texto = dados
      && dados.candidates && dados.candidates[0]
      && dados.candidates[0].content && dados.candidates[0].content.parts
      && dados.candidates[0].content.parts[0] && dados.candidates[0].content.parts[0].text;
    if (!texto) throw new Error('O Gemini não retornou uma resposta válida — tente outra foto.');

    let json;
    try { json = JSON.parse(texto); } catch (e) {
      throw new Error('Não entendi a resposta do Gemini — tente outra foto.');
    }

    return {
      itens: Array.isArray(json.itens) ? json.itens : [],
      caloriasTotal: Number(json.calorias_total) || 0,
      descricao: json.descricao || ''
    };
  }

  return {
    getChave: getChave,
    salvarChave: salvarChave,
    temChave: temChave,
    analisarFoto: analisarFoto
  };
})();
