use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;
use tauri::Emitter;
use std::sync::atomic::{AtomicBool, AtomicU16, Ordering};
use std::sync::OnceLock;
use std::sync::Arc;

// Helper function to map folder paths (handling Windows-to-macOS defaults)
fn get_actual_path(folder_path: Option<String>) -> PathBuf {
    let raw_path = folder_path.unwrap_or_default();
    let raw_path = raw_path.trim().to_string();

    if raw_path.is_empty() {
        PathBuf::from("C:\\FixOrTrash")
    } else {
        PathBuf::from(raw_path)
    }
}

// 1. Read Database
#[tauri::command]
fn read_database(folder_path: Option<String>) -> Result<Value, String> {
    let target_folder = get_actual_path(folder_path);

    if !target_folder.exists() {
        fs::create_dir_all(&target_folder).map_err(|e| e.to_string())?;
    }

    let db_file = target_folder.join("database.json");
    if db_file.exists() {
        let content = fs::read_to_string(&db_file).map_err(|e| e.to_string())?;
        let parsed: Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(parsed)
    } else {
        Ok(Value::Null)
    }
}

// 2. Write Database
#[tauri::command]
fn write_database(
    folder_path: Option<String>,
    data: Value,
    file_name: Option<String>,
) -> Result<Value, String> {
    let target_folder = get_actual_path(folder_path);

    if !target_folder.exists() {
        fs::create_dir_all(&target_folder).map_err(|e| e.to_string())?;
    }

    let name = file_name
        .filter(|n| !n.trim().is_empty())
        .unwrap_or_else(|| "database.json".to_string());
    let db_file = target_folder.join(name);

    let content = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&db_file, content).map_err(|e| e.to_string())?;

    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), Value::Bool(true));
    Ok(Value::Object(res))
}

// 3. Select Folder (using RFD native dialogs where supported)
#[tauri::command]
fn select_folder() -> Option<String> {
    let result = rfd::FileDialog::new().pick_folder();
    result.map(|path| path.to_string_lossy().to_string())
}

// Helper to resolve the ADB path relative to resources or executable
fn resolve_adb_path(app: &tauri::AppHandle) -> Option<PathBuf> {
    let adb_filename = if cfg!(target_os = "windows") {
        "adb.exe"
    } else {
        "adb"
    };

    // 1. Try resource directory (dev or package)
    if let Ok(resource_dir) = app.path().resource_dir() {
        let path1 = resource_dir.join("platform-tools").join(adb_filename);
        if path1.exists() {
            return Some(path1);
        }
        let path2 = resource_dir
            .join("resources")
            .join("platform-tools")
            .join(adb_filename);
        if path2.exists() {
            return Some(path2);
        }
    }

    // 2. Try adjacent to current executable
    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(exe_dir) = current_exe.parent() {
            let path1 = exe_dir
                .join("resources")
                .join("platform-tools")
                .join(adb_filename);
            if path1.exists() {
                return Some(path1);
            }
            let path2 = exe_dir.join("platform-tools").join(adb_filename);
            if path2.exists() {
                return Some(path2);
            }
        }
    }

    // 3. Try current working directory
    if let Ok(cwd) = std::env::current_dir() {
        let path1 = cwd
            .join("resources")
            .join("platform-tools")
            .join(adb_filename);
        if path1.exists() {
            return Some(path1);
        }
    }

    None
}

// 4. Shell Execution
#[derive(serde::Serialize)]
struct ShellExecResult {
    stdout: String,
    stderr: String,
    error: Option<String>,
    #[serde(rename = "debugInfo")]
    debug_info: Value,
}

