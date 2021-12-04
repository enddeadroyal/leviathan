import { Dispatch, SetStateAction } from 'react'
import { Error } from '../00.commons/types'

export interface TreeNode {
    id: string,
    nodeID: string,
    level: number,
    name: string,
    value?: any,
    parentID?: string, 
    children: TreeNode[],
}

export interface Tree {
    root: TreeNode,
    depth: number,
    selected: string[],
    loading: boolean,
}

export interface TreeResult<T> {
    data?: T,
    err?: Error
}

export interface TreeCache {
    tree: Tree,
    update: Dispatch<SetStateAction<Tree>>,
}