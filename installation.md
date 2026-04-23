# Installation Guide

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

Create a `.env` file in the project root and add your Telegram bot token:

```bash
touch .env
```

```env
TELEGRAM_TOKEN=<your_telegram_bot_token>
```

### 3. Run development mode

```bash
npm run dev
```

SCSS is now compiled directly by webpack, so only one process is required during development.

Any change in `src/scss/*.scss` is picked up by the dev server automatically.

### 4. Build for production

```bash
npm run build
```

Production build extracts the final stylesheet into `dist/css/main.min.css`.

## SCSS Source

The project uses:

- SCSS source: `src/scss/main.scss`
- SCSS partials: `src/scss/_*.scss`

### Recommended workflow

Use one command:

```bash
npm run dev
```

Webpack handles SCSS compilation automatically in both development and production.

## Recovering Telegram Bot Token

1. Open Telegram and start a chat with `@BotFather`.
2. Run the `/mybots` command.
3. Select your bot.
4. Open `API Token` and copy the token into `.env`.

## Cloudflare Pages Deployment

### 1. Create the project

1. Open the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Go to `Pages`.
3. Click `Create a project`.
4. Connect this GitHub repository.

### 2. Build settings

```bash
Framework preset: None
Build command: npm install && npm run build
Output directory: dist
```

### 3. Environment variables

Add:

```env
TELEGRAM_TOKEN=<your_telegram_bot_token>
```

## Netlify Deployment

### 1. Create the site

1. Open the [Netlify Dashboard](https://app.netlify.com/).
2. Click `Add new site`.
3. Select `Import an existing project`.
4. Connect this GitHub repository.

### 2. Build settings

```bash
Base directory: /
Package directory: /
Build command: npm install && npm run build
Publish directory: dist
Functions directory: /
```

### 3. Environment variables

Add:

```env
TELEGRAM_TOKEN=<your_telegram_bot_token>
```

### 4. Domain configuration

Go to `Site settings -> Domain management`.
