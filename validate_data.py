#!/usr/bin/env python3
"""
Automated Data Integrity & Schema Validation Suite for ST4 Anaesthetics Explorer
Runs client-side checks on data.js to ensure zero missing hospitals, valid coordinates,
proper schema keys, valid regions, hospital types, unique rotation identifiers, complete
rotation metadata, and valid service worker caching configuration.
"""

import sys
import re

def validate_sw_js(file_path="sw.js"):
    print(f"--> Validating {file_path}...")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"[FAIL] Could not read service worker file: {e}")
        return False

    errors = []
    cache_match = re.search(r'const\s+CACHE_NAME\s*=\s*["\']([^"\']+)["\']', content)
    if not cache_match:
        errors.append("const CACHE_NAME declaration missing from sw.js")
    else:
        cache_name = cache_match.group(1).strip()
        if not cache_name:
            errors.append("CACHE_NAME in sw.js is empty")
        elif not re.match(r'^st4-explorer-v\d+$', cache_name):
            errors.append(f"CACHE_NAME '{cache_name}' does not match expected versioned pattern 'st4-explorer-v<N>'")
        else:
            print(f"[PASS] Service Worker defines valid CACHE_NAME: '{cache_name}'.")

    if errors:
        for err in errors:
            print(f"  [X] {err}")
        return False
    return True

def validate_data_js(file_path="data.js", sw_path="sw.js"):
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

    # 6. Check Rotation Schema Completeness (code, title, places, stages)
    id_matches = list(re.finditer(r'\{\s*\n?\s*id:\s*["\']([^"\']+)["\']', rot_block))
    rot_schema_errors = 0
    for i, m in enumerate(id_matches):
        rot_id = m.group(1)
        start_pos = m.start()
        end_pos = id_matches[i + 1].start() if i + 1 < len(id_matches) else rot_block.rfind("];")
        chunk = rot_block[start_pos:end_pos]

        code_m = re.search(r'code:\s*["\']([^"\']*)["\']', chunk)
        if not code_m or not code_m.group(1).strip():
            errors.append(f"Rotation '{rot_id}' is missing a valid non-empty 'code'")
            rot_schema_errors += 1

        title_m = re.search(r'title:\s*["\']([^"\']*)["\']', chunk)
        if not title_m or not title_m.group(1).strip():
            errors.append(f"Rotation '{rot_id}' is missing a valid non-empty 'title'")
            rot_schema_errors += 1

        places_m = re.search(r'places:\s*["\']([^"\']*)["\']', chunk)
        if not places_m or not places_m.group(1).strip():
            errors.append(f"Rotation '{rot_id}' is missing a valid non-empty 'places'")
            rot_schema_errors += 1

        stages_m = re.search(r'stages:\s*\[(.*?)\]\s*(?:,|\n\s*\})', chunk, re.DOTALL)
        if stages_m:
            stage_hosps = re.findall(r'hosp:\s*["\']([^"\']+)["\']', stages_m.group(1))
            stage_count = len(stage_hosps)
        else:
            stage_count = 0

        if stage_count < 1:
            errors.append(f"Rotation '{rot_id}' must have at least 1 stage in 'stages' (found {stage_count})")
            rot_schema_errors += 1

    if rot_schema_errors == 0:
        print(f"[PASS] All {len(id_matches)} rotations have non-empty code, title, places, and at least 1 stage.")

    # 7. Verify driver and transit hub coordinates for all rotations
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

    # 8. Check Referenced Hospitals in Rotation Stages
    referenced_hosps = re.findall(r'hosp:\s*"([^"]+)"', rot_block)
    missing = set(referenced_hosps) - set(declared_hosps.keys())
    if missing:
        errors.append(f"Referenced hospitals in rotations that are missing from HOSPITALS dictionary: {missing}")
    else:
        print(f"[PASS] All {len(referenced_hosps)} stage references map cleanly to declared hospitals.")

    # 9. Check Rotation Regions in REGION_COLORS
    regions_in_rotations = set(re.findall(r'region:\s*"([^"]+)"', rot_block))
    missing_rot_regions = regions_in_rotations - declared_colors
    if missing_rot_regions:
        errors.append(f"Rotations have regions missing from REGION_COLORS: {missing_rot_regions}")
    else:
        print(f"[PASS] All {len(regions_in_rotations)} NHS rotation regions map to REGION_COLORS.")

    # 10. Service Worker CACHE_NAME Validation
    if sw_path:
        if not validate_sw_js(sw_path):
            errors.append("sw.js validation checks failed.")

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
