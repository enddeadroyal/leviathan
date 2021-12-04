import { createContext, useContext, useState } from 'react'
import { createSelector } from 'reselect'
import { createTreeCache, createTree } from './api'
import { Tree, TreeCache, TreeNode } from './types'

export const rootNodeSelector: (s: Tree) => TreeNode = s => s.root
export const seletedItemSelector: (s: Tree) => string[] = s => s.selected
export const depthSelector: (s: Tree) => number = s => s.depth
export const loadingSelector:  (s: Tree) => boolean = s => s.loading

export const childrenSelector = createSelector(rootNodeSelector, (node) => node.children)
export const TreeCacheContext = createContext<TreeCache>(createTreeCache("root"))

export const useTreeCache = () => useContext(TreeCacheContext)

export const useTree = (id: string = "root", depth: number = 0) => {
    return useState(createTree(id, depth))
}