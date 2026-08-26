# Meus Treinos

App pessoal (PWA) para acompanhar a rotina de musculação de 5 dias e os
treinos aeróbicos. Roda inteiramente no navegador do celular — **todos os
dados ficam salvos só no aparelho** (localStorage), sem servidor e sem login.

## Funcionalidades

- **Semana**: escolha do dia de treino, contador de semanas de treino e
  progresso dos 5 treinos da semana atual.
- **Treino do dia**: exercícios com ilustração (toque para ampliar em tela
  cheia, com pinça/duplo-toque), registro do peso usado (botões −/+ ou digitar)
  e marcação das 3 séries.
- **Exercícios editáveis**: a rotina muda com o tempo, então cada exercício
  pode ser renomeado, ter séries/repetições ajustadas ou ser removido do dia
  (toque no ✏️ no card), e é possível adicionar um exercício novo a qualquer
  dia ("+ Adicionar exercício"). Para a imagem de um exercício novo, escolha
  entre reaproveitar uma das 22 ilustrações já existentes ("Da biblioteca") ou
  anexar uma foto da galeria/câmera do celular ("Usar foto") — sem foto ou
  escolha, fica um ícone genérico neutro.
- **Aeróbico**: lista de sessões (spinning, esteira etc.) com tipo, tempo e
  calorias — usada normalmente às terças, quintas e domingos.
- **Progresso**: gráfico de evolução de carga por exercício, histórico de
  treinos concluídos e backup (exportar/importar `.json`).

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

## Rodar localmente (preview)

Requer Node.js instalado.

```bash
node scripts/dev-server.js
```

Depois abra `http://localhost:8792` no navegador.

## Regenerar ilustrações/ícones (opcional)

As ilustrações dos exercícios (`img/ex/*.svg`) e os ícones do PWA
(`img/icone-192.png`, `img/icone-512.png`) são gerados por script — só
precisa rodar de novo se quiser alterá-los:

```bash
node scripts/gerar-svgs.js
node scripts/gerar-icones.js
```

## Estrutura

```
index.html            shell do app e as 4 telas
css/app.css            tema visual (mobile-first)
js/exercicios.js        catálogo dos 5 dias e 22 exercícios
js/dados.js             leitura/escrita no localStorage
js/app.js               navegação, telas, zoom, backup
js/aerobico.js           tela de aeróbico
img/ex/*.svg            ilustrações dos exercícios
manifest.webmanifest    configuração do PWA
sw.js                   service worker (funcionamento offline)
scripts/                geração de ícones/ilustrações e servidor de preview
```
