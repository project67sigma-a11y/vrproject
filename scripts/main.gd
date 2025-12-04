extends Node3D

@onready var xr_origin: Node3D = $XROrigin
@onready var camera: Camera3D = $XROrigin/Camera3D

const CAR_SCENE := preload("res://scenes/car.tscn")
const DRONE_SCENE := preload("res://scenes/drone.tscn")

func _ready() -> void:
    # Setup a simple daytime sky (ProceduralSky) and environment
    var env = Environment.new()
    var sky = ProceduralSky.new()
    sky.sky_top_color = Color(0.2, 0.6, 1.0)
    sky.sky_horizon_color = Color(0.6, 0.8, 1.0)
    env.background_mode = Environment.BG_SKY
    env.sky = sky
    $WorldEnvironment.environment = env

    # Create a glowing skyscraper inspired by Jeddah Tower
    _create_tower()

    # Create circular low-poly city around tower
    _create_city(num_buildings=60, radius=40)

    # Ocean (Red Sea) behind the city
    _create_ocean(size=800)

    # Create road path and spawn cars
    var road = _create_circular_path(radius=30, name="RoadPath", points=64, height=0.1)
    for i in range(8):
        var pf = PathFollow3D.new()
        pf.unit_offset = i / 8.0
        pf.rotate = true
        pf.set_script(load("res://scripts/car.gd"))
        pf.set("speed", 0.8 + randf() * 0.8)
        var car = CAR_SCENE.instantiate()
        pf.add_child(car)
        road.add_child(pf)
        $Vehicles.add_child(road)

    # Create air path and spawn drones
    var air = _create_circular_path(radius=20, name="AirPath", points=64, height=10)
    for i in range(4):
        var pf2 = PathFollow3D.new()
        pf2.unit_offset = i / 4.0
        pf2.rotate = true
        pf2.set_script(load("res://scripts/drone.gd"))
        pf2.set("speed", 0.5 + randf() * 0.6)
        var drone = DRONE_SCENE.instantiate()
        pf2.add_child(drone)
        air.add_child(pf2)
        $Airspace.add_child(air)

    # Arabic sign near the tower using Label3D
    var sign = Label3D.new()
    sign.text = "برج جدة"
    sign.billboard = BaseMaterial3D.BILLBOARD_ENABLED
    sign.position = Vector3(3, 1.2, 2)
    sign.rotate_y(deg2rad(35))
    $SignHolder.add_child(sign)

    # Attach teleport script to XROrigin for gaze teleportation
    xr_origin.set_script(load("res://scripts/teleport_gaze.gd"))


func _create_tower() -> void:
    var cyl = CylinderMesh.new()
    cyl.top_radius = 2.8
    cyl.bottom_radius = 2.8
    cyl.height = 160.0
    cyl.subdivide_depth = 4

    var m = MeshInstance3D.new()
    m.mesh = cyl
    m.translation = Vector3(0, cyl.height * 0.5, 0)

    var mat = StandardMaterial3D.new()
    mat.albedo_color = Color(0.95, 0.9, 0.85)
    mat.metallic = 0.1
    mat.roughness = 0.4
    mat.emission_enabled = true
    mat.emission = Color(0.9, 0.6, 0.2)
    mat.emission_energy = 0.6
    m.material_override = mat

    $Tower.add_child(m)


func _create_city(num_buildings:=40, radius:=30) -> void:
    randomize()
    for i in range(num_buildings):
        var angle = TAU * i / num_buildings + randf() * 0.3
        var dist = radius * (0.7 + randf() * 0.3)
        var x = cos(angle) * dist
        var z = sin(angle) * dist
        var h = 2.0 + randf() * 12.0
        var box = BoxMesh.new()
        box.size = Vector3(1.8 + randf() * 4.0, h, 1.8 + randf() * 4.0)
        var bnode = MeshInstance3D.new()
        bnode.mesh = box
        bnode.translation = Vector3(x, h * 0.5, z)
        var mat = StandardMaterial3D.new()
        mat.albedo_color = Color(0.75 - randf()*0.25, 0.75 - randf()*0.25, 0.78)
        mat.roughness = 1.0
        bnode.material_override = mat
        $City.add_child(bnode)


func _create_ocean(size:=500) -> void:
    var plane = PlaneMesh.new()
    plane.size = Vector2(size, size)
    var ocean = MeshInstance3D.new()
    ocean.mesh = plane
    ocean.translation = Vector3(0, 0.0, -size * 0.35)
    var mat = StandardMaterial3D.new()
    mat.albedo_color = Color(0.05, 0.3, 0.6)
    mat.metallic = 0.0
    mat.roughness = 0.5
    mat.normal_scale = 0.2
    ocean.material_override = mat
    $Ocean.add_child(ocean)


func _create_circular_path(radius:=20, name:="Path", points:=32, height:=0.0) -> Path3D:
    var path = Path3D.new()
    path.name = name
    var curve = Curve3D.new()
    for i in range(points):
        var a = TAU * i / points
        var x = cos(a) * radius
        var z = sin(a) * radius
        curve.add_point(Vector3(x, height, z))
    # close the curve
    curve.add_point(curve.get_point_position(0))
    path.curve = curve
    return path
