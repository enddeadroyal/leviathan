import { useState } from 'react'
import { GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector, GridToolbarExport } from '@mui/x-data-grid'
import { AppRegistrationOutlined, ReplaySharp } from '@mui/icons-material'
import { Button, Grid, Modal } from '@mui/material'
import { TunnelRegisterPannel } from './TunnelRegisterPannel'
import { useTunnelCache } from './hooks'
import { reqViewTunnelInfo } from './event'

export function TunnelGridToolbar(): JSX.Element {
    return (
        <GridToolbarContainer>
            <ViewItem></ViewItem>
            <RegisterItem></RegisterItem>
            <GridToolbarColumnsButton></GridToolbarColumnsButton>
            <GridToolbarFilterButton></GridToolbarFilterButton>
            <GridToolbarDensitySelector></GridToolbarDensitySelector>
            <GridToolbarExport></GridToolbarExport>
        </GridToolbarContainer>
    )
}

const RegisterItem = (): JSX.Element => {

    const [ open, setOpen ] = useState(false);
    
    return (
        <Grid>
            <Button size="small" startIcon={<AppRegistrationOutlined />} onClick={() => setOpen(true)}>register</Button>
            <Modal open={open}>
                <TunnelRegisterPannel onClose={() => setOpen(false)}></TunnelRegisterPannel>
            </Modal>
        </Grid>
    )
}

const ViewItem = (): JSX.Element => {
    const { update } = useTunnelCache()

    return (
        <Button size="small" startIcon={<ReplaySharp />} onClick={() => {
            update && update([])
            reqViewTunnelInfo().then(tunnels => update && update(tunnels.map((elem, index) => ({...elem, id: index}))))
        }}>load</Button>
    )
}