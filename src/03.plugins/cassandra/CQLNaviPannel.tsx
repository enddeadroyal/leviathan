import { Fragment, useCallback, useState } from 'react'
import { useSnackbar } from 'notistack'
import { NaviTreeProvider, NaviTreePannel } from '../../01.tree/NaviTree'
import { useTreeCache, rootNodeSelector } from '../../01.tree/hooks'
import { updateOrAddTreeNode, searchNode } from '../../01.tree/api'
import { CQLRegisterPannel } from './CQLRegisterPannel'
import { useCQLBoardCache } from './hooks'
import { reqKeyspaces, reqTables } from './event'

export function CQLNaviPannel(): JSX.Element {
    return (
        <NaviTreeProvider id="cql" depth="3">
            <CQLNaviPannelInner></CQLNaviPannelInner>
        </NaviTreeProvider>
    )
}

function CQLNaviPannelInner(): JSX.Element {

    const { tree, update } = useTreeCache()
    const [ open, setOpen ] = useState(false)

    const { update: cqlUpdate } = useCQLBoardCache()
    const { enqueueSnackbar } = useSnackbar()

    const rootNode = rootNodeSelector(tree)

    const handleAdd = () => {
        setOpen(true)
    }

    const handleNodeLoad = useCallback((nodeIDs: string[]) => {
        if(!nodeIDs.length) return

        const node = searchNode(nodeIDs[0], rootNode)
        console.info("node: ", node)

        if(node.data?.level === 1) {
            update(s => ({...s, loading: true}))
            node.data && reqKeyspaces(node.data.value).then(data => {
                let $rootNode = rootNode
                const keyspaces = data.sort()
                for(const keyspace of keyspaces) {
                    const nodeID = `${node.data?.nodeID}@@${keyspace}`
                    const rs = updateOrAddTreeNode(nodeID, rootNode, (node, mode) => {
    
                        if(mode === "update") {
                            return {...node,
                                id: keyspace,
                                name: keyspace,
                                nodeID,
                                children: [],
                                value: {...node.value, keyspace},
                            }
                        }
    
                        return {
                            id: keyspace,
                            name: keyspace,
                            nodeID,
                            level: node.level + 1,
                            children: [],
                            value: {...node.value, keyspace}
                        }
                    })
                    rs.data && ($rootNode = rs.data)
                }
                update(s => ({...s, root: $rootNode, loading: false}))
            }).catch(err => {
                update(s => ({...s, loading: false}))
                enqueueSnackbar(err.message, {variant: "error"})
            })
        }

        if(node.data?.level === 2) {
            update(s => ({...s, loading: true}))
            node.data && reqTables(node.data.value).then(data => {
                let $rootNode = rootNode
                const tables = data.sort()
                for(const table of tables) {
                    const nodeID = `${node.data?.nodeID}@@${table}`
                    const rs = updateOrAddTreeNode(nodeID, rootNode, (node, mode) => {
    
                        if(mode === "update") {
                            return {...node,
                                id: table,
                                name: table,
                                nodeID,
                                children: [],
                                value: {...node.value, table},
                            }
                        }
    
                        return {
                            id: table,
                            name: table,
                            nodeID,
                            level: node.level + 1,
                            children: [],
                            value: {...node.value, table}
                        }
                    })
                    rs.data && ($rootNode = rs.data)
                }
                update(s => ({...s, root: $rootNode, loading: false}))
            }).catch(err => {
                update(s => ({...s, loading: false}))
                enqueueSnackbar(err.message, {variant: "error"})
            })
        }

        if(node.data?.level === 3) {
            console.info("node: ", node.data.value)
            cqlUpdate({cql: node.data.value, display: true})
        }
    }, [rootNode])

    return (
        <Fragment>
            <NaviTreePannel onAdd={handleAdd} onNodeLoad={handleNodeLoad}></NaviTreePannel>
            <CQLRegisterPannel open={open} onClose={() => setOpen(false)}></CQLRegisterPannel>
        </Fragment>
    )
}