#[tauri::command]
fn shell_exec(app: tauri::AppHandle, command: String) -> ShellExecResult {
    let mut cmd_to_run = command.clone();
    let mut debug_info_map = serde_json::Map::new();
    let mut tried_paths = Vec::new();
    let mut final_path = "global adb".to_string();
    let mut found = false;

    if command.trim_start().starts_with("adb") {
        if let Some(resolved) = resolve_adb_path(&app) {
            final_path = resolved.to_string_lossy().to_string();
            found = true;
            tried_paths.push(serde_json::json!({
                "path": final_path,
                "exists": true
            }));

            let resolved_str = format!("\"{}\"", final_path);
            if cmd_to_run.starts_with("adb") {
                cmd_to_run = cmd_to_run.replacen("adb", &resolved_str, 1);
            }
        } else {
            tried_paths.push(serde_json::json!({
                "path": "not found locally",
                "exists": false
            }));
        }
    }

    debug_info_map.insert("finalPath".to_string(), Value::String(final_path));
    debug_info_map.insert("found".to_string(), Value::Bool(found));
    debug_info_map.insert("triedPaths".to_string(), Value::Array(tried_paths));

    match Command::new("cmd").args(&["/c", &cmd_to_run]).output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let error = if !output.status.success() {
                Some(format!("Command exited with status: {}", output.status))
            } else {
                None
            };
            ShellExecResult {
                stdout,
                stderr,
                error,
                debug_info: Value::Object(debug_info_map),
            }
        }
        Err(e) => ShellExecResult {
            stdout: String::new(),
            stderr: e.to_string(),
            error: Some(e.to_string()),
            debug_info: Value::Object(debug_info_map),
        },
    }
}

// 5. Open Webview (IMEI Check) with basic CSS AdBlocker injected
#[tauri::command]
fn open_adblocked_window(
    app: tauri::AppHandle,
    url: String,
    script: Option<String>,
) -> Result<Value, String> {
    let label = "adblocked_window";

    // Close existing if open
    if let Some(existing) = app.get_webview_window(label) {
        let _ = existing.close();
        std::thread::sleep(std::time::Duration::from_millis(150));
    }

    let webview_url =
        tauri::WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?);

    let mut builder = tauri::WebviewWindowBuilder::new(&app, label, webview_url)
        .title("Verifica IMEI (Protetta da AdBlock)")
        .inner_size(1000.0, 800.0)
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    // CSS AdBlock injection + custom JS logic
    let mut init_script = r#"
        (function() {
            const style = document.createElement('style');
            style.innerHTML = 'iframe[src*="google"], iframe[src*="doubleclick"], [class*="ad-"], [class*="adsense"], [id*="google_ads"], [class*="banner"], .adsbygoogle { display: none !important; }';
            document.documentElement.appendChild(style);
        })();
    "#.to_string();

    if let Some(ref script_content) = script {
        init_script.push_str("\n");
        init_script.push_str(script_content);
    }

    builder = builder.initialization_script(&init_script);

    let _window = builder.build().map_err(|e| e.to_string())?;

    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), Value::Bool(true));
    Ok(Value::Object(res))
}

