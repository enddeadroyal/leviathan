import { SpeedDial, SpeedDialAction, SpeedDialIcon, Typography, Box } from '@mui/material'
import { VisibilitySharp } from '@mui/icons-material'
import { styled } from '@mui/system'
import { useNaviCache } from '../../02.navi/hooks'
import { TunnelGrid } from './TunnelGrid'

const TunnelBox = styled(Box)(({theme}) =>({
    padding: theme.spacing(1),
}))

export function SSHTunnelBoard(): JSX.Element {

    const { update } = useNaviCache()
    
    return (
        <TunnelBox>
            <TunnelGrid height={750}></TunnelGrid>
           <SpeedDial      
                ariaLabel="SpeedDial basic example" icon={<SpeedDialIcon />} 
                sx={{position: "absolute", bottom: 16, right: 16}}>
                <SpeedDialAction tooltipOpen icon={<VisibilitySharp />} onClick={() => update(s => ({open: !s.open}))} tooltipTitle={
                    <Typography color="primary" noWrap variant="overline">Show/Hide Navigator</Typography>}></SpeedDialAction>
            </SpeedDial>
        </TunnelBox>
    )   
}