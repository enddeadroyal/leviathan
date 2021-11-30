pub mod error;
pub mod ssh_tunnel;
pub mod datax;

pub type PluginResult<T> = std::result::Result<T, error::Error>;