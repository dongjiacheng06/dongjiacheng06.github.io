#!/usr/bin/env python3

import argparse
import copy
import json
import struct
from pathlib import Path


COMPONENT_COUNT = {
    "SCALAR": 1,
    "VEC2": 2,
    "VEC3": 3,
    "VEC4": 4,
    "MAT2": 4,
    "MAT3": 9,
    "MAT4": 16,
}

COMPONENT_SIZE = {
    5120: 1,
    5121: 1,
    5122: 2,
    5123: 2,
    5125: 4,
    5126: 4,
}


def read_glb(path: Path):
    with path.open("rb") as f:
        magic, version, length = struct.unpack("<4sII", f.read(12))
        if magic != b"glTF" or version != 2:
            raise ValueError(f"{path} is not a glTF 2.0 binary")
        json_length, json_type = struct.unpack("<I4s", f.read(8))
        if json_type != b"JSON":
            raise ValueError(f"{path} is missing a JSON chunk")
        doc = json.loads(f.read(json_length).decode("utf-8"))
        bin_length, bin_type = struct.unpack("<I4s", f.read(8))
        if bin_type != b"BIN\x00":
            raise ValueError(f"{path} is missing a BIN chunk")
        binary = f.read(bin_length)
    return doc, binary, length


def write_glb(path: Path, doc, binary: bytes):
    json_chunk = json.dumps(doc, separators=(",", ":")).encode("utf-8")
    json_padding = (-len(json_chunk)) % 4
    if json_padding:
        json_chunk += b" " * json_padding

    bin_padding = (-len(binary)) % 4
    if bin_padding:
        binary += b"\x00" * bin_padding

    total_length = 12 + 8 + len(json_chunk) + 8 + len(binary)
    with path.open("wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total_length))
        f.write(struct.pack("<I4s", len(json_chunk), b"JSON"))
        f.write(json_chunk)
        f.write(struct.pack("<I4s", len(binary), b"BIN\x00"))
        f.write(binary)


def accessor_byte_length(accessor):
    return (
        accessor["count"]
        * COMPONENT_COUNT[accessor["type"]]
        * COMPONENT_SIZE[accessor["componentType"]]
    )


def locate_point_primitive(doc):
    for mesh_index, mesh in enumerate(doc.get("meshes", [])):
        for prim_index, primitive in enumerate(mesh.get("primitives", [])):
            if primitive.get("mode", 4) == 0 and "POSITION" in primitive.get("attributes", {}):
                return mesh_index, prim_index, primitive
    raise ValueError("No POINTS primitive found")


def downsample_points(binary, doc, primitive, target_points):
    position_accessor_index = primitive["attributes"]["POSITION"]
    color_accessor_index = primitive["attributes"].get("COLOR_0")
    if color_accessor_index is None:
        raise ValueError("POINTS primitive is missing COLOR_0")

    position_accessor = doc["accessors"][position_accessor_index]
    color_accessor = doc["accessors"][color_accessor_index]
    position_view_index = position_accessor["bufferView"]
    color_view_index = color_accessor["bufferView"]
    position_view = doc["bufferViews"][position_view_index]
    color_view = doc["bufferViews"][color_view_index]

    if position_accessor["componentType"] != 5126 or position_accessor["type"] != "VEC3":
        raise ValueError("Expected float32 VEC3 positions")
    if color_accessor["componentType"] != 5121 or color_accessor["type"] != "VEC4":
        raise ValueError("Expected uint8 VEC4 colors")
    if position_view.get("byteStride") or color_view.get("byteStride"):
        raise ValueError("Strided point buffers are not supported")

    original_count = position_accessor["count"]
    target_count = min(target_points, original_count)
    if target_count == original_count:
        return None

    if accessor_byte_length(position_accessor) != position_view["byteLength"]:
        raise ValueError("Unexpected packed position buffer layout")
    if accessor_byte_length(color_accessor) != color_view["byteLength"]:
        raise ValueError("Unexpected packed color buffer layout")

    position_offset = position_view.get("byteOffset", 0) + position_accessor.get("byteOffset", 0)
    color_offset = color_view.get("byteOffset", 0) + color_accessor.get("byteOffset", 0)
    position_bytes = memoryview(binary)[position_offset:position_offset + position_view["byteLength"]]
    color_bytes = memoryview(binary)[color_offset:color_offset + color_view["byteLength"]]

    sampled_positions = bytearray(target_count * 12)
    sampled_colors = bytearray(target_count * 4)

    pos_min = [float("inf"), float("inf"), float("inf")]
    pos_max = [float("-inf"), float("-inf"), float("-inf")]
    color_min = [255, 255, 255, 255]
    color_max = [0, 0, 0, 0]

    for out_index in range(target_count):
        src_index = (out_index * original_count) // target_count
        pos_src = src_index * 12
        color_src = src_index * 4
        pos_dst = out_index * 12
        color_dst = out_index * 4

        sampled_positions[pos_dst:pos_dst + 12] = position_bytes[pos_src:pos_src + 12]
        sampled_colors[color_dst:color_dst + 4] = color_bytes[color_src:color_src + 4]

        x, y, z = struct.unpack_from("<fff", position_bytes, pos_src)
        pos_min[0] = min(pos_min[0], x)
        pos_min[1] = min(pos_min[1], y)
        pos_min[2] = min(pos_min[2], z)
        pos_max[0] = max(pos_max[0], x)
        pos_max[1] = max(pos_max[1], y)
        pos_max[2] = max(pos_max[2], z)

        r, g, b, a = sampled_colors[color_dst:color_dst + 4]
        color_min[0] = min(color_min[0], r)
        color_min[1] = min(color_min[1], g)
        color_min[2] = min(color_min[2], b)
        color_min[3] = min(color_min[3], a)
        color_max[0] = max(color_max[0], r)
        color_max[1] = max(color_max[1], g)
        color_max[2] = max(color_max[2], b)
        color_max[3] = max(color_max[3], a)

    position_accessor["count"] = target_count
    position_accessor["min"] = pos_min
    position_accessor["max"] = pos_max
    color_accessor["count"] = target_count
    color_accessor["min"] = color_min
    color_accessor["max"] = color_max

    return {
        position_view_index: bytes(sampled_positions),
        color_view_index: bytes(sampled_colors),
        "original_count": original_count,
        "target_count": target_count,
    }


def repack_binary(binary, doc, replacements):
    new_binary = bytearray()
    for view_index, buffer_view in enumerate(doc["bufferViews"]):
        payload = replacements.get(view_index)
        if payload is None:
            start = buffer_view.get("byteOffset", 0)
            payload = binary[start:start + buffer_view["byteLength"]]

        padding = (-len(new_binary)) % 4
        if padding:
            new_binary.extend(b"\x00" * padding)

        buffer_view["byteOffset"] = len(new_binary)
        buffer_view["byteLength"] = len(payload)
        new_binary.extend(payload)

    doc["buffers"][0]["byteLength"] = len(new_binary)
    return bytes(new_binary)


def main():
    parser = argparse.ArgumentParser(description="Downsample point-cloud-heavy GLB files for web viewing.")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--target-points", type=int, default=200000)
    args = parser.parse_args()

    doc, binary, original_length = read_glb(args.input)
    doc = copy.deepcopy(doc)
    _, _, primitive = locate_point_primitive(doc)
    replacements = downsample_points(binary, doc, primitive, args.target_points)
    if replacements is None:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(args.input.read_bytes())
        print(f"{args.input} already has <= {args.target_points} points")
        return

    original_count = replacements.pop("original_count")
    target_count = replacements.pop("target_count")
    new_binary = repack_binary(binary, doc, replacements)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    write_glb(args.output, doc, new_binary)

    print(f"input={args.input}")
    print(f"output={args.output}")
    print(f"points={original_count}->{target_count}")
    print(f"size_mb={args.input.stat().st_size / 1024 / 1024:.2f}->{args.output.stat().st_size / 1024 / 1024:.2f}")
    print(f"glb_length={original_length}->{args.output.stat().st_size}")


if __name__ == "__main__":
    main()
