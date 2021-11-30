import { Dispatch, SetStateAction } from 'react'

export interface TunnelInfo {
    id?: number,
    local_port?: number,
    remote_port?: number,
    remote_host?: string,
    ssh_port?: number,
    ssh_host?: string,
    username?: string,
    password?: string,
    private_key?: string,
    status?: "add" | "delete" | "update" | "run" | "stop",
}

export interface TunnelCache {
    tunnels: TunnelInfo[],
    update?: Dispatch<SetStateAction<TunnelInfo[]>>,
}