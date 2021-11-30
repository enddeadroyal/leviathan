use std::collections::HashMap;
use std::sync::Arc;
use cdrs_tokio::authenticators::StaticPasswordAuthenticatorProvider;
use cdrs_tokio::cluster::{ClusterTcpConfig, NodeTcpConfigBuilder, session::new as new_session};
use cdrs_tokio::load_balancing::RoundRobin;
use cdrs_tokio::query::QueryExecutor;
use cdrs_tokio::retry::DefaultRetryPolicy;
use cdrs_tokio::load_balancing::LoadBalancingStrategy;
use cdrs_tokio::cluster::TcpConnectionPool;
use cdrs_tokio::types::from_cdrs::FromCdrsByName;
use cdrs_tokio::types::prelude::*;
use cdrs_tokio::types::CBytes;
use cdrs_tokio::frame::AsBytes;
use chrono::Local;
use serde_json::Value;
use super::super::{Field, FieldType, FieldRestraint, IntoField, BaseInfo, FieldParam, UDTField};
use std::time::Duration;

#[derive(Debug, Clone,IntoCdrsValue,TryFromRow)]
struct CDRSColumn {
    column_name: String,
    kind: String,
    ctype: String,
}

#[derive(Debug, Clone,IntoCdrsValue,TryFromRow)]
struct CDRSType {
    field_names: Vec<String>,
    field_types: Vec<String>,
}

trait CreateCQL {
    fn create(&self) -> String;
    fn create_detail(&self) -> String {
        String::new()
    }
}

pub struct SelectCQL<'a> {
    pub keyspace: &'a str,
    pub table_name: &'a str,
    pub fields: &'a Option<Vec<Field>>,
    pub udt: &'a Option<UDTField>,
    pub params: &'a Option<Vec<FieldParam>>,
}

impl <'a> CreateCQL for SelectCQL<'a> {

    fn create(&self) -> String {
        let mut cql = String::from("SELECT ");
        let mut fields = Vec::new();

        for field in self.fields.as_ref().unwrap() {
            fields.push(field.name.as_str());
        }
        cql.push_str(fields.join(",").as_str());
        cql.push_str(format!(" FROM {}.{}", self.keyspace, self.table_name).as_str());

        if let Some(e) = self.params {
            if !e.is_empty() {
                let mut params = Vec::new();
                for i in e.iter() {
                    params.push(i.format());
                }
                cql.push_str(" WHERE ");
                cql.push_str(params.join(" AND ").as_str());
            } 
        }
        cql
    }

    fn create_detail(&self) -> String {
        let mut cql = String::from("SELECT ");
        let mut fields = Vec::new();

        fields.push(self.udt.as_ref().unwrap().field.name.as_str());
        cql.push_str(fields.join(",").as_str());
        cql.push_str(format!(" FROM {}.{}", self.keyspace, self.table_name).as_str());

        if let Some(e) = self.params {
            let mut params = Vec::new();
            if !e.is_empty() {
                for i in e.iter() {
                    params.push(i.format());
                }
                cql.push_str(" WHERE ");
                cql.push_str(params.join(" AND ").as_str());
            }
        }
        cql
    }
}

impl IntoField for CDRSColumn {
    fn into_field(&self) -> Option<Field> {

        let ctype =  self.ctype.replace("frozen", "").replace("list", "").replace("set", "").replace("<", "").replace(">", "");

        println!("ctype: {:#?}", ctype.as_str());

        Some(Field {
            name: self.column_name.clone(),
            vtype: match ctype.as_str() {
                "tinyint" => FieldType::TinyInt,
                "smallint" => FieldType::SmallInt,
                "int" => FieldType::Int,
                "bigint" => FieldType::BigInt,
                "decimal" => FieldType::Decimal,
                "text" => FieldType::String,
                "timestamp" => FieldType::Datetime,
                "uuid" => FieldType::UUID,
                "timeuuid" => FieldType::TimeUUID,
                other => FieldType::List(String::from(other)),
            },
            restraint: match self.kind.as_str() {
                "partition_key" => Some(FieldRestraint::PartitionKey),
                "clustering" => Some(FieldRestraint::ClusterKey),
                _ => None,
            }
        })
    }
}

