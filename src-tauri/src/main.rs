#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use leviathan::event::ssh_tunnel::tunnel_init;
use leviathan::event::bind_ssh_tunnel;
use leviathan::event::bind_cql_event;
use tokio;

#[tokio::main(flavor = "multi_thread", worker_threads = 50)]
async fn main() {

  let (sx, rx) = tunnel_init().await;
  let sx_replic = sx.clone();
  
  tauri::Builder::default().on_page_load(move |w, _| {
    bind_cql_event(&w);
    bind_ssh_tunnel(&w, &sx_replic, &rx);
    println!("OK");
  }).run(tauri::generate_context!())
  .expect("error while running tauri application");
}