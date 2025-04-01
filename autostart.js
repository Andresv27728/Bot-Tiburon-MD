
import { spawn } from 'child_process';
import { watchFile, unwatchFile } from 'fs';
import { join } from 'path';

const startBot = () => {
  const process = spawn('node', ['index.js'], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  });

  process.on('exit', (code) => {
    console.log('Bot stopped with code:', code);
    startBot(); // Reiniciar el bot
  });

  process.on('error', (err) => {
    console.error('Failed to start bot:', err);
    startBot(); // Reiniciar en caso de error
  });
};

console.log('Starting Bot Tiburón🦈 Auto-Restart System');
startBot();

// Vigilar cambios en archivos principales
const files = ['index.js', 'main.js', 'config.js'];
files.forEach(file => {
  watchFile(join(process.cwd(), file), () => {
    console.log(`${file} updated, restarting...`);
    process.exit();
  });
});
