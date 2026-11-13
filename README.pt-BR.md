# Steam Plus

[![CI](https://github.com/NemoKing1210/steam-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/steam-plus/actions/workflows/ci.yml)
[![Instalar userscript](https://img.shields.io/badge/Install-userscript-102436?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/steam-plus.user.js)
[![Licença: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/steam-plus/blob/main/LICENSE)

[English](https://github.com/NemoKing1210/steam-plus/blob/main/README.md) · [Deutsch](https://github.com/NemoKing1210/steam-plus/blob/main/README.de.md) · [Русский](https://github.com/NemoKing1210/steam-plus/blob/main/README.ru.md) · [Español](https://github.com/NemoKing1210/steam-plus/blob/main/README.es.md) · [Français](https://github.com/NemoKing1210/steam-plus/blob/main/README.fr.md) · **Português (Brasil)** · [简体中文](https://github.com/NemoKing1210/steam-plus/blob/main/README.zh-CN.md) · [日本語](https://github.com/NemoKing1210/steam-plus/blob/main/README.ja.md) · [한국어](https://github.com/NemoKing1210/steam-plus/blob/main/README.ko.md) · [Polski](https://github.com/NemoKing1210/steam-plus/blob/main/README.pl.md)

Um userscript que melhora a Steam Store e a Steam Community com um painel de
configurações completo e tradução de conteúdo — descrições de jogos, análises,
comentários de perfil, notícias e guias — direto na página.

> **Status:** fase inicial. Painel de configurações (Geral · Tradução · Página
> do jogo · Preços · Links externos · Conteúdos adicionais · Região) + tradução
> de conteúdo pelo endpoint gratuito do Google (sem chave de API). Mais
> melhorias para a Steam estão planejadas. A versão atual e as mudanças estão
> no [CHANGELOG.md](https://github.com/NemoKing1210/steam-plus/blob/main/CHANGELOG.md).

> Os metadados `@updateURL` / `@downloadURL` do script apontam para a branch
> `main` do GitHub — a URL de instalação direta abaixo é sempre a build mais
> recente.

## Capturas de tela

O userscript real em uma página ativa da Steam. O idioma de destino da
tradução nas capturas é francês.

![Painel de configurações do Steam Plus com Geral, Tradução, Página do jogo, Preços, Links externos, Conteúdos adicionais, Região, Cache, Backup e Sobre o script](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/settings-panel.png)

| | |
|---|---|
| ![Descrição do jogo traduzida abaixo do original](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/translation.png)<br>**Tradução** — descrições, análises, comentários e notícias, abaixo do original ou substituindo-o | ![Tabela de comparação de preços regionais](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/regional-prices.png)<br>**Preços regionais** — 24 regiões da loja, a mais barata destacada, conversão de moeda em tempo real |
| ![Lista de conteúdo adicional](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/add-ons.png)<br>**Conteúdo adicional** — todos os DLCs com preço e data de lançamento; a posse aparece ao entrar na conta | ![Chips de links externos](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/external-links.png)<br>**Links externos** — atalhos para SteamDB, ProtonDB, HowLongToBeat e seus próprios links |
| ![Visualizador de imagens dos DLCs](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/viewer.png)<br>**Visualizador de imagens** — zoom, arraste, rotação e navegação pelas artes dos DLCs | ![Sobreposição de busca rápida](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/search.png)<br>**Busca rápida** — pesquise na loja entre regiões a partir de qualquer página |

Também nas páginas de jogo: oculte os blocos que você nunca lê e recarregue
páginas bloqueadas por região por meio de uma requisição anônima de visitante.

## Instalação rápida

1. Instale um gerenciador de userscripts
   ([Tampermonkey](https://www.tampermonkey.net/),
   [Violentmonkey](https://violentmonkey.github.io/) ou
   [ScriptCat](https://scriptcat.org/) recomendado).
2. Instale o script pelo GitHub (URL direta abaixo).

**URL de instalação (GitHub — a mais recente):**

```
https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/steam-plus.user.js
```

[![Instalar](https://img.shields.io/badge/Install-GitHub_raw-102436?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/steam-plus.user.js)

### Instalação por URL (painel do gerenciador)

| Gerenciador | Caminho |
|-------------|---------|
| Tampermonkey | Painel → **Utilitários** → **Instalar de URL** |
| Violentmonkey | Painel → **+** → **Instalar de URL** |
| Greasemonkey | Menu da extensão → **Novo script de usuário** → cole a URL direta |
| ScriptCat | Instale a [extensão](https://scriptcat.org/) e depois **Instalar de URL** com a URL direta do GitHub |

Cole a URL de instalação do GitHub (acima) ao instalar pelo painel do
gerenciador.

### Instalação manual

1. Abra o arquivo compilado [`steam-plus.user.js`](https://github.com/NemoKing1210/steam-plus/blob/main/steam-plus.user.js) deste repositório (ou execute `npm run build` após clonar).
2. Copie todo o conteúdo do arquivo.
3. No seu gerenciador de userscripts, crie um novo script e cole o código.
4. Salve e ative o script.

## Atualizações

O script inclui os metadados `@updateURL` e `@downloadURL` apontando para o
arquivo direto do GitHub. Gerenciadores compatíveis verificam atualizações
automaticamente.

Passos de lançamento para mantenedores: veja [docs/DEVELOPMENT.md § Releasing](https://github.com/NemoKing1210/steam-plus/blob/main/docs/DEVELOPMENT.md#releasing).

## Recursos

**Configurações** (botão **Steam Plus** no cabeçalho ou menu do gerenciador de
userscripts):

- Painel com abas — **Geral** · **Tradução** · **Página do jogo** · **Preços** ·
  **Links externos** · **Conteúdos adicionais** · **Região** (mais abas
  planejadas)
- Interface escura no estilo da Steam; cada alteração é mantida após recarregar
- Idioma da interface: Automático (navegador) ou um dos **10 idiomas** —
  English, Русский, Deutsch, Español, Français, Português (Brasil), 简体中文,
  日本語, 한국어, Polski

**Tradução** (conteúdo da loja e da comunidade):

- **Descrições de jogos** — descrição completa na página do jogo e trechos nas
  listagens
- **Análises de jogos** — análises da loja e cartões de análise do hub da
  comunidade
- **Comentários de perfil** — tópicos de comentários em perfis, hubs e arquivos
  compartilhados
- **Notícias e eventos** — o corpo de notícias/eventos e os resumos do hub
- **Guias** — um botão Traduzir acima do guia traduz todo o conteúdo de uma
  vez: título, descrição superior e cada seção (os comentários dos guias são
  cobertos por Comentários de perfil)
- Endpoint gratuito do Google por padrão — sem chave de API, registro de
  provedores extensível
- Traduza **Automaticamente** conforme o conteúdo aparece ou com um botão
  **Traduzir** por bloco
- Mostre a tradução **abaixo** do original ou **substitua** o texto com um
  botão para voltar ao original
- Idioma de destino: Automático (idioma da Steam / do navegador) ou um dos 14
  idiomas comuns
- Interruptores por escopo; interruptor mestre global

**Página do jogo** (páginas de jogo da loja):

- Oculte os blocos que você nunca lê — capturas e trailers, opções de compra e
  pacotes, "Sobre este jogo", lista de DLCs, requisitos do sistema, análises de
  usuários, curadores, eventos e anúncios, barra lateral de detalhes, franquia
  e recomendações
- Interruptor mestre mais interruptores por bloco; nada é ocultado por padrão
- Ocultação apenas com CSS que sobrevive às re-renderizações da Steam e à
  navegação

**Preços regionais** (páginas de jogo da loja):

- Compare o preço do jogo em 24 regiões da loja Steam direto na página — seu
  preço fixado no topo, a região mais barata destacada e a economia em relação
  ao seu preço
- Totalmente configurável: interruptores mestre e de carregamento automático,
  seletor de regiões, posição (acima das opções de compra / barra lateral /
  abaixo da descrição), ordem padrão das linhas com cabeçalhos clicáveis (um
  clique ordena, outro inverte a direção) e interruptores de exibição por
  elemento (preço original, selo de desconto, economia, destaque do mais
  barato, linha do seu preço)
- Preços no formato próprio da Steam, selos de desconto no verde da Steam,
  cache de 1 hora com atualização manual; jogos gratuitos ocultam o bloco
  automaticamente
- Conversão de moeda ao vivo (ExchangeRate-API + fallback jsDelivr, cache com
  duração configurável, status e limpeza manual nas configurações): cada preço
  é convertido automaticamente para a moeda da sua loja ou a que você escolher,
  com a fonte das taxas indicada sob o bloco

**Links externos** (páginas de jogo da loja):

- Atalhos para outras lojas e bancos de dados na página do jogo — SteamDB,
  ProtonDB e HowLongToBeat por padrão — posicionados acima das opções de
  compra, na barra lateral ou abaixo da descrição
- Totalmente definido pelo usuário: adicione seus próprios links com modelos de
  URL no estilo do navegador (`{name}` para o título do jogo, `{appid}` para o
  id da Steam), favicons personalizados, interruptores por link, controles para
  reordenar e uma opção para abrir em nova aba

**Conteúdo adicional** (páginas de jogo da loja):

- Lista **todos os DLCs do jogo** com imagem de cápsula, data de lançamento,
  preço e se sua conta já o possui — um contador possuídos/total no cabeçalho,
  links por linha para a página da loja de cada DLC e ordenação "não possuídos
  primeiro" para que o que falta fique no topo
- Abre recolhido para economizar espaço; expanda com a seta no cabeçalho
- Clique na imagem de um DLC para abrir o **visualizador de imagens
  integrado**: ajuste à tela, zoom (roda do mouse, `+`/`−`, clique duplo),
  arrastar para mover, girar, navegar por todos os DLCs com `←`/`→` ou a faixa
  de miniaturas, `Esc` para fechar; o visualizador é configurável (faixa de
  miniaturas, repetição) e acessível pelo teclado
- Lê primeiro a lista de DLCs da própria página (nomes, preços, imagens já
  renderizadas) e pede à Steam apenas o que a página não fornece — datas de
  lançamento e cápsulas que a Steam mantém recolhidas são preenchidas
  progressivamente e ficam em cache por um dia, a posse por 30 minutos; com
  **Imagens dos DLCs** e **Datas de lançamento** desativadas, uma página cujas
  linhas a Steam já renderizou não custa nenhuma requisição; há um reset de
  cache na aba Conteúdos adicionais
- Configurável: interruptor mestre, posição (acima das opções de compra / barra
  lateral / abaixo da descrição), ordem das linhas, contador de possuídos,
  linhas possuídas e interruptores de preço, imagem e data de lançamento

**Bypass de região** (páginas de loja bloqueadas):

- Recarrega páginas `/app/`, `/bundle/` e `/sub/` bloqueadas com "indisponível
  na sua região" por meio de uma requisição anônima de visitante — sem cookies
  de conta, com os cookies de idioma e de verificação de idade da Steam
  enviados automaticamente e substituição opcional do país da loja (`cc`)
- Injeta o conteúdo do visitante no documento ativo — seu cabeçalho conectado,
  estilos e scripts permanecem intactos; as inicializações do visitante
  (análises, abas de requisitos, tags) são reproduzidas e as ilhas da loja são
  hidratadas no local, com uma reescrita completa do documento como fallback
  automático; tradução, preços regionais, links externos, conteúdo de DLCs e
  ocultação de blocos se aplicam automaticamente ao conteúdo injetado; o modo
  automático substitui o erro na hora, o manual mostra primeiro um botão de
  oferta e as falhas mostram um cartão de status com Tentar novamente
- Um gateway proxy HTTP opcional (host, porta, autenticação básica, três modos
  de URL) para bloqueios por IP — tudo na aba Região

Por baixo dos panos: um cache de tradução por provedor com TTL e corte LRU mais
uma fila de requisições com concorrência limitada — rápido em visitas repetidas
e gentil com o serviço de tradução.

> A tradução requer conexão com a internet com o provedor
> (`translate.googleapis.com` para o provedor padrão). O conteúdo traduzido
> fica em cache local no armazenamento do gerenciador de userscripts.

## Páginas compatíveis

| Site | Padrão de URL |
|------|---------------|
| Steam Store | `https://store.steampowered.com/*` |
| Steam Community | `https://steamcommunity.com/*` |

## Desenvolvimento e contribuição

- [docs/DEVELOPMENT.md](https://github.com/NemoKing1210/steam-plus/blob/main/docs/DEVELOPMENT.md) — build, testes locais, lançamento
- [docs/ARCHITECTURE.md](https://github.com/NemoKing1210/steam-plus/blob/main/docs/ARCHITECTURE.md) — estrutura dos módulos, fluxo de dados, contratos de extensão
- [CONTRIBUTING.md](https://github.com/NemoKing1210/steam-plus/blob/main/CONTRIBUTING.md) — diretrizes e convenções de PR
- [SECURITY.md](https://github.com/NemoKing1210/steam-plus/blob/main/SECURITY.md) — como relatar uma vulnerabilidade
- [AGENTS.md](https://github.com/NemoKing1210/steam-plus/blob/main/AGENTS.md) — notas de arquitetura para agentes de IA

```bash
npm install
npm run dev      # Servidor Vite — instale o userscript "dev:" gerado
npm run build    # Produção → dist/ + cópia para a raiz do repositório
npm run ci       # As mesmas verificações do GitHub Actions
```

Requer Node.js 22 (veja `.nvmrc`).

## Afiliação

Este projeto **não é afiliado** à Valve nem à Steam. É um userscript
independente da comunidade.

## Licença

[MIT](https://github.com/NemoKing1210/steam-plus/blob/main/LICENSE) — Copyright (c) 2026 NemoKing1210
