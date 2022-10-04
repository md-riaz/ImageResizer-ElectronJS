const form = document.querySelector("#img-form");
const img = document.querySelector("#img");
const outputPath = document.querySelector("#output-path");
const filename = document.querySelector("#filename");
const heightInput = document.querySelector("#height");
const widthInput = document.querySelector("#width");

function loadImage(e) {
  const file = e.target.files[0];

  if (!isFileImage(file)) {
    alertError("Please select an image file");
    return;
  }

  // Get original dimensions
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = function () {
    const { width, height } = image;
    widthInput.value = width;
    heightInput.value = height;
    URL.revokeObjectURL(image.src);
  };

  form.style.display = "block";
  filename.textContent = file.name;
  outputPath.textContent = path.join(os.homedir(), "imgresizer");
}

// Send image data to main process
function sendImage(e) {
  e.preventDefault();

  const width = widthInput.value;
  const height = heightInput.value;
  const imgPath = img.files[0].path;

  if (!img.files[0]) {
    alertError("Please select an image");
    return;
  }

  if (width === "" || height === "") {
    alertError("Please enter a width and height");
    return;
  }

  // Send to main using ipcRenderer
  ipcRenderer.send("image:resize", {
    imgPath,
    width,
    height,
  });
}

// Listen for image:done
ipcRenderer.on("image:done", () => {
  alertSuccess(`Image resized to ${widthInput.value}x${heightInput.value}`);
  img.value = "";
});

// Make sure file is image
function isFileImage(file) {
  const acceptedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
  ];

  return file && acceptedImageTypes.includes(file.type);
}

function alertError(msg) {
  Toastify.toast({
    text: msg,
    duration: 5000,
    close: false,
    style: {
      background: "linear-gradient(to right, #ff5f6d, #ffc371)",
      color: "white",
      textAlign: "center",
    },
  });
}

function alertSuccess(msg) {
  Toastify.toast({
    text: msg,
    duration: 5000,
    close: false,
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)",
      color: "white",
      textAlign: "center",
    },
  });
}

img.addEventListener("change", loadImage);
form.addEventListener("submit", sendImage);
