import { memo } from 'react'
import { CloudCircleSharp } from '@mui/icons-material'
import { CQLBoard } from '../03.plugins/cassandra/CQLBoard'
import { SSHTunnelBoard } from '../03.plugins/ssh_tunnel/TunnelBoard'
import { NaviInfo } from './types'


const MemoSSHTunnelBoard = memo(SSHTunnelBoard);
const MemoCQLBoard = memo(CQLBoard);
export const NAVI_DATA = [{
    name: "ssh tunnel", path: "/ssh_tunnel", element: <MemoSSHTunnelBoard />, icon: <CloudCircleSharp/>,
 },{
   name: "cassandra", path: "/cassandra", element: <MemoCQLBoard />, icon: <CloudCircleSharp/>,
},] as NaviInfo[];