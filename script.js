// JavaScript for interactive trail-building lesson

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  const sideslopeSlider = document.getElementById('sideslope');
  const sideslopeValue = document.getElementById('sideslope-value');
  const computeBtn = document.getElementById('compute');
  const outputDiv = document.getElementById('design-output');

  // Update display value for sideslope
  sideslopeSlider.addEventListener('input', () => {
    sideslopeValue.textContent = sideslopeSlider.value;
  });

  // Compute recommendations when button is clicked
  computeBtn.addEventListener('click', () => {
    const sideslope = parseFloat(sideslopeSlider.value);
    const soil = document.getElementById('soil').value;
    const users = document.getElementById('users').value;
    const verticalGain = parseFloat(document.getElementById('vertical-gain').value);
    const flow = document.getElementById('flow').value;

    // Calculate recommended average grade (%). Base is 10%.
    let avgGrade = 10;
    if (soil === 'sandy') {
      avgGrade -= 2; // reduce for loose soil
    } else if (soil === 'rocky') {
      avgGrade += 1; // a bit steeper allowed due to traction
    }
    if (users === 'equestrian') {
      avgGrade = Math.min(avgGrade, 8); // keep average lower for equestrians
    }

    // Maximum sustainable grade: half rule capped at 20%
    let maxGrade = Math.min(sideslope / 2, 20);
    // Ensure maxGrade isn’t lower than average (rare edge case)
    maxGrade = Math.max(maxGrade, avgGrade + 2);

    // Corridor dimensions
    let corridorWidthFeet = users === 'equestrian' ? 5 : 4; // approximate widths
    let corridorHeightFeet = users === 'equestrian' ? 10 : 8;

    // Grade reversal spacing (ft)
    let reversalSpacing;
    switch (flow) {
      case 'gentle':
        reversalSpacing = 50;
        break;
      case 'rolling':
        reversalSpacing = 35;
        break;
      case 'technical':
        reversalSpacing = 25;
        break;
      default:
        reversalSpacing = 40;
    }

    // Estimated trail length (ft) based on vertical gain and average grade
    let trailLengthFt;
    if (avgGrade > 0) {
      trailLengthFt = verticalGain / (avgGrade / 100);
    } else {
      trailLengthFt = 0;
    }
    const trailLengthMiles = trailLengthFt / 5280;

    // Build output HTML
    let html = '';
    html += `<p><strong>Recommended average grade:</strong> ${avgGrade.toFixed(
      1
    )}%</p>`;
    html += `<p><strong>Maximum grade (steepest section):</strong> ${maxGrade.toFixed(
      1
    )}%</p>`;
    html += `<p><strong>Corridor width:</strong> ${corridorWidthFeet.toFixed(
      1
    )} ft, <strong>height:</strong> ${corridorHeightFeet.toFixed(1)} ft</p>`;
    html += `<p><strong>Grade reversal spacing:</strong> every ${reversalSpacing} ft</p>`;
    html += `<p><strong>Estimated trail length to gain ${verticalGain} ft:</strong> ${trailLengthFt.toFixed(
      0
    )} ft (${trailLengthMiles.toFixed(2)} mi)</p>`;
    html += `<p><strong>Recommended outslope:</strong> 5% (tilt tread downhill to shed water)</p>`;
    outputDiv.innerHTML = html;
  });

  // Quiz handling
  const submitQuiz = document.getElementById('submit-quiz');
  const quizOutput = document.getElementById('quiz-output');
  submitQuiz.addEventListener('click', () => {
    let score = 0;
    const explanations = [];
    // Question 1
    const q1 = document.querySelector('input[name="q1"]:checked');
    if (q1 && q1.value === 'b') {
      score++;
      explanations.push(
        'Q1: Correct! The half rule states that a trail’s grade should not exceed half the hillside grade.'
      );
    } else {
      explanations.push(
        'Q1: Incorrect. Sustainable trail grades should be less than half the slope of the hillside to prevent water from running down the tread.'
      );
    }
    // Question 2
    const q2 = document.querySelector('input[name="q2"]:checked');
    // For Q2, option C (value "c") is correct (10% or less)
    if (q2 && q2.value === 'c') {
      score++;
      explanations.push(
        'Q2: Correct! Sustainable trails usually average around 10% grade or less.'
      );
    } else {
      explanations.push(
        'Q2: Incorrect. An average trail grade of 10% or less helps limit erosion and makes the trail more rideable or walkable.'
      );
    }
    // Question 3
    const q3 = document.querySelector('input[name="q3"]:checked');
    // For Q3, option C (value "c") is correct
    if (q3 && q3.value === 'c') {
      score++;
      explanations.push(
        'Q3: Correct! Grade reversals both shed water off the trail and add variety for users.'
      );
    } else {
      explanations.push(
        'Q3: Incorrect. Grade reversals are needed to drain water and improve trail flow; they do more than aesthetics or simply reducing outslope.'
      );
    }
    // Question 4
    const q4 = document.querySelector('input[name="q4"]:checked');
    // For Q4, option A (value "a") is correct
    if (q4 && q4.value === 'a') {
      score++;
      explanations.push(
        'Q4: Correct! An 8‑foot corridor is common for hikers and bikers, while equestrian trails need about 10 feet of clearance.'
      );
    } else {
      explanations.push(
        'Q4: Incorrect. Clearing an 8‑foot corridor (10 feet for equestrians) improves safety and sightlines.'
      );
    }

    // Display results
    const totalQuestions = 4;
    let resultHtml = `<p>You scored ${score} out of ${totalQuestions}.</p>`;
    resultHtml += '<ul>';
    for (const expl of explanations) {
      resultHtml += `<li>${expl}</li>`;
    }
    resultHtml += '</ul>';
    quizOutput.innerHTML = resultHtml;
  });

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