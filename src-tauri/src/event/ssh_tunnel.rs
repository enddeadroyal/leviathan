use tokio::sync::mpsc::{Receiver, Sender, channel};
use crate::plugins::ssh_tunnel::{Tunnel, TunnelControl, TunnelOperator, TunnelResult, TunnelsReceiver};
use crate::plugins::ssh_tunnel::api::run;
use tauri::window::Window;
use crate::event::{Request, Response};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::task;
use super::SerdeError;
use super::ConvertToEventError;
use super::EventError;

pub type ArcReceiver<T> = Arc<Mutex<Receiver<T>>>;

pub async fn tunnel_init() -> (Sender<TunnelControl>, TunnelsReceiver) {

    let (sx_src, rx_src) = channel::<TunnelControl>(1024);
    let (sx_dest, rx_dest) = channel::<TunnelResult<Vec<Tunnel>>>(1024);
    tokio::spawn(run(sx_dest, rx_src));
    (sx_src, Arc::new(Mutex::new(rx_dest)))
}

pub fn req_view_tunnel(w: &Window, sx: &Sender<TunnelControl>, rx: &TunnelsReceiver) {

    let w_replic = w.clone();
    let sx_replic = sx.clone();
    let rx_replic = rx.clone();

    w.listen("req-view-tunnel-info", move |e| {

        let sx_replic = sx_replic.clone();
        let rx_replic = rx_replic.clone();
        let w_replic = w_replic.clone();

        task::spawn(async move {
            let req: Result<Request<Option<Tunnel>>, SerdeError> = serde_json::from_str(e.payload().unwrap());
            let rs = match req {
                Ok(req) => {
                    let tc = TunnelControl {
                        tunnel: req.data,
                        operator: TunnelOperator::VIEW,
                    };

                    sx_replic.send(tc).await.unwrap_or_default();
                    match rx_replic.lock().await.recv().await {
                        Some(Ok(e)) => {
                            println!("tunnel: {:?}", e);
                            Response{status: String::from("success"), data: Some(e), err: None}
                        },
                        Some(Err(e)) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
                        None => Response{status: String::from("failure"), data: None, err: Some(EventError::build(0, "no data!!!"))},
                    }
                },
                Err(e) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
            };
            w_replic.emit("resp-view-tunnel-info", serde_json::to_string(&rs).unwrap()).unwrap()
        });
    });
}

pub fn req_register_tunnel(w: &Window, sx: &Sender<TunnelControl>, rx: &TunnelsReceiver) {

    let w_replic = w.clone();
    let sx_replic = sx.clone();
    let rx_replic = rx.clone();

    w.listen("req-register-tunnel-info", move |e| {

        let sx_replic = sx_replic.clone();
        let rx_replic = rx_replic.clone();
        let w_replic = w_replic.clone();

        task::spawn(async move {
            let req: Result<Request<Option<Tunnel>>, SerdeError> = serde_json::from_str(e.payload().unwrap());
            let rs = match req {
                Ok(req) => {
                    let tc = TunnelControl {
                        tunnel: req.data,
                        operator: TunnelOperator::ADD,
                    };

                    sx_replic.send(tc).await.unwrap_or_default();
                    match rx_replic.lock().await.recv().await {
                        Some(Ok(e)) => {
                            println!("tunnel: {:?}", e);
                            Response{status: String::from("success"), data: Some(e), err: None}
                        },
                        Some(Err(e)) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
                        None => Response{status: String::from("failure"), data: None, err: Some(EventError::build(0, "no data!!!"))},
                    }
                },
                Err(e) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
            };
            w_replic.emit("resp-register-tunnel-info", serde_json::to_string(&rs).unwrap()).unwrap()
        });
    });
}

