import { useState, Fragment, useCallback, useRef } from 'react'
import { ViewColumnSharp, FilterListSharp, MoreSharp, PlayCircleSharp } from '@mui/icons-material'
import { Button, Grid, Popover, TextField, FormControlLabel, Switch, Paper, Select, MenuItem, InputLabel, FormControl, Input, Badge, Menu } from '@mui/material'
import { styled } from '@mui/system'
import { useGridApi, columnSelector, hiddenItemsSelector, filterItemsSelector, gridSizeSelector, loadingSelector } from './hooks'
import { ExportSharp, DensitySharp } from '../01.icons/icons'
import { MASTER_DETIAL_SEARCH_LOAD_MODE, MASTER_DETIAL_SEARCH_MORE_MODE } from './constants'
import { TEXT_OPERATE } from '../01.components/FilterItem'

const ViewItemBox = styled(Paper)(({theme}) => ({
    width: 300,
    padding: theme.spacing(1, 2)
}))


const FilterItemBox = styled(Paper)(({theme}) => ({
    width: 500,
    padding: theme.spacing(1, 2)
}))

const ColumnGrid= styled(Grid)(({theme}) => ({
    height: 250,
    padding: theme.spacing(1, 1),
    overflowY: "auto",
}))

export function MasterDetailGridToolbar(): JSX.Element {

    return (<Grid container alignItems="center">
        <Grid item><LoadDataItem></LoadDataItem></Grid>
        <Grid item><MoreDataItem></MoreDataItem></Grid>
        <Grid item><ViewColumnItem></ViewColumnItem></Grid>
        <Grid item><FiltersItem></FiltersItem></Grid>
        <Grid item><DensityItem></DensityItem></Grid>
        <Grid item><ExposureItem></ExposureItem></Grid>
    </Grid>)
}

export function LoadDataItem({disabled}: any): JSX.Element {
    const { state, onLoad, update } = useGridApi()
    const loading = loadingSelector(state)

    const handleClick = () => {
        update(s => ({...s, loading: true}))
        onLoad && onLoad(MASTER_DETIAL_SEARCH_LOAD_MODE)
    }

    return (
        <Button disabled={loading} size="small" startIcon={<PlayCircleSharp />} onClick={handleClick}>load</Button>
    )
}

export function MoreDataItem(): JSX.Element {
    const { state, onLoad, update } = useGridApi()
    const loading = loadingSelector(state)

    const handleClick = () => {
        update(s => ({...s, loading: true}))
        onLoad && onLoad(MASTER_DETIAL_SEARCH_MORE_MODE)
    }

    return (
        <Button disabled={loading} size="small" startIcon={<MoreSharp />} onClick={handleClick}>more</Button>
    )
}

export function ViewColumnItem(): JSX.Element {

    const { state, toolBar, update } = useGridApi()
    const columns = columnSelector(state)
    const hidden = hiddenItemsSelector(state)
    const [ open, setOpen ] = useState(false)

    const loading = loadingSelector(state)
    
    return (
        <Fragment>
            <Button disabled={loading} size="small" startIcon={
                <Badge badgeContent={hidden.length} color="primary"><ViewColumnSharp /></Badge>
            } onClick={() => setOpen(true)}>columns</Button>
            <Popover open={open} anchorEl={toolBar?.current} anchorOrigin={{horizontal: "left", vertical: "bottom"}} onClose={() => setOpen(false)}>
                <ViewItemBox>
                    <TextField label="Find Column" size="small" variant="standard" InputLabelProps={{shrink: true}} fullWidth placeholder="Column Title"></TextField>
                        <ColumnGrid container direction="column" wrap="nowrap">
                            {
                                columns.map(elem => <Grid item container alignItems="center">
                                    <FormControlLabel label={elem.field} control={
                                        <Switch size="small" checked={!hidden.includes(elem.field)} onChange={(_, checked) => {
                                            const hiddenSet = new Set<string>(hidden)
                                            checked? hiddenSet.delete(elem.field) : hiddenSet.add(elem.field)
                                            update(s => ({...s, hiddenState: Array.from(hiddenSet)}))
                                        }}></Switch>
                                    }></FormControlLabel>
                                </Grid>)
                                }
                        </ColumnGrid>
                    <Grid container wrap="nowrap" justifyContent="space-between" alignItems="center">
                        <Button size="small" onClick={() => update(s => ({...s, hiddenState: []}))}>show all</Button>
                        <Button size="small" onClick={() => update(s => ({...s, hiddenState: columns.map(elem => elem.field)}))}>hide all</Button>
                    </Grid>
                </ViewItemBox>
            </Popover>
        </Fragment>
    )
}

