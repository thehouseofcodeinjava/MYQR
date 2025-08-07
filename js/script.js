let qrCodeData = null;
let logoImg = null;
let textDiv = null;
let maskImgElement = null;
let history = [];
let historyIndex = -1;

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

function saveState() {
  const state = {
    content: document.getElementById('content').value,
    fgColor: document.getElementById('fg-color').value,
    bgColor: document.getElementById('bg-color').value,
    shape: document.getElementById('shape').value,
    size: document.getElementById('size').value,
    logoSize: document.getElementById('logo-size').value,
    textOverlay: document.getElementById('text-overlay').value,
    textSize: document.getElementById('text-size').value,
    textColor: document.getElementById('text-color').value,
    maskOpacity: document.getElementById('mask-opacity').value,
    maskScale: document.getElementById('mask-scale').value,
    invertMask: document.getElementById('invert-mask').checked,
    errorCorrection: document.getElementById('error-correction').value,
    template: document.getElementById('template').value
  };
  history = history.slice(0, historyIndex + 1);
  history.push(state);
  historyIndex++;
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    applyState(history[historyIndex]);
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    applyState(history[historyIndex]);
  }
}

function applyState(state) {
  document.getElementById('content').value = state.content;
  document.getElementById('fg-color').value = state.fgColor;
  document.getElementById('bg-color').value = state.bgColor;
  document.getElementById('shape').value = state.shape;
  document.getElementById('size').value = state.size;
  document.getElementById('logo-size').value = state.logoSize;
  document.getElementById('text-overlay').value = state.textOverlay;
  document.getElementById('text-size').value = state.textSize;
  document.getElementById('text-color').value = state.textColor;
  document.getElementById('mask-opacity').value = state.maskOpacity;
  document.getElementById('mask-scale').value = state.maskScale;
  document.getElementById('invert-mask').checked = state.invertMask;
  document.getElementById('error-correction').value = state.errorCorrection;
  document.getElementById('template').value = state.template;
  generateQR();
}

function applyTemplate() {
  const template = document.getElementById('template').value;
  if (template === 'minimal') {
    document.getElementById('fg-color').value = '#000000';
    document.getElementById('bg-color').value = '#ffffff';
    document.getElementById('shape').value = 'square';
    document.getElementById('text-color').value = '#000000';
  } else if (template === 'vibrant') {
    document.getElementById('fg-color').value = '#ff4500';
    document.getElementById('bg-color').value = '#ffffe0';
    document.getElementById('shape').value = 'circle';
    document.getElementById('text-color').value = '#ff4500';
  } else if (template === 'corporate') {
    document.getElementById('fg-color').value = '#1e90ff';
    document.getElementById('bg-color').value = '#f5f6f5';
    document.getElementById('shape').value = 'rounded';
    document.getElementById('text-color').value = '#1e90ff';
  }
  generateQR();
}

function updateMaskPreview() {
  const maskInput = document.getElementById('mask-image');
  const maskPreview = document.getElementById('mask-preview');
  if (maskInput.files[0]) {
    maskPreview.src = URL.createObjectURL(maskInput.files[0]);
    maskPreview.style.display = 'block';
  } else {
    maskPreview.style.display = 'none';
  }
}

function checkScannability() {
  const fgColor = document.getElementById('fg-color').value;
  const bgColor = document.getElementById('bg-color').value;
  const maskOpacity = parseInt(document.getElementById('mask-opacity').value, 10) / 100;
  const feedback = document.getElementById('scannability-feedback');

  const getLuminance = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };
  const lum1 = getLuminance(fgColor);
  const lum2 = getLuminance(bgColor);
  const contrastRatio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  const adjustedRatio = maskOpacity < 1 ? contrastRatio * maskOpacity : contrastRatio;

  feedback.classList.remove('good', 'bad');
  if (adjustedRatio > 4.5) {
    feedback.textContent = 'Good scannability: Sufficient contrast.';
    feedback.classList.add('good');
  } else {
    feedback.textContent = 'Warning: Low contrast may affect scannability.';
    feedback.classList.add('bad');
  }
}

const debouncedGenerateQR = debounce(generateQR, 250);

