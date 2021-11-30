import { forwardRef, ForwardedRef, createElement, Fragment } from 'react'
import { useState, useRef, useContext, useMemo, useCallback } from 'react'
import { Table, TableHead, TableBody, TableContainer, TableRow, TableFooter, TableSortLabel, TableCell, TablePagination } from '@mui/material'
import { Typography, Collapse, IconButton, Grid, Checkbox, LinearProgress } from '@mui/material'
import { styled } from '@mui/system'
import { useSnackbar } from 'notistack'
import { KeyValueParied } from '../01.components/types'
import { SelectParied } from '../01.components/SelectParied'
import { MasterDetailGridToolbar } from './MasterDetailToolbar'
import { PlusSquareSharp, MinusSquareSharp, SeparatorSharp } from '../01.icons/icons'
import { GridColumn } from './types'
import { useGrid, useGridApi, GridContext, selectedItemsSelector, rowHeightSelector, columnSelector, loadingSelector } from './hooks'
import { visibleColumnSelector, filterDataSelector, paginationSelector, pagingDataSelector, sortedItemsSelector } from './hooks'

interface StyledTableContainerProps {
    height?: number | string,
}

const StyledTableContainer = styled(TableContainer)<StyledTableContainerProps>(props => ({
        width: '100%',
        height: props.height,
    })
)

const StyledTableRow = styled(TableRow)(props => ({
    // '&:hover': {
    //     backgroundColor: 'lightblue',
    // }
    })
)

const StyledTableColumnCell = styled(TableCell)(props => ({
    minWidth: props.width,
    maxWidth: props.width,
    minHeight: props.height,
    maxHeight: props.height,
    padding: 0,
}))

const StyledTableCell = styled(TableCell)(props => ({
    minHeight: props.height,
    maxHeight: props.height,
    padding: 0,
}))

const StyledSepartorIcon = styled(SeparatorSharp)({
    color: "lightgray",
})

const LinearProgressDiv = styled('div')({
    width: "100%",
})

export const MasterDetailGrid = (props: any) => {

    const { columns, data, onLoad, detail, loading, ..._props } = props || {}
    const [state, update] = useGrid(columns, data, loading)
    const toolBar = useRef<any>({})

    return (
        <GridContext.Provider value={{
            state, update, toolBar, onLoad, detail,
        }}>
            <MasterDetailGridPannel {..._props}></MasterDetailGridPannel>
        </GridContext.Provider>
    )
}

function MasterDetailGridPannel(props: any): JSX.Element {

    const { height } = props || {}
    const {state, update, toolBar } = useGridApi()

    const filerData = filterDataSelector(state)
    const pagination = paginationSelector(state)
    const pagingData = pagingDataSelector(state)
    const loading = loadingSelector(state)

    return (
        <div>
            <MasterDetailGridToolbar></MasterDetailGridToolbar>
            {loading? <LinearProgressDiv><LinearProgress color="primary"></LinearProgress></LinearProgressDiv> : null}
            
            <StyledTableContainer height={height}>
                <Table size="small" stickyHeader>
                    <MasterDetailHead ref={toolBar}></MasterDetailHead>
                    <TableBody>
                        {
                            pagingData?.map(elem => <MasterDetailRow key={elem.id} row={elem}></MasterDetailRow>)
                        }
                    </TableBody>
                    <TableFooter>
                    </TableFooter>
                </Table>
            </StyledTableContainer>
            <TablePagination size="small" count={filerData.length} page={pagination.page} rowsPerPage={pagination.rowPerPage} component="div" 
                onPageChange={(_, page) => update(s => ({...s, paginationState: {page, rowPerPage: s.paginationState.rowPerPage}}))}
                onRowsPerPageChange={(e) => update(s => ({...s, paginationState: {page: 0, rowPerPage: parseInt(e.target.value || "0")}}))}>
            </TablePagination>
        </div>
    )
}

