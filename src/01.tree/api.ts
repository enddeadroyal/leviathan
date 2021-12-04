import { Error } from '../00.commons/types'
import { TreeNode, TreeResult, Tree, TreeCache } from './types'

const TREE_CONCAT_SYMBOL = "@@"
const TREE_EXIST_ERROR: Error = { code: -1, message: "Tree Node has been Exist!!!"} as Error
const TREE_NOT_EXIST_ERROR: Error = { code: -1, message: "Tree Node not Exist!!!"} as Error

export type NodeCb = (node: TreeNode, mode?: string) => TreeNode | undefined;

export function searchNode(searchID: string, root: TreeNode): TreeResult<TreeNode> {
    if(root.nodeID === searchID) {
        return {data: root}
    }

    const pos = root.children.findIndex(elem => searchID.startsWith(`${elem.nodeID}${TREE_CONCAT_SYMBOL}`) || elem.nodeID === searchID)
    if(pos === -1) return {err: TREE_NOT_EXIST_ERROR}

    return searchNode(searchID, root.children[pos])
}

export function addTreeNode(parentID: string, root: TreeNode, cb: NodeCb): TreeResult<TreeNode> {

    if(parentID == root.nodeID) {
        const node = cb(root)
        if(!node) return {err: TREE_EXIST_ERROR}
        root.children.push(node)
        return {data: {...root}}
    }

    const pos = root.children.findIndex(elem => parentID.startsWith(`${elem.nodeID}${TREE_CONCAT_SYMBOL}`) || elem.nodeID === parentID)
    const rs = addTreeNode(parentID, root.children[pos], cb)
    if (rs.err) return rs
    return {data: {...root}}
}

export function updateTreeNode(searchID: string, root: TreeNode, cb: NodeCb): TreeResult<TreeNode> {

    if(root.nodeID === searchID) {
        return {data: cb(root)}
    }

    const pos = root.children.findIndex(elem => searchID.startsWith(`${elem.nodeID}${TREE_CONCAT_SYMBOL}`) || elem.nodeID === searchID)
    if(pos === -1) return {err: TREE_NOT_EXIST_ERROR}

    const rs = updateTreeNode(searchID, root.children[pos], cb)
    if (rs.err || !rs.data) return rs
    root.children.splice(pos, 1, rs.data)
    return {data: {...root}}
}

export function updateOrAddTreeNode(searchID: string, root: TreeNode, cb: NodeCb): TreeResult<TreeNode> {

    if(root.nodeID === searchID) {
        return {data: cb(root, "update")}
    }

    const pos = root.children.findIndex(elem => searchID.startsWith(`${elem.nodeID}${TREE_CONCAT_SYMBOL}`) || elem.nodeID === searchID)//172@111@111 172@111@111112 172@111@1_1 172@111@1
    if(pos === -1) {
        const node = cb(root, "add")
        node && root.children.push(node)
        return {data: {...root}}
    }

    const rs = updateOrAddTreeNode(searchID, root.children[pos], cb)
    if (rs.err || !rs.data) return rs
    root.children.splice(pos, 1, rs.data)
    return {data: {...root}}
}

export function deleteTreeNode(searchID: string, root: TreeNode): TreeResult<TreeNode> {

    if(root.nodeID === searchID) {
        return {}
    }

    const pos = root.children.findIndex(elem => searchID.startsWith(`${elem.nodeID}${TREE_CONCAT_SYMBOL}`) || elem.nodeID === searchID)
    if(pos === -1) return {err: TREE_NOT_EXIST_ERROR}

    const rs = deleteTreeNode(searchID, root.children[pos])
    if (rs.err || !rs.data) return rs
    root.children.splice(pos, 1)
    return {data: {...root}}
}

export const createTree: (id: string, depth: number) => Tree = (id = "root", depth = 0) => ({
    root: {
        name: id,
        id,
        nodeID: id,
        children: [],
        level: 0,
    },
    depth,
    selected: [],
    loading: false,
})

export const createTreeCache: (id: string) => TreeCache = (id) => ({
    tree: createTree(id, 0),
    update: s => {}
})