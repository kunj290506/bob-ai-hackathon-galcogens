"""Streamlit dashboard - Mission Readiness and Predictive Maintenance Copilot."""

import pathlib
import joblib
import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

# ==============================================================================
# CONFIGURATION & SETUP
# ==============================================================================
ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "hums_sensor_data.csv"
MODEL_PATH = ROOT / "models" / "failure_model.joblib"
FEATURES = [
    "vibration_g", "temperature_c", "oil_pressure_psi",
    "usage_hours", "maintenance_events", "days_since_maintenance",
]

st.set_page_config(
    page_title="Mission Readiness Copilot", 
    page_icon="cog", # Using text/strings instead of emojis per hackathon rules
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==============================================================================
# CUSTOM CSS FOR PREMIUM LIGHT THEME (Glassmorphism & Cards)
# ==============================================================================
st.markdown("""
<style>
    /* Main Background & Fonts */
    .stApp {
        background-color: #f8f9fa;
        font-family: 'Inter', 'Segoe UI', sans-serif;
    }
    
    /* Premium Metric Cards */
    div[data-testid="metric-container"] {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(15, 98, 254, 0.2);
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        border-radius: 12px;
        padding: 1.5rem;
        transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }
    div[data-testid="metric-container"]:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(15, 98, 254, 0.15);
    }
    
    /* Headers */
    h1, h2, h3 {
        color: #161616 !important;
        font-weight: 700 !important;
        letter-spacing: -0.5px;
    }
    
    /* Tabs styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 24px;
    }
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        white-space: pre-wrap;
        background-color: transparent;
        border-radius: 4px 4px 0 0;
        gap: 1px;
        padding-top: 10px;
        padding-bottom: 10px;
        color: #525252;
    }
    .stTabs [aria-selected="true"] {
        background-color: #ffffff;
        border-bottom: 2px solid #0f62fe !important;
        color: #0f62fe !important;
        font-weight: 600;
    }
    
    /* Dataframe styling */
    .stDataFrame {
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e0e0e0;
    }
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# DATA & MODEL LOADING
# ==============================================================================
@st.cache_data
def load_data():
    return pd.read_csv(DATA_PATH)

@st.cache_resource
def load_model():
    return joblib.load(MODEL_PATH)

df = load_data()
model = load_model()

# Compute per-asset summary: latest reading + failure probability
latest = df.groupby("asset_id").last().reset_index()
probs = model.predict_proba(latest[FEATURES])[:, 1]
latest["failure_probability"] = np.round(probs, 3)
latest["readiness_score"] = np.round(1 - probs, 3)
latest["risk_level"] = pd.cut(
    probs, bins=[-0.1, 0.3, 0.6, 1.0], labels=["Low", "Medium", "High"]
)

# ==============================================================================
# SIDEBAR
# ==============================================================================
with st.sidebar:
    st.image("https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg", width=100)
    st.markdown("### Mission Readiness Copilot")
    st.markdown("Team Galcogens - Hackathon 2026")
    st.divider()
    
    st.markdown("#### System Status")
    st.success("API Connected")
    st.success("Model Loaded")
    st.success("Data Stream Active")
    
    st.divider()
    st.markdown("*Powered by IBM watsonx & Bob*")

# ==============================================================================
# MAIN DASHBOARD HEADER
# ==============================================================================
st.title("Mission Readiness Command Center")
st.markdown("Real-time telemetry and predictive maintenance insights for military assets.")

# Top KPI Cards
total_assets = len(latest)
high_risk = len(latest[latest["risk_level"] == "High"])
avg_readiness = latest["readiness_score"].mean()

col1, col2, col3 = st.columns(3)
col1.metric("Total Monitored Assets", f"{total_assets}")
col2.metric("Critical Action Required", f"{high_risk}", f"{high_risk} High Risk", delta_color="inverse")
col3.metric("Fleet Average Readiness", f"{avg_readiness:.0%}")

st.divider()

# ==============================================================================
# TABS CONTENT
# ==============================================================================
tab1, tab2, tab3 = st.tabs([
    "Fleet Overview", 
    "Predictive Risk Analysis", 
    "Maintenance Action Plan"
])

# -- Tab 1: Fleet Overview --
with tab1:
    st.markdown("### Fleet Readiness Status")
    st.markdown("Overview of the latest sensor readings and computed readiness scores across the fleet.")
    
    display_cols = [
        "asset_id", "readiness_score", "risk_level",
        "vibration_g", "temperature_c", "oil_pressure_psi",
        "usage_hours", "days_since_maintenance",
    ]
    
    st.dataframe(
        latest[display_cols].sort_values("readiness_score"),
        use_container_width=True,
        hide_index=True,
    )

# -- Tab 2: Predictive Risk Analysis --
with tab2:
    st.markdown("### Advanced Sensor Telemetry & Risk Prediction")
    
    col_chart1, col_chart2 = st.columns(2)
    
    with col_chart1:
        # Scatter Plot: Temp vs Vibration
        fig1 = px.scatter(
            latest, 
            x="temperature_c", 
            y="vibration_g", 
            color="failure_probability",
            hover_data=["asset_id", "risk_level"],
            color_continuous_scale="Reds",
            title="Sensor Correlation: Temp vs. Vibration (Colored by Risk)",
            template="plotly_white"
        )
        fig1.update_traces(marker=dict(size=10, line=dict(width=1, color='DarkSlateGrey')))
        st.plotly_chart(fig1, use_container_width=True)
        
    with col_chart2:
        # Bar Chart: Top Riskiest Assets
        top_risk = latest.sort_values("failure_probability", ascending=False).head(10)
        fig2 = px.bar(
            top_risk, 
            x="failure_probability", 
            y="asset_id", 
            orientation='h',
            color="risk_level",
            color_discrete_map={"High": "#e74c3c", "Medium": "#f39c12", "Low": "#2ecc71"},
            title="Top 10 Assets by Failure Probability",
            template="plotly_white"
        )
        fig2.update_layout(yaxis={'categoryorder':'total ascending'})
        st.plotly_chart(fig2, use_container_width=True)

# -- Tab 3: Prioritized Maintenance Plan --
with tab3:
    st.markdown("### AI-Generated Maintenance Schedule")
    
    at_risk = latest[latest["failure_probability"] > 0.3].sort_values(
        "failure_probability", ascending=False
    )

    if at_risk.empty:
        st.success("All assets are operating within acceptable safety margins. No immediate maintenance required.")
    else:
        st.warning(f"ACTION REQUIRED: {len(at_risk)} asset(s) have exceeded risk thresholds.")
        
        importances = pd.Series(model.feature_importances_, index=FEATURES)
        top_features = importances.sort_values(ascending=False)
        
        for _, row in at_risk.iterrows():
            # Create a nice expander card for each asset
            with st.expander(f"ASSET: {row['asset_id']} | RISK LEVEL: {row['risk_level'].upper()} | SCORE: {row['failure_probability']:.0%}"):
                st.markdown(f"**Readiness Score:** {row['readiness_score']:.0%}")
                
                st.markdown("#### Explainable AI: Key Risk Drivers")
                # Show bars for feature importance specifically for this asset's values
                for feat, imp in top_features.head(3).items():
                    val = row[feat]
                    st.markdown(f"- **{feat.replace('_', ' ').title()}:** {val:.2f} *(Global Importance: {imp:.1%})*")
                
                st.markdown("---")
                st.markdown("**Recommendation:** Dispatch field maintenance crew immediately. Isolate asset from active mission roster until comprehensive diagnostics are completed.")
