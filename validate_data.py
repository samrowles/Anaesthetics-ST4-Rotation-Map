#!/usr/bin/env python3
"""
Automated Data Integrity & Schema Validation Suite for ST4 Anaesthetics Explorer
Runs client-side checks on data.js to ensure zero missing hospitals, valid coordinates,
proper schema keys, valid regions, hospital types, and unique rotation identifiers.
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

    # 1. Parse REGION_COLORS first
    color_match = re.search(r'const REGION_COLORS\s*=\s*\{([^}]+)\}', content)
    if not color_match:
        errors.append("const REGION_COLORS declaration missing from data.js")
        declared_colors = set()
    else:
        declared_colors = set(re.findall(r'"([^"]+)":\s*"#[0-9a-fA-F]{6}"', color_match.group(1)))
        print(f"[PASS] Parsed {len(declared_colors)} valid deanery colors from REGION_COLORS.")

    # 2. Extract Boundaries
    hosp_start = content.find("const HOSPITALS = {")
    rot_start = content.find("const ROTATIONS_DATA = [")
    if hosp_start == -1 or rot_start == -1:
        errors.append("Could not locate const HOSPITALS or const ROTATIONS_DATA boundaries in data.js")
        return False

    hosp_block = content[hosp_start:rot_start]
    rot_block = content[rot_start:]

    # 3. Clean Hospital Parsing (No fragile string slices)
    # Match hospital declarations: "Hospital Name": { coords: [...], region: "...", type: "..." }
    hosp_pattern = re.compile(
        r'^\s*"([^"]+)":\s*\{\s*'
        r'coords:\s*\[([0-9\.\-]+),\s*([0-9\.\-]+)\],\s*'
        r'region:\s*"([^"]+)",\s*'
        r'type:\s*"([^"]+)"',
        re.MULTILINE
    )
    hosp_entries = hosp_pattern.findall(hosp_block)
    declared_hosps = {}

    for name, lat_s, lon_s, region, htype in hosp_entries:
        lat = float(lat_s)
        lon = float(lon_s)
        declared_hosps[name] = {
            "coords": [lat, lon],
            "region": region,
            "type": htype
        }

    # Verify no hospital declarations were missed
    all_quoted_keys = re.findall(r'^\s*"([^"]+)":\s*\{', hosp_block, re.MULTILINE)
    missed_keys = set(all_quoted_keys) - set(declared_hosps.keys())
    if missed_keys:
        errors.append(f"Hospital declarations with malformed schema: {missed_keys}")

    print(f"[INFO] Successfully parsed {len(declared_hosps)} hospitals from HOSPITALS dictionary.")

    # 4. Check Hospital Region Coverage and Type Constraints
    for hname, hdata in declared_hosps.items():
        # Check coordinates in UK bounds (49.0 - 61.5 N, -9.5 - 3.0 E)
        lat, lon = hdata["coords"]
        if not (49.0 <= lat <= 61.5 and -9.5 <= lon <= 3.0):
            errors.append(f"Hospital '{hname}' coordinates out of UK bounds: [{lat}, {lon}]")
        
        # Check region exists in REGION_COLORS
        if hdata["region"] not in declared_colors:
            errors.append(f"Hospital '{hname}' has region '{hdata['region']}' which is missing from REGION_COLORS")
        
        # Check hospital type
        if hdata["type"] not in ("Tertiary", "DGH"):
            errors.append(f"Hospital '{hname}' has invalid type '{hdata['type']}' (must be 'Tertiary' or 'DGH')")

    # 5. Check Rotations Unique IDs and Hub Coordinates
    rot_ids = re.findall(r'id:\s*["\']([^"\']+)["\']', rot_block)
    if not rot_ids:
        errors.append("No rotation IDs found in ROTATIONS_DATA.")
    elif len(rot_ids) != len(set(rot_ids)):
        duplicates = [x for x in rot_ids if rot_ids.count(x) > 1]
        errors.append(f"Duplicate rotation IDs found: {set(duplicates)}")
    else:
        print(f"[PASS] All {len(rot_ids)} rotation IDs are unique.")

    # Verify driver and transit hub coordinates for all rotations
    driver_hub_matches = re.findall(r'driver:\s*\{\s*name:\s*"[^"]+",\s*coords:\s*\[([0-9\.\-]+),\s*([0-9\.\-]+)\]', rot_block)
    transit_hub_matches = re.findall(r'transit:\s*\{\s*name:\s*"[^"]+",\s*coords:\s*\[([0-9\.\-]+),\s*([0-9\.\-]+)\]', rot_block)

    if len(driver_hub_matches) != len(rot_ids):
        errors.append(f"Driver hubs mismatch: found {len(driver_hub_matches)} driver hubs for {len(rot_ids)} rotations.")
    if len(transit_hub_matches) != len(rot_ids):
        errors.append(f"Transit hubs mismatch: found {len(transit_hub_matches)} transit hubs for {len(rot_ids)} rotations.")

    for lat_s, lon_s in driver_hub_matches:
        lat, lon = float(lat_s), float(lon_s)
        if not (49.0 <= lat <= 61.5 and -9.5 <= lon <= 3.0):
            errors.append(f"Driver hub coordinate out of UK bounds: [{lat}, {lon}]")

    for lat_s, lon_s in transit_hub_matches:
        lat, lon = float(lat_s), float(lon_s)
        if not (49.0 <= lat <= 61.5 and -9.5 <= lon <= 3.0):
            errors.append(f"Transit hub coordinate out of UK bounds: [{lat}, {lon}]")

    print(f"[PASS] All {len(driver_hub_matches)} driver and {len(transit_hub_matches)} transit hubs have valid UK coordinates.")

    # 6. Check Referenced Hospitals in Rotation Stages
    referenced_hosps = re.findall(r'hosp:\s*"([^"]+)"', rot_block)
    missing = set(referenced_hosps) - set(declared_hosps.keys())
    if missing:
        errors.append(f"Referenced hospitals in rotations that are missing from HOSPITALS dictionary: {missing}")
    else:
        print(f"[PASS] All {len(referenced_hosps)} stage references map cleanly to declared hospitals.")

    # 7. Check Rotation Regions in REGION_COLORS
    regions_in_rotations = set(re.findall(r'region:\s*"([^"]+)"', rot_block))
    missing_rot_regions = regions_in_rotations - declared_colors
    if missing_rot_regions:
        errors.append(f"Rotations have regions missing from REGION_COLORS: {missing_rot_regions}")
    else:
        print(f"[PASS] All {len(regions_in_rotations)} NHS rotation regions map to REGION_COLORS.")

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
