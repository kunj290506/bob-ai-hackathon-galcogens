"""
Automated Presentation Deck Generator for D1 Mission Readiness Copilot.
Generates a professional 12-slide landscape PDF (presentation/slides.pdf)
adhering strictly to official hackathon template guidelines.
"""

import base64
import os
from pathlib import Path
import subprocess
import sys

REPO_ROOT = Path(__file__).resolve().parent.parent
PRESENTATION_DIR = REPO_ROOT / "presentation"
OUTPUT_PDF = PRESENTATION_DIR / "slides.pdf"
SCREENSHOTS_DIR = REPO_ROOT / "demo" / "screenshots"

def get_base64_image(image_path: Path) -> str:
    if image_path.exists():
        with open(image_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
            return f"data:image/png;base64,{encoded}"
    return ""

def build_slides_html() -> str:
    img_dashboard = get_base64_image(SCREENSHOTS_DIR / "01-home-dashboard.png")
    img_output = get_base64_image(SCREENSHOTS_DIR / "03-result-output.png")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>D1 Mission Readiness & Predictive Maintenance Copilot — Pitch Deck</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

@page {{
  size: 16in 9in;
  margin: 0;
}}

* {{
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}}

body {{
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #070a12;
  color: #f8fafc;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}}

.slide {{
  width: 16in;
  height: 9in;
  page-break-after: always;
  break-after: page;
  padding: 0.8in 1in;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 15% 85%, rgba(139, 92, 246, 0.04) 0%, transparent 40%),
              #070a12;
  border-bottom: 1px solid #1e293b;
}}

/* Grid pattern background */
.slide::before {{
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: radial-gradient(#1e293b 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.25;
  pointer-events: none;
}}

/* Top header bar */
.slide-header {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  padding-bottom: 0.2in;
}}

.slide-tag {{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}}

.slide-tag.purple {{
  color: #c084fc;
  background: rgba(192, 132, 252, 0.1);
  border-color: rgba(192, 132, 252, 0.3);
}}

.slide-tag.amber {{
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
}}

.slide-tag.red {{
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.3);
}}

.slide-counter {{
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
}}

/* Slide Title */
.slide-title-block {{
  margin-top: 0.25in;
  margin-bottom: 0.3in;
  position: relative;
  z-index: 10;
}}

.slide-title {{
  font-size: 38px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
  line-height: 1.15;
}}

.slide-subtitle {{
  font-size: 18px;
  color: #94a3b8;
  margin-top: 6px;
  font-weight: 400;
}}

/* Slide Body */
.slide-content {{
  flex: 1;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: center;
}}

/* Grid layouts */
.grid-2 {{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4in;
}}

.grid-3 {{
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.35in;
}}

.grid-4 {{
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 0.25in;
}}

/* Cards */
.card {{
  background: #0d1322;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 0.3in;
  position: relative;
}}

.card.highlight {{
  border-color: rgba(16, 185, 129, 0.4);
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, #0d1322 100%);
}}

.card.purple-glow {{
  border-color: rgba(139, 92, 246, 0.4);
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, #0d1322 100%);
}}

.card-title {{
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}}

.card-body {{
  font-size: 16px;
  line-height: 1.5;
  color: #94a3b8;
}}

.kpi-num {{
  font-family: 'JetBrains Mono', monospace;
  font-size: 46px;
  font-weight: 800;
  color: #10b981;
  line-height: 1;
  margin-bottom: 8px;
}}

.kpi-num.red {{ color: #ef4444; }}
.kpi-num.amber {{ color: #f59e0b; }}
.kpi-num.purple {{ color: #a855f7; }}

.kpi-label {{
  font-size: 14px;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
}}

/* Workflow horizontal flow */
.flow-container {{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}}

.flow-step {{
  flex: 1;
  background: #0d1322;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
}}

.flow-step.active {{
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.08);
}}

.flow-arrow {{
  color: #475569;
  font-size: 24px;
  font-weight: bold;
}}

/* Code / mono pills */
.mono-pill {{
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  background: #1e293b;
  color: #38bdf8;
  padding: 4px 10px;
  border-radius: 4px;
  display: inline-block;
  margin-right: 6px;
  margin-bottom: 6px;
}}

/* Slide Footer */
.slide-footer {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
  border-top: 1px solid rgba(51, 65, 85, 0.4);
  padding-top: 0.15in;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #64748b;
}}
</style>
</head>
<body>

<!-- SLIDE 1: TITLE & IDENTITY -->
<div class="slide" style="justify-content: center; align-items: center; text-align: center;">
  <div style="max-width: 12in;">
    <div style="display: inline-flex; align-items: center; gap: 10px; padding: 8px 20px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 9999px; margin-bottom: 24px;">
      <span style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981;"></span>
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; letter-spacing: 0.15em; color: #10b981; text-transform: uppercase;">BOB AI HACKATHON SUBMISSION &bull; TRACK: AI</span>
    </div>

    <h1 style="font-size: 56px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 16px;">
      D1 Mission Readiness &<br><span style="color: #10b981;">Predictive Maintenance Copilot</span>
    </h1>

    <p style="font-size: 22px; color: #94a3b8; max-width: 9in; margin: 0 auto 36px; line-height: 1.5;">
      Condition-Based Maintenance (CBM+) powered by GPU-Accelerated Prognostics, watsonx.ai Granite 3.0, and the IBM Bob FastMCP Autonomous Protocol.
    </p>

    <div style="display: flex; justify-content: center; gap: 40px; margin-top: 20px; padding-top: 24px; border-top: 1px solid #1e293b;">
      <div style="text-align: left;">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #64748b; text-transform: uppercase;">Team</div>
        <div style="font-size: 18px; font-weight: 700; color: #f8fafc;">Galcogens</div>
      </div>
      <div style="text-align: left;">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #64748b; text-transform: uppercase;">Team Lead</div>
        <div style="font-size: 18px; font-weight: 700; color: #f8fafc;">Kunj <span style="font-size: 14px; font-weight: 400; color: #94a3b8;">(d24aiml082@charusat.edu.in)</span></div>
      </div>
      <div style="text-align: left;">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #64748b; text-transform: uppercase;">Members</div>
        <div style="font-size: 18px; font-weight: 700; color: #f8fafc;">Vedant, Path, Venisha</div>
      </div>
    </div>
  </div>
</div>

<!-- SLIDE 2: THE PROBLEM -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-tag red">Operational Problem</div>
    <div class="slide-counter">SLIDE 02 / 12</div>
  </div>
  <div class="slide-title-block">
    <h2 class="slide-title">The Problem: High Cost of Unpredictable Readiness</h2>
    <p class="slide-subtitle">Military organizations struggle to guarantee platform airworthiness before critical mission commitment.</p>
  </div>
  <div class="slide-content">
    <div class="grid-4" style="margin-bottom: 24px;">
      <div class="card">
        <div class="kpi-num red">$90B</div>
        <div class="kpi-label">Annual DoD Maintenance</div>
        <p class="card-body" style="margin-top: 8px; font-size: 14px;">Over $90 billion spent annually on military fleet maintenance with massive logistics recovery overhead.</p>
      </div>
      <div class="card">
        <div class="kpi-num amber">&gt;50%</div>
        <div class="kpi-label">Unscheduled Failures</div>
        <p class="card-body" style="margin-top: 8px; font-size: 14px;">More than half of platform breakdowns occur unexpectedly during operations, aborting planned sorties.</p>
      </div>
      <div class="card">
        <div class="kpi-num">0%</div>
        <div class="kpi-label">Real-Time HUMS Analysis</div>
        <p class="card-body" style="margin-top: 8px; font-size: 14px;">High-frequency telemetry (vibration, thermal creep, pressure) sits unanalyzed in siloed flight recorders.</p>
      </div>
      <div class="card">
        <div class="kpi-num purple">Weeks</div>
        <div class="kpi-label">Recovery Latency</div>
        <p class="card-body" style="margin-top: 8px; font-size: 14px;">Unplanned grounding forces emergency supply rushes, grounding wings and draining operational tempo.</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="color: #ef4444;">Conventional Maintenance Doctrine</div>
        <ul style="list-style: none; padding-left: 0;" class="card-body">
          <li style="margin-bottom: 8px;">&bull; <strong>Static Calendar Schedules:</strong> 100-hour phase inspections regardless of actual subsystem wear.</li>
          <li style="margin-bottom: 8px;">&bull; <strong>Binary Grounding:</strong> Platforms are either full go or completely grounded with no mission nuance.</li>
          <li>&bull; <strong>Paper Logbooks & Disconnect:</strong> Maintenance records disconnected from onboard sensor health.</li>
        </ul>
      </div>
      <div class="card">
        <div class="card-title" style="color: #10b981;">Operational Mission Impact</div>
        <ul style="list-style: none; padding-left: 0;" class="card-body">
          <li style="margin-bottom: 8px;">&bull; <strong>Air Tasking Order Failures:</strong> Degradation discovered on the tarmac minutes before takeoff.</li>
          <li style="margin-bottom: 8px;">&bull; <strong>Premature Component Scrapping:</strong> Healthy parts removed simply because calendar intervals expired.</li>
          <li>&bull; <strong>Combat Readiness Dip:</strong> Squadron availability often hovers below minimum operational requirements.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="slide-footer">
    <span>D1 COPILOT &bull; PROBLEM STATEMENT</span>
    <span>DEFENSE CBM+ CHALLENGE</span>
  </div>
</div>

<!-- SLIDE 3: THE D1 SOLUTION -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-tag">Closed-Loop Architecture</div>
    <div class="slide-counter">SLIDE 03 / 12</div>
  </div>
  <div class="slide-title-block">
    <h2 class="slide-title">The D1 Solution: Autonomous CBM+ Operational Loop</h2>
    <p class="slide-subtitle">A closed-loop system connecting raw sensor telemetry to autonomous AI decision support.</p>
  </div>
  <div class="slide-content">
    <div class="flow-container" style="margin-bottom: 30px;">
      <div class="flow-step">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #38bdf8; margin-bottom: 4px;">STEP 01</div>
        <div style="font-weight: 700; font-size: 16px;">HUMS Telemetry</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">14 degradation channels (T30, EGT, P30, RPM)</div>
      </div>
      <div class="flow-arrow">&rarr;</div>
      <div class="flow-step">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #38bdf8; margin-bottom: 4px;">STEP 02</div>
        <div style="font-weight: 700; font-size: 16px;">Anomaly Detection</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Isolation Forest + Rolling Z-Scores</div>
      </div>
      <div class="flow-arrow">&rarr;</div>
      <div class="flow-step active">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #10b981; margin-bottom: 4px;">STEP 03</div>
        <div style="font-weight: 700; font-size: 16px;">GPU RUL Prediction</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">XGBoost (18.21 cycles holdout RMSE)</div>
      </div>
      <div class="flow-arrow">&rarr;</div>
      <div class="flow-step">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #38bdf8; margin-bottom: 4px;">STEP 04</div>
        <div style="font-weight: 700; font-size: 16px;">Mission Matching</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">FMC/PMC/NMC airworthiness assessment</div>
      </div>
      <div class="flow-arrow">&rarr;</div>
      <div class="flow-step active">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #c084fc; margin-bottom: 4px;">STEP 05</div>
        <div style="font-weight: 700; font-size: 16px;">Bob Copilot</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">FastMCP tools + watsonx Granite 3-8B</div>
      </div>
    </div>

    <div class="grid-3">
      <div class="card highlight">
        <div class="card-title">1. Predict Failure Horizontally</div>
        <p class="card-body">Forecasts exact remaining cycles/hours with 95% confidence intervals, alerting crews days before catastrophic failure occurs.</p>
      </div>
      <div class="card highlight">
        <div class="card-title">2. Correlate with Mission Windows</div>
        <p class="card-body">Checks whether forecasted degradation will violate upcoming flight operational horizons (e.g. 48-hour combat sortie window).</p>
      </div>
      <div class="card highlight">
        <div class="card-title">3. Dispatch Actionable Work Orders</div>
        <p class="card-body">Generates official AFTO Form 781A discrepancy sheets, ranks turnaround work orders, and assigns logistics part codes.</p>
      </div>
    </div>
  </div>
  <div class="slide-footer">
    <span>D1 COPILOT &bull; SYSTEM ARCHITECTURE</span>
    <span>CLOSED-LOOP OPERATIONAL COPILOT</span>
  </div>
</div>

<!-- SLIDE 4: PREDICTIVE INTELLIGENCE -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-tag">ML Prognostics Engine</div>
    <div class="slide-counter">SLIDE 04 / 12</div>
  </div>
  <div class="slide-title-block">
    <h2 class="slide-title">Predictive Intelligence: NASA C-MAPSS Benchmark</h2>
    <p class="slide-subtitle">Trained on real aerospace turbofan degradation benchmarks &mdash; verified in serialized model weights.</p>
  </div>
  <div class="slide-content">
    <div class="grid-2">
      <div>
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-title">Rigorous Feature Engineering (108 Features)</div>
          <p class="card-body" style="font-size: 15px; margin-bottom: 12px;">
            14 sensor channels with physical aerodynamic degradation signatures, transformed using exponential moving statistics over 5, 10, and 20 cycle windows.
          </p>
          <div>
            <span class="mono-pill">s_4: LPT Exit Temp (26.7%)</span>
            <span class="mono-pill">s_11: HPC Outlet Pressure (11.4%)</span>
            <span class="mono-pill">s_15: Bypass Ratio (6.1%)</span>
            <span class="mono-pill">s_9: Core Speed (3.0%)</span>
          </div>
        </div>

        <div class="card highlight">
          <div class="card-title">GPU-Accelerated Model Pipeline</div>
          <ul style="list-style: none;" class="card-body">
            <li style="margin-bottom: 6px;">&bull; <strong>Algorithm:</strong> XGBoost Regressor (<span style="font-family: monospace;">tree_method='hist'</span>)</li>
            <li style="margin-bottom: 6px;">&bull; <strong>Training Duration:</strong> 3.37s on NVIDIA RTX 3050 (CUDA)</li>
            <li style="margin-bottom: 6px;">&bull; <strong>Dataset:</strong> NASA C-MAPSS FD001 (20,631 run-to-failure cycles)</li>
            <li>&bull; <strong>Unsupervised Anomaly Detector:</strong> Isolation Forest (100 estimators)</li>
          </ul>
        </div>
      </div>

      <div>
        <div class="card" style="background: #0b1120; border-color: #334155;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #10b981; margin-bottom: 12px; font-weight: 700;">
            VERIFIED BENCHMARK PERFORMANCE (src/backend/app/ml/weights/model_metrics.json)
          </div>
          <div class="grid-2" style="gap: 16px; margin-bottom: 16px;">
            <div style="background: #070a12; padding: 14px; border-radius: 8px; border: 1px solid #1e293b;">
              <div class="kpi-num" style="font-size: 32px;">18.21</div>
              <div class="kpi-label">Holdout Test RMSE (Cycles)</div>
            </div>
            <div style="background: #070a12; padding: 14px; border-radius: 8px; border: 1px solid #1e293b;">
              <div class="kpi-num" style="font-size: 32px;">12.75</div>
              <div class="kpi-label">Holdout Test MAE (Cycles)</div>
            </div>
            <div style="background: #070a12; padding: 14px; border-radius: 8px; border: 1px solid #1e293b;">
              <div class="kpi-num" style="font-size: 32px;">0.7935</div>
              <div class="kpi-label">Test Set R&sup2; Score</div>
            </div>
            <div style="background: #070a12; padding: 14px; border-radius: 8px; border: 1px solid #1e293b;">
              <div class="kpi-num" style="font-size: 32px;">1089.2</div>
              <div class="kpi-label">NASA PHM08 Penalty Score</div>
            </div>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.4;">
            *PHM08 competition metric exponentially penalizes late predictions where failure occurs before forecast, ensuring flight safety.
          </p>
        </div>
      </div>
    </div>
  </div>
  <div class="slide-footer">
    <span>D1 COPILOT &bull; MACHINE LEARNING PROGNOSTICS</span>
    <span>AEROSPACE BENCHMARK VERIFICATION</span>
  </div>
</div>

<!-- SLIDE 5: MISSION-AWARE READINESS -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-tag amber">Operational Readiness</div>
    <div class="slide-counter">SLIDE 05 / 12</div>
  </div>
  <div class="slide-title-block">
    <h2 class="slide-title">Mission-Aware Readiness: Beyond Component Health</h2>
    <p class="slide-subtitle">Correlating real-time subsystem wear against military operational deployment horizons.</p>
  </div>
  <div class="slide-content">
    <div class="grid-3" style="margin-bottom: 24px;">
      <div class="card" style="border-top: 4px solid #10b981;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 800; color: #10b981;">FMC</span>
          <span style="font-size: 13px; color: #94a3b8;">Score &ge; 85%</span>
        </div>
        <div class="card-title">Fully Mission Capable</div>
        <p class="card-body" style="font-size: 15px;">
          All primary and secondary combat avionics, hydraulics, and propulsion systems verified nominal. Cleared for all primary combat sortie profiles.
        </p>
      </div>

      <div class="card" style="border-top: 4px solid #f59e0b;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 800; color: #f59e0b;">PMC</span>
          <span style="font-size: 13px; color: #94a3b8;">Score 50% &ndash; 84%</span>
        </div>
        <div class="card-title">Partially Mission Capable</div>
        <p class="card-body" style="font-size: 15px;">
          Secondary subsystem degradation detected. Airframe restricted from high-G combat sorties, but cleared for low-stress secondary missions (ISR/Ferry).
        </p>
      </div>

      <div class="card" style="border-top: 4px solid #ef4444;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 800; color: #ef4444;">NMC</span>
          <span style="font-size: 13px; color: #94a3b8;">Score &lt; 50%</span>
        </div>
        <div class="card-title">Non-Mission Capable</div>
        <p class="card-body" style="font-size: 15px;">
          Critical safety limits exceeded or component failure predicted within operational mission window. Airframe grounded; turnaround work orders dispatched.
        </p>
      </div>
    </div>

    <div class="card highlight">
      <div class="card-title" style="color: #38bdf8;">Mission Window Conflict Resolution</div>
      <p class="card-body" style="font-size: 16px;">
        A component with 25 hours RUL might appear &ldquo;healthy&rdquo; under static thresholds. However, if assigned to a 48-hour mission window (e.g., <strong>Operation Desert Shield</strong>), D1 instantly flags a <strong>Mission Horizon Conflict</strong>, alerts the squadron commander, and initiates proactive turnaround before commitment.
      </p>
    </div>
  </div>
  <div class="slide-footer">
    <span>D1 COPILOT &bull; READINESS SEMANTICS</span>
    <span>MISSION HORIZON CORRELATION</span>
  </div>
</div>

<!-- SLIDE 6: IBM BOB + MCP + WATSONX -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-tag purple">IBM Technology Integration</div>
    <div class="slide-counter">SLIDE 06 / 12</div>
  </div>
  <div class="slide-title-block">
    <h2 class="slide-title">IBM Bob + FastMCP + watsonx.ai Granite 3-8B</h2>
    <p class="slide-subtitle">Load-bearing autonomous agent architecture &mdash; not a superficial wrapper.</p>
  </div>
  <div class="slide-content">
    <div class="grid-2">
      <div>
        <div class="card purple-glow" style="margin-bottom: 20px;">
          <div class="card-title" style="color: #c084fc;">FastMCP Autonomous Protocol (/mcp)</div>
          <p class="card-body" style="font-size: 15px; margin-bottom: 12px;">
            IBM Bob connects as an autonomous MCP client to our FastMCP server, exposing <strong>11 military operational tools</strong> and real-time resources:
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <span class="mono-pill">get_fleet_readiness_summary</span>
            <span class="mono-pill">predict_component_failures</span>
            <span class="mono-pill">explain_readiness_issue</span>
            <span class="mono-pill">generate_maintenance_plan</span>
            <span class="mono-pill">simulate_mission_stress</span>
            <span class="mono-pill">get_mission_reallocation_matrix</span>
            <span class="mono-pill">generate_mil_std_work_order</span>
            <span class="mono-pill">get_sensor_anomalies</span>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Live Resources & Prompts</div>
          <p class="card-body" style="font-size: 14px;">
            &bull; <strong>MCP Resources:</strong> <span style="font-family: monospace;">fleet://status</span> &bull; <span style="font-family: monospace;">fleet://predictions/critical</span><br>
            &bull; <strong>MCP Prompts:</strong> Morning readiness briefing &bull; Investigate asset failure
          </p>
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-title" style="color: #a855f7;">IBM watsonx.ai Granite 3-8B Synthesis</div>
          <p class="card-body" style="font-size: 15px; margin-bottom: 12px;">
            Translates thermodynamic telemetry deviations into concise natural language briefings for flight commanders and technicians.
          </p>
          <ul style="list-style: none;" class="card-body">
            <li style="margin-bottom: 6px;">&bull; <strong>Model:</strong> <span style="font-family: monospace;">ibm/granite-3-8b-instruct</span> via official Python SDK.</li>
            <li style="margin-bottom: 6px;">&bull; <strong>Role:</strong> Root-cause mechanical failure analysis and maintenance guidance.</li>
            <li>&bull; <strong>Dual-Mode Engine:</strong> Live IBM Cloud connection + deterministic military diagnostic fallback ensuring zero crashes during judge evaluation.</li>
          </ul>
        </div>

        <div class="card highlight">
          <div class="card-title" style="color: #10b981;">Why IBM Bob is Load-Bearing</div>
          <p class="card-body" style="font-size: 14px;">
            Bob is not a generic chatbot. Bob acts as an operational copilot with direct read/write access to fleet models, ML predictions, work orders, and mission windows via JSON-RPC 2.0.
          </p>
        </div>
      </div>
    </div>
  </div>
  <div class="slide-footer">
    <span>D1 COPILOT &bull; IBM TECHNOLOGY INTEGRATION</span>
    <span>FASTMCP + WATSONX.AI GRANITE 3.0</span>
  </div>
</div>

<!-- SLIDE 7: HERO DEMO -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-tag">Operational Hero Scenario</div>
    <div class="slide-counter">SLIDE 07 / 12</div>
  </div>
  <div class="slide-title-block">
    <h2 class="slide-title">Hero Demo: F-16 Viper 101 Failure Prevention</h2>
    <p class="slide-subtitle">A live tactical demonstration from raw sensor anomaly to prioritized turnaround.</p>
  </div>
  <div class="slide-content">
    <div class="grid-2">
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="card">
          <div class="card-title" style="color: #ef4444;">1. Platform at Risk: F16-VIPER-101</div>
          <p class="card-body" style="font-size: 14px;">
            <strong>Aircraft:</strong> F-16C Block 50 (421st Fighter Sq, 1178.2 hrs)<br>
            <strong>Status:</strong> Non-Mission Capable (Readiness: 42%)<br>
            <strong>Precursor Anomaly:</strong> Turbine gas temperature thermal creep (T30: 1598.4&deg;R, EGT limit exceeded).
          </p>
        </div>

        <div class="card highlight">
          <div class="card-title" style="color: #38bdf8;">2. Prognostic Forecast & Mission Impact</div>
          <p class="card-body" style="font-size: 14px;">
            <strong>Predicted RUL:</strong> 18.4 flight hours (95% CI: 14.1 &ndash; 22.7 hrs)<br>
            <strong>Mission Threat:</strong> Assigned to <em>Operation Desert Shield</em> (starts in 48 hrs). Platform would experience catastrophic turbine distress mid-sortie.
          </p>
        </div>

        <div class="card purple-glow">
          <div class="card-title" style="color: #c084fc;">3. Bob Copilot & watsonx Resolution</div>
          <p class="card-body" style="font-size: 14px;">
            Bob executes <span style="font-family: monospace;">explain_readiness_issue</span> via Granite 3-8B, explains LPT thermal creep, and auto-generates Work Order WO-2026-001 (Priority 1 Turnaround, 6.5 hrs).
          </p>
        </div>
      </div>

      <div class="card" style="padding: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #070a12;">
        {"<img src='" + img_output + "' style='max-width: 100%; max-height: 4.8in; border-radius: 8px; border: 1px solid #334155; object-fit: contain;' />" if img_output else "<div style='color: #64748b; font-family: monospace;'>[03-result-output.png]</div>"}
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748b; margin-top: 8px;">
          ACTUAL APPLICATION SCREENSHOT: Bob Copilot Autonomous FastMCP Output
        </div>
      </div>
    </div>
  </div>
  <div class="slide-footer">
    <span>D1 COPILOT &bull; LIVE DEMONSTRATION</span>
    <span>END-TO-END HERO SCENARIO</span>
  </div>
</div>

<!-- SLIDE 8: MISSION DECISION SUPPORT -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-tag amber">Breakthrough Differentiators</div>
    <div class="slide-counter">SLIDE 08 / 12</div>
  </div>
  <div class="slide-title-block">
    <h2 class="slide-title">Mission Decision Support: Beyond Binary Grounding</h2>
    <p class="slide-subtitle">Innovative capabilities engineered specifically for defense combat generation.</p>
  </div>
  <div class="slide-content">
    <div class="grid-2">
      <div class="card highlight">
        <div class="card-title" style="color: #fbbf24;">1. What-If Mission Stress Digital Twin</div>
        <p class="card-body" style="font-size: 15px; margin-bottom: 14px;">
          Simulates counterfactual environmental & combat profiles before platform commitment to evaluate accelerated wear factors:
        </p>
        <ul style="list-style: none;" class="card-body">
          <li style="margin-bottom: 8px;">&bull; <strong>Desert Heat (+45&deg;C):</strong> Thermal creep accelerator factor 1.42&times;</li>
          <li style="margin-bottom: 8px;">&bull; <strong>Sand & Dust Ingestion:</strong> Compressor particulate abrasion 1.85&times;</li>
          <li style="margin-bottom: 8px;">&bull; <strong>Combat High-G Maneuvering (7-9G):</strong> Structural fatigue surge 2.10&times;</li>
          <li>&bull; <strong>Survivability Probability:</strong> Forecasts exact mission completion odds before pilot takeoff.</li>
        </ul>
      </div>

      <div class="card highlight">
        <div class="card-title" style="color: #38bdf8;">2. Mission-Adaptive Sortie Re-allocation</div>
        <p class="card-body" style="font-size: 15px; margin-bottom: 14px;">
          Dynamic Air Tasking Order (ATO) matching engine. Rather than grounding degraded aircraft (PMC), D1 re-allocates them to compatible low-stress sorties:
        </p>
        <div style="background: #070a12; padding: 14px; border-radius: 8px; border: 1px solid #1e293b; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.6;">
          <div style="color: #ef4444;">&times; Combat Air Patrol (9G): INELIGIBLE (Exceeds Thermal Margins)</div>
          <div style="color: #ef4444;">&times; Close Air Support (Low-Level): INELIGIBLE (Dust Abrasion Risk)</div>
          <div style="color: #10b981;">&check; High-Altitude ISR Recon (3G): VIABLE (94% Mission Odds)</div>
          <div style="color: #10b981;">&check; Tactical Ferry / Transit (2G): VIABLE (99% Mission Odds)</div>
        </div>
        <p class="card-body" style="font-size: 13px; margin-top: 10px; color: #94a3b8;">
          <strong>Impact:</strong> Saves critical combat sorties and preserves operational tempo without compromising flight safety.
        </p>
      </div>
    </div>
  </div>
  <div class="slide-footer">
    <span>D1 COPILOT &bull; TACTICAL DECISION SUPPORT</span>
    <span>COUNTERFACTUAL DIGITAL TWIN & ATO ENGINE</span>
  </div>
</div>

<!-- SLIDE 9: ACTION + HUMAN CONTROL -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-tag">Human-In-The-Loop Governance</div>
    <div class="slide-counter">SLIDE 09 / 12</div>
  </div>
  <div class="slide-title-block">
    <h2 class="slide-title">Action & Human Control: Defense Compliance</h2>
    <p class="slide-subtitle">Supporting human command decisions &mdash; never executing irreversible maintenance silently.</p>
  </div>
  <div class="slide-content">
    <div class="grid-2">
      <div>
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-title">Digital AFTO Form 781A & DA Form 2404</div>
          <p class="card-body" style="font-size: 15px; margin-bottom: 12px;">
            D1 auto-dispatches official defense discrepancy documents compliant with Air Force Technical Order 00-20-1 standards:
          </p>
          <ul style="list-style: none;" class="card-body">
            <li style="margin-bottom: 6px;">&bull; <strong>Military Discrepancy Symbols:</strong> Official Red X (Grounded) / Red Diagonal (Warning).</li>
            <li style="margin-bottom: 6px;">&bull; <strong>Job Control Numbers (JCN):</strong> Automated Julian date work tracking (e.g. <span style="font-family: monospace;">26258-001</span>).</li>
            <li style="margin-bottom: 6px;">&bull; <strong>Action J-Codes:</strong> Corrective maintenance standard military codes.</li>
            <li>&bull; <strong>DLA NSN Parts Manifests:</strong> Federal National Stock Numbers (e.g. <span style="font-family: monospace;">NSN-2840-01-450-1289</span>) for rapid supply requisition.</li>
          </ul>
        </div>
      </div>

      <div>
        <div class="card highlight">
          <div class="card-title" style="color: #10b981;">Strict Human Command Hierarchy</div>
          <div class="flow-container" style="flex-direction: column; gap: 12px; margin-top: 14px;">
            <div style="background: #070a12; padding: 12px 16px; border-radius: 8px; border: 1px solid #1e293b; width: 100%;">
              <span style="font-family: 'JetBrains Mono', monospace; color: #38bdf8; font-size: 12px;">STEP 1:</span>
              <span style="font-size: 14px; font-weight: 600; margin-left: 8px;">AI Recommends Priority Work Order</span>
            </div>
            <div style="background: #070a12; padding: 12px 16px; border-radius: 8px; border: 1px solid #1e293b; width: 100%;">
              <span style="font-family: 'JetBrains Mono', monospace; color: #f59e0b; font-size: 12px;">STEP 2:</span>
              <span style="font-size: 14px; font-weight: 600; margin-left: 8px;">Maintenance Officer Reviews Telemetry & RUL</span>
            </div>
            <div style="background: #070a12; padding: 12px 16px; border-radius: 8px; border: 1px solid #10b981; width: 100%;">
              <span style="font-family: 'JetBrains Mono', monospace; color: #10b981; font-size: 12px;">STEP 3:</span>
              <span style="font-size: 14px; font-weight: 600; margin-left: 8px;">Command Officer Approves Work Order Dispatch</span>
            </div>
            <div style="background: #070a12; padding: 12px 16px; border-radius: 8px; border: 1px solid #1e293b; width: 100%;">
              <span style="font-family: 'JetBrains Mono', monospace; color: #a855f7; font-size: 12px;">STEP 4:</span>
              <span style="font-size: 14px; font-weight: 600; margin-left: 8px;">Fleet Readiness Automatically Recalculates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="slide-footer">
    <span>D1 COPILOT &bull; GOVERNANCE & COMPLIANCE</span>
    <span>AFTO FORM 781A & HUMAN-IN-THE-LOOP</span>
  </div>
</div>

<!-- SLIDE 10: SECURITY ARCHITECTURE -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-tag">Defense Security Architecture</div>
    <div class="slide-counter">SLIDE 10 / 12</div>
  </div>
  <div class="slide-title-block">
    <h2 class="slide-title">Security: Implemented Controls vs. Production Roadmap</h2>
    <p class="slide-subtitle">Clear demarcation of verified codebase security controls and future defense hardening.</p>
  </div>
  <div class="slide-content">
    <div class="grid-2">
      <div class="card highlight">
        <div class="card-title" style="color: #10b981;">Implemented & Verified in Codebase</div>
        <ul style="list-style: none;" class="card-body">
          <li style="margin-bottom: 12px;">
            <strong>&bull; Cryptographic Password Hashing:</strong><br>
            <span style="color: #94a3b8; font-size: 14px;">Direct <span style="font-family: monospace;">bcrypt</span> with 12 salt rounds & 72-byte truncation in <span style="font-family: monospace;">src/backend/app/core/security.py</span>.</span>
          </li>
          <li style="margin-bottom: 12px;">
            <strong>&bull; Signed JWT Token Authentication:</strong><br>
            <span style="color: #94a3b8; font-size: 14px;">Stateless cryptographic tokens via <span style="font-family: monospace;">python-jose</span> with expiration and subject claims.</span>
          </li>
          <li style="margin-bottom: 12px;">
            <strong>&bull; 5-Role Role-Based Access Control (RBAC):</strong><br>
            <span style="color: #94a3b8; font-size: 14px;">Enforced at FastAPI route level: <span style="font-family: monospace;">commander</span>, <span style="font-family: monospace;">maintenance_officer</span>, <span style="font-family: monospace;">logistics_planner</span>, <span style="font-family: monospace;">technician</span>, <span style="font-family: monospace;">admin</span>.</span>
          </li>
          <li>
            <strong>&bull; Persistent Audit Logging:</strong><br>
            <span style="color: #94a3b8; font-size: 14px;">Dedicated <span style="font-family: monospace;">AuditLog</span> database model recording timestamps, user IDs, actions, and IP addresses.</span>
          </li>
        </ul>
      </div>

      <div class="card">
        <div class="card-title" style="color: #38bdf8;">Production Hardening Roadmap</div>
        <ul style="list-style: none;" class="card-body">
          <li style="margin-bottom: 12px;">
            <strong>&bull; Avionics Bus Cryptography:</strong><br>
            <span style="color: #94a3b8; font-size: 14px;">Hardware encryption for physical MIL-STD-1553 and ARINC 429 aircraft data buses.</span>
          </li>
          <li style="margin-bottom: 12px;">
            <strong>&bull; Field-Level Database Encryption:</strong><br>
            <span style="color: #94a3b8; font-size: 14px;">AES-256 transparent data encryption for classified platform telemetry at rest.</span>
          </li>
          <li style="margin-bottom: 12px;">
            <strong>&bull; API Gateway Rate Limiting:</strong><br>
            <span style="color: #94a3b8; font-size: 14px;">Redis-backed token bucket rate limiting for external MCP endpoint traffic.</span>
          </li>
          <li>
            <strong>&bull; Air-Gapped LLM Deployments:</strong><br>
            <span style="color: #94a3b8; font-size: 14px;">On-premise IBM Granite deployment for classified SCIF defense installations.</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <div class="slide-footer">
    <span>D1 COPILOT &bull; DEFENSE SECURITY</span>
    <span>AUTHENTICATION, RBAC & AUDIT LOGGING</span>
  </div>
</div>

<!-- SLIDE 11: IMPACT / FUTURE -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-tag">Impact & Evolution</div>
    <div class="slide-counter">SLIDE 11 / 12</div>
  </div>
  <div class="slide-title-block">
    <h2 class="slide-title">Impact & Scalability: The Road Beyond Hackathon</h2>
    <p class="slide-subtitle">Transforming prototype validation into enterprise-scale defense fleet maintenance.</p>
  </div>
  <div class="slide-content">
    <div class="grid-3" style="margin-bottom: 24px;">
      <div class="card highlight">
        <div class="card-title">1. Operational Availability</div>
        <div class="kpi-num" style="font-size: 38px;">&ge;85%</div>
        <p class="card-body" style="font-size: 14px;">
          Sustaining an FMC rate &ge;85% across combat squadrons by catching high-severity degradation before platform deployment.
        </p>
      </div>

      <div class="card highlight">
        <div class="card-title">2. Zero Sortie Aborts</div>
        <div class="kpi-num" style="font-size: 38px;">0</div>
        <p class="card-body" style="font-size: 14px;">
          Eliminating preventable mid-mission turbine and transmission failures through proactive 48-to-72 hour horizon forecasting.
        </p>
      </div>

      <div class="card highlight">
        <div class="card-title">3. Turnaround Optimization</div>
        <div class="kpi-num" style="font-size: 38px;">-40%</div>
        <p class="card-body" style="font-size: 14px;">
          Reducing hangar turnaround delays by auto-dispatching AFTO 781A work orders and pre-ordering DLA NSN parts.
        </p>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Production Scaling Vectors</div>
      <div class="grid-3" style="gap: 16px; margin-top: 8px;">
        <div style="font-size: 14px; color: #94a3b8;">
          <strong style="color: #f8fafc;">Avionics Integration:</strong> Direct connection to physical MIL-STD-1553 and HUMS ground replay stations.
        </div>
        <div style="font-size: 14px; color: #94a3b8;">
          <strong style="color: #f8fafc;">Enterprise Systems:</strong> Two-way synchronization with military ERPs (GCSS-Army, AFTO G081, IMDS).
        </div>
        <div style="font-size: 14px; color: #94a3b8;">
          <strong style="color: #f8fafc;">Tactical Edge:</strong> Running quantized ONNX RUL models on ruggedized field hardware with zero cloud dependency.
        </div>
      </div>
    </div>
  </div>
  <div class="slide-footer">
    <span>D1 COPILOT &bull; IMPACT & FUTURE ROADMAP</span>
    <span>ENTERPRISE DEFENSE FLEET SCALING</span>
  </div>
</div>

<!-- SLIDE 12: CLOSING -->
<div class="slide" style="justify-content: center; align-items: center; text-align: center;">
  <div style="max-width: 12in;">
    <div class="slide-tag" style="margin-bottom: 24px;">MISSION STATEMENT</div>
    
    <h2 style="font-size: 52px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; margin-bottom: 24px; color: #ffffff;">
      &ldquo;D1 turns equipment health predictions<br>into <span style="color: #10b981;">mission-readiness decisions</span>.&rdquo;
    </h2>

    <p style="font-size: 20px; color: #94a3b8; max-width: 9in; margin: 0 auto 36px; line-height: 1.6;">
      By combining physics-grounded ML prognostics, autonomous IBM Bob FastMCP orchestration, and watsonx.ai diagnostics, D1 ensures that when the mission begins, every airframe and combat platform is ready to fly.
    </p>

    <div style="display: inline-flex; gap: 20px; align-items: center; background: #0d1322; border: 1px solid #1e293b; padding: 16px 32px; border-radius: 12px;">
      <div style="text-align: left;">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #64748b;">TEAM GALCOGENS</div>
        <div style="font-size: 16px; font-weight: 700; color: #f8fafc;">Kunj, Vedant, Path, Venisha</div>
      </div>
      <div style="width: 1px; height: 36px; background: #334155;"></div>
      <div style="text-align: left;">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #64748b;">GITHUB REPOSITORY</div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; color: #10b981;">github.com/kunj290506/bob-ai-hackathon-galcogens</div>
      </div>
    </div>
  </div>
</div>

</body>
</html>"""
    return html

def main():
    PRESENTATION_DIR.mkdir(parents=True, exist_ok=True)
    html_file = PRESENTATION_DIR / "slides_deck.html"
    
    print(f"Generating slides HTML at: {html_file}")
    html_content = build_slides_html()
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)
    print("Slides HTML written successfully.")

    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        print(f"ERROR: Chrome not found at {chrome_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Compiling PDF using Chrome headless: {OUTPUT_PDF}")
    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--no-pdf-header-footer",
        f"--print-to-pdf={OUTPUT_PDF}",
        str(html_file)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Chrome error: {res.stderr}", file=sys.stderr)
        sys.exit(res.returncode)

    if OUTPUT_PDF.exists():
        pdf_size = OUTPUT_PDF.stat().st_size
        print(f"SUCCESS: Generated {OUTPUT_PDF} ({pdf_size:,} bytes)")
        
        # Verify page count
        with open(OUTPUT_PDF, "rb") as f:
            pdf_bytes = f.read()
            page_count = pdf_bytes.count(b"/Type /Page") - pdf_bytes.count(b"/Type /Pages")
            print(f"Verified Page Count: {page_count} slides")
    else:
        print(f"ERROR: Output PDF does not exist at {OUTPUT_PDF}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
