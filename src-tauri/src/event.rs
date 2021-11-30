pub mod cassandra;
pub mod ssh_tunnel;
use serde::{Serialize, Deserialize};
use tauri::window::Window;
use crate::plugins::ssh_tunnel::{TunnelControl, TunnelsReceiver};
use tokio::sync::mpsc::Sender;
use crate::plugins::error::Error as PluginError;

pub type SerdeError = serde_json::error::Error;

pub trait ConvertToEventError {
    fn convert(&self) -> EventError;
}

impl ConvertToEventError for PluginError {
    fn convert(&self) -> EventError {
        EventError { code: (self.code), message: (self.message.clone()) }
    }
}

impl ConvertToEventError for SerdeError {
    fn convert(&self) -> EventError {
        EventError::build(0, self.to_string().as_str())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EventError {
    code: i32,
    message: String,
}

impl EventError {
    pub fn build(code: i32, message: &str) -> EventError {
        EventError { code: (code), message: (String::from(message)) }
    }

    pub fn unknow() -> EventError {
        EventError { code: 0, message: String::from("unknow error")}
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Request<T = String> where T: Clone + Serialize {
    data: T,
}

#[derive(Debug, Serialize, Deserialize)]
struct Response<T = String> where T: Clone + Serialize {
    status: String,
    data: Option<T>,
    err: Option<EventError>,
}

pub fn bind_ssh_tunnel(w: &Window, sx: &Sender<TunnelControl>, rx: &TunnelsReceiver) {
    ssh_tunnel::req_view_tunnel(w, &sx, rx);
    ssh_tunnel::req_register_tunnel(w, &sx, rx);
    ssh_tunnel::req_sync_tunnel(w, &sx, rx);
    ssh_tunnel::req_delete_tunnel(w, &sx, rx);
    ssh_tunnel::req_state_tunnel(w, &sx, rx);
}

pub fn bind_cql_event(w: &Window) {
    cassandra::req_cql_keyspaces(w);
    cassandra::req_cql_tables(w);
    cassandra::req_cql_table_info(w);
    cassandra::req_cql_data(w);
    cassandra::req_cql_detail_data(w);
}