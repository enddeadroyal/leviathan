mod api;

use cdrs_tokio::Error as CdrsError;

use super::super::error::ConvertToPluginError;
use super::super::error::Error as PluginError;
use super::{BaseInfo, Field};
use std::collections::HashMap;
use serde_json::Value;
use api::SelectCQL as ApiSelectCQL;

pub type CQLResult<T> = super::super::PluginResult<T>;
pub type SelectCQL<'a> = ApiSelectCQL<'a>;

impl ConvertToPluginError for CdrsError {
    fn convert(&self) -> PluginError {
        PluginError::build(-3, self.to_string().as_str())
    }
}

pub async fn view_keyspace<'a>(bi: &BaseInfo<'a>) -> CQLResult<Vec<String>> {
    match api::acquire_keyspace(bi).await {
        Ok(rs) => Ok(rs),
        Err(e) => Err(e.convert()),
    }
}

pub async fn view_tables<'a>(keyspace: &'a str, bi: &BaseInfo<'a>) -> CQLResult<Vec<String>> {
    match api::acquire_tables(keyspace, bi).await {
        Ok(rs) => Ok(rs),
        Err(e) => Err(e.convert()),
    }
}

pub async fn acquire_types<'a>(keyspace: &'a str, bi: &BaseInfo<'a>) -> CQLResult<Vec<String>> {
    match api::acquire_types(keyspace, bi).await {
        Ok(rs) => Ok(rs),
        Err(e) => Err(e.convert()),
    }
}

pub async fn view_columns<'a>(keyspace: &'a str, table: &'a str, bi: &BaseInfo<'a>) -> CQLResult<Vec<Field>> {
    match api::acquire_columns(keyspace, table, bi).await {
        Ok(rs) => Ok(rs),
        Err(e) => Err(e.convert()),
    }
}

pub async fn view_type_by_name<'a>(keyspace: &'a str, type_name: &'a str, bi: &BaseInfo<'a>) -> CQLResult<Vec<Field>> {
    match api::acquire_type_by_name(keyspace, type_name, bi).await {
        Ok(rs) => Ok(rs),
        Err(e) => Err(e.convert()),
    }
}

pub async fn view_data<'a>(bi: &BaseInfo<'a>, scql: &SelectCQL<'a>, page_size: i32, pagination: Option<Vec<u8>>) -> CQLResult<HashMap<String, Value>> {
    match api::search_data(bi, scql, page_size, pagination).await {
        Ok(rs) => Ok(rs),
        Err(e) => Err(e.convert()),
    }
}

pub async fn view_detail_data<'a>(bi: &BaseInfo<'a>, scql: &SelectCQL<'a>) -> CQLResult<Vec<HashMap<String, Value>>> {
    match api::search_detail_data(bi, scql).await {
        Ok(rs) => Ok(rs),
        Err(e) => Err(e.convert()),
    }
}