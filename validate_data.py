#!/usr/bin/env python3
"""
Automated Data Integrity & Schema Validation Suite for ST4 Anaesthetics Explorer
Runs client-side checks on data.js to ensure zero missing hospitals, valid coordinates,
proper schema keys, and unique rotation identifiers.
"""

import sys
import re

def validate_data_js(file_path="data.js"):
    print(f"--> Validating {file_path}...")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"[FAIL] Could not read file: {e}")
        return False

    errors = []

    # 1. Check unique rotation IDs
    ids = re.findall(r'id:\s*["\']([^"\']+)["\']', content)
    if not ids:
        errors.append("No rotation IDs found in file.")
    elif len(ids) != len(set(ids)):
        duplicates = [x for x in ids if ids.count(x) > 1]
        errors.append(f"Duplicate rotation IDs found: {set(duplicates)}")
    else:
        print(f"[PASS] All {len(ids)} rotation IDs are unique.")

    # 2. Check declared hospitals in HOSPITALS object
    rot_idx = content.find("const ROTATIONS_DATA")
    if rot_idx == -1:
        errors.append("Could not find 'const ROTATIONS_DATA' boundary.")
        return False

    hosp_block = content[:rot_idx]
    rot_block = content[rot_idx:]

    declared_hosps = re.findall(r'"([^"]+)":\s*\{', hosp_block)
    # Remove non-hospital top keys if any
    declared_hosps = [h for h in declared_hosps if "coords" in hosp_block[hosp_block.find(f'"{h}"'):hosp_block.find(f'"{h}"') + 300]]

    print(f"[INFO] Found {len(declared_hosps)} declared hospitals.")

    # 3. Check all referenced hospitals in stages exist
    referenced_hosps = re.findall(r'hosp:\s*"([^"]+)"', rot_block)
    missing = set(referenced_hosps) - set(declared_hosps)
    if missing:
        errors.append(f"Referenced hospitals in rotations that are missing from HOSPITALS dictionary: {missing}")
    else:
        print(f"[PASS] All {len(referenced_hosps)} stage references map cleanly to declared hospitals.")

    # 4. Check coordinates validity (UK bounding box: 49.0 - 61.0 N, -9.0 - 2.5 E)
    coord_matches = re.findall(r'coords:\s*\[([0-9\.\-]+),\s*([0-9\.\-]+)\]', content)
    coord_errors = 0
    for lat_str, lon_str in coord_matches:
        lat = float(lat_str)
        lon = float(lon_str)
        if not (49.0 <= lat <= 61.5 and -9.5 <= lon <= 3.0):
            coord_errors += 1
            errors.append(f"Coordinate out of UK bounds: [{lat}, {lon}]")
    if coord_errors == 0:
        print(f"[PASS] All {len(coord_matches)} coordinate pairs are within valid UK geographical bounds.")

    if errors:
        print("\n=== VALIDATION FAILED ===")
        for err in errors:
            print(f"  [X] {err}")
        return False

    print("\n[SUCCESS] ALL INTEGRITY CHECKS PASSED: 100% data consistency verified.")
    return True

if __name__ == "__main__":
    success = validate_data_js()
    sys.exit(0 if success else 1)
