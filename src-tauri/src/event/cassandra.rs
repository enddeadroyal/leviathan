use std::collections::HashMap;
use tauri::window::Window;
use serde::{Serialize, Deserialize};
use serde_json::Value;
use super::{Request, Response};
use crate::plugins::datax::{Field, UDTField, FieldParam, BaseInfo, FieldType};
use crate::plugins::datax::cassandra;
use crate::plugins::datax::cassandra::SelectCQL;
use super::{EventError,ConvertToEventError};
use super::SerdeError;
use tokio::task;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CQLParam {
  pub port: i32,
  pub host: String,
  pub username: String,
  pub password: String,
  pub keyspace: Option<String>,
  pub table: Option<String>,
  pub fields: Option<Vec<Field>>,
  pub udt: Option<UDTField>,
  pub params: Option<Vec<FieldParam>>,
  pub pagination: Option<Vec<u8>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CQLTableInfo {
    pub keyspace: String,
    pub table: String,
    pub fields: Vec<Field>,
    pub udts: Option<Vec<UDTField>>,
}

const CQL_PAGE_SIZE: i32 = 5000;
const REQ_CQL_KEYSAPCE: &'static str = "cql-keyspace";
const RESP_CQL_KEYSAPCE: &'static str = "cql-keyspace-reply";

const REQ_CQL_TABLES: &'static str = "cql-tables";
const RESP_CQL_TABLES: &'static str = "cql-tables-reply";

const REQ_CQL_TABLE_INFO: &'static str = "cql-table-info";
const RESP_CQL_TABLE_INFO: &'static str = "cql-table-info-reply";

const REQ_CQL_DATA: &'static str = "cql-data";
const RESP_CQL_DATA: &'static str = "cql-data-reply";

const REQ_CQL_DETAIL_DATA: &'static str = "cql-detail-data";
const RESP_CQL_DETAIL_DATA: &'static str = "cql-detail-data-reply";

async fn view_keyspaces(param: CQLParam) -> Result<Vec<String>, EventError> {
    let CQLParam{port, host, username, password, ..} = param;
    let bi = BaseInfo{port, host: &host, username: &username, password: &password};
    match cassandra::view_keyspace(&bi).await {
        Ok(t) => Ok(t),
        Err(e) => Err(e.convert()),
    }
}

async fn view_tables(param: CQLParam) -> Result<Vec<String>, EventError> {
    if let CQLParam{port, host, username, password, keyspace: Some(keyspace), ..} = param {
        let bi = BaseInfo{port, host: &host, username: &username, password: &password};
        match cassandra::view_tables(&keyspace, &bi).await {
            Ok(t) => Ok(t),
            Err(e) => Err(e.convert()),
        }
    } else {
        Err(EventError::unknow())
    }
}

async fn view_table_info(param: CQLParam) -> Result<CQLTableInfo, EventError> {
    if let CQLParam{port, host, username, password, keyspace: Some(keyspace), table: Some(table), ..} = param {
        let bi = BaseInfo{port, host: &host, username: &username, password: &password};
        let columns = match cassandra::view_columns(&keyspace, &table, &bi).await {
            Ok(t) => t,
            Err(e) => return Err(e.convert()),
        };

        let mut fields = Vec::new();
        let mut udts = Vec::new();

        for column in columns {
            if let FieldType::List(type_name) = &column.vtype {
                let type_fields = match cassandra::view_type_by_name(&keyspace, type_name, &bi).await {
                    Ok(t) => t,
                    Err(e) => return Err(e.convert()),
                };
                udts.push(UDTField{field: column, udt: type_fields});
            } else {
                fields.push(column);
            }
        }

        Ok(CQLTableInfo{keyspace, table, fields, udts: Some(udts)})
    } else {
        Err(EventError::unknow())
    }
}

async fn view_data(param: CQLParam) -> Result<HashMap<String, Value>, EventError> {
    if let CQLParam{port, host, username, password, keyspace: Some(keyspace), table: Some(table), fields, params, pagination, ..} = param {
        let bi = BaseInfo{port, host: &host, username: &username, password: &password};
        let scql = SelectCQL { keyspace: &keyspace, table_name: &table, fields: &fields, udt: &None, params: &params };
        match cassandra::view_data(&bi, &scql, CQL_PAGE_SIZE, pagination).await {
            Ok(t) => Ok(t),
            Err(e) => Err(e.convert()),
        }
    } else {
        Err(EventError::unknow())
    }
}

async fn view_detail_data(param: CQLParam) -> Result<Vec<HashMap<String, Value>>, EventError> {
    if let CQLParam{port, host, username, password, keyspace: Some(keyspace), table: Some(table), udt, params, ..} = param {
        let bi = BaseInfo{port, host: &host, username: &username, password: &password};
        let scql = SelectCQL { keyspace: &keyspace, table_name: &table, fields: &None, udt: &udt, params: &params };
        match cassandra::view_detail_data(&bi, &scql).await {
            Ok(t) => Ok(t),
            Err(e) => Err(e.convert()),
        }
    } else {
        Err(EventError::unknow())
    }
}

pub fn req_cql_keyspaces(w: &Window) {
    let w_replica = w.clone();

    w.listen(REQ_CQL_KEYSAPCE, move |e| {
        let w_replica = w_replica.clone();

        task::spawn(async move {
            let req: Result<Request<CQLParam>, SerdeError> = serde_json::from_str(e.payload().unwrap());
            let rs = match req {
                Ok(req) => {
                    match view_keyspaces(req.data).await {
                        Ok(t) => Response{status: String::from("success"), data: Some(t), err: None},
                        Err(e) => Response{status: String::from("failure"), data: None, err: Some(e)},
                    }
                },
                Err(e) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
            };
            w_replica.emit(RESP_CQL_KEYSAPCE, serde_json::to_string(&rs).unwrap()).unwrap();
        });
    });
}

pub fn req_cql_tables(w: &Window) {
    let w_replica = w.clone();
    w.listen(REQ_CQL_TABLES, move |e| {
        let w_replica = w_replica.clone();

        task::spawn(async move{
            let req: Result<Request<CQLParam>, SerdeError> = serde_json::from_str(e.payload().unwrap());
            let rs = match req {
                Ok(req) => {
                    match view_tables(req.data).await {
                        Ok(t) => Response{status: String::from("success"), data: Some(t), err: None},
                        Err(e) => Response{status: String::from("failure"), data: None, err: Some(e)},
                    }
                },
                Err(e) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
            };
            w_replica.emit(RESP_CQL_TABLES, serde_json::to_string(&rs).unwrap()).unwrap();
        });
    });
}

pub fn req_cql_table_info(w: &Window) {
    let w_replica = w.clone();
    w.listen(REQ_CQL_TABLE_INFO,  move |e| {
        let w_replica = w_replica.clone();

        task::spawn(async move{
            let req: Result<Request<CQLParam>, SerdeError> = serde_json::from_str(e.payload().unwrap());
            let rs = match req {
                Ok(req) => {
                    match view_table_info(req.data).await {
                        Ok(t) => Response{status: String::from("success"), data: Some(t), err: None},
                        Err(e) => Response{status: String::from("failure"), data: None, err: Some(e)},
                    }
                },
                Err(e) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
            };
            w_replica.emit(RESP_CQL_TABLE_INFO, serde_json::to_string(&rs).unwrap()).unwrap();
        });
    });
}

pub fn req_cql_data(w: &Window) {
    let w_replica = w.clone();
    w.listen(REQ_CQL_DATA,  move |e| {
        let w_replica = w_replica.clone();

        task::spawn(async move{
            let req: Result<Request<CQLParam>, SerdeError> = serde_json::from_str(e.payload().unwrap());
            let rs = match req {
                Ok(req) => {
                    match view_data(req.data).await {
                        Ok(t) => Response{status: String::from("success"), data: Some(t), err: None},
                        Err(e) => Response{status: String::from("failure"), data: None, err: Some(e)},
                    }
                },
                Err(e) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
            };
            w_replica.emit(RESP_CQL_DATA, serde_json::to_string(&rs).unwrap()).unwrap();
        });
    });
}

pub fn req_cql_detail_data(w: &Window) {
    let w_replica = w.clone();
    w.listen(REQ_CQL_DETAIL_DATA,  move |e| {
        let w_replica = w_replica.clone();

        task::spawn(async move{
            let req: Result<Request<CQLParam>, SerdeError> = serde_json::from_str(e.payload().unwrap());
            let rs = match req {
                Ok(req) => {
                    match view_detail_data(req.data).await {
                        Ok(t) => Response{status: String::from("success"), data: Some(t), err: None},
                        Err(e) => Response{status: String::from("failure"), data: None, err: Some(e)},
                    }
                },
                Err(e) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
            };
            w_replica.emit(RESP_CQL_DETAIL_DATA, serde_json::to_string(&rs).unwrap()).unwrap();
        });
    });
}