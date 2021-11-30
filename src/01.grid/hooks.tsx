import {useState, useEffect, useContext, createContext, Dispatch, SetStateAction} from 'react'
import {createSelector} from 'reselect'
import {GridState, GridColumn, MasterDetailGridCache } from './types'
import { textFilter } from '../00.commons/utils'

export const createGrid: () => GridState = () => ({
    columns: [],
    sortedState: [],
    hiddenState: [],
    filterState: {},
    data: [],
    selectedState: [],
    paginationState: {
        rowPerPage: 100,
        page: 0,
    },
    loading: true,
    size: "compact"
})

export const GridContext = createContext<MasterDetailGridCache>({
    state: createGrid(),
    update: (s: SetStateAction<GridState>) => {}
});

export const columnSelector = (state: GridState) => state.columns
export const dataSelector = (state: GridState) => state.data
export const sortedItemsSelector = (state: GridState) => state.sortedState
export const filterItemsSelector = (state: GridState) => state.filterState
export const hiddenItemsSelector = (state: GridState) => state.hiddenState
export const selectedItemsSelector = (state: GridState) => state.selectedState
export const paginationSelector = (state: GridState) => state.paginationState
export const gridSizeSelector = (state: GridState) => state.size
export const loadingSelector = (state: GridState) => state.loading

export const rowHeightSelector = createSelector(gridSizeSelector, (size) => {
    switch(size) {
        case "compact":
            return 36

        case "starndard":
            return 52

        case "comfortable":
            return 67

        default:
            return 0
    }
})

export const sortedDataSelector = createSelector(dataSelector, sortedItemsSelector, (data, sorted) => {

    if(!Array.isArray(sorted) || !sorted.length) return data

    let sortedData = data.map(elem => elem)
    for (let sortItem of sorted) {
        sortedData.sort((v1, v2) => {
            switch(sortItem.order) {

                case 'asc':
                    if(!v1[sortItem.field]) return -1
                    return v1[sortItem.field] - v2[sortItem.field]

                case 'desc':
                    if(!v2[sortItem.field]) return -1
                    return v2[sortItem.field] - v1[sortItem.field]

                default:
                    return 0
            }
        })
    }
    return sortedData
})

export const filterDataSelector = createSelector(sortedDataSelector, filterItemsSelector, (data, filter) => {

    if(filter.field && filter.operate && filter.value) {
        const filterData = data.filter(elem => filter.field && filter.operate && filter.value && textFilter(elem[filter.field]+"", filter.operate, filter.value))
        return filterData
    }
    return data
})

export const visibleColumnSelector = createSelector(columnSelector, hiddenItemsSelector, (columns, hidden) => {
    if(!Array.isArray(hidden) || !hidden.length) return columns
    return columns.filter(elem => !hidden.includes(elem.field))
})

export const pagingDataSelector = createSelector(filterDataSelector, paginationSelector, (data, pagination) => {
    return data.filter((_, index) => pagination.page * pagination.rowPerPage <= index && index < (pagination.page + 1) * pagination.rowPerPage)
})

export const useGrid: (
    columns: GridColumn[],
    rows: any[], loading: boolean
) => [GridState, Dispatch<SetStateAction<GridState>>] = (columns: GridColumn[], rows: any[], loading: boolean) => {

    const [gridState, update] = useState<GridState>(createGrid())

    useEffect(() => {
        update(old =>({...old, columns, data: rows, loading,}))
    }, [columns, rows, loading, update])

    return [gridState, update]
}

export const useGridApi = () => {
    return useContext(GridContext)
}