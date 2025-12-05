extends XRController3D

@export var max_distance: float = 40.0

signal teleport_request(pos : Vector3)

var _reticle: MeshInstance3D

func _ready() -> void:
    # create a small sphere reticle
    var m = SphereMesh.new()
    m.radius = 0.04
    _reticle = MeshInstance3D.new()
    _reticle.mesh = m
    var mat = StandardMaterial3D.new()
    mat.albedo_color = Color(1.0, 0.9, 0.5)
    mat.emission_enabled = true
    mat.emission = Color(1.0, 0.6, 0.15)
    _reticle.material_override = mat
    add_child(_reticle)
    _reticle.visible = false

func _process(delta: float) -> void:
    var from = global_transform.origin
    var fwd = -global_transform.basis.z
    var to = from + fwd * max_distance
    var space = get_world_3d().direct_space_state
    var query = PhysicsRayQueryParameters3D.create(from, to)
    query.exclude = [self]
    var res = space.intersect_ray(query)
    if res:
        _reticle.global_transform = Transform3D(Basis(), res.position)
        _reticle.visible = true
    else:
        _reticle.visible = false

    # trigger teleport when primary action is pressed (map controller trigger to ui_accept)
    if Input.is_action_just_pressed("ui_accept") and _reticle.visible:
        emit_signal("teleport_request", _reticle.global_transform.origin)
