use serde::{Serialize, Deserialize, de::Error as SerdeError};
use serde_json::value::Value;

pub mod cassandra;

pub trait IntoField {
    fn into_field(&self) -> Option<Field> {None}
    fn into_fields(&self) -> Option<Vec<Field>> {None}
}

#[derive(Debug, Clone)]
pub enum FieldType {
    TinyInt,
    SmallInt,
    Int,
    BigInt,
    String,
    Decimal,
    Datetime,
    UUID,
    TimeUUID,
    List(String),
}

#[derive(Debug, Clone)]
pub enum FieldOperate {
    EQ,
    NE,
    Greater,
    Less,
}

#[derive(Debug, Clone)]
pub enum DataXType {
    PosgtresX,
    CassandraX,
    RedisX,
}

#[derive(Debug, Clone)]
pub enum FieldRestraint {
    PartitionKey,
    ClusterKey,
    PrimaryKey,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Field {
    pub name: String,
    pub vtype: FieldType,
    pub restraint: Option<FieldRestraint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UDTField {
    pub field: Field,
    pub udt: Vec<Field>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldParam {
    pub field: Field,
    pub operate: FieldOperate,
    pub value: Value,
}

#[derive(Debug, Clone)]
pub struct BaseInfo<'a> {
    pub port: i32,
    pub host: &'a str,
    pub username: &'a str,
    pub password: &'a str,
}

impl Serialize for FieldType {

    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
            S: serde::Serializer {
        match self {
            FieldType::TinyInt => serializer.serialize_str("tinyint"),
            FieldType::SmallInt => serializer.serialize_str("smallint"),
            FieldType::Int => serializer.serialize_str("int"),
            FieldType::BigInt => serializer.serialize_str("bigint"),
            FieldType::Decimal => serializer.serialize_str("decimal"),
            FieldType::String => serializer.serialize_str("string"),
            FieldType::Datetime => serializer.serialize_str("datetime"),
            FieldType::UUID => serializer.serialize_str("uuid"),
            FieldType::TimeUUID => serializer.serialize_str("time-uuid"),
            FieldType::List(_) => serializer.serialize_str("list"),
        }
    }
}

impl <'de> Deserialize<'de> for FieldType {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
            D: serde::Deserializer<'de> {
        match String::deserialize(deserializer)?.as_str() {
            "tinyint" => Ok(FieldType::TinyInt),
            "smallint" => Ok(FieldType::SmallInt),
            "int" => Ok(FieldType::Int),
            "bigint" => Ok(FieldType::BigInt),
            "decimal" => Ok(FieldType::Decimal),
            "string" => Ok(FieldType::String),
            "datetime" => Ok(FieldType::Datetime),
            "uuid" => Ok(FieldType::UUID),
            "time-uuid" => Ok(FieldType::UUID),
            "list" => Ok(FieldType::List(String::from("list"))),
            other => Err(SerdeError::unknown_variant(other, &["number", "string", "datetime", "uuid", "list"])),
        }
    }
}

impl Serialize for FieldOperate {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
            S: serde::Serializer {
        match self {
            FieldOperate::EQ => serializer.serialize_str("="),
            FieldOperate::NE => serializer.serialize_str("<>"),
            FieldOperate::Greater => serializer.serialize_str(">"),
            FieldOperate::Less => serializer.serialize_str("<"),
        }
    }
}

impl <'de> Deserialize<'de> for FieldOperate {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
            D: serde::Deserializer<'de> {
        match String::deserialize(deserializer)?.as_str() {
            "=" => Ok(FieldOperate::EQ),
            "<>" => Ok(FieldOperate::NE),
            ">" => Ok(FieldOperate::Greater),
            "<" => Ok(FieldOperate::Less),
            other => Err(SerdeError::unknown_variant(other, &["=", "<>", ">", "<"])),
        } 
    }
}

impl Serialize for DataXType {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
            S: serde::Serializer {
        match self {
            DataXType::PosgtresX => serializer.serialize_str("postgres"),
            DataXType::CassandraX => serializer.serialize_str("cassandra"),
            DataXType::RedisX => serializer.serialize_str("redis"),
        }
    }
}

impl <'de> Deserialize<'de> for DataXType {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
            D: serde::Deserializer<'de> {
        match String::deserialize(deserializer)?.as_str() {
            "postgres" => Ok(DataXType::PosgtresX),
            "cassandra" => Ok(DataXType::CassandraX),
            "redis" => Ok(DataXType::RedisX),
            other => Err(SerdeError::unknown_variant(other, &["postgres", "cassandra", "redis"])),
        }
    }
}

impl Serialize for FieldRestraint {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
            S: serde::Serializer {
        match self {
            FieldRestraint::PartitionKey => serializer.serialize_str("partition-key"),
            FieldRestraint::ClusterKey => serializer.serialize_str("clustering"),
            FieldRestraint::PrimaryKey => serializer.serialize_str("primary-key"),
        }
    }
}

impl <'de> Deserialize<'de> for FieldRestraint {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
            D: serde::Deserializer<'de> {
        match String::deserialize(deserializer)?.as_str() {
            "partition-key" => Ok(FieldRestraint::PartitionKey),
            "clustering" => Ok(FieldRestraint::ClusterKey),
            "primary-key" => Ok(FieldRestraint::PrimaryKey),
            other => Err(SerdeError::unknown_variant(other, &["partition-key", "clustering", "primary-key"])),
        }
    }
}

impl FieldParam {
    fn format(&self) -> String {
        let mut f = String::from(&self.field.name);

        match self.operate {
            FieldOperate::EQ => f.push_str("="),
            FieldOperate::NE => f.push_str("!="),
            FieldOperate::Greater => f.push_str(">"),
            FieldOperate::Less => f.push_str("<"),
        }

        if let serde_json::Value::String(e) = &self.value {
            f.push_str(format!("'{}'", e).as_str());
        } else {
            f.push_str(format!("{}", self.value).as_str());
        }

        f
    }
}