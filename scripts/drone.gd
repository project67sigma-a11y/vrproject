extends PathFollow3D

@export var speed: float = 0.7
@export var bob_amplitude: float = 0.6
@export var bob_speed: float = 1.5

var _time := 0.0

func _process(delta: float) -> void:
    _time += delta
    progress_ratio = fmod(progress_ratio + speed * delta * 0.08, 1.0)
    # bob up and down relative to the follow position
    var bob = sin(_time * bob_speed) * bob_amplitude
    position = Vector3(0, bob, 0)
