const video = document.getElementById('video');
const statusText = document.getElementById('status');

async function loadModels() {
  statusText.innerText = "Chargement des modèles...";
  await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  statusText.innerText = "Modèles chargés !";
}

async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
  } catch (err) {
    console.error("Erreur webcam :", err);
    statusText.innerText = "Impossible d'accéder à la webcam.";
  }
}

async function getReferenceFace() {
  const img = await faceapi.fetchImage('moi.jpg');
  const detection = await faceapi.detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  if (!detection) {
    alert("Aucun visage trouvé dans moi.jpg !");
    return null;
  }

  return new faceapi.LabeledFaceDescriptors('Aaron', [detection.descriptor]);
}

async function init() {
  await loadModels();
  await startVideo();

  const referenceFace = await getReferenceFace();
  if (!referenceFace) return;

  video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    const faceMatcher = new faceapi.FaceMatcher(referenceFace, 0.6);

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceDescriptors();

      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      resizedDetections.forEach(d => {
        const bestMatch = faceMatcher.findBestMatch(d.descriptor);
        const box = d.detection.box;
        const text = bestMatch.toString();
        const drawBox = new faceapi.draw.DrawBox(box, { label: text });
        drawBox.draw(canvas);
        statusText.innerText = "Résultat : " + text;
      });
    }, 200);
  });
}

init();