// 6. HTTP DuckDuckGo scraper to search model specs (no UI window needed, fast & low RAM)
fn decode_html_entities(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
        .replace("&#x27;", "'")
        .replace("&#39;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
}

#[derive(serde::Serialize)]
struct IdentifyModelResult {
    success: bool,
    #[serde(rename = "modelName")]
    model_name: Option<String>,
    error: Option<String>,
}

#[tauri::command]
fn auto_identify_model(model_code: String) -> IdentifyModelResult {
    let query = format!("{} specs", model_code.trim());
    let encoded = urlencoding::encode(&query);
    let url = format!("https://html.duckduckgo.com/html/?q={}", encoded);

    let agent = ureq::AgentBuilder::new()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        .build();

    let response = match agent.get(&url).call() {
        Ok(res) => res,
        Err(e) => {
            return IdentifyModelResult {
                success: false,
                model_name: None,
                error: Some(format!("HTTP request failed: {}", e)),
            };
        }
    };

    let body = match response.into_string() {
        Ok(b) => b,
        Err(e) => {
            return IdentifyModelResult {
                success: false,
                model_name: None,
                error: Some(format!("Failed to read response body: {}", e)),
            };
        }
    };

    if let Some(pos) = body.find("class=\"result__a\"") {
        let sub = &body[pos..];
        if let Some(start_tag) = sub.find('>') {
            let sub_title = &sub[start_tag + 1..];
            if let Some(end_tag) = sub_title.find("</a>") {
                let raw_title = &sub_title[..end_tag];
                let title = decode_html_entities(raw_title).trim().to_string();

                let mut cleaned = title;
                let clean_suffixes = [
                    " - Full phone specifications",
                    " | Full phone specifications",
                    " - Specs",
                    " | Specs",
                    " - Specifications",
                    " | Specifications",
                    " - Review",
                    " | Review",
                    " - GSMArena.com",
                    " | GSMArena.com",
                    " - PhoneDB",
                    " | PhoneDB",
                ];

                for suffix in &clean_suffixes {
                    let lower_cleaned = cleaned.to_lowercase();
                    let lower_suffix = suffix.to_lowercase();
                    if let Some(idx) = lower_cleaned.rfind(&lower_suffix) {
                        cleaned.truncate(idx);
                    }
                }

                cleaned = cleaned.trim().to_string();

                return IdentifyModelResult {
                    success: true,
                    model_name: Some(cleaned),
                    error: None,
                };
            }
        }
    }

    IdentifyModelResult {
        success: false,
        model_name: Some("Modello non trovato".to_string()),
        error: None,
    }
}

// 6.5. Fetch HTML via Rust to bypass CORS blocks
#[tauri::command]
fn fetch_html(url: String) -> Result<String, String> {
    let agent = ureq::AgentBuilder::new()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        .build();

    let response = agent.get(&url).call().map_err(|e| e.to_string())?;
    let body = response.into_string().map_err(|e| e.to_string())?;
    Ok(body)
}

// 7. Open Native WebView Window (for Gmail, Calendar, etc.)
#[tauri::command]
fn open_native_window(
    app: tauri::AppHandle,
    label: String,
    title: String,
    url: String,
) -> Result<(), String> {
    if let Some(existing) = app.get_webview_window(&label) {
        let _ = existing.set_focus();
        return Ok(());
    }

    let webview_url =
        tauri::WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?);

    let _window = tauri::WebviewWindowBuilder::new(&app, &label, webview_url)
        .title(&title)
        .inner_size(1100.0, 750.0)
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

// 7. Open External URLs in OS Browser
#[tauri::command]
fn open_external(app: tauri::AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    if url.starts_with("http://") || url.starts_with("https://") {
        app.opener().open_url(url, None::<String>).map_err(|e| e.to_string())
    } else {
        app.opener().open_path(url, None::<String>).map_err(|e| e.to_string())
    }
}

// 8. Save PDF base64 bytes to path chosen by user via Dialog
#[tauri::command]
fn save_pdf_data(base64_data: String, filename: String) -> Result<Value, String> {
    use base64::{engine::general_purpose, Engine as _};
    let bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| e.to_string())?;

    let result = rfd::FileDialog::new()
        .set_file_name(&filename)
        .add_filter("PDF Document", &["pdf"])
        .save_file();

    if let Some(path) = result {
        fs::write(&path, bytes).map_err(|e| e.to_string())?;
        let mut res = serde_json::Map::new();
        res.insert("success".to_string(), Value::Bool(true));
        res.insert(
            "path".to_string(),
            Value::String(path.to_string_lossy().to_string()),
        );
        Ok(Value::Object(res))
    } else {
        Err("Canceled".to_string())
    }
}

// 9. Write PDF base64 to temp and open it using system default viewer
#[tauri::command]
fn open_pdf_data(app: tauri::AppHandle, base64_data: String, filename: String) -> Result<Value, String> {
    use base64::{engine::general_purpose, Engine as _};
    let bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| e.to_string())?;

    let temp_dir = std::env::temp_dir();
    let unique_name = format!("{}_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis(), filename);
    let temp_file = temp_dir.join(unique_name);
    fs::write(&temp_file, &bytes).map_err(|e| e.to_string())?;

    open_external(app, temp_file.to_string_lossy().to_string())?;

    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), Value::Bool(true));
    Ok(Value::Object(res))
}

// 10. Write PDF base64 to temp for preview frame
#[tauri::command]
fn get_preview_pdf_path(base64_data: String) -> Result<String, String> {
    use base64::{engine::general_purpose, Engine as _};
    let bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| e.to_string())?;

    let temp_dir = std::env::temp_dir();
    let temp_file = temp_dir.join("fixortrash_temp_preview.pdf");
    fs::write(&temp_file, &bytes).map_err(|e| e.to_string())?;

    Ok(temp_file.to_string_lossy().to_string())
}