export function FiltersItem(): JSX.Element {
    
    const { state, toolBar, update } = useGridApi()
    const columns = columnSelector(state).filter(elem => elem.type !== "nested")
    const gridFilterItem = filterItemsSelector(state)
    const loading = loadingSelector(state)

    const [open, setOpen] = useState(false)
    const [filterItem, setFilterItem] = useState(gridFilterItem)

    const handleClose = useCallback(() => {
        setOpen(false)
        filterItem.field? 
        update(s => ({...s, filterState: filterItem}))
        :
        update(s => ({...s, filterState: {}})) 
    }, [filterItem, setOpen, update])

    return (
        <Fragment>
            <Button disabled={loading} size="small" startIcon={
                <Badge badgeContent={filterItem.field? 1 : 0} color="primary"><FilterListSharp /></Badge>
            } onClick={() => setOpen(true)}>filters</Button>
            <Popover open={open} anchorEl={toolBar?.current} anchorOrigin={{horizontal: "left", vertical: "bottom"}} onClose={handleClose}>
                <FilterItemBox>
                    <Grid container columnSpacing={2} alignItems="flex-end">
                        <Grid item xs={1}>
                            <Switch size="small" checked={!!filterItem.field} onChange={(_, checked) => {
                                if(!checked) setFilterItem({})
                            }}></Switch>
                        </Grid>
                        <Grid item xs={4}>
                        <InputLabel id="columns" shrink>Columns</InputLabel>
                            <Select size="small" labelId="columns" fullWidth variant="standard" value={filterItem.field} onChange={(e) => setFilterItem(s => ({...s, field: e.target.value}))}>
                                {
                                    columns.map(elem => <MenuItem key={elem.field} value={elem.field}>{elem.field}</MenuItem>)
                                }
                            </Select>
                        </Grid>
                        <Grid item xs={3}>
                            <InputLabel id="operators" shrink>Operators</InputLabel>
                            <Select size="small" labelId="operators" fullWidth variant="standard" value={filterItem.operate} onChange={(e) => setFilterItem(s => ({...s, operate: e.target.value}))}>
                                {
                                    TEXT_OPERATE.map(elem => <MenuItem key={elem.key} value={elem.key}>{elem.value}</MenuItem>)
                                }
                            </Select>
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="operators" shrink>Value</InputLabel>
                                <Input placeholder="Filter Value" value={filterItem.value} onChange={(e) => {console.info(e); setFilterItem(s => ({...s, value: e.target.value}))}}></Input>
                            </FormControl>
                        </Grid>
                    </Grid>
                </FilterItemBox>
            </Popover>
        </Fragment>)
}

export function DensityItem(): JSX.Element {

    const { state, update } = useGridApi()
    const size = gridSizeSelector(state)
    const loading = loadingSelector(state)

    const densityItem = useRef<any>({})
    const [open, setOpen] = useState(false)

    return (<Fragment>
        <Button disabled={loading} size="small" startIcon={<DensitySharp />} ref={densityItem} onClick={() => setOpen(true)}>density</Button>
            <Menu open={open} variant="selectedMenu" anchorEl={densityItem.current} onClose={() => setOpen(false)}>
                <MenuItem value="compact" selected={size === "compact"} onClick={() => {
                    setOpen(false)
                    update(s => ({...s, size: "compact"}))}
                }>Compact</MenuItem>
                <MenuItem value="medium" selected={size === "starndard"} onClick={() => {
                     setOpen(false)
                    update(s => ({...s, size: "starndard"}))}
                }>Standard</MenuItem>
                <MenuItem value="comfortable" selected={size === "comfortable"} onClick={() => {
                     setOpen(false)
                    update(s => ({...s, size: "comfortable"}))}
                }>Comfortable</MenuItem>
            </Menu>
    </Fragment>)
}

export function ExposureItem(): JSX.Element {

    const { state } = useGridApi()
    const loading = loadingSelector(state)
    return (<Button disabled={loading} size="small" startIcon={<ExportSharp />}>export</Button>)
}