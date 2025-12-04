extends PathFollow3D

@export var speed: float = 1.0

func _process(delta: float) -> void:
    # Move along path by changing unit_offset
    unit_offset = (unit_offset + speed * delta * 0.1) % 1.0
    # Simple orientation to face forward is automatic if rotate = true on PathFollow3D
