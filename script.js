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
    if (q2 && q2.value === 'b') {
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
    if (q3 && q3.value === 'b') {
      score++;
      explanations.push(
        'Q3: Correct! Grade reversals both shed water off the trail and add variety for users.'
      );
    } else {
      explanations.push(
        'Q3: Incorrect. Grade reversals are needed to drain water and improve trail flow; they do more than aesthetics.'
      );
    }
    // Question 4
    const q4 = document.querySelector('input[name="q4"]:checked');
    if (q4 && q4.value === 'b') {
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
});