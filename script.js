// JavaScript for interactive trail-building lesson

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // This page previously included a design tool and quiz. Those have been removed in
  // favor of a simpler trail drawing exercise and an external form for the quiz.

  // ---- Interactive Map Drawing (custom implementation using canvas) ----
  const canvas = document.getElementById('mapCanvas');
  const resetPathBtn = document.getElementById('reset-path');
  const lengthDiv = document.getElementById('path-length');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    // Constants for tile grid and coordinate conversion
    const tileSize = 256;
    const zoom = 13;
    const n = Math.pow(2, zoom);
    // Starting tile indices for the mosaic (top-left corner of the 4×4 grid)
    const xStart = 2487;
    const yStart = 2947;
    const tilesX = 4;
    const tilesY = 4;
    // Array to store tile images and track loading state
    const tileImages = [];
    let tilesLoaded = 0;
    let pathPoints = [];

    // Resize the canvas based on the tile grid
    canvas.width = tileSize * tilesX;
    canvas.height = tileSize * tilesY;

    // Load the 4×4 tile grid from OpenTopoMap.  Each tile image is drawn into the proper position once loaded.
    function loadTiles() {
      for (let i = 0; i < tilesX; i++) {
        for (let j = 0; j < tilesY; j++) {
          const xTile = xStart + i;
          const yTile = yStart + j;
          const tileImg = new Image();
          tileImg.crossOrigin = 'anonymous';
          tileImg.src = `https://a.tile.opentopomap.org/${zoom}/${xTile}/${yTile}.png`;
          tileImg.onload = () => {
            tilesLoaded++;
            // Store information for drawing later
            tileImages.push({ img: tileImg, i, j });
            // Once all tiles are loaded, draw the full map
            if (tilesLoaded === tilesX * tilesY) {
              draw();
            }
          };
          tileImg.onerror = () => {
            // If loading fails, fill the tile with a blank image
            const blank = document.createElement('canvas');
            blank.width = tileSize;
            blank.height = tileSize;
            const ctxBlank = blank.getContext('2d');
            ctxBlank.fillStyle = '#ffffff';
            ctxBlank.fillRect(0, 0, tileSize, tileSize);
            tilesLoaded++;
            tileImages.push({ img: blank, i, j });
            if (tilesLoaded === tilesX * tilesY) {
              draw();
            }
          };
        }
      }
    }
    loadTiles();

    // Draw the tile grid and the current path
    function draw() {
      // Draw each tile in its correct position
      for (const tile of tileImages) {
        ctx.drawImage(tile.img, tile.i * tileSize, tile.j * tileSize, tileSize, tileSize);
      }
      // Draw the path on top of the map
      if (pathPoints.length > 0) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].px, pathPoints[0].py);
        for (let k = 1; k < pathPoints.length; k++) {
          ctx.lineTo(pathPoints[k].px, pathPoints[k].py);
        }
        ctx.stroke();
        ctx.fillStyle = '#e74c3c';
        for (const pt of pathPoints) {
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    // Convert pixel coordinates to geographic coordinates
    function pixelToLatLon(px, py) {
      const globalX = xStart * tileSize + px;
      const globalY = yStart * tileSize + py;
      const lon = (globalX / (tileSize * n)) * 360 - 180;
      const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * globalY) / (tileSize * n))));
      const lat = (latRad * 180) / Math.PI;
      return { lat, lon };
    }
    // Haversine distance between two geographic points (in metres)
    function haversine(lat1, lon1, lat2, lon2) {
      const R = 6371000; // Earth radius in metres
      const toRad = Math.PI / 180;
      const phi1 = lat1 * toRad;
      const phi2 = lat2 * toRad;
      const dPhi = (lat2 - lat1) * toRad;
      const dLambda = (lon2 - lon1) * toRad;
      const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    // Update the displayed path length
    function updateLength() {
      if (pathPoints.length < 2) {
        lengthDiv.innerHTML = '';
        return;
      }
      let total = 0;
      for (let i = 1; i < pathPoints.length; i++) {
        const p1 = pathPoints[i - 1];
        const p2 = pathPoints[i];
        total += haversine(p1.lat, p1.lon, p2.lat, p2.lon);
      }
      const miles = total / 1609.34;
      lengthDiv.innerHTML = `<p><strong>Drawn path length:</strong> ${miles.toFixed(2)} mi</p>`;
    }
    // Handle clicks on the canvas to add points
    canvas.addEventListener('click', function (e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;
      const { lat, lon } = pixelToLatLon(px, py);
      pathPoints.push({ px, py, lat, lon });
      draw();
      updateLength();
    });
    // Reset path when the button is clicked
    resetPathBtn.addEventListener('click', function () {
      pathPoints = [];
      lengthDiv.innerHTML = '';
      draw();
    });
  }
});