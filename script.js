(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const defaults = { driverTeeth: 12, drivenTeeth: 36, inputRpm: 3000, inputTorque: 2, efficiency: 95 };
  let savedDesigns = [];
  let designCounter = 1;

  const number = (id) => Number($(id).value);
  const format = (value, digits = 2) => Number(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  const whole = (value) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });

  function readCalculatorInputs() {
    return {
      driverTeeth: number("driverTeeth"),
      drivenTeeth: number("drivenTeeth"),
      inputRpm: number("inputRpm"),
      inputTorque: number("inputTorque"),
      efficiency: number("efficiency")
    };
  }

  function validateInputs(data) {
    if (!Number.isInteger(data.driverTeeth) || data.driverTeeth < 1 || data.driverTeeth > 200) {
      return "Driver teeth must be a whole number from 1 to 200.";
    }
    if (!Number.isInteger(data.drivenTeeth) || data.drivenTeeth < 1 || data.drivenTeeth > 200) {
      return "Driven teeth must be a whole number from 1 to 200.";
    }
    if (!Number.isFinite(data.inputRpm) || data.inputRpm < 0 || data.inputRpm > 100000) {
      return "Input speed must be between 0 and 100,000 RPM.";
    }
    if (!Number.isFinite(data.inputTorque) || data.inputTorque < 0 || data.inputTorque > 100000) {
      return "Input torque must be between 0 and 100,000 N·m.";
    }
    if (!Number.isFinite(data.efficiency) || data.efficiency < 50 || data.efficiency > 100) {
      return "Efficiency must be between 50% and 100%.";
    }
    return "";
  }

  function calculate(data) {
    const ratio = data.drivenTeeth / data.driverTeeth;
    const outputRpm = data.inputRpm / ratio;
    const outputTorque = data.inputTorque * ratio * (data.efficiency / 100);
    return { ...data, ratio, outputRpm, outputTorque, speedPercent: ratio === 0 ? 0 : 100 / ratio };
  }

  function updateCalculator() {
    const data = readCalculatorInputs();
    $("efficiencyValue").textContent = `${data.efficiency}%`;
    $("metricEfficiency").innerHTML = `${data.efficiency}<em>%</em>`;
    const error = validateInputs(data);
    $("calcError").textContent = error;
    if (error) return null;

    const result = calculate(data);
    $("metricRatio").textContent = `${format(result.ratio)}:1`;
    $("metricRpm").innerHTML = `${whole(result.outputRpm)} <em>RPM</em>`;
    $("metricTorque").innerHTML = `${format(result.outputTorque)} <em>N·m</em>`;
    $("speedChange").textContent = result.ratio > 1 ? "Speed reduction" : result.ratio < 1 ? "Speed increase" : "No speed change";
    $("ratioResult").innerHTML = `${format(result.ratio)}<span>:1</span>`;
    $("rpmResult").textContent = `${whole(result.outputRpm)} RPM`;
    $("torqueResult").textContent = `${format(result.outputTorque)} N·m`;
    $("speedPercent").textContent = `${format(result.speedPercent)}%`;
    $("ratioDescription").textContent = result.ratio > 1
      ? "A reduction stage: output rotates more slowly with higher torque."
      : result.ratio < 1
        ? "A speed-increasing stage: output rotates faster with lower torque."
        : "A 1:1 stage: both gears have the same rotational speed magnitude.";
    return result;
  }

  function resetCalculator() {
    Object.entries(defaults).forEach(([id, value]) => { $(id).value = value; });
    updateCalculator();
  }

  function saveCurrentDesign() {
    const result = updateCalculator();
    if (!result) return;
    savedDesigns.push({ id: designCounter++, ...result });
    renderSavedDesigns();
    $("saved").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderSavedDesigns() {
    const body = $("savedRows");
    if (savedDesigns.length === 0) {
      body.innerHTML = '<tr><td colspan="6" class="table-empty">No saved designs yet. Calculate a setup and choose “Save this design.”</td></tr>';
      return;
    }
    body.innerHTML = savedDesigns.map((item, index) => `
      <tr>
        <td><strong>Design ${index + 1}</strong></td>
        <td>${item.driverTeeth}T → ${item.drivenTeeth}T</td>
        <td>${format(item.ratio)}:1</td>
        <td>${whole(item.outputRpm)} RPM</td>
        <td>${format(item.outputTorque)} N·m</td>
        <td><button class="delete-button" type="button" data-delete="${item.id}" aria-label="Remove design ${index + 1}">Remove</button></td>
      </tr>`).join("");
  }

  function clearOptimizerError() { $("optimizerError").textContent = ""; }

  function findCombinations() {
    clearOptimizerError();
    const inputRpm = Number($("targetInputRpm").value);
    const targetRpm = Number($("targetOutputRpm").value);
    const minTeeth = Number($("minTeeth").value);
    const maxTeeth = Number($("maxTeeth").value);
    const allowIncrease = $("allowSpeedIncrease").checked;

    if (!Number.isFinite(inputRpm) || !Number.isFinite(targetRpm) || inputRpm <= 0 || targetRpm <= 0) {
      $("optimizerError").textContent = "Enter positive values for both input speed and target output speed.";
      return;
    }
    if (!Number.isInteger(minTeeth) || !Number.isInteger(maxTeeth) || minTeeth < 6 || maxTeeth > 200 || minTeeth > maxTeeth) {
      $("optimizerError").textContent = "Enter whole-number tooth limits from 6 to 200, with minimum no greater than maximum.";
      return;
    }

    const targetRatio = inputRpm / targetRpm;
    if (!allowIncrease && targetRatio < 1) {
      $("optimizerError").textContent = "Your target needs a speed increase. Enable “Include speed-increasing combinations” to search for those.";
      return;
    }

    const candidates = [];
    for (let driver = minTeeth; driver <= maxTeeth; driver++) {
      for (let driven = minTeeth; driven <= maxTeeth; driven++) {
        const ratio = driven / driver;
        if (!allowIncrease && ratio < 1) continue;
        const outputRpm = inputRpm / ratio;
        const errorPercent = Math.abs(outputRpm - targetRpm) / targetRpm * 100;
        candidates.push({ driver, driven, ratio, outputRpm, errorPercent });
      }
    }
    candidates.sort((a, b) => a.errorPercent - b.errorPercent || (a.driver + a.driven) - (b.driver + b.driven));
    // Avoid showing mirrored duplicates that produce the same ratio.
    const unique = [];
    const seen = new Set();
    for (const item of candidates) {
      const key = `${item.driver}/${item.driven}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
      if (unique.length === 6) break;
    }

    const container = $("recommendationResults");
    const summary = `Target ratio: ${format(targetRatio)}:1 · ${unique.length} close combination${unique.length === 1 ? "" : "s"} shown.`;
    container.innerHTML = `<p class="recommendation-summary">${summary}</p><div class="recommendation-list">${unique.map((item, index) => `
      <article class="recommendation-card ${index === 0 ? "best" : ""}">
        <div class="rec-top"><span class="rec-tag">${index === 0 ? "CLOSEST MATCH" : `OPTION ${index + 1}`}</span><span class="rec-error">${format(item.errorPercent)}% error</span></div>
        <h4>${item.driver}T <span style="color:#8098aa">→</span> ${item.driven}T</h4>
        <p>Ratio ${format(item.ratio)}:1 · Output ${whole(item.outputRpm)} RPM</p>
        <button type="button" data-use-driver="${item.driver}" data-use-driven="${item.driven}">Use this gear pair ↗</button>
      </article>`).join("")}</div>`;
  }

  $("calcForm").addEventListener("input", updateCalculator);
  $("resetBtn").addEventListener("click", resetCalculator);
  $("saveDesignBtn").addEventListener("click", saveCurrentDesign);
  $("clearSavedBtn").addEventListener("click", () => { savedDesigns = []; renderSavedDesigns(); });
  $("savedRows").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete]");
    if (!button) return;
    savedDesigns = savedDesigns.filter((item) => item.id !== Number(button.dataset.delete));
    renderSavedDesigns();
  });
  $("findGearsBtn").addEventListener("click", findCombinations);
  $("recommendationResults").addEventListener("click", (event) => {
    const button = event.target.closest("[data-use-driver]");
    if (!button) return;
    $("driverTeeth").value = button.dataset.useDriver;
    $("drivenTeeth").value = button.dataset.useDriven;
    updateCalculator();
    $("calculator").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Build the decorative gear silhouettes with SVG teeth.
  function gearPath(teeth, outerRadius, innerRadius) {
    const points = [];
    const step = (Math.PI * 2) / (teeth * 4);
    for (let i = 0; i < teeth * 4; i++) {
      const radius = [innerRadius, outerRadius, outerRadius, innerRadius][i % 4];
      const angle = i * step - Math.PI / 2;
      points.push(`${i === 0 ? "M" : "L"}${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`);
    }
    return points.join(" ") + " Z";
  }
  $("gearPathLarge").setAttribute("d", gearPath(18, 72, 64));
  $("gearPathSmall").setAttribute("d", gearPath(12, 46, 40));

  updateCalculator();
})();
