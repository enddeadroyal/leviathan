import { useState } from 'react'
import { Drawer, List, ListItemIcon, ListItemButton, ListItemText, AppBar, Grid, Typography, Divider } from '@mui/material'
import { SettingsSharp } from '@mui/icons-material'
import { styled } from '@mui/system'
import { useNavigate } from 'react-router'
import { NaviContext, useNaviCache } from './hooks'
import { NAVI_DATA } from './api'

const DrawerGrid = styled(Grid)({
    height: 32,
})

const NaviDrawer = styled(Drawer)({
    width: 250,
    '& .MuiDrawer-paper': {
        width: 250,
    },
})

export function NaviBoard(props: any): JSX.Element {
    const navigate = useNavigate()
    const {state:{open}, update} = useNaviCache()
    return (
        <div>
            {
                <NaviDrawer open={open} onClose={()=> update({open: false})}>
                    <AppBar position="relative">
                        <DrawerGrid container alignItems="center" direction="column" justifyContent="center">
                            <SettingsSharp fontSize="small"/>
                        </DrawerGrid>
                    </AppBar>
                    <List>
                        <Divider />
                        {
                            NAVI_DATA.map(elem => (
                                <ListItemButton key={elem.name} divider onClick={() => navigate(elem.path)}>
                                    <ListItemIcon>{elem.icon}</ListItemIcon>
                                    <ListItemText primary={<Typography variant="overline" align="center">{elem.name}</Typography>} disableTypography></ListItemText>
                                </ListItemButton>
                            ))
                        }
                    </List>
                </NaviDrawer>
            }
        </div>
    )
}

export const NaviProvider = ({children}: any) => {

    const [naviState, setNaviState] = useState({open: true})
    return (
        <NaviContext.Provider value={{state: naviState, update: setNaviState}}>
            {children}
        </NaviContext.Provider>
    )
}