use std::collections::HashMap;
use tokio::select;
use tokio::task;
use tokio::sync::mpsc::{Receiver, Sender, channel};
use super::server::poll;
use super::PluginError;

use super::{Tunnel, TunnelControl, TunnelWrapper, TunnelOperator, TunnelState, TunnelResult};

type TunnelWrapperMap = HashMap<u16, TunnelWrapper>;

pub async fn run(sx: Sender<TunnelResult<Vec<Tunnel>>>, mut rx: Receiver<TunnelControl>) {
    let mut tunnels = HashMap::<u16, TunnelWrapper>::new();

    loop {
        select! {
            tc = rx.recv() => {
                let tc = match tc {
                    Some(tc) => tc,
                    None => continue,
                };

                let rs = match tc.operator {
                    TunnelOperator::VIEW => Ok(make_tunels(&tunnels).await),
                    TunnelOperator::ADD => add_tunnel(tc, &mut tunnels).await,
                    TunnelOperator::DELETE => delete_tunnel(tc, &mut tunnels).await,
                    TunnelOperator::SYNC => change_tunnel(tc, &mut tunnels).await,
                    TunnelOperator::STATE => state_tunnel(tc, &mut tunnels).await,
                    TunnelOperator::EXIT => break,
                };
                sx.send(rs).await.unwrap();
            }
        }
    }
}

async fn make_tunels(tunnel_map: &TunnelWrapperMap) -> Vec<Tunnel> {
    let mut tunnels = Vec::new();
    for elem in tunnel_map.values() {
        tunnels.push(elem.tunnel.clone());
    }
    tunnels
}

async fn add_tunnel(tc: TunnelControl, tunnels: &mut TunnelWrapperMap) -> TunnelResult<Vec<Tunnel>> {
    let tunnel = tc.tunnel.unwrap();
    let wrapper = tunnels.get(&tunnel.local_port);
    if let None = wrapper  {
        let wrapper = TunnelWrapper::from_tunnel(tunnel);
        tunnels.insert(wrapper.tunnel.local_port, wrapper);
        Ok(make_tunels(tunnels).await)
    } else {
        Err(PluginError::build(-2, "DUPLICATE NODE!!!"))
    }
}

async fn delete_tunnel(tc: TunnelControl, tunnels: &mut TunnelWrapperMap) -> TunnelResult<Vec<Tunnel>> {
    let wrapper = tunnels.get(&tc.tunnel.unwrap().local_port);
    match wrapper {
        Some(wrapper) if wrapper.tunnel.status == TunnelState::STOP => {
            let local_port = wrapper.tunnel.local_port;
            tunnels.remove(&local_port).unwrap();
            Ok(make_tunels(tunnels).await)
        }
        _ => Err(PluginError::build(-2, "NODE DOES NOT EXISTS!!!")),
    }
}

async fn change_tunnel(tc: TunnelControl, tunnels: &mut TunnelWrapperMap) -> TunnelResult<Vec<Tunnel>> {
    let tunnel = tc.tunnel.unwrap();
    let wrapper = tunnels.get_mut(&tunnel.local_port);
    match wrapper {
        Some(wrapper) if wrapper.tunnel.status == TunnelState::STOP => {
            wrapper.tunnel = tunnel;
            Ok(make_tunels(tunnels).await)
        },
        _ => Err(PluginError::build(-2, "NODE DOES NOT EXISTS!!!")),
    }
}

async fn state_tunnel(tc: TunnelControl, tunnels: &mut TunnelWrapperMap) -> TunnelResult<Vec<Tunnel>> {

    let tunnel = tc.tunnel.unwrap();

    match tunnel.status {
        TunnelState::RUNNING => start_tunnel(tunnel, tunnels).await,
        TunnelState::STOP => stop_tunnel(tunnel, tunnels).await,
    }
}

pub async fn start_tunnel(tunnel: Tunnel, tunnels: &mut TunnelWrapperMap) -> TunnelResult<Vec<Tunnel>> {

    let wrapper = tunnels.get_mut(&tunnel.local_port);
    match wrapper {
        Some(wrapper) if wrapper.tunnel.status == TunnelState::STOP => {

            let mut wrapper_replic = wrapper.clone();
            wrapper_replic.tunnel = tunnel.clone();

            let (sx, rx) = channel::<TunnelState>(1024);
            task::spawn(poll(wrapper_replic, rx));

            let rs = wrapper.rx.lock().await.recv().await.unwrap();
            match rs {
                Err(e) => Err(e),
                Ok(state) => {
                    let mut wrapper = wrapper.clone();
                    wrapper.tunnel = tunnel;
                    wrapper.tunnel.status = state;
                    wrapper.sx_dest = Some(sx);
                    tunnels.insert(wrapper.tunnel.local_port, wrapper);
                    Ok(make_tunels(tunnels).await)
                },
            }
        },
        Some(_) => Err(PluginError::build(-2, "NODE STATE IS RUNNING!!!")),
        _ => Err(PluginError::build(-2, "NODE DOES NOT EXISTS!!!")),
    }
}

pub async fn stop_tunnel(tunnel: Tunnel, tunnels: &mut TunnelWrapperMap) -> TunnelResult<Vec<Tunnel>> {

    let wrapper = tunnels.get_mut(&tunnel.local_port);
    match wrapper {
        Some(wrapper) if wrapper.tunnel.status == TunnelState::RUNNING => {

            wrapper.sx_dest.as_mut().unwrap().send(TunnelState::STOP).await.unwrap();
            let rs = wrapper.rx.lock().await.recv().await.unwrap();
            match rs {
                Err(e) => Err(e),
                Ok(state) => {
                    let mut wrapper = wrapper.clone();
                    wrapper.tunnel = tunnel;
                    wrapper.tunnel.status = state;
                    tunnels.insert(wrapper.tunnel.local_port, wrapper);
                    Ok(make_tunels(tunnels).await)
                },
            }
        },
        Some(_) => Err(PluginError::build(-2, "NODE STATE IS STOP!!!")),
        _ => Err(PluginError::build(-2, "NODE DOES NOT EXISTS!!!")),
    }
}