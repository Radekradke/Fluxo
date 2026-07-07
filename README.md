# Fluxo — Painel Financeiro + Serviços + PWA

Aplicativo React/Vite para controle financeiro pessoal com:

- Dashboard financeiro mensal
- Extrato de receitas/despesas
- Planejamento de orçamentos e metas
- Contas, dívidas, cartões e recorrentes
- Aba **Serviços** para projetos/freelas/tattoo
- Backup/importação de dados em JSON
- PWA instalável no celular/computador

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal, normalmente:

```bash
http://localhost:5173
```

## Como gerar versão de produção

```bash
npm run build
```

A versão final fica na pasta `dist/`.

## Como hospedar

Suba o conteúdo da pasta `dist/` em uma hospedagem estática, por exemplo Hostinger, HostGator, Vercel, Netlify ou GitHub Pages.

Para o PWA funcionar como app instalável, use HTTPS. Em `localhost` também funciona para teste.

## Como instalar como aplicativo

### Android / Chrome / Edge

1. Abra o site publicado.
2. Toque em **Instalar** quando o botão aparecer no topo do app ou no aviso do navegador.
3. O Fluxo será adicionado como app na tela inicial.

### iPhone / Safari

1. Abra o site no Safari.
2. Toque no botão de compartilhar.
3. Toque em **Adicionar à Tela de Início**.

## Como os dados ficam salvos

O app salva tudo no navegador usando `localStorage`.

Chaves usadas:

- `fluxo:v2` — dados financeiros gerais, temas, lançamentos, metas, cartões, dívidas e recorrentes.
- `fluxo:jobs` — dados da aba Serviços.

Os dados continuam salvos ao fechar e abrir o app, inclusive instalado como PWA.

Atenção: os dados podem ser perdidos se você limpar dados/cache do site, trocar de navegador, trocar de aparelho, mudar o domínio da hospedagem ou usar aba anônima.

## Backup recomendado

Na aba **Contas**, use:

- **Exportar backup** para baixar um arquivo `.json` com tudo.
- **Importar backup** para restaurar os dados depois.

Faça backup antes de trocar de celular, limpar navegador, mudar domínio ou reinstalar o app.

## Arquivos PWA adicionados

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/maskable-512.png`
- `public/icons/apple-touch-icon.png`
- `src/pwa.js`
