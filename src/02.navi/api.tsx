import { CloudCircleSharp } from '@mui/icons-material'
import { CQLBoard, CQLBoardProvider } from '../03.plugins/cassandra/CQLBoard'
import { SSHTunnelBoard } from '../03.plugins/ssh_tunnel/TunnelBoard'
import { NaviInfo } from './types'

export const NAVI_DATA = [{
    name: "ssh tunnel", path: "/ssh_tunnel", element: <SSHTunnelBoard />, icon: <CloudCircleSharp/>,
 },{
   name: "cassandra", path: "/cassandra", element: <CQLBoardProvider><CQLBoard /></CQLBoardProvider> , icon: <CloudCircleSharp/>,
},] as NaviInfo[];