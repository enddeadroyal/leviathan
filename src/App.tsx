import { Route, Routes } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import { createTheme, ThemeProvider } from '@mui/material'
import { AppBar, Typography } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import { NaviBoard, NaviProvider } from './02.navi/NaviBoard'
import { NAVI_DATA } from './02.navi/api'
import './App.css'

function App() {

  let theme = createTheme()
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}>
          <AppBar position="relative">
            <Typography variant="overline">leviathan</Typography>
          </AppBar>
          <BrowserRouter>
            <NaviProvider>
              <NaviBoard></NaviBoard>
              <Routes>
                {
                    NAVI_DATA.map(elem => (
                        <Route key={elem.name} path={elem.path} element={elem.element}></Route>
                    ))
                }
              </Routes>
            </NaviProvider>
          </BrowserRouter>  
        </SnackbarProvider>
      </ThemeProvider>
    </div>
  )
}

export default App