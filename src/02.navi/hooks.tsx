import { useContext, createContext, SetStateAction } from 'react'
import { NaviCache, NaviItem } from './types'

export const NaviContext = createContext<NaviCache>({state: {open: false}, update: (value: SetStateAction<NaviItem>) => {}});

export const useNaviCache: () => NaviCache = () => {
    return useContext(NaviContext)
}