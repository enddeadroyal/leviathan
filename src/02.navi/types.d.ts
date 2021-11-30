import { ReactComponentElement, Dispatch, SetStateAction } from 'react'
export interface NaviInfo {
    name: string,
    path: string,
    element: ReactComponentElement,
    icon: ReactComponentElement,
}

export interface NaviCache {
    state: NaviItem,
    update: Dispatch<SetStateAction<NaviItem>>,
}

export interface NaviItem {
    open: boolean,
}