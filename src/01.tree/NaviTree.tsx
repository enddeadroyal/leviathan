import { styled } from '@mui/system'
import { Paper, Grid, AppBar, IconButton, InputAdornment, TextField, LinearProgress } from '@mui/material'
import { TreeView } from '@mui/lab'
import { SearchSharp, AddSharp, DeleteSharp, RefreshSharp } from '@mui/icons-material'
import { EllipsisTreeItem } from '../01.components/EllipsisItem'
import { TreeCacheContext, useTree, useTreeCache, rootNodeSelector, seletedItemSelector, loadingSelector } from './hooks'
import { useMemo } from 'react'
import { PlusSquareSharp, MinusSquareSharp, CloseSquareSharp } from '../01.icons/icons'
import { TreeNode } from './types'


interface NaviTreePaperrops {
    width: number|string,
}

interface NaviTreePannelProps {
    onAdd: () => void,
    onNodeLoad: (nodeIDs: string[]) => void,
}

interface NaviTreeContentDivProps {
    height: number|string,
}
const NaviTreePaper = styled(Paper)<NaviTreePaperrops>(({theme, width}) =>({
    padding: theme.spacing(1),
    // width,
}))

const StyledTreeView = styled(TreeView)<NaviTreeContentDivProps>(({height}) => ({
    overflowY: "auto",
    textAlign: "left",
    height,
}))

const NaviAppBar = styled(AppBar)({
    width: "100%",
})

export const NaviTreeProvider: (props: any) => JSX.Element = (props) => {
    
    const {id, depth, children, ..._props} = props

    const [ state, update ] = useTree(id, depth)
    console.info(state)
    return (
        <TreeCacheContext.Provider value={{tree: state, update,}}>
            {children}
        </TreeCacheContext.Provider>
    )
}

export function NaviTreePannel(props: NaviTreePannelProps): JSX.Element {

    const { tree, update } = useTreeCache()

    const { onAdd, onNodeLoad } = props
    const rootNode = rootNodeSelector(tree)
    const selectedItems = seletedItemSelector(tree)
    const loading = loadingSelector(tree)

    const createTreeNode = (node: TreeNode) => node.children.map(elem => (
        <EllipsisTreeItem key={elem.nodeID} nodeId={elem.nodeID} label={elem.id} value={elem.id}>
            {
                createTreeNode(elem)
            }
        </EllipsisTreeItem>
    ))

    return (
        <NaviTreePaper width={0}>
            <Grid wrap="nowrap" container direction="column">
                <Grid item>
                    <NaviAppBar position="relative">
                        <Grid wrap="nowrap" container alignItems="center" textAlign="left" justifyContent="space-between">
                            <Grid item xs={1}><IconButton disabled={loading} size="small" color="inherit" onClick={() => onAdd()}><AddSharp /></IconButton></Grid>
                            <Grid item xs={1}><IconButton disabled={loading} size="small" color="inherit"><DeleteSharp /></IconButton></Grid>
                            <Grid item xs={1}><IconButton disabled={loading} size="small" color="inherit" onClick={() => onNodeLoad(selectedItems)}><RefreshSharp /></IconButton></Grid>
                            <Grid item xs={6}>
                                <TextField disabled={loading} variant="standard" size="small" color="info" fullWidth InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <IconButton disabled={loading} size="small" sx={{color: "white"}}><SearchSharp /></IconButton>
                                        </InputAdornment>
                                    )
                                }}></TextField>
                            </Grid>
                        </Grid>
                    </NaviAppBar>
                </Grid>
                    {
                        loading? <Grid item><LinearProgress></LinearProgress></Grid> : null
                    }
                <Grid item>
                    <StyledTreeView
                        defaultCollapseIcon={<MinusSquareSharp />}
                        defaultExpandIcon={<PlusSquareSharp /> }
                        defaultEndIcon ={<CloseSquareSharp />}
                        height={950} selected={selectedItems.length? selectedItems[0]: ""} onNodeSelect={(_: any, nodeID: string) => update(s => ({...s, selected: [nodeID]}))}>
                        {
                            useMemo(() => createTreeNode(rootNode), [rootNode])
                        }
                    </StyledTreeView>
                </Grid>
            </Grid>
        </NaviTreePaper>
    )
}