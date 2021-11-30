import { Grid, TextField, Select, MenuItem, FormControlLabel, Switch } from '@mui/material'
import { styled } from '@mui/system'
import { FilterItemProps, KeyValueParied } from './types'

const FilterGrid = styled(Grid)(({theme}) => ({
    padding: theme.spacing(0, 2),
}))

export const SIMPLE_OPERATE = [{
    key: "=", value: "=",
},] as KeyValueParied[]

export const NUMERIC_OPERATE = [{
    key: "<", value: "<",
}, {
    key: ">", value: ">",
}, {
    key: "=", value: "=",
}, {
    key: "<>", value: "<>",
}, {
    key: "contains", value: "contains",
},] as KeyValueParied[]

export const TEXT_OPERATE = [{
    key: "=", value: "=",
}, {
    key: "contains", value: "contains",
}, {
    key: "start with", value: "start with",
}, {
    key: "end with", value: "end with",
},] as KeyValueParied[]

export function FilterItem(props: FilterItemProps): JSX.Element {

    const { name, checked, operate, value, onChange, options } = props

    return (
        <FilterGrid container columnSpacing={2} alignItems="center">
            <Grid item xs={2} container>
                <FormControlLabel label={name} control={<Switch size="small" checked={checked} onChange={(_,checked) => onChange && onChange({
                name, checked, operate, value, options
            } as FilterItemProps)}></Switch>}></FormControlLabel>
            </Grid>
            <Grid item xs={1}><Select fullWidth variant="standard" disabled={!checked} value={operate} onChange={e => onChange && onChange({
                name, checked, operate: e.target.value, value, options,
            } as FilterItemProps)}>
                {
                    Array.isArray(options)? options.map(elem => <MenuItem value={elem.key}>{elem.value}</MenuItem>) : null
                }
            </Select></Grid>
            <Grid item xs={2}><TextField variant="standard" size="small" fullWidth value={value} disabled={!checked} onChange={e => onChange && onChange({
                name, checked, operate, value: e.target.value, options,
            })}></TextField></Grid>
        </FilterGrid>
    )
}

export const NumericFilterItem = (props: FilterItemProps): JSX.Element => <FilterItem {...props} options={NUMERIC_OPERATE}></FilterItem>

export const TextFilterItem = (props: FilterItemProps): JSX.Element => <FilterItem {...props} options={TEXT_OPERATE}></FilterItem>