impl IntoField for CDRSType {

    fn into_fields(&self) -> Option<Vec<Field>> {

        let mut fields = Vec::new();

        for (index, ttype) in self.field_types.iter().enumerate() {
            if ttype.contains("frozen") || ttype.contains("list") || ttype.contains("set") {
                continue;
            }

            fields.push(Field{
                name: String::from(self.field_names.get(index).unwrap()),
                vtype: match ttype.as_str() {
                    "tinyint" => FieldType::TinyInt,
                    "smallint" => FieldType::SmallInt,
                    "int" => FieldType::Int,
                    "bigint" => FieldType::BigInt,
                    "decimal" => FieldType::Decimal,
                    "text" => FieldType::String,
                    "timestamp" => FieldType::Datetime,
                    "uuid" => FieldType::UUID,
                    "timeuuid" => FieldType::TimeUUID,
                    _ => FieldType::String,
                },
                restraint: None,
            })
        }
        Some(fields)
    }
}

const CASSANDRA_CONNECTION_TIMEOUT: Duration = Duration::from_secs(55);

async fn create_session<'a, LB>(bi: &BaseInfo<'a>, load_balancing: LB) -> cdrs_tokio::Result<cdrs_tokio::cluster::session::Session<LB>>
where LB: LoadBalancingStrategy<TcpConnectionPool> {
    let addr = String::from(bi.host);
    let addr = addr + &":" + format!("{}", bi.port).as_str();
    let node = NodeTcpConfigBuilder::new(addr.as_str()
        , Arc::new(StaticPasswordAuthenticatorProvider::new(bi.username, bi.password)))
        .connection_timeout(CASSANDRA_CONNECTION_TIMEOUT)
        .build();
    let cluster_config = ClusterTcpConfig(vec![node]);
    Ok(new_session(&cluster_config, load_balancing, Box::new(DefaultRetryPolicy::default())).await?)
}

pub async fn acquire_keyspace<'a>(bi: &BaseInfo<'a>) -> cdrs_tokio::Result<Vec<String>> {
    let s = create_session(bi, RoundRobin::default()).await?;
    let  r = s.query("select keyspace_name from system_schema.keyspaces").await?.body()?;
    drop(s);
    let mut space_name = Vec::new();
    for row in r.into_rows().unwrap().iter() {
        if let Some(name) = String::from_cdrs_by_name(row, "keyspace_name")? {
            space_name.push(name);
        }
    }
    Ok(space_name)
}

pub async fn acquire_tables<'a>(keyspace: &'a str, bi: &BaseInfo<'a>) -> cdrs_tokio::Result<Vec<String>> {
    let s = create_session (bi, RoundRobin::default()).await?;
    let param = cdrs_tokio::query::QueryParamsBuilder::new().values(query_values!(keyspace)).finalize();
    let r = s.query_with_params("select table_name from system_schema.tables WHERE keyspace_name=?", param).await?.body()?;
    let mut table_name = Vec::new();
    for row in r.into_rows().unwrap().iter() {
        if let Some(name) = String::from_cdrs_by_name(row, "table_name")? {
            table_name.push(name);
        }
    }
    Ok(table_name)
}

pub async fn acquire_types<'a>(keyspace: &'a str, bi: &BaseInfo<'a>) -> cdrs_tokio::Result<Vec<String>> {
    let s = create_session(bi, RoundRobin::default()).await?;
    let param = cdrs_tokio::query::QueryParamsBuilder::new().values(query_values!(keyspace)).finalize();
    let r = s.query_with_params("select type_name from system_schema.types WHERE keyspace_name=?", param).await?.body()?;
    let mut type_name = Vec::new();

    for row in r.into_rows().unwrap().iter() {
        if let Some(name) = String::from_cdrs_by_name(row, "type_name")? {
            type_name.push(name);
        }
    }
    Ok(type_name)
}

