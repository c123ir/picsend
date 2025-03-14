import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppRouter } from './routes';
import { createAppTheme } from './lib/theme/index';
import { cacheRtl } from './lib/theme/rtl';
import './lib/theme/styles.css';
import { useTheme } from './contexts/ThemeContext';

const ThemedApp = () => {
  const { isDarkMode } = useTheme();
  const theme = createAppTheme(isDarkMode);

  return (
    <CacheProvider value={cacheRtl}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <AppRouter />
      </MuiThemeProvider>
    </CacheProvider>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