static SHUTDOWN_SIGNAL: OnceLock<Arc<AtomicBool>> = OnceLock::new();
static HTTP_SERVER_PORT: AtomicU16 = AtomicU16::new(0);
static WS_SERVER_PORT: AtomicU16 = AtomicU16::new(0);

fn get_shutdown_signal() -> Arc<AtomicBool> {
    SHUTDOWN_SIGNAL.get_or_init(|| Arc::new(AtomicBool::new(false))).clone()
}

#[derive(serde::Serialize)]
struct ServerInfo {
    ip: String,
    port: u16,
    #[serde(rename = "wsPort")]
    ws_port: u16,
}

// Helper to resolve PC local IP
fn get_local_ip() -> Option<String> {
    let socket = std::net::UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;
    socket.local_addr().ok().map(|addr| addr.ip().to_string())
}

// Command to get local IP and start the servers if not already running
#[tauri::command]
fn start_diagnostic_server(app: tauri::AppHandle) -> Result<ServerInfo, String> {
    let shutdown = get_shutdown_signal();
    
    // If already running, return existing info
    if shutdown.load(Ordering::Relaxed) == false && HTTP_SERVER_PORT.load(Ordering::Relaxed) != 0 {
        let ip = get_local_ip().unwrap_or_else(|| "127.0.0.1".to_string());
        let port = HTTP_SERVER_PORT.load(Ordering::Relaxed);
        let ws_port = WS_SERVER_PORT.load(Ordering::Relaxed);
        return Ok(ServerInfo { ip, port, ws_port });
    }

    // Set running state
    shutdown.store(false, Ordering::Relaxed);

    // 1. Generate SSL certificate dynamically
    let ip = get_local_ip().unwrap_or_else(|| "127.0.0.1".to_string());
    
    let mut params = rcgen::CertificateParams::default();
    params.distinguished_name = rcgen::DistinguishedName::new();
    params.distinguished_name.push(rcgen::DnType::CommonName, ip.clone());
    
    let dns_localhost = rcgen::Ia5String::try_from("localhost").map_err(|e| e.to_string())?;
    let dns_loopback = rcgen::Ia5String::try_from("127.0.0.1").map_err(|e| e.to_string())?;

    let mut subject_alt_names = vec![
        rcgen::SanType::DnsName(dns_localhost),
        rcgen::SanType::DnsName(dns_loopback),
    ];
    
    if let Ok(ip_addr) = ip.parse::<std::net::IpAddr>() {
        subject_alt_names.push(rcgen::SanType::IpAddress(ip_addr));
    }
    
    if let Ok(loopback) = "127.0.0.1".parse::<std::net::IpAddr>() {
        subject_alt_names.push(rcgen::SanType::IpAddress(loopback));
    }
    
    params.subject_alt_names = subject_alt_names;
    
    // Generate key pair and certificate
    let key_pair = rcgen::KeyPair::generate().map_err(|e| e.to_string())?;
    let cert = params.self_signed(&key_pair).map_err(|e| e.to_string())?;
    let cert_pem = cert.pem();
    let key_pem = key_pair.serialize_pem();

    let server_config = tiny_http::SslConfig {
        certificate: cert_pem.as_bytes().to_vec(),
        private_key: key_pem.as_bytes().to_vec(),
    };

    // 2. Start HTTP Server over HTTPS on dynamic port
    let http_server = tiny_http::Server::https("0.0.0.0:0", server_config).map_err(|e| e.to_string())?;
    let http_port = http_server.server_addr().to_ip().map(|addr| addr.port()).unwrap_or(4567);

    let app_clone = app.clone();
    let shutdown_clone = shutdown.clone();
    std::thread::spawn(move || {
        let html_content = include_str!("mobile_diagnostics.html");
        
        while !shutdown_clone.load(Ordering::Relaxed) {
            match http_server.try_recv() {
                Ok(Some(mut request)) => {
                    let url = request.url().to_string();
                    let method = request.method().to_string();
                    
                    if method == "OPTIONS" {
                        let response = tiny_http::Response::empty(204)
                            .with_header(tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap())
                            .with_header(tiny_http::Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"POST, GET, OPTIONS"[..]).unwrap())
                            .with_header(tiny_http::Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Content-Type"[..]).unwrap());
                        let _ = request.respond(response);
                    } else if url.starts_with("/api/event") && method == "POST" {
                        let mut body = String::new();
                        if let Ok(_) = request.as_reader().read_to_string(&mut body) {
                            app_clone.emit("diagnostic-event", body).ok();
                        }
                        let response = tiny_http::Response::from_string("{\"status\":\"ok\"}")
                            .with_header(tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                            .with_header(tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap());
                        let _ = request.respond(response);
                    } else if url.starts_with("/download/app.apk") {
                        let mut found_path = None;
                        
                        // 1. Try resource directory first (production/packaged environment)
                        if let Ok(resource_dir) = app_clone.path().resource_dir() {
                            let p1 = resource_dir.join("FixOrTrashPro-debug.apk");
                            if p1.exists() {
                                found_path = Some(p1);
                            } else {
                                let p2 = resource_dir.join("resources").join("FixOrTrashPro-debug.apk");
                                if p2.exists() {
                                    found_path = Some(p2);
                                }
                            }
                        }

                        // 2. Fall back to developer paths
                        if found_path.is_none() {
                            let paths_to_try = vec![
                                PathBuf::from("E:\\Antigravity Progetti\\Software Negozio Tauri\\APK\\FixOrTrashPro-debug.apk"),
                                PathBuf::from("..\\APK\\FixOrTrashPro-debug.apk"),
                                PathBuf::from(".\\APK\\FixOrTrashPro-debug.apk"),
                            ];
                            for p in paths_to_try {
                                if p.exists() {
                                    found_path = Some(p);
                                    break;
                                }
                            }
                        }

                        if let Some(apk_path) = found_path {
                            if let Ok(file) = std::fs::File::open(&apk_path) {
                                let file_len = apk_path.metadata().map(|m| m.len() as usize).unwrap_or(0);
                                let response = tiny_http::Response::new(
                                    tiny_http::StatusCode(200),
                                    vec![
                                        tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"application/vnd.android.package-archive"[..]).unwrap(),
                                        tiny_http::Header::from_bytes(&b"Content-Disposition"[..], &b"attachment; filename=\"FixOrTrashPro.apk\""[..]).unwrap(),
                                        tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
                                    ],
                                    file,
                                    Some(file_len),
                                    None
                                );
                                let _ = request.respond(response);
                            } else {
                                let response = tiny_http::Response::empty(500)
                                    .with_header(tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap());
                                let _ = request.respond(response);
                            }
                        } else {
                            let response = tiny_http::Response::empty(404)
                                .with_header(tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap());
                            let _ = request.respond(response);
                        }
                    } else if url.starts_with("/") {

                        let response = tiny_http::Response::from_string(html_content)
                            .with_header(tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap())
                            .with_header(tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap());
                        let _ = request.respond(response);
                    } else {
                        let response = tiny_http::Response::empty(404)
                            .with_header(tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap());
                        let _ = request.respond(response);
                    }
                }
                Ok(None) => {
                    std::thread::sleep(std::time::Duration::from_millis(50));
                }
                Err(_) => break,
            }
        }
    });

    // Save ports globally (WebSocket port matches HTTP port since we communicate via HTTPS POST)
    HTTP_SERVER_PORT.store(http_port, Ordering::Relaxed);
    WS_SERVER_PORT.store(http_port, Ordering::Relaxed);

    Ok(ServerInfo { ip, port: http_port, ws_port: http_port })
}

#[tauri::command]
fn stop_diagnostic_server() -> Result<(), String> {
    let shutdown = get_shutdown_signal();
    shutdown.store(true, Ordering::Relaxed);
    HTTP_SERVER_PORT.store(0, Ordering::Relaxed);
    WS_SERVER_PORT.store(0, Ordering::Relaxed);
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_database,
            write_database,
            select_folder,
            shell_exec,
            open_adblocked_window,
            auto_identify_model,
            open_external,
            save_pdf_data,
            open_pdf_data,
            get_preview_pdf_path,
            open_native_window,
            fetch_html,
            start_diagnostic_server,
            stop_diagnostic_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
