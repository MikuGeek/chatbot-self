# Emotion-Aware Chatbot

A chatbot application that captures photos from the user's camera, analyzes emotions, and responds contextually based on detected emotions and user input text.

## Features

- Camera capture for taking photos
- Emotion detection using Google's Gemini API
- Contextual responses based on detected emotions and user text
- Real-time interaction with a modern UI using TailwindCSS and shadcn/ui

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```

3. Set up the Gemini API:
   - Go to [Google AI Studio](https://ai.google.dev/) and create an account
   - Generate an API key
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Replace `your_gemini_api_key_here` with your actual Gemini API key
   - Note that Vite requires environment variables to be prefixed with `VITE_` to be accessible in browser code

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Allow camera access when prompted
2. The application will capture your photo when you press the "Send" button
3. Type a message in the input field (optional)
4. Press "Send" to submit your photo and message
5. The chatbot will analyze your emotion from the photo and respond accordingly

## How It Works

1. The application captures a photo using your device's camera
2. The photo is sent to Google's Gemini API for emotion detection
3. The detected emotion and your text message are sent to Gemini again for generating a contextual response
4. The response is displayed in the chat interface

## Technologies Used

- React
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- Google Gemini API
