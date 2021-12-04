import { Modal, Button, Paper, Grid, TextField, AppBar, Typography, Box } from '@mui/material'
import { styled } from '@mui/system'
import { useSnackbar } from 'notistack'
import { useForm } from 'react-hook-form'
import { useTreeCache, rootNodeSelector } from '../../01.tree/hooks'
import { addTreeNode } from '../../01.tree/api'
import { CQLDataGridProps } from './types'

interface CQLRegisterPannelProps {
    open: boolean,
    onClose: () => void
}

const RegisterPaper = styled(Paper)(({theme}) => ({
    padding: theme.spacing(2),
}))

const RegisterBox = styled(Box)({
    width: 500,
    position: "absolute",
    transform: 'translate(-50%, -50%)',
    top: '50%',
    left: '50%',
})

export function CQLRegisterPannel(props: CQLRegisterPannelProps): JSX.Element {

    const { open, onClose } = props
    const { tree, update } = useTreeCache()
    const rootNode = rootNodeSelector(tree)

    const { register, handleSubmit } = useForm<CQLDataGridProps>()
    const { enqueueSnackbar } = useSnackbar()

    const onSubmit = handleSubmit(data => {
        onClose()
        const rs = addTreeNode("cql", rootNode, node => {
            const nodeID = `${node.nodeID}@@${data.host}:${data.port}`
            const pos = rootNode.children.findIndex(elem => elem.nodeID === `${node.nodeID}@@${data.host}:${data.port}`)
            if(pos !== -1) return
            return {
                id: `${data.host}:${data.port}`,
                name: `${data.host}:${data.port}`,
                nodeID,
                level: node.level + 1,
                children: [],
                value: data
            }
        })
        
        rs.data && update(s => ({...s, root: rs.data || s.root}))
        rs.err && enqueueSnackbar(rs.err.message, {variant: "error"})
    })

    return (
        <Modal open={open} onClose={onClose}>
            <RegisterBox>
                <AppBar position="relative">
                    <Typography align="center" variant="overline">register</Typography>
                </AppBar>
                <RegisterPaper>
                    <form onSubmit={onSubmit}>
                        <Grid container direction="column" rowSpacing={2} alignItems="center">
                            <Grid item container justifyContent="space-around" alignItems="center">
                                <Grid item xs={5}>
                                    <TextField fullWidth variant="standard" size="small" InputLabelProps={{shrink: true}} label="PORT" {...register("port", {valueAsNumber: true})}></TextField>
                                </Grid>
                                <Grid item xs={5}>
                                    <TextField fullWidth variant="standard" size="small" InputLabelProps={{shrink: true}} label="HOST" {...register("host")}></TextField>
                                </Grid>
                            </Grid>
                            <Grid item container justifyContent="space-around" alignItems="center">
                                <Grid item xs={5}>
                                    <TextField fullWidth variant="standard" size="small" InputLabelProps={{shrink: true}} label="USERNAME" {...register("username")}></TextField>
                                </Grid>
                                <Grid item xs={5}>
                                    <TextField fullWidth variant="standard" size="small" InputLabelProps={{shrink: true}} label="PASSWORD" {...register("password")}></TextField>
                                </Grid>
                            </Grid>
                            <Grid item container justifyContent="space-between" alignItems="center">
                                <Button size="small" type="submit">submit</Button>
                                <Button size="small" type="reset" onClick={() => onClose()}>cancel</Button>
                            </Grid>
                        </Grid>
                    </form>
                </RegisterPaper>
            </RegisterBox>
        </Modal>
    )
}