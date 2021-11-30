import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { TextField, Grid, Paper, Box, Select, Typography, MenuItem, SelectChangeEvent, Collapse, SpeedDial, SpeedDialAction, SpeedDialIcon, IconButton, FormControl, InputLabel } from '@mui/material'
import { VisibilitySharp, SearchSharp } from '@mui/icons-material'
import { styled } from '@mui/system'
import { useSnackbar } from 'notistack'
import { reqKeyspaces, reqTables } from './event'
import { CQLRequest, CQLDataGridProps } from './types'
import { createCQLDataGridPrpos } from './api'
import { CQLDataGrid } from './CQLDataGrid'
import { useNaviCache } from '../../02.navi/hooks'

const BorderBox = styled(Box)(({theme}) => ({
    borderRadius: theme.shape.borderRadius,
    borderColor: theme.palette.grey[400]
}))

const PaperBox = styled(Paper)(({theme}) => ({
    padding: theme.spacing(1),
}))

export function CQLBoard(props: any): JSX.Element {

    const { register, handleSubmit } = useForm<CQLDataGridProps>()
    const [ spaces, setSpaces ] = useState<string[]>([])
    const [ tables, setTables ] = useState<string[]>([])
    const [ show, foreceUpdate ] = useState<number>(0)
    const [ open, setOpen ] = useState(false)
    const { update } = useNaviCache()

    const cqlRef = useRef<CQLDataGridProps>(createCQLDataGridPrpos())

    const { enqueueSnackbar } = useSnackbar()

    const onSubmit = handleSubmit(data => {
        setSpaces([])
        setTables([])

        foreceUpdate(0)

        cqlRef.current = {...cqlRef.current, ...data}

        const req = {
            port: cqlRef.current.port,
            host: cqlRef.current.host,
            username: cqlRef.current.username,
            password: cqlRef.current.password,
        } as CQLRequest
        reqKeyspaces(req).then(r => {
            setSpaces(r.sort())
            enqueueSnackbar("GET KEYSPACES SUCCESS!!!", {variant: "success"})
        }).catch(e => enqueueSnackbar(e.message, {variant: "error"}))
    })

    const onSpaceChange = useCallback((e: SelectChangeEvent<string>) => {
        
        foreceUpdate(0)
        setTables([])
        if (!cqlRef.current) return
        cqlRef.current.keyspace = e.target.value

        const req = {
            port: cqlRef.current.port,
            host: cqlRef.current.host,
            username: cqlRef.current.username,
            password: cqlRef.current.password,
            keyspace: cqlRef.current.keyspace,
        } as CQLRequest
        reqTables(req).then(r => {
            setTables(r.sort())
            enqueueSnackbar("GET TABLES SUCCESS!!!", {variant: "success"})
        }).catch(e => enqueueSnackbar(e.message, {variant: "error"}))
    }, [cqlRef, setTables, enqueueSnackbar])

    const onTableChange = useCallback((e: SelectChangeEvent<string>) => {
        foreceUpdate(0)
        if (!cqlRef.current) return
        cqlRef.current.table = e.target.value
    }, [cqlRef])

    const onGridLoad = () => {
        foreceUpdate(s => s + 1)
    }
    
    return (
        <div>
        <Grid container direction="column" wrap="nowrap" rowSpacing={2}>
            <Grid item>
                <Collapse in={open}>
                    <PaperBox>
                        <BorderBox border={1}>
                            <Grid container direction="column" wrap="nowrap" rowSpacing={1}>
                                <Grid item xs={1}>
                                    <form onSubmit={onSubmit}>
                                        <Grid container wrap="nowrap" columnSpacing={2} alignItems="center">
                                            <Grid item><IconButton color="primary" type="submit"><SearchSharp /></IconButton></Grid>
                                            <Grid item xs={2}><TextField fullWidth variant="standard" label="HOST" size="small" {...register("host")}></TextField></Grid>
                                            <Grid item xs={1}><TextField fullWidth variant="standard" label="PORT" size="small" {...register("port", {valueAsNumber: true})}></TextField></Grid>
                                            <Grid item xs={2}><TextField fullWidth variant="standard" label="USERNAME" size="small" {...register("username")}></TextField></Grid>
                                            <Grid item xs={2}><TextField fullWidth variant="standard" label="PASSWORD" size="small" {...register("password")}></TextField></Grid>
                                        </Grid>
                                    </form>
                                </Grid>
                                <Grid container item wrap="nowrap" alignItems="center" columnSpacing={2} xs={1}>
                                    <Grid item>
                                        <IconButton color="primary" onClick={onGridLoad}><SearchSharp /></IconButton>
                                    </Grid>
                                    <Grid container item xs={2} alignItems="center" direction="column">
                                        <FormControl fullWidth size="small" variant="standard">
                                            <InputLabel id="keyspaces">KEYSAPCES</InputLabel>
                                            <Select displayEmpty size="small" labelId="keyspaces" fullWidth onChange={onSpaceChange}>
                                                {
                                                    spaces.map((elem, index) => <MenuItem value={elem} key={index}>
                                                        <Typography align="left">{elem}</Typography>
                                                    </MenuItem>)
                                                }
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid container item xs={2} alignItems="center" direction="column">
                                        <FormControl fullWidth size="small"  variant="standard">
                                            <InputLabel id="tables">TABLES</InputLabel>
                                            <Select displayEmpty size="small" labelId="tables" fullWidth onChange={onTableChange}>
                                                {
                                                    tables.map((elem, index) => <MenuItem value={elem} key={index}>
                                                        <Typography align="left">{elem}</Typography>
                                                    </MenuItem>)
                                                }
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </BorderBox>
                    </PaperBox>
                </Collapse>
            </Grid>
            <Grid item xs>
                {
                    show? <CQLDataGrid {...cqlRef.current}></CQLDataGrid> : null
                }
            </Grid>
            
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