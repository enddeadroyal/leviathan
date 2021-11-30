import { CQLDataGridProps, CQLField, CQLDataGridCache, CQLDetailGridCache } from './types'

export const createCQLDataGridPrpos = () => ({
    port: 0,
    host: "",
    username: "",
    keyspace: "",
    table: "",
} as CQLDataGridProps)

export const createCQLGridCahe = () => ({
    port: 0,
    host: "",
    username: "",
    keyspace: "",
    table: "",
    fields: [],
    udts: [],
    filters: [],
} as CQLDataGridCache)

export const createCQLDetailCache = () => ({
    params: [],
} as CQLDetailGridCache)

export const calColumnWidth = (field: CQLField) =>  {
    switch(field.vtype) {
        case "datetime": return 300
        case "time-uuid": return 350
        case "string": return 400
        case "tinyint" || "smallint" || "int" || "bigint": return 100
        default: return 200
    }
}

export const convertValue = (value: string, type: string): number | string => {

    switch(type) {
        case 'tinyint':
        case 'smallint':
        case 'int':
        case 'bigint':
            return parseInt(value)
        case 'float':
        case 'double':
        case 'decimal':
            return parseFloat(value)
        default:
            return value
    }
}