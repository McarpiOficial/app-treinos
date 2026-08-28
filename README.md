# Meus Treinos

App pessoal (PWA) para acompanhar a rotina de musculação de 5 dias e os
treinos aeróbicos. Roda inteiramente no navegador do celular — **todos os
dados ficam salvos só no aparelho** (localStorage), sem servidor e sem login.

## Funcionalidades

- **Semana**: escolha do dia de treino, contador de semanas de treino e
  progresso dos treinos da semana atual.
- **Treino do dia**: exercícios com ilustração (toque para ampliar em tela
  cheia, com pinça/duplo-toque), registro do peso usado (botões −/+ ou digitar)
  e marcação das 3 séries. Um contador no topo mostra quantos exercícios
  ainda faltam (um exercício "conta" quando todas as suas séries estão
  marcadas) — decresce conforme o treino avança.
- **Rotina flexível**: os dias de treino são agrupamentos que você cria,
  renomeia e exclui (✏️ no card do dia, ou "+ Novo dia de treino"). Um dia
  criado funciona igual aos originais: recebe exercícios, registra carga e
  conta para o fechamento da semana — então dá para passar de 5 para 4 dias,
  ou para 6/7, quando quiser. Para mudar a ordem da semana, use as setas
  ▲▼ do card (também dá para segurar e arrastar); útil para começar por
  outro treino em caso de lesão. O número ("DIA 2") é a posição na semana e
  se renumera sozinho; o histórico de cargas fica preso ao treino, não à
  posição, e não se perde ao reordenar.
- **Exercícios editáveis, com imagem automática**: a rotina muda com o tempo,
  então cada exercício pode ser renomeado, ter séries/repetições ajustadas ou
  ser removido do dia (toque no ✏️ no card), e dá para adicionar exercícios
  novos a qualquer dia. **Ao criar ou renomear, o app procura sozinho a foto
  correspondente** numa biblioteca de 136 exercícios — a busca entende
  sinônimos, então "peck deck", "crucifixo máquina" e "voador" caem no mesmo
  lugar. Se o palpite errar, "Escolher outra" abre a biblioteca com busca, e
  "Usar foto minha" aceita uma foto da galeria/câmera. Escolha manual é
  respeitada e não é sobrescrita depois.
- **Aeróbico**: lista de sessões (spinning, esteira etc.) com tipo, tempo e
  calorias — usada normalmente às terças, quintas e domingos.
- **Abdômen**: exercícios de core (prancha, abdominal reto/infra/bicicleta,
  polichinelo etc., ou um "Outro" digitado à mão), registrados por
  **repetições** ou por **tempo** — para tempo, um cronômetro regressivo
  (chips de 15s a 90s, ou digitado) conta e registra sozinho ao chegar a
  zero, com vibração no fim.
- **Alimentação**: descreva o que comeu — **digitando ou ditando por voz**
  (🎤, com fallback automático para digitar se o navegador não suportar ou
  a transcrição errar) — e o app estima as calorias por um dicionário local
  de alimentos comuns (a estimativa aparece antes de salvar e pode ser
  ajustada à mão). Mostra o total de calorias comidas hoje e, se o TMB
  estiver calculado (em Progresso), o saldo do dia (TMB − comido). Histórico
  agrupado por dia, com o total de cada dia.
- **Progresso**: gráfico de evolução de carga por exercício; histórico
  separado por tipo (musculação, aeróbico, abdômen, alimentação); calculadora
  de TMB (Taxa Metabólica Basal — fórmula de Mifflin-St Jeor, a partir de
  peso/altura/idade/sexo) cujo resultado alimenta o saldo mostrado em
  Alimentação; e backup (exportar/importar `.json`).

## Como usar no celular

1. Abra a URL do app publicado (GitHub Pages) no navegador do celular.
2. No menu do navegador, escolha **"Adicionar à tela de início"** (Android/
   Chrome) ou **"Adicionar à Tela de Início"** (iOS/Safari, no botão de
   compartilhar). O app passa a abrir em tela cheia, como um aplicativo, e
   funciona offline depois do primeiro acesso.
3. Registre os treinos normalmente — nada é enviado para a internet.

**Importante:** como os dados ficam só no navegador daquele aparelho, use a
tela **Progresso → Backup** para exportar um `.json` de vez em quando (ex.:
antes de trocar de celular ou limpar os dados do navegador) e guarde o arquivo
em um lugar seguro (Drive, e-mail para você mesmo etc.). Para restaurar, use
"Importar backup" com esse mesmo arquivo.

**Se o app parecer estar com uma versão antiga** (uma mudança publicada não
apareceu): o app tenta se atualizar sozinho, mas em alguns aparelhos/redes o
service worker pode demorar a notar a versão nova. Vá em **Progresso →
Ajustes → Forçar atualização agora** — apaga a cópia guardada no aparelho e
busca a mais recente pela internet, sem afetar treinos, pesos ou aeróbicos
(esses ficam no armazenamento local, separado do cache do app). O número da
versão exibido ali (ex.: "versão v7") serve para confirmar visualmente se a
atualização chegou.

## Rodar localmente (preview)

Requer Node.js instalado.

```bash
node scripts/dev-server.js
```

Depois abra `http://localhost:8792` no navegador.

## Biblioteca de imagens

As fotos dos exercícios (`img/lib/`) vêm da
[free-exercise-db](https://github.com/yuhonas/free-exercise-db), base pública
em domínio público (Unlicense). São 2 fotos por exercício — início e fim do
movimento —, e é por isso que a tela cheia alterna entre elas para mostrar a
execução.

Para acrescentar exercícios à biblioteca, adicione a entrada em
`scripts/dicionario-exercicios.js` (nome em português, nome exato na base e
sinônimos de busca) e rode:

```bash
npm install sharp
node scripts/gerar-biblioteca.js
```

O script baixa as fotos, reduz para 520px (~24 KB cada) e regrava o índice
`js/biblioteca.js`. Os ícones do PWA vêm de `node scripts/gerar-icones.js`.

## Estrutura

```
index.html            shell do app e as 4 telas
css/app.css            tema visual (mobile-first)
js/exercicios.js        catálogo dos 5 dias e dos exercícios (editável)
js/dados.js             leitura/escrita no localStorage
js/app.js               navegação, telas, zoom, backup
js/aerobico.js           tela de aeróbico
js/abdominal.js         tela de abdômen (repetições/tempo + cronômetro)
js/alimentacao.js       tela de alimentação (voz, calorias, saldo do dia)
js/alimentos.js         dicionário local + estimador de calorias
js/biblioteca.js        índice da biblioteca de fotos (gerado)
js/imagens.js           casa o nome do exercício com a foto certa
img/lib/<slug>/*.jpg    fotos dos exercícios (2 por movimento)
manifest.webmanifest    configuração do PWA
sw.js                   service worker (funcionamento offline)
scripts/                geração de ícones/ilustrações e servidor de preview
```
