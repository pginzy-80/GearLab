# GearLab — Gear Ratio Design Tool

GearLab is an educational web app for exploring a single gear pair. It calculates gear ratio, output RPM, and an estimated output torque, and includes a simple target-speed gear-pair finder and in-session design comparison.

## Run locally
1. Download or unzip this project folder.
2. Open `index.html` in a modern web browser.
3. Change the input values and test the calculator.

No dependencies, database, build step, or API key is required.

## Publish online
You can publish this static website using GitHub Pages:
1. Create a GitHub repository and upload `index.html`, `style.css`, `script.js`, and `README.md` to the repository root.
2. Open the repository's **Settings → Pages**.
3. Select deployment from the `main` branch and `/ (root)` folder, then save.
4. Wait for GitHub Pages to publish the site and use the URL it provides.

## Model and assumptions
- Gear ratio = driven gear tooth count / driver gear tooth count.
- Output RPM = input RPM / gear ratio.
- Estimated output torque = input torque × gear ratio × efficiency.
- Efficiency is a user-selected assumption between 50% and 100%.
- The gear finder searches tooth-count pairs within a user-selected range and ranks them by percentage error from the target output RPM.
- Design comparisons are stored only in the current browser session; there is no server or database.

## Limitations
This is a learning tool, not a production engineering design validator. It does not assess gear module/pitch, center distance, tooth profile, material strength, lubrication, thermal limits, bearing loads, shaft deflection, noise, fatigue, or safety factors. The gear-pair finder assumes the selected gears are otherwise compatible. Validate any real-world design using appropriate engineering methods and qualified supervision.

## Suggested next improvements
- Add gear module and center-distance compatibility checks.
- Add multi-stage gear trains.
- Add an exportable design report.
- Add unit tests for calculation and validation logic.
- Compare model estimates against supervised measurements from a real gear-motor setup.