pub fn req_sync_tunnel(w: &Window, sx: &Sender<TunnelControl>, rx: &TunnelsReceiver) {

    let w_replic = w.clone();
    let sx_replic = sx.clone();
    let rx_replic = rx.clone();

    w.listen("req-sync-tunnel-info", move |e| {

        let sx_replic = sx_replic.clone();
        let rx_replic = rx_replic.clone();
        let w_replic = w_replic.clone();

        task::spawn(async move {
            let req: Result<Request<Option<Tunnel>>, SerdeError> = serde_json::from_str(e.payload().unwrap());
            let rs = match req {
                Ok(req) => {
                    let tc = TunnelControl {
                        tunnel: req.data,
                        operator: TunnelOperator::SYNC,
                    };

                    sx_replic.send(tc).await.unwrap_or_default();
                    match rx_replic.lock().await.recv().await {
                        Some(Ok(e)) => {
                            println!("tunnel: {:?}", e);
                            Response{status: String::from("success"), data: Some(e), err: None}
                        },
                        Some(Err(e)) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
                        None => Response{status: String::from("failure"), data: None, err: Some(EventError::build(0, "no data!!!"))},
                    }
                },
                Err(e) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
            };
            w_replic.emit("resp-sync-tunnel-info", serde_json::to_string(&rs).unwrap()).unwrap()
        });
    });
}

pub fn req_delete_tunnel(w: &Window, sx: &Sender<TunnelControl>, rx: &TunnelsReceiver) {

    let w_replic = w.clone();
    let sx_replic = sx.clone();
    let rx_replic = rx.clone();

    w.listen("req-delete-tunnel-info", move |e| {

        let sx_replic = sx_replic.clone();
        let rx_replic = rx_replic.clone();
        let w_replic = w_replic.clone();

        task::spawn(async move {
            let req: Result<Request<Option<Tunnel>>, SerdeError> = serde_json::from_str(e.payload().unwrap());
            let rs = match req {
                Ok(req) => {
                    let tc = TunnelControl {
                        tunnel: req.data,
                        operator: TunnelOperator::DELETE,
                    };

                    sx_replic.send(tc).await.unwrap_or_default();
                    match rx_replic.lock().await.recv().await {
                        Some(Ok(e)) => {
                            println!("tunnel: {:?}", e);
                            Response{status: String::from("success"), data: Some(e), err: None}
                        },
                        Some(Err(e)) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
                        None => Response{status: String::from("failure"), data: None, err: Some(EventError::build(0, "no data!!!"))},
                    }
                },
                Err(e) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
            };
            w_replic.emit("resp-delete-tunnel-info", serde_json::to_string(&rs).unwrap()).unwrap()
        });
    });
}

pub fn req_state_tunnel(w: &Window, sx: &Sender<TunnelControl>, rx: &TunnelsReceiver) {

    let w_replic = w.clone();
    let sx_replic = sx.clone();
    let rx_replic = rx.clone();

    w.listen("req-state-tunnel-info", move |e| {

        let sx_replic = sx_replic.clone();
        let rx_replic = rx_replic.clone();
        let w_replic = w_replic.clone();

        task::spawn(async move {
            let req: Result<Request<Option<Tunnel>>, SerdeError> = serde_json::from_str(e.payload().unwrap());
            let rs = match req {
                Ok(req) => {
                    let tc = TunnelControl {
                        tunnel: req.data,
                        operator: TunnelOperator::STATE,
                    };

                    sx_replic.send(tc).await.unwrap_or_default();
                    match rx_replic.lock().await.recv().await {
                        Some(Ok(e)) => {
                            println!("tunnel: {:?}", e);
                            Response{status: String::from("success"), data: Some(e), err: None}
                        },
                        Some(Err(e)) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
                        None => Response{status: String::from("failure"), data: None, err: Some(EventError::build(0, "no data!!!"))},
                    }
                },
                Err(e) => Response{status: String::from("failure"), data: None, err: Some(e.convert())},
            };
            w_replic.emit("resp-state-tunnel-info", serde_json::to_string(&rs).unwrap()).unwrap()
        });
    });
}