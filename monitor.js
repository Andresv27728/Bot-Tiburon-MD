
import express from 'express'
import { createServer } from 'http'
import { spawn } from 'child_process'

const startMonitor = (conn) => {
    const app = express()
    const server = createServer(app)
    const PORT = process.env.PORT || 3500

    let startTime = Date.now()
    let lastMessage = "Sin mensajes aún"
    let botActive = true

    // Capturar último mensaje
    conn.ev.on('messages.upsert', (m) => {
        if (m.messages && m.messages[0]) {
            lastMessage = m.messages[0].message?.conversation || "Sin texto"
        }
    })

    conn.ev.on('connection.update', (update) => {
        botActive = update.connection === 'open'
    })

    app.use(express.static('public'))
    app.use(express.json())

    app.get('/', (req, res) => {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Monitor Bot Tiburón🦈</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background: #f0f0f0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .stat {
                    margin: 10px 0;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }
                @keyframes rgb {
                    0% { color: hsl(0, 100%, 50%); }
                    20% { color: hsl(72, 100%, 50%); }
                    40% { color: hsl(144, 100%, 50%); }
                    60% { color: hsl(216, 100%, 50%); }
                    80% { color: hsl(288, 100%, 50%); }
                    100% { color: hsl(360, 100%, 50%); }
                }
                .restart-button {
                    display: none;
                    width: auto;
                    padding: 8px 15px;
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 14px;
                    cursor: pointer;
                    margin: 10px auto;
                    transition: all 0.3s ease;
                }
                .restart-button:hover {
                    background: #ff2222;
                }
                h1 {
                    animation: rgb 8s infinite;
                }
                #uptime, #lastMessage {
                    animation: rgb 8s infinite;
                    font-weight: bold;
                }
                .status {
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Bot Tiburón🦈 Monitor</h1>
                <div class="status" id="statusText"></div>
                <div class="stat">
                    <strong>Tiempo Activo:</strong>
                    <span id="uptime">Cargando...</span>
                </div>
                <div class="stat">
                    <strong>Último Mensaje:</strong>
                    <span id="lastMessage">Cargando...</span>
                </div>
                <button id="restartButton" class="restart-button" onclick="restartBot()">
                    BOT ENCENDIDO - PRESIONA PARA REINICIAR
                </button>
            </div>
            <script>
                function formatUptime(ms) {
                    let seconds = Math.floor(ms / 1000);
                    let minutes = Math.floor(seconds / 60);
                    let hours = Math.floor(minutes / 60);
                    let days = Math.floor(hours / 24);
                    return \`\${days}d \${hours%24}h \${minutes%60}m \${seconds%60}s\`;
                }

                function updateStats() {
                    fetch('/stats')
                        .then(response => response.json())
                        .then(data => {
                            document.getElementById('uptime').textContent = data.uptime;
                            document.getElementById('lastMessage').textContent = data.lastMessage;
                            document.getElementById('statusText').textContent = data.botActive ? "BOT ACTIVO" : "BOT APAGADO";
                            document.getElementById('statusText').style.color = data.botActive ? "#4CAF50" : "#ff4444";
                            document.getElementById('restartButton').style.display = data.botActive ? "none" : "block";
                        })
                        .catch(console.error);
                }

                function restartBot() {
                    fetch('/restart', { method: 'POST' })
                        .then(response => response.json())
                        .then(data => {
                            if(data.status === 'restarting') {
                                alert('Reiniciando el bot...');
                            }
                        })
                        .catch(console.error);
                }
                
                setInterval(updateStats, 1000);
                updateStats();
            </script>
        </body>
        </html>
        `)
    })

    app.get('/stats', (req, res) => {
        const uptime = formatUptime(Date.now() - startTime)
        res.json({
            uptime,
            lastMessage,
            botActive
        })
    })

    app.post('/restart', (req, res) => {
        const child = spawn('node', ['main.js'], {
            detached: true,
            stdio: 'inherit'
        })
        res.json({ status: 'restarting' })
    })

    function formatUptime(ms) {
        let seconds = Math.floor(ms / 1000)
        let minutes = Math.floor(seconds / 60)
        let hours = Math.floor(minutes / 60)
        let days = Math.floor(hours / 24)
        return `${days}d ${hours%24}h ${minutes%60}m ${seconds%60}s`
    }

    server.listen(PORT, '0.0.0.0', () => {
        console.log('Monitor web iniciado en puerto:', PORT)
    })
}

export default startMonitor
