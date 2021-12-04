#[macro_use]
extern crate cdrs_tokio;
#[macro_use]
extern crate cdrs_tokio_helpers_derive;
extern crate uuid;
extern crate chrono;
extern crate tauri;
extern crate ssh2;
extern crate log;
extern crate fern;

pub mod event;
pub mod plugins;

pub async fn init_log() {
    fern::Dispatch::new()
        .format(|out, message, record| {
            out.finish(format_args!(
                "{} [{}] {}",
                chrono::Local::now().format("%Y-%m-%d %H:%M:%S"),
                record.level(),
                message
            ))
        })
        .level(log::LevelFilter::Info)
        .chain(fern::log_file("leviathan.log").unwrap()).apply().unwrap()
}