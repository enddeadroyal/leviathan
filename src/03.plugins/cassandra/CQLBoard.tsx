import { useState } from 'react'
import { Typography, Collapse, SpeedDial, SpeedDialAction, SpeedDialIcon, Grid } from '@mui/material'
import { VisibilitySharp } from '@mui/icons-material'
import { CQLDataGrid } from './CQLDataGrid'
import { useNaviCache } from '../../02.navi/hooks'
import { CQLNaviPannel } from './CQLNaviPannel'
import { useCQLBoardCache, CQLBoardContext, cqlStateSelector, cqlDisplaySelector } from './hooks'
import { createCQLBoardState } from './api'

export const CQLBoardProvider: (props: any) => JSX.Element = (props) => {

    const {children} = props

    const [state, update] = useState(createCQLBoardState())
    return (
        <CQLBoardContext.Provider value={{item: state, update}}>
            {children}
        </CQLBoardContext.Provider>
    )
}

export function CQLBoard(props: any): JSX.Element {

    const [ open, setOpen ] = useState(true)
    const { update } = useNaviCache()
    const { item } = useCQLBoardCache()
    const cql = cqlStateSelector(item)
    const display = cqlDisplaySelector(item)
    
    return (
        <div>
        <Grid container wrap="nowrap" alignItems="content">
            <Grid item xs={open? 2 : false}>
                <Collapse in={open} orientation="horizontal">
                    <CQLNaviPannel></CQLNaviPannel>
                </Collapse>
            </Grid>
                {
                    display? <Grid item xs={open? 10 : 12}><CQLDataGrid {...cql}></CQLDataGrid></Grid> : null
                }
        </Grid>
        <SpeedDial
                ariaLabel="SpeedDial basic example" icon={<SpeedDialIcon />} 
                sx={{position: "absolute", bottom: 16, right: 16}}>
                <SpeedDialAction tooltipOpen icon={<VisibilitySharp />} onClick={() => setOpen(o => !o)} tooltipTitle={
                    <Typography color="primary" noWrap variant="overline">Show/Hide Search</Typography>}></SpeedDialAction>
                <SpeedDialAction tooltipOpen icon={<VisibilitySharp />} onClick={() => update(s => ({open: !s.open}))} tooltipTitle={
                    <Typography color="primary" noWrap variant="overline">Show/Hide Navigator</Typography>}></SpeedDialAction>
            </SpeedDial>
        </div>
    )
}