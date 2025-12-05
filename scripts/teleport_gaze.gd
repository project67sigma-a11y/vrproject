extends Node3D

@export var max_distance: float = 40.0
@export var reticle_scene: PackedScene

var _reticle: MeshInstance3D
var _last_hit: Vector3 = Vector3.ZERO

func _ready() -> void:
    # Create a simple reticle if none provided
    if not reticle_scene:
        var m = SphereMesh.new()
        m.radius = 0.06
        _reticle = MeshInstance3D.new()
        _reticle.mesh = m
        var mat = StandardMaterial3D.new()
        mat.albedo_color = Color(1.0, 0.9, 0.4)
        mat.emission_enabled = true
        mat.emission = Color(0.9, 0.6, 0.15)
        _reticle.material_override = mat
        add_child(_reticle)
    else:
        _reticle = reticle_scene.instantiate()
        add_child(_reticle)

    _reticle.visible = false

func _process(delta: float) -> void:
    var cam = get_node("../XRCamera") if has_node("../XRCamera") else get_tree().get_root().get_node_or_null("root/XRCamera")
    if not cam:
        cam = get_viewport().get_camera_3d()
    if not cam:
        return

    var from = cam.global_transform.origin
    var fwd = -cam.global_transform.basis.z
    var to = from + fwd * max_distance

    var space = get_world_3d().direct_space_state
    var query = PhysicsRayQueryParameters3D.create(from, to)
    query.exclude = [self, cam]
    var res = space.intersect_ray(query)
    if res:
        _last_hit = res.position
        _reticle.global_transform = Transform3D(Basis(), _last_hit + Vector3(0, 0.02, 0))
        _reticle.visible = true
    else:
        _reticle.visible = false

    # Teleport on primary action (mouse left or VR trigger mapped to ui_accept)
    if Input.is_action_just_pressed("ui_accept") and _reticle.visible:
        _teleport_to(_last_hit)

func _teleport_to(pos: Vector3) -> void:
    # Move the XROrigin (this node) so camera lands at pos.
    # Keep current height offset of camera from origin.
    var cam = get_node("../XRCamera") if has_node("../XRCamera") else get_viewport().get_camera_3d()
    if not cam:
        return
    var camera_local = cam.global_transform.origin - global_transform.origin
    # Place origin so that camera ends up at hit position
    global_transform.origin = pos - camera_local


func request_teleport(pos: Vector3) -> void:
    # Public method other nodes can call to request a teleport
    _teleport_to(pos)
