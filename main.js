const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const resizeImg = require("resize-img");

const isMac = process.platform === "darwin";
const isDev = process.env.NODE_ENV !== "production";

let mainWindow;

// Create the main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
    title: "Image Resizer",
    width:  500,
      height: 600,
      webPreferences: {
          contextIsolation: true,
          nodeIntegration: true,
        preload: path.join(__dirname, "preload.js"),
    }
  });

  // Open devtools if in dev env
  // if (isDev) {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

// Create about window
function createAboutWindow() {
    const aboutWindow = new BrowserWindow({
        title: "About Image Resizer",
        width: 300,
        height: 300,
    });
    
    aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
    
 }

// App i sready
app.whenReady().then(() => {
  createMainWindow();

  // Implement menu
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Menu template
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
                  label: "About",
                  click: createAboutWindow
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
    },
    ...(!isMac ? [
        {
            label: "Help",
            submenu: [{
                label: "About",
                click: createAboutWindow
            }],
      }
  ] : []),
];

// Remove mainWin when closed
app.on("window-all-closed", () => { 
    mainWindow = null;
});

// Respond to ipcRenderer events
ipcMain.on("image:resize", (e, options) => { 
    options.dest = path.join(os.homedir(), "imgresizer");

    resizeImage(options);
});

// Resize image
async function resizeImage({ imgPath, width, height, dest }) { 

    try {
        const newpath = await resizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height
        });

        const filename = path.basename(imgPath);

        // Create dest folder if not exists
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        
        }
        
        // Write file to dest folder
        fs.writeFileSync(path.join(dest, filename), newpath);

        // Send success message to renderer
        mainWindow.webContents.send("image:done");

        // Open dest folder
        shell.openPath(dest);
        
    } catch (error) {
        console.log(error);
    }

}

// Quit when all windows are closed
app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});
