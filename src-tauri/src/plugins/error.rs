use serde_json::Error as SerdeError;

#[derive(Debug)]
pub struct Error {
    pub code: i32,
    pub message: String,
}

impl Error {
    pub fn build(code: i32, message: &str) -> Error {
        Error { code: (code), message: (String::from(message)) }
    }
}

pub trait ConvertToPluginError {
    fn convert(&self) -> Error;
}

impl ConvertToPluginError for SerdeError {
    fn convert(&self) -> Error {
        Error { code: (-1), message: (self.to_string()) }
    }
}