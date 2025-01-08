# Installation local
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a .env file in the root directory and add your Telegram bot token:
   ```bash
   vim .env
   TELEGRAM_TOKEN=9774699703:MBUx7liQHbpN7XKSpa5aMWC05mcFDMsiH14
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

<br>

# Recovering Telegram Bot Token
1. Open Telegram and start a chat with @BotFather.
2. Use the command /mybots to view your bots.
3. Select your bot and click "API Token" to retrieve token.

<br>

# Installation on Cloudflare
1. **Set Up a New Project on Cloudflare Pages**:
- Log in to your [Cloudflare dashboard](https://dash.cloudflare.com/)
- Navigate to the **Pages** section and click **Create a project**.
- Choose the **GitHub repository**.

2. **Configure the Build Settings**:
- Set the framework preset to **"None"**.
- Specify the build command:
  ```bash
  npm install && npm run build
  ```
- Set the output directory to:
  ```bash
  dist
     ```

3. **Add Environment Variables**:
- Go to the **Environment Variables** section in the build settings.
- Add the environment variable for the Telegram bot token:
  ```
  TELEGRAM_TOKEN=<token>
  ```

<br>



# Installation on Netlify
1. **Set Up a New Site on Netlify**:
- Log in to your [Netlify dashboard](https://app.netlify.com/).
- Click **Add new site** > **Import an existing project**.
- Choose the **GitHub repository**.

2. **Configure the Build Settings**:
```bash
base directory: /
package directory: /
build command: npm install && npm run build
publish directory: /dist
functions directory: /
```

3. **Add Environment Variables**:
- Go to the **Environment Variables** section in the build settings.
- Add the environment variable for the Telegram bot token:
  ```
  TELEGRAM_TOKEN=9774699703:MBUx7liQHbpN7XKSpa5aMWC05mcFDMsiH14
4. **Configure domain**:
- Site settings > Domain management.
