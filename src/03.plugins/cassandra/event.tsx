import { getCurrent } from '@tauri-apps/api/window'
import { Request, Response } from '../../00.event/event'
import { CQLRequest, CQLTableInfo, PagingData } from './types'

const REQ_CQL_TIMEOUT = 60000 //ms

const REQ_CQL_KEYSAPCE = "cql-keyspace"
const RESP_CQL_KEYSAPCE = "cql-keyspace-reply"

const REQ_CQL_TABLES = "cql-tables"
const RESP_CQL_TABLES = "cql-tables-reply"

const REQ_CQL_TABLE_INFO = "cql-table-info"
const RESP_CQL_TABLE_INFO = "cql-table-info-reply"

const REQ_CQL_DATA_INFO = "cql-data"
const RESP_CQL_DATA_INFO = "cql-data-reply"

const REQ_CQL_DETAIL_DATA_INFO = "cql-detail-data"
const RESP_CQL_DETAIL_DATA_INFO = "cql-detail-data-reply"

const CQL_TIMEOUT_ERR = {name: "cql-timeout", message: "CASSANDRA Request Time Out!!!"} as Error
const CQL_UNKNOWN_ERR = {name: "cql-unknown", message: "CASSANDRA Unknown Error!!!"} as Error

export const reqKeyspaces = (req: CQLRequest) => {

    getCurrent().emit(REQ_CQL_KEYSAPCE, JSON.stringify({data: req} as Request<CQLRequest>))
    return new Promise<string[]>((resolve, reject) => {
        const tid = setTimeout(() => reject(CQL_TIMEOUT_ERR), REQ_CQL_TIMEOUT)

        getCurrent().once<string>(RESP_CQL_KEYSAPCE, e => {  
            clearTimeout(tid)

            const r = JSON.parse(e.payload) as Response<string[]>
            r.data? resolve(r.data) : reject(r.err || CQL_UNKNOWN_ERR)
        })
    })
}

export const reqTables = (req: CQLRequest) => {

    getCurrent().emit(REQ_CQL_TABLES, JSON.stringify({data: req} as Request<CQLRequest>))
    return new Promise<string[]>((resolve, reject) => {
        const tid = setTimeout(() => reject(CQL_TIMEOUT_ERR), REQ_CQL_TIMEOUT)

        getCurrent().once<string>(RESP_CQL_TABLES, e => {
            clearTimeout(tid)

            const r = JSON.parse(e.payload) as Response<string[]>
            r.data? resolve(r.data) : reject(r.err || CQL_UNKNOWN_ERR)
        })
    })
}

export const reqTableInfo = (req: CQLRequest) => {

    getCurrent().emit(REQ_CQL_TABLE_INFO, JSON.stringify({data: req} as Request<CQLRequest>))
    return new Promise<CQLTableInfo>((resolve, reject) => {
        const tid = setTimeout(() => reject(CQL_TIMEOUT_ERR), REQ_CQL_TIMEOUT)

        getCurrent().once<string>(RESP_CQL_TABLE_INFO, e => {
            clearTimeout(tid)

            const r = JSON.parse(e.payload) as Response<CQLTableInfo>
            r.data? resolve(r.data) : reject(r.err || CQL_UNKNOWN_ERR)
        })
    })
}

export const reqData = (req: CQLRequest) => {

    getCurrent().emit(REQ_CQL_DATA_INFO, JSON.stringify({data: req} as Request<CQLRequest>))
    return new Promise<PagingData>((resolve, reject) => {
        const tid = setTimeout(() => reject(CQL_TIMEOUT_ERR), REQ_CQL_TIMEOUT)

        getCurrent().once<string>(RESP_CQL_DATA_INFO, e => {
            clearTimeout(tid)

            const r = JSON.parse(e.payload) as Response<PagingData>
            r.data? resolve(r.data) : reject(r.err || CQL_UNKNOWN_ERR)
        })
    })
}

export const reqDetailData = (req: CQLRequest) => {

    getCurrent().emit(REQ_CQL_DETAIL_DATA_INFO, JSON.stringify({data: req} as Request<CQLRequest>))
    return new Promise<any[]>((resolve, reject) => {
        const tid = setTimeout(() => reject(CQL_TIMEOUT_ERR), REQ_CQL_TIMEOUT)

        getCurrent().once<string>(RESP_CQL_DETAIL_DATA_INFO, e => {
            clearTimeout(tid)

            const r = JSON.parse(e.payload) as Response<any[]>
            r.data? resolve(r.data) : reject(r.err || CQL_UNKNOWN_ERR)
        })
    })
}