import { forwardRef, ForwardedRef, useRef, useState } from 'react'
import { Paper, Box, Grid, TextField, Button, AppBar, Typography, } from '@mui/material'
import { styled } from '@mui/system'
import { useForm } from 'react-hook-form'
import { useSnackbar } from 'notistack'
import { TunnelInfo } from './types'
import { useTunnelCache } from './hooks'
import { reqRegisterTunnelInfo } from './event'
import { FileBrowser } from '../../01.components/FileBrowser'
import { WindowSharp } from '@mui/icons-material'

export interface TunnelRegisterPannelProps {
    children?: React.ReactNode;
    ref?: React.Ref<unknown>;
    onClose?: () => void,
}

const RegisterPannelBox = styled(Box)(({theme}) => ({
    padding: theme.spacing(2),
}))

const RegisterPannelPaper = styled(Paper)({
    width: 600,
    position: "absolute",
    transform: 'translate(-50%, -50%)',
    top: '50%',
    left: '50%',
})

export const TunnelRegisterPannel = forwardRef(({onClose}: TunnelRegisterPannelProps, ref: ForwardedRef<HTMLDivElement | null>) => {
    const { handleSubmit, register } = useForm<TunnelInfo>()
    const { update } = useTunnelCache()
    const [ file, setFile ] = useState("")
    const { enqueueSnackbar } = useSnackbar()

    const fileRef = useRef<any>({})

    const onSubmit = handleSubmit((data) => {
        onClose && onClose()
        reqRegisterTunnelInfo({...data, status: "stop", private_key: file} as TunnelInfo)
            .then(tunnels => {update && update(tunnels.map((elem, index) => ({...elem, id: index})))})
            .catch(e => enqueueSnackbar(e.message, {variant: "error"}))
    })

    return (
        <RegisterPannelPaper tabIndex={-1} ref={ref}>
            <AppBar position="relative">
                <Typography variant="overline" align="center">ssh tunnel register</Typography>
            </AppBar>
            <RegisterPannelBox>
                <form onSubmit={onSubmit}>
                    <Grid container direction="column" alignItems="center" rowSpacing={2}>
                        <Grid item container alignItems="center" columnSpacing={2}>
                            <Grid item xs={3}><TextField label="Local Port" variant="standard" size="small" fullWidth {...register("local_port", {valueAsNumber: true})} InputLabelProps={{shrink: true}}></TextField></Grid>
                        </Grid>
                        <Grid item container alignItems="center" columnSpacing={2}>
                            <Grid item xs={3}><TextField label="Remote Port" variant="standard" size="small" fullWidth {...register("remote_port", {valueAsNumber: true})} InputLabelProps={{shrink: true}}></TextField></Grid>
                            <Grid item xs={3}><TextField label="Remote Host" variant="standard" size="small" fullWidth {...register("remote_host")} InputLabelProps={{shrink: true}}></TextField></Grid>
                        </Grid>
                        <Grid item container alignItems="center" columnSpacing={2}>
                            <Grid item xs={3}><TextField label="SSH Port" variant="standard" size="small" fullWidth {...register("ssh_port", {valueAsNumber: true})} InputLabelProps={{shrink: true}}></TextField></Grid>
                            <Grid item xs={3}><TextField label="SSH Host" variant="standard" size="small" fullWidth {...register("ssh_host")} InputLabelProps={{shrink: true}}></TextField></Grid>
                        </Grid>
                        <Grid item container alignItems="center" columnSpacing={2}>
                            <Grid item xs={3}><TextField label="Username" variant="standard" size="small" fullWidth {...register("username")} InputLabelProps={{shrink: true}}></TextField></Grid>
                            <Grid item xs={3}><TextField label="Password" variant="standard" size="small" fullWidth {...register("password")} InputLabelProps={{shrink: true}}></TextField></Grid>
                            <Grid item xs={4}><FileBrowser ref={fileRef} value={file} onChange={(file: string|string[]) => {
                                Array.isArray(file)? setFile(file.join(",")) : setFile(file)
                            }}></FileBrowser></Grid>
                        </Grid>
                        <Grid item container alignItems="center" justifyContent="space-between">
                            <Button size="small" variant="text" type="submit">register</Button>
                            <Button size="small" variant="text" type="reset" onClick={() => onClose && onClose()}>cancel</Button>
                        </Grid>
                    </Grid>
                </form>
            </RegisterPannelBox>
        </RegisterPannelPaper>
    )
});