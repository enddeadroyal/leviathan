import { Dispatch, MutableRefObject, SetStateAction } from 'react'

export interface CQLField {
    name: string,
    vtype: string,
    restraint?: string,
}

export interface CQLUDTField {
    field: CQLField,
    udt: CQLField[],
}

export interface CQLTableInfo {
    keyspace?: string,
    table?: string,
    fields?: CQLField[],
    udts?: CQLUDTField[],
}

export interface CQLParam {
    field: CQLField,
    operate?: string,
    checked?: boolean,
    value?: any,
}

export interface CQLRequest {
    port: number,
    host: string,
    username: string,
    password?: string,
    ca?: string,
    keyspace?: string,
    table?: string,
    fields?: CQLField[],
    udt?: CQLUDTField,
    params?: CQLParam[],
    pagination?: any,
}

export interface CQLDataGridCache {
    port: number,
    host: string,
    username: string,
    password?: string,
    ca?: string,
    keyspace: string,
    table: string,
    fields: CQLField[],
    udts: CQLUDTField[],
    filters: CQLParam[],
    pagingState?: any,
}

export interface PagingData {
    pagination?: any,
    data: any[],
}

export interface CQLDataGridProps {
    port: number,
    host: string,
    username: string,
    password?: string,
    ca?: string,
    keyspace: string,
    table: string,
}

export interface CQLRowData {
    loading: boolean,
    rows: any[],
}

export interface CQLDetailGridCache {
    udt?: CQLUDTField,
    params: CQLParam[],
    updateData?: Dispatch<SetStateAction<CQLRowData>>,
}

export interface CQLTreeNode {
    id: string,
    node_id: string,
    name: string,
    parent?: CQLTreeNode,
    children: CQLTreeNode[],
    ref: MutableRefObject<any>,
    value: any,
}

export interface CQLBoardState {
    cql: CQLDataGridProps,
    display: boolean,
}

export interface CQLBoardCache {
    item: CQLBoardState,
    update: Dispatch<SetStateAction<CQLBoardState>>,
}