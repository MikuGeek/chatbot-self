import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Check for API key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
console.log('Main entry point - API key available:', !!apiKey, 'Length:', apiKey?.length || 0);

// Create a styled error message component for when the API key is missing
const ApiKeyError = () => (
  <div style={{
    padding: '20px',
    margin: '40px auto',
    maxWidth: '600px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
    <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>API Key Missing</h1>
    <p style={{ marginBottom: '12px' }}>
      The Gemini API key is missing. Please follow these steps to add it:
    </p>
    <ol style={{ marginLeft: '24px' }}>
      <li style={{ marginBottom: '8px' }}>Create a <code>.env</code> file in the root directory</li>
      <li style={{ marginBottom: '8px' }}>Add the following line to the file: <br />
        <code>VITE_GEMINI_API_KEY=your_actual_api_key_here</code>
      </li>
      <li style={{ marginBottom: '8px' }}>Replace <code>your_actual_api_key_here</code> with your Gemini API key</li>
      <li style={{ marginBottom: '8px' }}>Restart the development server</li>
    </ol>
    <p>
      You can get a Gemini API key from the <a href="https://ai.google.dev/" style={{ color: '#b91c1c', textDecoration: 'underline' }}>Google AI Studio</a>.
    </p>
  </div>
);

// Render the app or error message
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {apiKey ? <App /> : <ApiKeyError />}
  </StrictMode>,
)
