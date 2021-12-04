use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::select;
use tokio::net::TcpStream;
use crate::plugins::error::ConvertToPluginError;

use super::{TunnelWrapper, TunnelState, Tunnel};
use tokio::net::TcpListener;
use std::net::{SocketAddrV4, Ipv4Addr};
use tokio::sync::mpsc::{Receiver, Sender, channel};
use ssh2::{Session, Channel as SSHChannel};
use std::path::Path;
use std::io::{Write, Read};
use ssh2::Stream as SSHStream;

#[derive(Debug)]
struct Payload {
    size: usize,
    content: Vec<u8>,
}

pub async fn poll(wrapper: TunnelWrapper, mut rx: Receiver<TunnelState>) {

    let listener = match TcpListener::bind(SocketAddrV4::new(Ipv4Addr::new(0,0,0,0), wrapper.tunnel.local_port)).await {
        Ok(listener) => listener,
        Err(e) => {
            wrapper.sx.send(Err(e.convert())).await.unwrap();
            return;
        },
    };
    wrapper.sx.send(Ok(TunnelState::RUNNING)).await.unwrap();
    log::info!("START CLIENT: {:?}", wrapper.tunnel);

    loop {
        select! {
            client = listener.accept() => {
                let (stream, _) = match client {
                    Err(_) => break,
                    Ok(client) => client,
                };
                let tunnel = wrapper.tunnel.clone();
                tokio::spawn(start_ssh(stream, tunnel));
            },
            message = rx.recv() => {
                match message {
                    None => {
                        // tokio::task::yield_now().await;
                        continue;
                    },
                    Some(state) => {
                        wrapper.sx.send(Ok(state)).await.unwrap();
                        return;
                    },
                }
            },
        }
    }
    wrapper.sx.send(Ok(TunnelState::STOP)).await.unwrap();
    log::info!("STOP CLIENT: {:?}", wrapper.tunnel);
}

async fn start_ssh(stream: TcpStream, t: Tunnel) {
    let mut s= Session::new().unwrap();
    let addr = format!("{}:{}", t.ssh_host, t.ssh_port);
    let ssh_stream = TcpStream::connect(addr.as_str()).await.unwrap();
    s.set_tcp_stream(ssh_stream.into_std().unwrap());
    s.handshake().unwrap();

    let t_replica = t.clone();
    match t_replica {
        Tunnel{password: Some(password), private_key: None, username, ..} => {
            s.userauth_password(&username, &password).unwrap();
        },
        Tunnel{password: Some(password), private_key: Some(privatekey), username, ..} if privatekey == "" && password != "" => {
            s.userauth_password(&username, &password).unwrap();
        },
        Tunnel{password: None, private_key: Some(privatekey), username, ..} => {
            s.userauth_pubkey_file(username.as_str(), None, Path::new(privatekey.as_str()), None).unwrap();
        },
        Tunnel{password: Some(password), private_key: Some(privatekey), username, ..} if password == "" && privatekey != "" => {
            s.userauth_pubkey_file(username.as_str(), None, Path::new(privatekey.as_str()), None).unwrap();
        },
        Tunnel{password: Some(password), private_key: Some(privatekey), username, ..} => {
            s.userauth_pubkey_file(username.as_str(), None, Path::new(privatekey.as_str()), Some(password.as_str())).unwrap();
        },
        _ => (),
    }
    let c = s.channel_direct_tcpip(t.remote_host.as_str(), t.remote_port, None).unwrap();

    let ssh_stream = c.stream(0);
    let (sx, rx) = channel::<Payload>(1024);
    s.set_blocking(false);
    let t_replica = t.clone();
    tokio::spawn(poll_client(t, stream, s, c, rx));
    tokio::spawn(poll_ssh(t_replica, ssh_stream, sx));
}

async fn poll_client(tunnel: Tunnel, mut stream: TcpStream, session: Session, c: SSHChannel, mut rx: Receiver<Payload>) {

    loop {

        let mut request = vec![0; 16 * 1024];
        let mut ssh_stream = c.stream(0);

        select! {
            size = stream.read(&mut request) => {
                let size = match size {
                    Ok(size) if size == 0 => break,
                    Ok(size) => size,
                    Err(_) => break,
                };

                ssh_stream.write_all(&request[..size]).unwrap();
            },
            payload = rx.recv() => {
                let payload = match payload {
                    None => break,
                    Some(payload) => payload,
                };

                stream.write_all(&payload.content[..payload.size]).await.unwrap();
            },
        }
    }
    
    session.disconnect(None, "close", None).unwrap();
    stream.shutdown().await.unwrap();
    log::info!("CLIENT CLOSE: {:?}!!!", tunnel);
}

async fn poll_ssh(tunnel: Tunnel, mut stream: SSHStream, sx: Sender<Payload>) {

    loop {

        let mut response = vec![0; 16 * 1024];
        let size = match stream.read(&mut response) {
            Ok(size) if size == 0 => {
                log::warn!("STREAM CLOSE!!!");
                break
            },
            Ok(size) => size,
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                tokio::task::yield_now().await;
                continue;
            },
            Err(e) => {
                log::error!("SSH INTERRUPED: {:?}!!!", e);
                break
            },
        };
        sx.send(Payload{size, content: response}).await.unwrap();
    }
    sx.closed().await;
    log::info!("SSH CLOSE: {:?}!!!", tunnel);
}