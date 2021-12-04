import { ReactNode, ReactComponentElement, MutableRefObject, Dispatch, SetStateAction } from 'react'
import { KeyValueParied } from '../01.components/SelectParied'

export interface GridColumn {
    field: string,
    type: string,
    headerName?: string,
    width?: number | string,
    render?: (v: any, column: GridColumn) => string | number | JSX.Element | ReactNode,
    options?: KeyValueParied[],
}

export interface FilterState {
    field?: string,
    operate?: string,
    value?: string,
}

export interface SortedState {
    field: string,
    type: string,
    order: 'asc' | 'desc',
}

export interface PaginationState {
    rowPerPage: number,
    page: number,
}

export interface GridState {
    columns: GridColumn[],
    sortedState: SortedState[],
    filterState: FilterState,
    hiddenState: string[],
    selectedState: number[],
    paginationState: PaginationState,
    loading: boolean,
    data: any[],
    size: "compact" | "starndard" | "comfortable"
}

export interface MasterDetailGridCache {
    state: GridState,
    update: Dispatch<SetStateAction<GridState>>,
    onLoad?: (mode: string) => void,
    detail?: ReactComponentElement,
    toolBar?: MutableRefObject<any>
}