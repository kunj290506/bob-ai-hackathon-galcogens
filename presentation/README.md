# Presentation Deck - D1 Mission Readiness Copilot

This folder contains the official presentation slide deck for the D1 Mission Readiness and Predictive Maintenance Copilot, submitted by Team Galcogens for the Bob AI Innovation Hackathon (Track: AI).

- Primary Deck: [ppt.pptx](ppt.pptx) (PowerPoint Presentation)

---

## Slide Deck Overview

| Slide | Title | Core Content and Narrative |
|---|---|---|
| 01 | Title Slide | Project: D1 Mission Readiness & Predictive Maintenance Copilot. Team Galcogens. Track: AI. Platform: IBM Bob, watsonx.ai Granite 3-8B, FastMCP. |
| 02 | Executive Problem Statement | Military organizations cannot determine real mission readiness. Fixed calendar schedules cause unexpected failures in 50%+ of critical missions. $90B/year DoD maintenance spend. |
| 03 | The Data Paradox | Gigabytes of onboard HUMS telemetry (temperatures, vibrations, pressures) sit unanalyzed in silos while platforms are grounded for weeks. |
| 04 | Solution Vision & Core Architecture | End-to-end modular monolith: Ingestion -> XGBoost GPU Prognostics -> Readiness Scoring -> IBM Bob FastMCP Copilot -> watsonx.ai Granite 3-8B. |
| 05 | Propulsion Physics & NASA C-MAPSS ML | GPU-accelerated XGBoost regressor trained on NASA C-MAPSS FD001 benchmark (108 engineered features). Verified holdout RMSE of 18.21 cycles, MAE 12.75 cycles, R-squared 0.7935. |
| 06 | What-If Mission Stress Simulator | Counterfactual digital twin modeling harsh combat environments (Desert Heat 45C, Sand/Dust Ingestion, Sub-Zero Arctic, 9G Combat Turns) to compute wear multipliers and survivability probability. |
| 07 | Mission-Adaptive Sortie Re-allocation | Dynamic Air Tasking Order (ATO) matching engine that re-allocates degraded platforms (PMC) to secondary low-stress sorties (Combat Air Patrol vs ISR Recon vs Ferry), eliminating lost combat tempo. |
| 08 | Digital AFTO Form 781A Compliance | Automated defense discrepancy sheet generation with military Red X / Red Diagonal symbols, automated Job Control Numbers (JCN), military J-codes, and DLA NSN parts requisitions. |
| 09 | Deep IBM Bob FastMCP Integration | FastMCP server at /mcp exposing 11 autonomous tools for fleet summary, asset diagnostics, what-if stress tests, work order generation, and maintenance history search. |
| 10 | IBM watsonx.ai Granite Intelligence | Plain-language diagnostic reasoning with ibm/granite-3-8b-instruct. Intelligent dual-mode engine guaranteeing crash-free execution in air-gapped / keyless test environments. |
| 11 | Operational Impact & Metrics | 40% reduction in unplanned in-field failures, 20% reduction in MTTR, sustaining >= 85% fleet FMC readiness rate, saving millions in emergency recovery logistics. |
| 12 | Team Galcogens Credentials | Team roles, responsibilities, and institutional contacts (Kunj, Vedant, Path, Venisha - CHARUSAT). |
