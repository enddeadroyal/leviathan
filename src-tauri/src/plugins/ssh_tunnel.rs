pub mod api;
pub mod server;

use serde::{Serialize, Deserialize};
use std::cmp::PartialEq;
use tokio::sync::mpsc::{channel, Receiver, Sender};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::result::Result;
use super::error::Error as PluginError;
use super::error::ConvertToPluginError;
use std::io::Error as IOError;

pub type SSH2Error = ssh2::Error;
pub type TunnelResult<T> = Result<T, PluginError>;
pub type TunnelStateReceiver = Arc<Mutex<Receiver<TunnelResult<TunnelState>>>>;
pub type TunnelsReceiver = Arc<Mutex<Receiver<TunnelResult<Vec<Tunnel>>>>>;

#[derive(Debug, Clone, PartialEq)]
pub enum  TunnelState {
    STOP,
    RUNNING,
}

pub enum TunnelOperator {
    VIEW,
    ADD,
    DELETE,
    SYNC,
    STATE,
    EXIT,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tunnel {
    pub local_port: u16,
    pub remote_port: u16,
    pub remote_host: String,
    pub ssh_port: u16,
    pub ssh_host: String,
    pub username: String,
    pub password: Option<String>,
    pub private_key: Option<String>,
    pub status: TunnelState,
}

impl Serialize for TunnelState {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
            S: serde::Serializer {
        match self {
            TunnelState::STOP => serializer.serialize_str("stop"),
            TunnelState::RUNNING => serializer.serialize_str("run"),
        }
    }
}

impl <'de> Deserialize<'de> for TunnelState {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
            D: serde::Deserializer<'de> {
        match String::deserialize(deserializer)?.as_str() {
            "run" => Ok(TunnelState::RUNNING),
            "stop" => Ok(TunnelState::STOP),
            _ => Ok(TunnelState::STOP),
        }
    }
}

#[derive(Clone)]
pub struct TunnelWrapper {
    pub tunnel: Tunnel,
    pub rx: TunnelStateReceiver,
    pub sx: Sender<TunnelResult<TunnelState>>,
    pub sx_dest: Option<Sender<TunnelState>>,
}

impl TunnelWrapper {
    pub fn from_tunnel(tunnel: Tunnel) -> TunnelWrapper {
        let (sx, rx) = channel::<TunnelResult<TunnelState>>(1024);

        TunnelWrapper {
            tunnel,
            sx, rx: Arc::new(Mutex::new(rx)),
            sx_dest: None,
        }
    }
}

pub struct TunnelControl {
    pub tunnel: Option<Tunnel>,
    pub operator: TunnelOperator,
}

impl ConvertToPluginError for SSH2Error {
    fn convert(&self) -> PluginError {
        PluginError::build(-2, self.message())
    }
}

impl ConvertToPluginError for IOError {
    fn convert(&self) -> PluginError {
        PluginError::build(-2, self.to_string().as_str())
    }
}