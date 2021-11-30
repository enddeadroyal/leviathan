import { getCurrent } from '@tauri-apps/api/window'
import { Request, Response } from '../../00.event/event'
import { TunnelInfo } from './types'

const REQ_TUNNEL_TIMEOUT = 10000 //ms

const REQ_VIEW_TUNNEL_INFO = "req-view-tunnel-info"
const RESP_VIEW_TUNNEL_INFO = "resp-view-tunnel-info"

const REQ_REGISTER_TUNNEL_INFO = "req-register-tunnel-info"
const RESP_REGISTER_TUNNEL_INFO = "resp-register-tunnel-info"

const REQ_SYNC_TUNNEL_INFO = "req-sync-tunnel-info"
const RESP_SYNC_TUNNEL_INFO = "resp-sync-tunnel-info"

const REQ_DELETE_TUNNEL_INFO = "req-delete-tunnel-info"
const RESP_DELETE_TUNNEL_INFO = "resp-delete-tunnel-info"

const REQ_STATE_TUNNEL_INFO = "req-state-tunnel-info"
const RESP_STAET_TUNNEL_INFO = "resp-state-tunnel-info"

const TUNNEL_TIMEOUT_ERR = {name: "ssh-tunnel-timeout", message: "SSH TUNNEL Request Time Out!!!"} as Error
const TUNNEL_UNKNOWN_ERR = {name: "ssh-tunnel-unknown", message: "SSH TUNNEL Unknown Error!!!"} as Error

export const reqViewTunnelInfo = () => {
    getCurrent().emit(REQ_VIEW_TUNNEL_INFO, JSON.stringify({} as Request<undefined>))
    return new Promise<TunnelInfo[]>((resolve, reject) => {
        const tid = setTimeout(() => reject(TUNNEL_TIMEOUT_ERR), REQ_TUNNEL_TIMEOUT)

        getCurrent().once<string>(RESP_VIEW_TUNNEL_INFO, e => {  
            clearTimeout(tid)

            const r = JSON.parse(e.payload) as Response<TunnelInfo[]>
            r.data? resolve(r.data) : reject(r.err || TUNNEL_UNKNOWN_ERR)
        })
    })
}

export const reqRegisterTunnelInfo = (tunnel: TunnelInfo) => {
    getCurrent().emit(REQ_REGISTER_TUNNEL_INFO, JSON.stringify({data: tunnel} as Request<TunnelInfo>))
    return new Promise<TunnelInfo[]>((resolve, reject) => {
        const tid = setTimeout(() => reject(TUNNEL_TIMEOUT_ERR), REQ_TUNNEL_TIMEOUT)

        getCurrent().once<string>(RESP_REGISTER_TUNNEL_INFO, e => {  
            clearTimeout(tid)

            const r = JSON.parse(e.payload) as Response<TunnelInfo[]>
            r.data? resolve(r.data) : reject(r.err || TUNNEL_UNKNOWN_ERR)
        })
    })
}

export const reqSyncTunnelInfo = (tunnel: TunnelInfo) => {
    getCurrent().emit(REQ_SYNC_TUNNEL_INFO, JSON.stringify({data: tunnel} as Request<TunnelInfo>))
    return new Promise<TunnelInfo[]>((resolve, reject) => {
        const tid = setTimeout(() => reject(TUNNEL_TIMEOUT_ERR), REQ_TUNNEL_TIMEOUT)

        getCurrent().once<string>(RESP_SYNC_TUNNEL_INFO, e => {  
            clearTimeout(tid)

            const r = JSON.parse(e.payload) as Response<TunnelInfo[]>
            r.data? resolve(r.data) : reject(r.err || TUNNEL_UNKNOWN_ERR)
        })
    })
}

export const reqDeleteTunnelInfo = (tunnel: TunnelInfo) => {
    getCurrent().emit(REQ_DELETE_TUNNEL_INFO, JSON.stringify({data: tunnel} as Request<TunnelInfo>))
    return new Promise<TunnelInfo[]>((resolve, reject) => {
        const tid = setTimeout(() => reject(TUNNEL_TIMEOUT_ERR), REQ_TUNNEL_TIMEOUT)

        getCurrent().once<string>(RESP_DELETE_TUNNEL_INFO, e => {  
            clearTimeout(tid)

            const r = JSON.parse(e.payload) as Response<TunnelInfo[]>
            r.data? resolve(r.data) : reject(r.err || TUNNEL_UNKNOWN_ERR)
        })
    })
}

export const reqStateTunnelInfo = (tunnel: TunnelInfo) => {
    getCurrent().emit(REQ_STATE_TUNNEL_INFO, JSON.stringify({data: tunnel} as Request<TunnelInfo>))
    return new Promise<TunnelInfo[]>((resolve, reject) => {
        const tid = setTimeout(() => reject(TUNNEL_TIMEOUT_ERR), REQ_TUNNEL_TIMEOUT)

        getCurrent().once<string>(RESP_STAET_TUNNEL_INFO, e => {  
            clearTimeout(tid)

            const r = JSON.parse(e.payload) as Response<TunnelInfo[]>
            r.data? resolve(r.data) : reject(r.err || TUNNEL_UNKNOWN_ERR)
        })
    })
}