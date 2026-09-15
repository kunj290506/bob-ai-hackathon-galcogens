import os
import sys
import yaml

def run_validation():
    errors = []
    print("--- 1. Check required files exist ---")
    required_files = [
        "README.md",
        "submission.yaml",
        "docs/problem-statement.md",
        "docs/solution-overview.md",
        "docs/architecture.md",
        "docs/setup-guide.md",
        "demo/demo-video-link.txt",
        "demo/live-demo-url.txt",
        "presentation/slides.pdf"
    ]
    for f in required_files:
        if not os.path.exists(f):
            errors.append(f"[FAIL] Missing required file: {f}")
        else:
            print(f"[PASS] Found: {f}")

    print("\n--- 2. Validate submission.yaml ---")
    with open("submission.yaml", "r", encoding="utf-8") as f:
        try:
            sub = yaml.safe_load(f)
            print("[PASS] submission.yaml is valid YAML.")
        except Exception as e:
            errors.append(f"[FAIL] YAML parse error: {e}")
            return errors

    print("\n--- 3. Check required fields in submission.yaml ---")
    fields = [
        ("team.name", sub.get("team", {}).get("name")),
        ("team.track", sub.get("team", {}).get("track")),
        ("team.lead.name", sub.get("team", {}).get("lead", {}).get("name")),
        ("team.lead.email", sub.get("team", {}).get("lead", {}).get("email")),
        ("submission.title", sub.get("submission", {}).get("title")),
        ("submission.problem_statement", sub.get("submission", {}).get("problem_statement")),
        ("submission.solution_summary", sub.get("submission", {}).get("solution_summary"))
    ]
    for label, val in fields:
        if not val or str(val).strip() == "":
            errors.append(f"[FAIL] Missing required field: {label}")
        else:
            print(f"[PASS] Field present: {label}")

    track = sub.get("team", {}).get("track")
    if track not in ["AI", "DevOps", "Sustainability", "Open"]:
        errors.append(f"[FAIL] Invalid track: {track}")
    else:
        print(f"[PASS] Track is valid: {track}")

    features = sub.get("submission", {}).get("key_features", [])
    if len(features) < 1:
        errors.append("[FAIL] submission.key_features must have >= 1 entry")
    else:
        print(f"[PASS] key_features count: {len(features)}")

    print("\n--- 4. Check src/ has actual code ---")
    code_files = []
    for root, _, files in os.walk("src"):
        for file in files:
            if file not in ["README.md", ".env.example"]:
                code_files.append(os.path.join(root, file))
    if len(code_files) < 1:
        errors.append("[FAIL] src/ contains no code files")
    else:
        print(f"[PASS] src/ contains {len(code_files)} code files.")

    print("\n--- 5. Check demo video link is not default placeholder ---")
    with open("demo/demo-video-link.txt", "r", encoding="utf-8") as f:
        first_line = f.readline().strip()
    if "your-demo-video-link-here" in first_line:
        errors.append("[FAIL] demo/demo-video-link.txt contains placeholder")
    else:
        print(f"[PASS] Demo video link check passed: {first_line}")

    print("\n--- 6. Check demo/live-demo-url.txt ---")
    with open("demo/live-demo-url.txt", "r", encoding="utf-8") as f:
        live_content = f.read().strip()
    if live_content != "NOT DEPLOYED" and not live_content.startswith("http"):
        errors.append(f"[FAIL] demo/live-demo-url.txt contains invalid text: '{live_content}'")
    else:
        print(f"[PASS] live-demo-url.txt is exact: '{live_content}'")

    print("\n--- 7. Check demo/screenshots/ ---")
    screenshot_files = [
        "demo/screenshots/01-home-dashboard.png",
        "demo/screenshots/02-query-input.png",
        "demo/screenshots/03-result-output.png"
    ]
    for sf in screenshot_files:
        if not os.path.exists(sf):
            errors.append(f"[FAIL] Missing screenshot: {sf}")
        else:
            size_kb = os.path.getsize(sf) / 1024
            print(f"[PASS] Found screenshot: {sf} ({size_kb:.1f} KB)")

    print("\n--- 8. Check README placeholders ---")
    with open("README.md", "r", encoding="utf-8") as f:
        readme = f.read()
    if "[Your Project Title Here]" in readme:
        errors.append("[FAIL] README.md contains '[Your Project Title Here]'")
    if "[Your Team Name]" in readme:
        errors.append("[FAIL] README.md contains '[Your Team Name]'")
    print("[PASS] README.md placeholders verified clear.")

    return errors

if __name__ == "__main__":
    errs = run_validation()
    if errs:
        print("\n[FAIL] VALIDATION FAILED WITH ERRORS:")
        for e in errs:
            print("  ", e)
        sys.exit(1)
    else:
        print("\n[SUCCESS] Submission validation PASSED! All official checks green.")
        sys.exit(0)

