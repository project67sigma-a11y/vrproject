extends PathFollow3D

@export var speed: float = 1.0

func _process(delta: float) -> void:
    # Move along path by changing progress_ratio (Godot 4.3+)
    progress_ratio = fmod(progress_ratio + speed * delta * 0.1, 1.0)
    # Simple orientation to face forward is automatic if rotate = true on PathFollow3D
