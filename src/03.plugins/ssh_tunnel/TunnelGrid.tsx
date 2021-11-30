import { useState, useMemo, useEffect } from 'react'
import { IconButton, Grid, Chip } from '@mui/material'
import { EditSharp, SaveSharp, CancelSharp, DeleteSharp } from '@mui/icons-material'
import { DataGrid, GridRenderCellParams, GridRowId } from '@mui/x-data-grid'
import { useSnackbar } from 'notistack'
import { styled } from '@mui/system'
import { TunnelInfo } from './types'
import { TunnelGridToolbar } from './TunnelGridToolbar'
import { TunnelContext, useTunnelCache } from './hooks'
import { reqViewTunnelInfo, reqSyncTunnelInfo, reqDeleteTunnelInfo, reqStateTunnelInfo } from './event'

interface TunnelGridDivProps {
    height?: number | string,
}

const TunnelGridDiv = styled('div')<TunnelGridDivProps>(props=> ({
    height: props.height,
}))

export function TunnelPannel(props: any): JSX.Element {

    const {tunnels, update} = useTunnelCache()

    const { enqueueSnackbar } = useSnackbar()

    const columns = useMemo(() => [{
        headerName: "Local Port", field: "local_port", width: 120, type: 'number',
    }, {
        headerName: "Remote Port", field: "remote_port", width: 120, editable: true, type: 'number',
    }, {
        headerName: "Remote Host", field: "remote_host", width: 150, editable: true,
    }, {
        headerName: "SSH Port", field: "ssh_port", width: 120, editable: true, type: 'number',
    }, {
        headerName: "SSH Host", field: "ssh_host", width: 150, editable: true,
    }, {
        headerName: "Status", field: "status", width: 100,
        renderCell: (params: GridRenderCellParams) => {

            const {id, row, api} = params;

            const handleClick = (id: GridRowId, row: TunnelInfo) => () => {
                const {id: _id, ...tunnel} = row
                tunnel.status = "run"
                reqStateTunnelInfo(tunnel)
                    .then(tunnels => update && update(tunnels.map((elem, index) => ({...elem, id: index}))))
                    .catch(e => enqueueSnackbar(e.message, {variant: "warning"}))
            }

            const handleClick2 = (id: GridRowId, row: TunnelInfo) => () => {
                const {id: _id, ...tunnel} = row
                tunnel.status = "stop"
                reqStateTunnelInfo(tunnel)
                    .then(tunnels => update && update(tunnels.map((elem, index) => ({...elem, id: index}))))
                    .catch(e => enqueueSnackbar(e.message, {variant: "warning"}))
            }

            return (
                <Grid container direction="column" alignItems="flex-start" justifyContent="center">
                    {
                        params.value && params.value === "run"?
                        <Chip disabled={api.getRowMode(params.id) === "edit"} color="success" size="small" label="RUNNING" onClick={
                            handleClick2(id, row)
                        }></Chip>
                        :
                        <Chip disabled={api.getRowMode(params.id) === "edit"} color="info" size="small" label="STOP" onClick={
                            handleClick(id, row)
                        }></Chip>
                    }
                </Grid>
            )
        }
    }, {
        headerName: "Username", field: "username", width: 200, editable: true,
    }, {
        headerName: "Password", field: "password", width: 200, editable: true,
    }, {
        headerName: "Private Key", field: "private_key", width: 200,
    }, {
        headerName: "Operation", field: "operation", width: 100,
        renderCell: (params: GridRenderCellParams) => {
            console.info("render: ", params)
            const {id, row, api} = params;

            const onSaveClick = (id: GridRowId) => () => {
                const {
                    remote_port:{value: remote_port},
                    remote_host: {value: remote_host},
                    ssh_port: {value: ssh_port},
                    ssh_host: {value: ssh_host},
                    username: {value: username},
                    password: {value: password},
                } = api.getEditRowsModel()[id]
                api.setRowMode(id, "view")

                const { id: _id, ...tunnel } = {
                    ...row,
                    remote_port, remote_host, ssh_port, ssh_host, username, password,
                } as TunnelInfo

                console.info("sync: ", tunnel)

                reqSyncTunnelInfo(tunnel)
                    .then(tunnels => update && update(tunnels.map((elem, index) => ({...elem, id: index}))))
                    .catch(e => enqueueSnackbar(e.message, {variant: "error"}))
            }

            const onCancelClick = (id: GridRowId) => () => {
                api.setRowMode(id, "view")
            }

            const onDeleteClick = (id: GridRowId) => () => {
                const { id: _id, ...tunnel } = row
                reqDeleteTunnelInfo(tunnel)
                    .then(tunnels => update && update(tunnels.map((elem, index) => ({...elem, id: index}))))
                    .catch(e => enqueueSnackbar(e.message, {variant: "error"}))
            }

            return (
                api.getRowMode(id) === "edit"?
                    <Grid alignItems="center" container>
                        <IconButton color="primary" size="small" onClick={onSaveClick(id)}><SaveSharp /></IconButton>
                        <IconButton size="small" onClick={onCancelClick(id)}><CancelSharp /></IconButton>
                    </Grid>
                    :
                    <Grid alignItems="center" container>
                        <IconButton disabled={row.status === "run"} size="small" onClick={() => {api.setRowMode(id, "edit")}}><EditSharp /></IconButton>
                        <IconButton color="error" disabled={row.status === "run"} size="small" onClick={onDeleteClick(id)}><DeleteSharp /></IconButton>
                    </Grid>
            )
        }
    },], [update, enqueueSnackbar])

    useEffect(() => {
        reqViewTunnelInfo().then(tunnels => update && update(tunnels.map((elem, index) => ({...elem, id: index}))))
    }, [update])
    
    return (
        <DataGrid editMode="row" density="compact" columns={columns} rows={tunnels} components={{
                Toolbar: TunnelGridToolbar,
            }} checkboxSelection disableSelectionOnClick
            onRowEditStart={(_, e: any) => e.defaultMuiPrevented = true}
            onRowEditStop={(_, e: any) => e.defaultMuiPrevented = true}
            onCellFocusOut={(_, e: any) => e.defaultMuiPrevented = true}></DataGrid>
    )
}

export const TunnelProvider = (props: any) => {
    const { children } = props
    const [tunnels, setTunnels] = useState<TunnelInfo[]>([])
    return <TunnelContext.Provider value={{tunnels, update: setTunnels}}>
        {children}
    </TunnelContext.Provider>
}

export const TunnelGrid = (props: any) => {

    const { children, ..._props } = props
    return (
        <TunnelProvider>
            <TunnelGridDiv {..._props}>
                <TunnelPannel></TunnelPannel>
                {children}
            </TunnelGridDiv>
        </TunnelProvider>
    )
}