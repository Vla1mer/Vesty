import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.tsx'
import { store } from './store/store.ts'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { LanguageProvider } from './context/LanguageContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <LanguageProvider>
          <MotionConfig reducedMotion="user">
            <App />
          </MotionConfig>
        </LanguageProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
