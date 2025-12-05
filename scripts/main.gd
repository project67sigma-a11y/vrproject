extends Node3D

func _ready() -> void:
	# Setup environment
	var env = Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.5, 0.8, 1.0)
	$WorldEnvironment.environment = env

	# Create tower
	_create_tower()

	# Create city
	_create_city(60, 40)

	# Create ocean
	_create_ocean(800)

	# Create road with cars
	var road = _create_circular_path(30, "RoadPath", 64, 0.1)
	$Vehicles.add_child(road)
	for i in range(8):
		var pf = PathFollow3D.new()
		pf.progress_ratio = float(i) / 8.0
		pf.rotate = true
		pf.set_script(load("res://scripts/car.gd"))
		pf.speed = 0.8 + randf() * 0.8
		var car_mesh = MeshInstance3D.new()
		var box = BoxMesh.new()
		box.size = Vector3(1.0, 0.4, 2.0)
		car_mesh.mesh = box
		car_mesh.position = Vector3(0, 0.2, 0)
		pf.add_child(car_mesh)
		road.add_child(pf)

	# Create air path with drones
	var air = _create_circular_path(20, "AirPath", 64, 12)
	$Airspace.add_child(air)
	for i in range(4):
		var pf2 = PathFollow3D.new()
		pf2.progress_ratio = float(i) / 4.0
		pf2.rotate = true
		pf2.set_script(load("res://scripts/drone.gd"))
		pf2.speed = 0.5 + randf() * 0.6
		var drone_mesh = MeshInstance3D.new()
		var capsule = CapsuleMesh.new()
		capsule.radius = 0.25
		capsule.height = 0.4
		drone_mesh.mesh = capsule
		drone_mesh.position = Vector3(0, 0.0, 0)
		pf2.add_child(drone_mesh)
		air.add_child(pf2)

	# Arabic sign
	if $SignHolder.has_node("SignLabel"):
		$SignHolder/SignLabel.text = "برج جدة"

	# Attach teleport script to XROrigin
	$XROrigin.set_script(load("res://scripts/teleport_gaze.gd"))

	# Connect controller signals
	if $XROrigin.has_node("LeftController"):
		var left = $XROrigin/LeftController
		if left.has_signal("teleport_request"):
			left.teleport_request.connect(Callable($XROrigin, "request_teleport"))
	if $XROrigin.has_node("RightController"):
		var right = $XROrigin/RightController
		if right.has_signal("teleport_request"):
			right.teleport_request.connect(Callable($XROrigin, "request_teleport"))


func _create_tower() -> void:
	var cyl = CylinderMesh.new()
	cyl.top_radius = 2.8
	cyl.bottom_radius = 2.8
	cyl.height = 160.0
	cyl.subdivide_depth = 4

	var m = MeshInstance3D.new()
	m.mesh = cyl
	m.position = Vector3(0, 80, 0)

	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color(0.95, 0.9, 0.85)
	mat.metallic = 0.1
	mat.roughness = 0.4
	mat.emission_enabled = true
	mat.emission = Color(0.9, 0.6, 0.2)
	mat.emission_energy_multiplier = 0.6
	m.material_override = mat

	$Tower.add_child(m)


func _create_city(num_buildings: int, radius: float) -> void:
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
		bnode.position = Vector3(x, h * 0.5, z)
		var mat = StandardMaterial3D.new()
		mat.albedo_color = Color(0.75 - randf()*0.25, 0.75 - randf()*0.25, 0.78)
		mat.roughness = 1.0
		bnode.material_override = mat
		$City.add_child(bnode)


func _create_ocean(size: float) -> void:
	var plane = PlaneMesh.new()
	plane.size = Vector2(size, size)
	var ocean = MeshInstance3D.new()
	ocean.mesh = plane
	ocean.position = Vector3(0, 0.0, -size * 0.35)
	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color(0.05, 0.3, 0.6)
	mat.metallic = 0.0
	mat.roughness = 0.5
	mat.normal_scale = 0.2
	ocean.material_override = mat
	$Ocean.add_child(ocean)


func _create_circular_path(radius: float, name: String, points: int, height: float) -> Path3D:
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