function generateQR() {
  saveState();
  const content = document.getElementById('content').value.trim();
  if (!content) {
    return;
  }
  const fgColor = document.getElementById('fg-color').value;
  const bgColor = document.getElementById('bg-color').value;
  const shape = document.getElementById('shape').value;
  const qrSize = parseInt(document.getElementById('size').value, 10);
  const logoInput = document.getElementById('logo');
  const logoSizePercent = parseInt(document.getElementById('logo-size').value, 10);
  const textOverlay = document.getElementById('text-overlay').value;
  const textSize = parseInt(document.getElementById('text-size').value, 10);
  const textColor = document.getElementById('text-color').value;
  const maskOpacity = parseInt(document.getElementById('mask-opacity').value, 10) / 100;
  const maskScale = parseInt(document.getElementById('mask-scale').value, 10) / 100;
  const invertMask = document.getElementById('invert-mask').checked;
  const errorCorrection = document.getElementById('error-correction').value;

  const qrPreview = document.getElementById('qr-preview');
  qrPreview.innerHTML = `<canvas id="qr-canvas" width="${qrSize}" height="${qrSize}"></canvas>`;
  const finalCanvas = document.getElementById('qr-canvas');
  const ctx = finalCanvas.getContext('2d');

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = qrSize;
  tempCanvas.height = qrSize;

  QRCode.toCanvas(tempCanvas, content, {
    width: qrSize,
    color: {
      dark: fgColor,
      light: bgColor
    },
    errorCorrectionLevel: errorCorrection
  }, () => {
    ctx.clearRect(0, 0, qrSize, qrSize);

    const bgInput = document.getElementById('bg-image');
    if (bgInput.files[0]) {
      const bgImg = new Image();
      bgImg.src = URL.createObjectURL(bgInput.files[0]);
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, qrSize, qrSize);
        drawQRWithShapeAndMask();
      };
    } else {
      drawQRWithShapeAndMask();
    }

    function drawQRWithShapeAndMask() {
      const maskInput = document.getElementById('mask-image');
      const shapedCanvas = document.createElement('canvas');
      shapedCanvas.width = qrSize;
      shapedCanvas.height = qrSize;
      const shapedCtx = shapedCanvas.getContext('2d');

      applyShape(shapedCanvas, tempCanvas, shape);

      if (maskInput.files[0]) {
        const maskImg = new Image();
        maskImg.src = URL.createObjectURL(maskInput.files[0]);
        maskImg.onload = () => {
          shapedCtx.globalCompositeOperation = invertMask ? 'destination-out' : 'destination-in';
          shapedCtx.globalAlpha = maskOpacity;
          const scaledSize = qrSize * maskScale;
          const offset = (qrSize - scaledSize) / 2;
          shapedCtx.drawImage(maskImg, offset, offset, scaledSize, scaledSize);
          shapedCtx.globalAlpha = 1.0;
          ctx.drawImage(shapedCanvas, 0, 0);

          if (maskImgElement) {
            maskImgElement.remove();
          }
          maskImgElement = new Image();
          maskImgElement.className = 'draggable';
          maskImgElement.src = URL.createObjectURL(maskInput.files[0]);
          maskImgElement.style.width = `${scaledSize}px`;
          maskImgElement.style.left = `${offset}px`;
          maskImgElement.style.top = `${offset}px`;
          maskImgElement.style.opacity = maskOpacity;
          makeDraggable(maskImgElement);
          qrPreview.appendChild(maskImgElement);

          finalizeQR();
        };
      } else {
        ctx.drawImage(shapedCanvas, 0, 0);
        finalizeQR();
      }
    }

    function finalizeQR() {
      if (logoInput.files[0]) {
        if (logoImg) logoImg.remove();
        logoImg = new Image();
        logoImg.className = 'draggable';
        logoImg.src = URL.createObjectURL(logoInput.files[0]);
        logoImg.style.width = `${qrSize * (logoSizePercent / 100)}px`;
        logoImg.style.left = `${qrSize / 2 - (qrSize * logoSizePercent / 200)}px`;
        logoImg.style.top = `${qrSize / 2 - (qrSize * logoSizePercent / 200)}px`;
        makeDraggable(logoImg);
        qrPreview.appendChild(logoImg);
      }

      if (textOverlay) {
        if (textDiv) textDiv.remove();
        textDiv = document.createElement('div');
        textDiv.className = 'draggable';
        textDiv.textContent = textOverlay;
        textDiv.style.font = `${textSize}px Arial`;
        textDiv.style.color = textColor;
        textDiv.style.left = '10px';
        textDiv.style.top = `${qrSize - textSize - 10}px`;
        makeDraggable(textDiv);
        qrPreview.appendChild(textDiv);
      }

      qrCodeData = finalCanvas;
      checkScannability();
    }
  });
}

