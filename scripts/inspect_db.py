"""
Database Inspection Utility for D1 Mission Readiness & Predictive Maintenance Copilot.
Enables instant terminal inspection of SQLite database tables, rows, schemas, and custom queries.
"""

import sys
import sqlite3
import argparse
from pathlib import Path
from typing import List, Tuple, Any

# Ensure UTF-8 output on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

DB_PATH = Path("mission_readiness.db")


def get_connection(db_file: Path) -> sqlite3.Connection:
    if not db_file.exists():
        print(f"[ERROR] Database file not found: {db_file}")
        print("Run 'python src/data/seed.py' first to initialize and seed the database.")
        sys.exit(1)
    conn = sqlite3.connect(db_file)
    conn.row_factory = sqlite3.Row
    return conn


def format_table(headers: List[str], rows: List[List[Any]], max_col_width: int = 35) -> str:
    if not headers:
        return "(empty table)"
    
    # Truncate long cells and convert to str
    formatted_rows = []
    for row in rows:
        formatted_row = []
        for cell in row:
            val = "NULL" if cell is None else str(cell).replace("\n", " ")
            if len(val) > max_col_width:
                val = val[: max_col_width - 3] + "..."
            formatted_row.append(val)
        formatted_rows.append(formatted_row)

    col_widths = [len(h) for h in headers]
    for row in formatted_rows:
        for i, val in enumerate(row):
            if i < len(col_widths):
                col_widths[i] = max(col_widths[i], len(val))

    sep = "+-" + "-+-".join("-" * w for w in col_widths) + "-+"
    header_str = "| " + " | ".join(h.ljust(w) for h, w in zip(headers, col_widths)) + " |"

    lines = [sep, header_str, sep]
    for row in formatted_rows:
        line = "| " + " | ".join(cell.ljust(w) for cell, w in zip(row, col_widths)) + " |"
        lines.append(line)
    lines.append(sep)
    return "\n".join(lines)


def show_summary(conn: sqlite3.Connection):
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    tables = [r[0] for r in cursor.fetchall()]

    print("\n" + "=" * 78)
    print(" [D1 MISSION READINESS COPILOT] DATABASE OVERVIEW")
    print(f" Database File: {DB_PATH.resolve()} (Size: {DB_PATH.stat().st_size / 1024:.1f} KB)")
    print("=" * 78)

    summary_headers = ["Table Name", "Row Count", "Columns Count", "Primary Key / Unique Columns"]
    summary_rows = []

    for t in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        count = cursor.fetchone()[0]

        cursor.execute(f"PRAGMA table_info({t})")
        cols = cursor.fetchall()
        col_names = [c["name"] for c in cols]
        pk_cols = [c["name"] for c in cols if c["pk"] > 0]
        pk_desc = ", ".join(pk_cols) if pk_cols else "-"

        summary_rows.append([t, str(count), str(len(col_names)), pk_desc])

    print(format_table(summary_headers, summary_rows, max_col_width=40))
    print("\n👉 To inspect a specific table:  python scripts/inspect_db.py --table <table_name>")
    print("👉 To inspect all tables:        python scripts/inspect_db.py --all")
    print("👉 To execute a custom query:    python scripts/inspect_db.py --query \"SELECT * FROM assets LIMIT 5\"\n")


def show_table(conn: sqlite3.Connection, table_name: str, limit: int = 25):
    cursor = conn.cursor()
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    if not cursor.fetchone():
        print(f"\n[ERROR] Table '{table_name}' does not exist in {DB_PATH}.")
        return

    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    total_count = cursor.fetchone()[0]

    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [col["name"] for col in cursor.fetchall()]

    cursor.execute(f"SELECT * FROM {table_name} LIMIT ?", (limit,))
    rows = cursor.fetchall()
    row_data = [[r[c] for c in columns] for r in rows]

    print("\n" + "=" * 80)
    print(f" 📋 TABLE: {table_name.upper()} (Showing {len(rows)} of {total_count} rows)")
    print("=" * 80)
    print(format_table(columns, row_data, max_col_width=30))
    if total_count > limit:
        print(f"* Displaying first {limit} rows. Use --limit {total_count} to view all.")


def execute_custom_query(conn: sqlite3.Connection, query: str):
    cursor = conn.cursor()
    print("\n" + "=" * 80)
    print(f" 🔍 EXECUTING SQL: {query}")
    print("=" * 80)
    try:
        cursor.execute(query)
        if cursor.description:
            columns = [d[0] for d in cursor.description]
            rows = cursor.fetchall()
            row_data = [[r[c] for c in columns] for r in rows]
            print(format_table(columns, row_data, max_col_width=35))
            print(f"\nTotal rows returned: {len(rows)}")
        else:
            conn.commit()
            print("Query executed successfully (no result set returned).")
    except Exception as e:
        print(f"[SQL ERROR] {e}")


def main():
    parser = argparse.ArgumentParser(description="Inspect D1 Mission Readiness SQLite Database")
    parser.add_argument("--table", "-t", type=str, help="Name of table to inspect (e.g. assets, users, work_orders)")
    parser.add_argument("--limit", "-l", type=int, default=25, help="Maximum rows to display (default: 25)")
    parser.add_argument("--all", "-a", action="store_true", help="Inspect all tables sequentially")
    parser.add_argument("--query", "-q", type=str, help="Execute a custom SQL SELECT statement")
    parser.add_argument("--db", type=str, default=str(DB_PATH), help="Path to SQLite database file")

    args = parser.parse_args()
    conn = get_connection(Path(args.db))

    if args.query:
        execute_custom_query(conn, args.query)
    elif args.table:
        show_table(conn, args.table, limit=args.limit)
    elif args.all:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        tables = [r[0] for r in cursor.fetchall()]
        for t in tables:
            show_table(conn, t, limit=10)
    else:
        show_summary(conn)

    conn.close()


if __name__ == "__main__":
    main()
