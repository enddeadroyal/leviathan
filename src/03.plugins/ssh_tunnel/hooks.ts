import { useContext, createContext } from 'react'
import { TunnelCache } from './types'

export const TunnelContext = createContext<TunnelCache>({tunnels: []})

export const useTunnelCache = () => useContext(TunnelContext)