pub async fn acquire_columns<'a>(keyspace: &'a str, table: &'a str, bi: &BaseInfo<'a>) -> cdrs_tokio::Result<Vec<Field>> {
    let s = create_session(bi, RoundRobin::default()).await?;
    let param = cdrs_tokio::query::QueryParamsBuilder::new().values(query_values!(keyspace, table)).finalize();
    let r = s.query_with_params("select column_name,kind,type as ctype from system_schema.columns WHERE keyspace_name=? and table_name=?", param).await?.body()?;
    let mut columns: Vec<Field> = Vec::new();
    for row in r.into_rows().unwrap() {
        let column = CDRSColumn::try_from_row(row)?;
        if let Some(field) = column.into_field() {
            columns.push(field);
        }
    }
    Ok(columns)
}

pub async fn acquire_type_by_name<'a>(keyspace: &'a str, type_name: &'a str, bi: &BaseInfo<'a>) -> cdrs_tokio::Result<Vec<Field>> {
    let s = create_session(bi, RoundRobin::default()).await?;
    let param = cdrs_tokio::query::QueryParamsBuilder::new().values(query_values!(keyspace, type_name)).finalize();
    let r = s.query_with_params("select field_names,field_types from system_schema.types WHERE keyspace_name=? and type_name=?", param).await?.body()?;
    let columns: Vec<Field> = Vec::new();
    for row in r.into_rows().unwrap() {
        let types = CDRSType::try_from_row(row)?;
        // println!("types: {:#?}", types);
        return Ok(types.into_fields().unwrap_or(columns));
    }
    Ok(columns)
}

pub async fn search_data<'a>(bi: &BaseInfo<'a>, scql: &SelectCQL<'a>, page_size: i32, pagination: Option<Vec<u8>>) -> cdrs_tokio::Result<HashMap<String, Value>> {

    let cql = scql.create();
    let s = create_session(bi, RoundRobin::default()).await?;

    let param = match pagination {
        Some(p) => cdrs_tokio::query::QueryParamsBuilder::new().page_size(page_size).paging_state(CBytes::new(p)).finalize(),
        _ => cdrs_tokio::query::QueryParamsBuilder::new().page_size(page_size).finalize(),
    };

    let r = s.query_with_params(&cql, param).await?.body()?;
    let pagination = match r.as_rows_metadata() {
        Some(e) => match e.paging_state {
            Some(pagination) => pagination.into_plain(),
            _ => None,
        },
        _ => None,
    };

    let ofs = Local::now().offset().clone();

    let mut json_data = Vec::new();

    let mut wrapped_map = HashMap::new();

    for row in r.into_rows().unwrap() {

        let mut json_map = HashMap::new();

        for field in scql.fields.as_ref().unwrap() {
            let v = match field.vtype {

                FieldType::String => {
                    match String::from_cdrs_by_name(&row, &field.name)? {
                        Some(rs) => serde_json::json!(rs),
                        _ => serde_json::value::Value::Null,
                    }
                },
                FieldType::TinyInt => {
                    match i8::from_cdrs_by_name(&row, &field.name)? {
                        Some(rs) => serde_json::json!(rs),
                        _ => serde_json::value::Value::Null,
                    }
                },
                FieldType::SmallInt => {
                    match i16::from_cdrs_by_name(&row, &field.name)? {
                        Some(rs) => serde_json::json!(rs),
                        _ => serde_json::value::Value::Null,
                    }
                },
                FieldType::Int => {
                    match i32::from_cdrs_by_name(&row, &field.name)? {
                        Some(rs) => serde_json::json!(rs),
                        _ => serde_json::value::Value::Null,
                    }
                },
                FieldType::BigInt => {
                    match i64::from_cdrs_by_name(&row, &field.name)? {
                        Some(rs) => serde_json::json!(rs),
                        _ => serde_json::value::Value::Null,
                    }
                },
                FieldType::Decimal => {
                    match Decimal::from_cdrs_by_name(&row, &field.name)? {
                        Some(rs) => serde_json::json!(rs.as_plain()),
                        _ => serde_json::value::Value::Null,
                    }
                }
                FieldType::TimeUUID => {
                    match uuid::Uuid::from_cdrs_by_name(&row, &field.name)? {
                        Some(rs) =>  serde_json::json!(format!("{}", rs)),
                        _ => serde_json::value::Value::Null,
                    }
                },
                FieldType::Datetime => {
                    match chrono::NaiveDateTime::from_cdrs_by_name(&row, &field.name)? {
                        Some(rs) => {
                            let rs = chrono::DateTime::<Local>::from_utc(rs, ofs);
                            serde_json::json!(format!("{}", rs))
                        },
                        _ => serde_json::value::Value::Null,
                    }
                },
                _ => serde_json::value::Value::Null,
            };

            json_map.insert(field.name.clone(), v);
        }
        json_data.push(json_map);
    }

    wrapped_map.insert(String::from("pagination"), serde_json::json!(pagination));
    wrapped_map.insert(String::from("data"), serde_json::json!(json_data));

    Ok(wrapped_map)
}

