# BCS MEDIA TEAM - Professional Deployment Guide

This project is now a standard Vite + React + TypeScript application.

## 🚀 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   Create a `.env` file or export your key:
   ```bash
   export API_KEY=your_gemini_api_key
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 🏗️ Production Build

To build the project for production:
```bash
npm run build
```
The output will be in the `dist/` folder.

## 🚀 Hosting (Vercel / Netlify)

1. **Framework Preset**: Select **Vite**.
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables**: Add `API_KEY` with your Google Gemini key.

## 🛡️ Important Notes
- **HTTPS**: Deployment **must** be via HTTPS for Geolocation and Camera features to work.
- **Permissions**: Ensure users "Allow" location and camera access when prompted.
