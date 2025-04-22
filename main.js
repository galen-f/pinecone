const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {


  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'media', 'Pinecone_logo.png')
  });

  win.loadFile('public/index.html');
  // win.webContents.openDevTools(); // Enable for debugging

  const { dialog, ipcMain } = require('electron');

  ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
    // console.log('Electron process started')
  });

  return result.canceled ? null : result.filePaths[0];
});
}

app.whenReady().then(createWindow);