pub async fn search_detail_data<'a>(bi: &BaseInfo<'a>, scql: &SelectCQL<'a>) -> cdrs_tokio::Result<Vec<HashMap<String, Value>>> {

    let cql = scql.create_detail();

    let s = create_session(bi, RoundRobin::default()).await?;
    let r = s.query(&cql).await?.body()?;

    let ofs = Local::now().offset().clone();

    let mut json_data = Vec::new();

    let udt = scql.udt.as_ref().unwrap();

    if let FieldType::List(_) = udt.field.vtype {
        
        for row in r.into_rows().unwrap() {

            let  list: Vec<Udt> = match List::from_cdrs_by_name(&row, &udt.field.name)? {
                Some(list) => list.as_r_type()?,
                _ => Vec::new(),
            };

            for elem in list {

                let mut json_map = HashMap::new();

                for field in udt.udt.iter() {
                    let v = match field.vtype {
    
                        FieldType::String => {
                            match String::from_cdrs_by_name(&elem, &field.name)? {
                                Some(rs) => serde_json::json!(rs),
                                _ => serde_json::value::Value::Null,
                            }
                        },
                        FieldType::TinyInt => {
                            match i8::from_cdrs_by_name(&elem, &field.name)? {
                                Some(rs) => serde_json::json!(rs),
                                _ => serde_json::value::Value::Null,
                            }
                        },
                        FieldType::SmallInt => {
                            match i16::from_cdrs_by_name(&elem, &field.name)? {
                                Some(rs) => serde_json::json!(rs),
                                _ => serde_json::value::Value::Null,
                            }
                        },
                        FieldType::Int => {
                            match i32::from_cdrs_by_name(&elem, &field.name)? {
                                Some(rs) => serde_json::json!(rs),
                                _ => serde_json::value::Value::Null,
                            }
                        },
                        FieldType::BigInt => {
                            match i64::from_cdrs_by_name(&elem, &field.name)? {
                                Some(rs) => serde_json::json!(rs),
                                _ => serde_json::value::Value::Null,
                            }
                        },
                        FieldType::Decimal => {
                            match Decimal::from_cdrs_by_name(&elem, &field.name)? {
                                Some(rs) => serde_json::json!(rs.as_plain()),
                                _ => serde_json::value::Value::Null,
                            }
                        },
                        FieldType::TimeUUID => {
                            match uuid::Uuid::from_cdrs_by_name(&elem, &field.name)? {
                                Some(rs) =>  serde_json::json!(format!("{}", rs)),
                                _ => serde_json::value::Value::Null,
                            }
                        },
                        FieldType::Datetime => {        
                            match chrono::NaiveDateTime::from_cdrs_by_name(&elem, &field.name)? {
                                Some(rs) => {
                                    let rs = chrono::DateTime::<Local>::from_utc(rs, ofs);
                                    serde_json::json!(format!("{}", rs))
                                },
                                _ => serde_json::value::Value::Null,
                            }
                        }
                        _ => serde_json::value::Value::Null,
                    };

                    json_map.insert(field.name.clone(), v);
                }
                json_data.push(json_map);
            }
        }   
        Ok(json_data)
    } else {
        Err(cdrs_tokio::error::Error::General(String::from("Uncofiguration Info!!!")))
    }
}