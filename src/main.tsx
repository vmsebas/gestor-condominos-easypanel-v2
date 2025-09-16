import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  // StrictMode desactivado temporalmente para evitar doble renderizado
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
)