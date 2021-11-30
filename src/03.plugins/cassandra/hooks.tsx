import { createContext } from 'react'
import { CQLDataGridCache, CQLDetailGridCache } from './types'
import { createCQLGridCahe, createCQLDetailCache } from './api'

export const CQLGridContext = createContext<CQLDataGridCache>(createCQLGridCahe())

export const CQLDetailGridContext = createContext<CQLDetailGridCache>(createCQLDetailCache())