import { Select, MenuItem, SelectChangeEvent, InputBase } from '@mui/material'
import { useState, useCallback } from 'react'
import { SelectPariedProps } from './types'

export function SelectParied(props: SelectPariedProps): JSX.Element {

    const {data, options, onChange} = props
    const [edit, setEdit] = useState(false)

    const handleChange = useCallback((e: SelectChangeEvent) => {
        setEdit(false)
        onChange && onChange(options?.find(elem => elem.key === e.target.value))
    }, [onChange, options])

    const handleClick = useCallback(() => {
        setEdit(true)
    }, [setEdit])

    return (
        edit && Array.isArray(options) && options.length?
            <Select fullWidth size="small" variant="standard" value={data?.key} onChange={handleChange}>
                {
                    options.map(elem => <MenuItem onClick={() => setEdit(false)} value={elem.key}>{elem.value}</MenuItem>)
                }
            </Select> : <InputBase readOnly onClick={handleClick} placeholder="EMPTY" value={data?.value}></InputBase>
    )
}