function MasterDetailRow(props: any): JSX.Element {

    const { row } = props
    const {state, detail, update} =  useGridApi()
    const columns = columnSelector(state)
    const visibleColumns = visibleColumnSelector(state)
    const selectItems = selectedItemsSelector(state)
    const rowHeight = rowHeightSelector(state)
    const { enqueueSnackbar } = useSnackbar()

    const [open, setOpen] = useState(false)
    const checked = selectItems.includes(row.id)

    const handleCheck = useCallback((checked: boolean) => {
        if(checked) update(s => ({...s, selectedState: [...s.selectedState, row.id]}))
        else update(s => ({...s, selectedState: s.selectedState.filter(elem => elem !== row.id)}))
    },[update, row.id])
    
    return (
        useMemo(() => <Fragment>
            <StyledTableRow hover selected={checked}>
                <StyledTableCell padding="checkbox" height={rowHeight}>
                    <Checkbox checked={checked} onChange={(_, checked) => handleCheck(checked)}></Checkbox>
                </StyledTableCell>
                {
                    columns.find(elem => elem.type === "nested")? 
                    <StyledTableCell padding="checkbox" height={rowHeight}>
                        <IconButton onClick={() => {
                            if(open) return setOpen(false)
                            if(row.detail) return setOpen(true)
                            setOpen(false)
                            enqueueSnackbar("DETAIL COLUMN MUST BE SELECTED!!!", {variant: "warning"})
                        }}>
                            {open ? <MinusSquareSharp /> : <PlusSquareSharp />}
                        </IconButton>
                    </StyledTableCell>
                    : null
                }
                {
                    visibleColumns?.map(elem => <StyledTableCell key={elem.field} height={rowHeight}>
                        {
                            elem.render? elem.render(row, elem) :
                            <Typography>{row[elem.field]}</Typography>
                        }
                    </StyledTableCell>)
                }
                <StyledTableCell height={rowHeight}></StyledTableCell>
            </StyledTableRow>
                {
                    open && detail && row.detail ? <TableRow>
                        <TableCell colSpan={visibleColumns.length + 3}>
                            <Collapse in={open}>
                                {
                                    createElement(detail, {data: row})
                                }
                            </Collapse>
                        </TableCell>
                    </TableRow> : null
                }
        </Fragment>, [row, visibleColumns, open, checked, rowHeight, detail, handleCheck, enqueueSnackbar, columns])
    )
}

const MasterDetailHead = forwardRef((_props: any, ref: ForwardedRef<any>): JSX.Element => {

    const { state, update } = useContext(GridContext)
    const columns = columnSelector(state)
    const visibleColumns = visibleColumnSelector(state)
    const filterData = filterDataSelector(state)
    const sortedItems = sortedItemsSelector(state)
    const selectItems = selectedItemsSelector(state)
    const rowHeight = rowHeightSelector(state)
    

    const checked = filterData.length !== 0 && filterData.length === selectItems.length
    const indeterminate = selectItems.length !== 0 && selectItems.length < filterData.length

    const handleCheck = (checked: boolean) => {
        if(checked) update(s => ({...s, selectedState: filterData.map(elem => elem.id)}))
        else update(s => ({...s, selectedState: []}))
    }

    const handldSortClick = useCallback((column: GridColumn) => () => {
        const current = sortedItems.find(elem => elem.field === column.field)
        if(current?.order === "asc")  update(s => ({...s, sortedState: [{field: column.field, order: "desc"}]}))
        else if (current?.order === "desc") update(s => ({...s, sortedState: []}))
        else update(s => ({...s, sortedState: [{field: column.field, order: "asc"}]}))
    }, [sortedItems, update])

    return (
        <TableHead>
            <TableRow selected={checked}>
                <StyledTableColumnCell padding="checkbox" width={25} height={rowHeight} ref={ref}>       
                    <Checkbox checked={checked} indeterminate={indeterminate} onChange={(_,checked) => handleCheck(checked)}></Checkbox>
                </StyledTableColumnCell>
                {
                    columns.find(elem => elem.type === "nested")? <StyledTableColumnCell padding="checkbox" width={25} height={rowHeight}>
                    </StyledTableColumnCell> : null
                }
                {
                    visibleColumns.map(elem => <StyledTableColumnCell key={elem.field} width={elem.width || 150} height={rowHeight}>
                        <Grid container>
                            <Grid item xs>
                                { 
                                    elem.type === "nested"?
                                        elem.headerName || elem.field
                                        :
                                        <TableSortLabel active={!!sortedItems.find(sortItem => sortItem.field === elem.field)} direction={
                                            sortedItems.find(sortItem => sortItem.field === elem.field)?.order
                                        } onClick={handldSortClick(elem)}>{elem.headerName || elem.field}</TableSortLabel>
                                }
                            </Grid>
                            <StyledSepartorIcon/>
                        </Grid>
                    </StyledTableColumnCell>)
                }
                {
                    visibleColumns &&  visibleColumns.length ? <StyledTableColumnCell height={rowHeight}></StyledTableColumnCell> : null
                }
            </TableRow>
        </TableHead>
    )
})

export function MasterDetailSelect(props: any) {

    const {row, options, onChange} = props

    const handleChange = useCallback((data: KeyValueParied) => {
        onChange && onChange(data, row)
    }, [row, onChange])

    return (
        <SelectParied data={row.detail} options={options} onChange={handleChange}></SelectParied>
    )
}