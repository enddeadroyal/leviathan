import { useState, useContext, useEffect, useMemo, useCallback } from 'react'
import { memo } from 'react'
import { styled } from '@mui/system'
import { Button } from '@mui/material'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarFilterButton, GridToolbarDensitySelector, GridToolbarExport } from '@mui/x-data-grid'
import { PlayCircleSharp } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { CQLRequest, CQLRowData } from './types'
import { CQLGridContext, CQLDetailGridContext } from './hooks'
import { calColumnWidth, createCQLDetailCache } from './api'
import { reqDetailData } from './event'

const DetailDiv = styled('div')({
    width: '100%',
    height: 750,
})

export const CQLDetailGrid = memo((props: any): JSX.Element => {

    const { data } = props
    const cache = useContext(CQLGridContext)

    const [ detailCache, setDetaiCache ] = useState(createCQLDetailCache())

    const [ columns, setColumns ] = useState<any[]>([])
    const [ rowData, setRowData ] = useState<CQLRowData>({
        loading: false,
        rows: [],
    })

    useEffect(() => {

        const { fields, udts } = cache
    
        const partitionFields = fields?.filter((elem: any) => elem?.restraint === "partition-key")
        const clusteringFields = fields?.filter((elem: any) => elem?.restraint === "clustering")
    
        const patitionParams = partitionFields?.map((elem: any) => ({
            field: elem,
            operate: "=",
            value: data[elem.name]
        })) || []
    
        const clusteringParams = clusteringFields?.map((elem: any) => ({
            field: elem,
            operate: "=",
            value: data[elem.name]
        })) || []
    
        const udt = udts?.find((elem: any) => elem?.field?.name === data?.detail?.key)
    
        const params = [...patitionParams, ...clusteringParams]

        const columns = udt?.udt?.map(elem => ({
            field: elem.name,
            width: calColumnWidth(elem),
        })) || []

        setColumns(columns)
        setRowData({loading: false, rows: []})
        setDetaiCache({udt, params, updateData: setRowData})
    }, [data, cache, setColumns, setRowData])
    
    return(
        <DetailDiv>
            <CQLDetailGridContext.Provider value={detailCache}>
                { 
                    useMemo(() => (
                        <DataGrid checkboxSelection disableSelectionOnClick density="compact"
                            loading={rowData.loading} 
                            columns={columns}
                            rows={rowData.rows}
                            components={{Toolbar: DetailGridToolBar}}
                        ></DataGrid>
                    ), [columns, rowData])
                }
            </CQLDetailGridContext.Provider>
        </DetailDiv>)
})

const DetailGridToolBar = (): JSX.Element => {
    return (
        <GridToolbarContainer>
            <GridToolbarLoadButton></GridToolbarLoadButton>
            <GridToolbarColumnsButton></GridToolbarColumnsButton>
            <GridToolbarFilterButton></GridToolbarFilterButton>
            <GridToolbarDensitySelector></GridToolbarDensitySelector>
            <GridToolbarExport></GridToolbarExport>
        </GridToolbarContainer>
    )
}

const GridToolbarLoadButton = (): JSX.Element => {

    const cache = useContext(CQLGridContext)
    const detailCache = useContext(CQLDetailGridContext)

    const { enqueueSnackbar } = useSnackbar()

    const handleLoad = useCallback(() => {
        const req = {
            port: cache.port,
            host: cache.host,
            username: cache.username,
            password: cache.password,
            keyspace: cache.keyspace,
            table: cache.table,
            udt: detailCache.udt,
            params: detailCache.params,
        } as CQLRequest

        detailCache.updateData && detailCache.updateData({loading: true, rows: []})

        reqDetailData(req).then(data => {
            const rows = data.map((elem, index) => ({...elem, id: index}))
            detailCache.updateData && detailCache.updateData({loading: false, rows})

            enqueueSnackbar("GET DETAIL-DATA SUCCESS!!!", {variant: "success"})
        }).catch(e => {
            detailCache.updateData && detailCache.updateData({loading: false, rows: []})
            enqueueSnackbar(e.message, {variant: "error"})
        })
    }, [cache, detailCache, enqueueSnackbar])
    return (
        <Button size="small" startIcon={<PlayCircleSharp />} onClick={handleLoad}>load</Button>
    )
}