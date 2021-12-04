import { useState, useEffect, memo, useMemo, useRef, useCallback } from 'react'
import { Grid, AppBar, Typography, Box, Paper } from '@mui/material'
import { styled } from '@mui/material/styles'
import { useSnackbar } from 'notistack'
import { CQLRequest, CQLDataGridProps, CQLTableInfo, CQLParam, CQLDataGridCache, CQLRowData } from './types'
import { FilterItemProps } from '../../01.components/types'
import { MASTER_DETIAL_SEARCH_MORE_MODE } from '../../01.grid/constants'
import { CASSANDRA_OPERATE } from './constants'
import { calColumnWidth, createCQLGridCahe, convertValue } from './api'
import { CQLGridContext } from './hooks'
import { reqTableInfo, reqData } from './event'
import { FilterItem } from '../../01.components/FilterItem'
import { GridColumn } from '../../01.grid/types'
import { MasterDetailGrid, MasterDetailSelect } from '../../01.grid/MasterDetailGrid'
import { CQLDetailGrid } from './CQLDetailGrid'

const BorderBox = styled(Box)(({theme}) => ({
    borderRadius: theme.shape.borderRadius,
    borderColor: theme.palette.grey[400]
}))

const PaperBox = styled(Paper)(({theme}) => ({
    padding: theme.spacing(1),
}))

export const CQLDataGrid = memo((props: CQLDataGridProps): JSX.Element => {

    const { port, host, username, password, keyspace, table } = props

    const [ filterItems, setFilterItems ] = useState<FilterItemProps[]>([])
    const [ columns, setColumns ] = useState<GridColumn[]>([])
    const [ data, setData ] = useState<CQLRowData>({ rows: [], loading: false})
    const [ round, setRound ] = useState(0)
    const { enqueueSnackbar } = useSnackbar()

    const cqlRef = useRef<CQLDataGridCache>(createCQLGridCahe())

    const handleChange = (item: FilterItemProps) => {
        const index = filterItems.findIndex(elem => elem.name === item.name)
        filterItems.splice(index, 1, item)
        setFilterItems([...filterItems])
    }

    const handleLoad = useCallback((mode: string) => {

        setData({rows: [], loading: true})
        
        const params = filterItems
            .filter(elem => elem.checked && cqlRef.current.fields.find(field => field.name === elem.name))
            .map(elem => {
                const field = cqlRef.current.fields.find(field => field.name === elem.name)
                return {field, operate: elem.operate, value: convertValue(elem.value, field?.vtype || "string")} as CQLParam
            })

        const req = {
            port: cqlRef.current.port,
            host: cqlRef.current.host,
            username: cqlRef.current.username,
            password: cqlRef.current.password,
            keyspace: cqlRef.current.keyspace,
            table: cqlRef.current.table,
            fields: cqlRef.current.fields,
            params,
            pagination: mode === MASTER_DETIAL_SEARCH_MORE_MODE? cqlRef.current.pagingState : null,
        } as CQLRequest

        reqData(req).then(data => {
            const rows = data.data.map((elem, index) => ({...elem, id: index}))
            cqlRef.current.pagingState = data.pagination
            if(cqlRef.current.pagingState && mode === MASTER_DETIAL_SEARCH_MORE_MODE) {
                setRound(s => s + 1) 
            } else {
                setRound(0)
            }
            setData({rows, loading: false})

            enqueueSnackbar("GET DATA SUCCESS!!!", {variant: "success"})
        }).catch(e => {
            setData(s => ({...s, loading: false}))
            enqueueSnackbar(e.message, {variant: "error"})
        })
    }, [ filterItems, setData, enqueueSnackbar ])

    useEffect(() => {

        setColumns([])
        setData({rows: [], loading: true})

        const req = { port, host, username, password, keyspace, table } as CQLRequest
        reqTableInfo(req).then((tableInfo: CQLTableInfo) => {
            cqlRef.current = {...cqlRef.current, port, host, username, password, keyspace, table, ...tableInfo} as CQLDataGridCache

            let columns = cqlRef.current.fields.map(elem =>({
                field: elem.name,
                type: elem.vtype,
                width: calColumnWidth(elem),
            } as GridColumn))

            const patitionParams = cqlRef.current.fields.filter(elem => elem.restraint === "partition-key").map(elem => ({
                name: elem.name,
                checked: false,
            } as FilterItemProps))

            const clusteringParams = cqlRef.current.fields.filter(elem => elem.restraint === "clustering").map(elem => ({
                name: elem.name,
                checked: false,
            } as FilterItemProps))

            if(Array.isArray(tableInfo.udts) && tableInfo.udts.length) {
                const options = tableInfo.udts.map(elem => ({key: elem.field.name, value: elem.field.name}))
                columns.push({
                    field: 'detail',
                    type: 'nested',
                    options,
                    render: (row: any, c: GridColumn) => <MasterDetailSelect key={c.field} row={row} options={options} onChange={(data: any, row: any) => {
                        const newRow = {...row, detail: data}
                        setData(({rows, loading}) => {
                            rows.splice(row.id, 1, newRow)
                            return {rows: [...rows], loading}
                        })
                    }}></MasterDetailSelect>,
                })
            }
            setColumns(columns)
            setData({rows: [], loading: false})
            setFilterItems([...patitionParams, ...clusteringParams])

            enqueueSnackbar("GET TABLE-INFO SUCCESS!!!", {variant: "success"})
        }).catch(e => {
            setData(s => ({...s, loading: false}))
            enqueueSnackbar(e.message, {variant: "error"})
        })
    }, [port, host, username, password, keyspace, table, setColumns, setFilterItems, setData, enqueueSnackbar])

    return (
        <PaperBox>
            <BorderBox border={1}>
                <Grid direction="column" container wrap="nowrap">
                    <Grid item>
                        <AppBar position="relative">
                            <Typography variant="overline">{`${keyspace} ${table} (Round: ${round})`}</Typography>
                        </AppBar>
                    </Grid>
                    <Grid item container>
                        {
                            filterItems.map(elem => (
                                <FilterItem key={elem.name} options={CASSANDRA_OPERATE} name={elem.name} checked={elem.checked} operate={elem.operate || ""} value={elem.value || ""} onChange={handleChange}></FilterItem>
                            ))
                        }
                    </Grid>
                    <Grid item>
                        <CQLGridContext.Provider value={cqlRef.current}>
                            {
                                useMemo(() => (
                                    <MasterDetailGrid loading={data.loading} height={800} columns={columns} data={data.rows} detail={CQLDetailGrid} onLoad={handleLoad}></MasterDetailGrid>
                                ), [columns, data, handleLoad])
                            }
                        </CQLGridContext.Provider>
                    </Grid>
                </Grid>
            </BorderBox>
        </PaperBox>
    )
})