function applyShape(destinationCanvas, sourceCanvas, shape) {
  const ctx = destinationCanvas.getContext('2d');
  const w = destinationCanvas.width;
  const h = destinationCanvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save();

  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  } else if (shape === 'hexagon') {
    const r = w / 2;
    const cx = w / 2;
    const cy = h / 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i - Math.PI / 6;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.clip();
  } else if (shape === 'rounded') {
    const radius = 40;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(w - radius, 0);
    ctx.quadraticCurveTo(w, 0, w, radius);
    ctx.lineTo(w, h - radius);
    ctx.quadraticCurveTo(w, h, w - radius, h);
    ctx.lineTo(radius, h);
    ctx.quadraticCurveTo(0, h, 0, h - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();
  } else if (shape === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.clip();
  }
  ctx.drawImage(sourceCanvas, 0, 0, w, h);
  ctx.restore();
}

function makeDraggable(el) {
  el.style.position = 'absolute';
  el.onmousedown = function (e) {
    e.preventDefault();
    let offsetX = e.clientX - el.offsetLeft;
    let offsetY = e.clientY - el.offsetTop;
    function mouseMoveHandler(e) {
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    }
    function reset() {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', reset);
    }
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', reset);
  };
}

function removeLogo() {
  if (logoImg && logoImg.parentNode) {
    logoImg.parentNode.removeChild(logoImg);
    logoImg = null;
  }
  generateQR();
}

function removeMask() {
  const maskInput = document.getElementById('mask-image');
  const maskPreview = document.getElementById('mask-preview');
  maskInput.value = '';
  maskPreview.style.display = 'none';
  if (maskImgElement && maskImgElement.parentNode) {
    maskImgElement.parentNode.removeChild(maskImgElement);
    maskImgElement = null;
  }
  generateQR();
}

function downloadQR() {
  if (!qrCodeData) {
    alert('Please generate a QR code first.');
    return;
  }
  const format = document.getElementById('format').value;
  const filename = 'custom-qr-code.' + format;

  if (format === 'png') {
    html2canvas(document.getElementById('qr-preview')).then(canvas => {
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  } else if (format === 'svg') {
    const content = document.getElementById('content').value;
    const fgColor = document.getElementById('fg-color').value;
    const bgColor = document.getElementById('bg-color').value;
    const errorCorrection = document.getElementById('error-correction').value;
    QRCode.toString(content, {
      type: 'svg',
      color: {
        dark: fgColor,
        light: bgColor
      },
      width: 300,
      errorCorrectionLevel: errorCorrection
    }, (error, svg) => {
      if (error) {
        console.error(error);
        alert('Error generating SVG.');
        return;
      }
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      link.click();
    });
  } else if (format === 'pdf') {
    html2canvas(document.getElementById('qr-preview')).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      pdf.addImage(imgData, 'PNG', 10, 10, 180, 180);
      pdf.save(filename);
    });
  }
}

function init() {
    document.getElementById('content').addEventListener('input', debouncedGenerateQR);
    document.getElementById('size').addEventListener('change', generateQR);
    document.getElementById('fg-color').addEventListener('change', generateQR);
    document.getElementById('bg-color').addEventListener('change', generateQR);
    document.getElementById('shape').addEventListener('change', generateQR);
    document.getElementById('error-correction').addEventListener('change', generateQR);
    document.getElementById('logo').addEventListener('change', generateQR);
    document.getElementById('logo-size').addEventListener('input', debouncedGenerateQR);
    document.getElementById('bg-image').addEventListener('change', generateQR);
    document.getElementById('mask-image').addEventListener('change', () => { updateMaskPreview(); generateQR(); });
    document.getElementById('mask-opacity').addEventListener('input', debouncedGenerateQR);
    document.getElementById('mask-scale').addEventListener('input', debouncedGenerateQR);
    document.getElementById('invert-mask').addEventListener('change', generateQR);
    document.getElementById('text-overlay').addEventListener('input', debouncedGenerateQR);
    document.getElementById('text-size').addEventListener('input', debouncedGenerateQR);
    document.getElementById('text-color').addEventListener('change', generateQR);
    document.getElementById('template').addEventListener('change', applyTemplate);

    generateQR();
}

window.onload = init;
