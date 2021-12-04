import { createContext, useContext } from 'react'
import { CQLDataGridCache, CQLDetailGridCache, CQLBoardCache, CQLBoardState } from './types'
import { createCQLGridCahe, createCQLDetailCache, createCQLBoardCache } from './api'

export const CQLGridContext = createContext<CQLDataGridCache>(createCQLGridCahe())

export const CQLDetailGridContext = createContext<CQLDetailGridCache>(createCQLDetailCache())

export const CQLBoardContext = createContext<CQLBoardCache>(createCQLBoardCache())

export const useCQLBoardCache = () => useContext(CQLBoardContext)
export const cqlStateSelector = (s: CQLBoardState) => s.cql
export const cqlDisplaySelector = (s: CQLBoardState) => s.display