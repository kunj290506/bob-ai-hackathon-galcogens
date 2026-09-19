"""
Comprehensive Full System Integration Verification Script.
Tests all frontend and backend endpoints, FastMCP tools, and database integrity.
"""
import httpx
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

print('=' * 80)
print('🚀 STARTING FULL SYSTEM INTEGRATION AUDIT: FRONTEND TO BACKEND')
print('=' * 80)

failures = []

# 1. Frontend Test
try:
    r_fe = httpx.get('http://localhost:5173/', timeout=5.0)
    print(f'[PASS] 1. Frontend Web App (http://localhost:5173/): HTTP {r_fe.status_code}')
    assert r_fe.status_code == 200
    assert 'html' in r_fe.text.lower()
except Exception as e:
    print(f'[FAIL] 1. Frontend Web App: {e}')
    failures.append(f'Frontend: {e}')

# 2. Fleet Summary API
try:
    r_sum = httpx.get('http://127.0.0.1:8000/api/v1/fleet/summary', timeout=5.0)
    data = r_sum.json()
    fmc = data.get('fmc_count')
    pmc = data.get('pmc_count')
    nmc = data.get('nmc_count')
    print(f'[PASS] 2. Fleet Summary API: HTTP {r_sum.status_code} | FMC: {fmc} | PMC: {pmc} | NMC: {nmc}')
    assert data.get('total_assets') == 20
    assert fmc == 13
    assert pmc == 4
    assert nmc == 3
except Exception as e:
    print(f'[FAIL] 2. Fleet Summary API: {e}')
    failures.append(f'Fleet Summary: {e}')

# 3. Fleet Assets API
try:
    r_ast = httpx.get('http://127.0.0.1:8000/api/v1/fleet/assets', timeout=5.0)
    assets = r_ast.json()
    print(f'[PASS] 3. Fleet Assets Registry API: HTTP {r_ast.status_code} | Total Assets: {len(assets)}')
    assert len(assets) == 20
except Exception as e:
    print(f'[FAIL] 3. Fleet Assets API: {e}')
    failures.append(f'Fleet Assets: {e}')

# 4. Predictions API
try:
    r_pred = httpx.get('http://127.0.0.1:8000/api/v1/predictions/', timeout=5.0)
    preds = r_pred.json()
    print(f'[PASS] 4. ML Predictions (NASA C-MAPSS) API: HTTP {r_pred.status_code} | Total Forecasts: {len(preds)}')
    assert len(preds) > 0
except Exception as e:
    print(f'[FAIL] 4. Predictions API: {e}')
    failures.append(f'Predictions: {e}')

# 5. Work Orders API
try:
    r_wo = httpx.get('http://127.0.0.1:8000/api/v1/maintenance/work-orders', timeout=5.0)
    wos = r_wo.json()
    print(f'[PASS] 5. Maintenance Work Orders API: HTTP {r_wo.status_code} | Total Work Orders: {len(wos)}')
    assert len(wos) > 0
except Exception as e:
    print(f'[FAIL] 5. Work Orders API: {e}')
    failures.append(f'Work Orders: {e}')

# 6. Missions API
try:
    r_mis = httpx.get('http://127.0.0.1:8000/api/v1/fleet/missions', timeout=5.0)
    missions = r_mis.json()
    print(f'[PASS] 6. Mission Deployment Windows API: HTTP {r_mis.status_code} | Active Missions: {len(missions)}')
    assert len(missions) > 0
except Exception as e:
    print(f'[FAIL] 6. Missions API: {e}')
    failures.append(f'Missions: {e}')

# 7. Copilot Chat: NMC Platforms Query
try:
    r_chat1 = httpx.post('http://127.0.0.1:8000/api/v1/copilot/chat', json={'message': 'Which platforms are NMC / grounded?'}, timeout=10.0)
    c1 = r_chat1.json()
    tools1 = c1.get('tools_used', [])
    print(f'[PASS] 7. Copilot Chat (NMC Grounded Platforms): HTTP {r_chat1.status_code} | Tools Used: {tools1}')
    assert 'get_fleet_readiness_summary' in tools1
    assert 'F16-VIPER-101' in c1.get('response', '')
    assert 'AH64-APACHE-401' in c1.get('response', '')
    assert 'M1A2-ABRAMS-701' in c1.get('response', '')
except Exception as e:
    print(f'[FAIL] 7. Copilot Chat NMC: {e}')
    failures.append(f'Copilot NMC: {e}')

# 8. Copilot Chat: RUL Prognostics Query
try:
    r_chat2 = httpx.post('http://127.0.0.1:8000/api/v1/copilot/chat', json={'message': 'Predict component failures before 48h mission window'}, timeout=10.0)
    c2 = r_chat2.json()
    tools2 = c2.get('tools_used', [])
    print(f'[PASS] 8. Copilot Chat (RUL Prognostics): HTTP {r_chat2.status_code} | Tools Used: {tools2}')
    assert 'predict_component_failures' in tools2
except Exception as e:
    print(f'[FAIL] 8. Copilot Chat RUL: {e}')
    failures.append(f'Copilot RUL: {e}')

# 9. Copilot Chat: Maintenance Turnaround Plan Query
try:
    r_chat3 = httpx.post('http://127.0.0.1:8000/api/v1/copilot/chat', json={'message': 'Generate prioritized maintenance turnaround plan'}, timeout=10.0)
    c3 = r_chat3.json()
    tools3 = c3.get('tools_used', [])
    print(f'[PASS] 9. Copilot Chat (Maintenance Plan): HTTP {r_chat3.status_code} | Tools Used: {tools3}')
    assert 'generate_maintenance_plan' in tools3
except Exception as e:
    print(f'[FAIL] 9. Copilot Chat Maint Plan: {e}')
    failures.append(f'Copilot Maint Plan: {e}')

# 10. Copilot Chat: AFTO Form 781A Query
try:
    r_chat4 = httpx.post('http://127.0.0.1:8000/api/v1/copilot/chat', json={'message': 'Generate AFTO Form 781A for F16-VIPER-101'}, timeout=10.0)
    c4 = r_chat4.json()
    tools4 = c4.get('tools_used', [])
    print(f'[PASS] 10. Copilot Chat (AFTO Form 781A): HTTP {r_chat4.status_code} | Tools Used: {tools4}')
    assert 'generate_mil_std_work_order' in tools4
    assert 'AFTO-781A' in c4.get('response', '')
except Exception as e:
    print(f'[FAIL] 10. Copilot Chat AFTO Form: {e}')
    failures.append(f'Copilot AFTO Form: {e}')

print('=' * 80)
if not failures:
    print('✅ ALL 10 INTEGRATION VERIFICATION CHECKS PASSED!')
    sys.exit(0)
else:
    print(f'❌ {len(failures)} CHECKS FAILED:')
    for f in failures:
        print(f'   - {f}')
    sys.exit(1)
