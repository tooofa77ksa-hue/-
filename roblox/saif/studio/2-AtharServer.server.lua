--!strict
-- ============================================================
--  أثر — سكربت الخادم
--  Script داخل ServerScriptService · الاسم: AtharServer
--
--  هذا السكربت يبني العالم بنفسه عند التشغيل، ويدير كل المنطق.
--  ⚠️ لا تعدّل هذا الملف — كل ما تريد تغييره موجود في AtharConfig.
--
--  قاعدة المشروع: الخادم هو المرجع النهائي.
--  العميل يرسل «نية» فقط، والخادم يقرر. انظر القسم ٧.
-- ============================================================

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage:WaitForChild("AtharConfig"))

local CLUE_TOTAL = #Config.Clues
local GATE_TOTAL = #Config.Bridge.gates
local B = Config.Bridge
local BRIDGE_START_Z = B.startZ - B.gap

-- ============================================================
-- 1) قنوات الاتصال
-- ============================================================
local Net = Instance.new("Folder")
Net.Name = "AtharNet"
Net.Parent = ReplicatedStorage

local function makeRemote(name: string): RemoteEvent
	local r = Instance.new("RemoteEvent")
	r.Name = name
	r.Parent = Net
	return r
end

-- خادم ← عميل
local EvClue   = makeRemote("ClueFound")
local EvVerdict = makeRemote("Verdict")
local EvGate   = makeRemote("GateResult")
local EvFinish = makeRemote("BridgeDone")
local EvPhase  = makeRemote("Phase")

-- عميل ← خادم (كل واحد يمر بالأبواب الأربعة)
local RqAccuse = makeRemote("RequestAccuse")
local RqBridge = makeRemote("RequestBridge")

-- ============================================================
-- 2) حالة اللاعبين — على الخادم وحده
-- ============================================================
type State = {
	clues: { [string]: boolean },
	clueCount: number,
	accused: boolean,
	phase: string,
	gate: number,
	score: number,
	failed: { [number]: boolean },
	lastAccuse: number,
	lastBridge: number,
	lastTouch: number,
}

local states: { [Player]: State } = {}

local function newState(): State
	return {
		clues = {}, clueCount = 0, accused = false, phase = "investigate",
		gate = 0, score = 0, failed = {},
		lastAccuse = 0, lastBridge = 0, lastTouch = 0,
	}
end

local function playerFrom(hit: BasePart): Player?
	local model = hit:FindFirstAncestorOfClass("Model") :: Model?
	if not model then return nil end
	return Players:GetPlayerFromCharacter(model)
end

local function teleport(player: Player, pos: Vector3)
	local char = player.Character
	if char then
		char:PivotTo(CFrame.new(pos))
	end
end

local function gateStartPos(index: number): Vector3
	local z = (index <= 1) and BRIDGE_START_Z or (B.startZ + (index - 2) * B.gap)
	return Vector3.new(0, 4, z)
end

-- ============================================================
-- 3) جمع الأدلة
--    ProximityPrompt.Triggered يعمل على الخادم،
--    فلا يستطيع أحد تزوير جمع دليل من جهازه.
-- ============================================================
local function onClueTriggered(player: Player, id: string, name: string, text: string, kind: string)
	local s = states[player]
	if not s then return end
	if s.phase ~= "investigate" then return end
	if s.clues[id] then return end

	s.clues[id] = true
	s.clueCount += 1
	EvClue:FireClient(player, id, name, text, kind, s.clueCount, CLUE_TOTAL)
end

-- ============================================================
-- 4) أدوات البناء
-- ============================================================
local function makePart(name: string, size: Vector3, pos: Vector3, color: Color3): Part
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.Position = pos
	p.Color = color
	p.Material = Enum.Material.SmoothPlastic
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	return p
end

local function makeLabel(parent: BasePart, text: string, height: number, size: number, color: Color3)
	local bb = Instance.new("BillboardGui")
	bb.Name = "Label"
	bb.Size = UDim2.new(0, 280, 0, 56)
	bb.StudsOffset = Vector3.new(0, height, 0)
	bb.AlwaysOnTop = true
	bb.MaxDistance = 150
	bb.Parent = parent

	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.Text = text
	t.TextColor3 = color
	t.TextSize = size
	t.Font = Enum.Font.GothamMedium
	t.TextStrokeTransparency = 0.4
	t.TextStrokeColor3 = Color3.new(0, 0, 0)
	t.Parent = bb
end

-- ============================================================
-- 5) بناء العالم
-- ============================================================
local World = Instance.new("Folder")
World.Name = "AtharWorld"
World.Parent = Workspace

-- الغرف
for _, room in ipairs(Config.Rooms) do
	local floor = makePart(room.name, room.size, room.pos, Config.Colors.ground)
	floor.Parent = World
	makeLabel(floor, room.name, 6, 20, Color3.fromRGB(180, 195, 215))
end

-- نقطة الظهور
local spawnPad = Instance.new("SpawnLocation")
spawnPad.Name = "AtharSpawn"
spawnPad.Size = Vector3.new(8, 1, 8)
spawnPad.Position = Vector3.new(0, 1, -30)
spawnPad.Color = Config.Colors.physical
spawnPad.Anchored = true
spawnPad.Neutral = true
spawnPad.Parent = World

-- الأدلة
for _, clue in ipairs(Config.Clues) do
	local color = (clue.kind == "digital") and Config.Colors.digital or Config.Colors.physical
	local part = makePart("Clue_" .. clue.id, Vector3.new(2, 2, 2), clue.pos, color)
	part.Material = Enum.Material.Neon
	part.Parent = World
	makeLabel(part, clue.name, 3, 17, color)

	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = Config.UI.promptAction
	prompt.ObjectText = clue.name
	prompt.HoldDuration = 0.4
	prompt.MaxActivationDistance = 12
	prompt.RequiresLineOfSight = false
	prompt.Parent = part

	local id, name, text, kind = clue.id, clue.name, clue.text, clue.kind
	prompt.Triggered:Connect(function(player: Player)
		onClueTriggered(player, id, name, text, kind)
	end)
end

-- الجسر الآمن
local startPad = makePart("BridgeStart", Vector3.new(B.spread * 2 + 4, 1, 12),
	Vector3.new(0, 0, BRIDGE_START_Z), Config.Colors.physical)
startPad.Parent = World
makeLabel(startPad, Config.UI.bridgeTitle .. " — " .. Config.UI.bridgeHint, 7, 20, Config.Colors.physical)

local planks: { BasePart } = {}

for i, gate in ipairs(B.gates) do
	local z = B.startZ + (i - 1) * B.gap
	local realX = (gate.side == "left") and -B.spread / 2 or B.spread / 2

	local realPart = makePart("Gate" .. i .. "_Real", Vector3.new(B.width, 1, B.length),
		Vector3.new(realX, 0, z), Config.Colors.plankSafe)
	realPart:SetAttribute("GateIndex", i)
	realPart:SetAttribute("IsReal", true)
	realPart.Parent = World
	makeLabel(realPart, gate.real, 4, 16, Color3.fromRGB(226, 236, 246))

	local fakePart = makePart("Gate" .. i .. "_Fake", Vector3.new(B.width, 1, B.length),
		Vector3.new(-realX, 0, z), Config.Colors.plankSafe)
	fakePart:SetAttribute("GateIndex", i)
	fakePart:SetAttribute("IsReal", false)
	fakePart.Parent = World
	makeLabel(fakePart, gate.fake, 4, 16, Color3.fromRGB(226, 236, 246))

	table.insert(planks, realPart)
	table.insert(planks, fakePart)
end

local finishPad = makePart("Finish", Vector3.new(B.spread * 2 + 4, 1, 14),
	Vector3.new(0, 0, B.startZ + GATE_TOTAL * B.gap), Config.Colors.finish)
finishPad.Material = Enum.Material.Neon
finishPad.Parent = World
makeLabel(finishPad, Config.UI.finishTitle, 7, 22, Config.Colors.finish)

-- أرضية أمان: من يسقط يعود، ولا يموت
local safety = makePart("Safety", Vector3.new(500, 1, 500), Vector3.new(0, -24, 40),
	Color3.fromRGB(18, 24, 36))
safety.Transparency = 0.6
safety.CanCollide = false
safety.Parent = World

-- ============================================================
-- 6) دخول اللاعبين وخروجهم
-- ============================================================
local function setup(player: Player)
	states[player] = newState()
	EvPhase:FireClient(player, "investigate")
end

for _, p in ipairs(Players:GetPlayers()) do
	setup(p)
end
Players.PlayerAdded:Connect(setup)

Players.PlayerRemoving:Connect(function(player)
	states[player] = nil
end)

-- ============================================================
-- 7) الاتهام — الأبواب الأربعة قبل أي منطق
--    ① النوع  ② القيمة  ③ المعدل  ④ السياق
-- ============================================================
local function isValidSuspect(id: string): boolean
	for _, sus in ipairs(Config.Case.suspects) do
		if sus.id == id then return true end
	end
	return false
end

RqAccuse.OnServerEvent:Connect(function(player: Player, suspectId: any)
	local s = states[player]
	if not s then return end

	if typeof(suspectId) ~= "string" then return end          -- ① النوع
	if #suspectId > 32 or not isValidSuspect(suspectId) then return end  -- ② القيمة

	local now = os.clock()
	if now - s.lastAccuse < 2 then return end                 -- ③ المعدل
	s.lastAccuse = now

	if s.clueCount < CLUE_TOTAL then return end               -- ④ السياق
	if s.accused then return end

	s.accused = true
	local correct = (suspectId == Config.Case.answer)
	EvVerdict:FireClient(player, correct,
		correct and Config.Case.rightTitle or Config.Case.wrongTitle,
		Config.Case.reveal, Config.Case.rule)
end)

RqBridge.OnServerEvent:Connect(function(player: Player)
	local s = states[player]
	if not s then return end

	local now = os.clock()
	if now - s.lastBridge < 1 then return end                 -- ③ المعدل
	s.lastBridge = now

	if not s.accused then return end                          -- ④ السياق
	if s.phase == "bridge" then return end

	s.phase = "bridge"
	s.gate, s.score, s.failed = 0, 0, {}
	teleport(player, Vector3.new(0, 4, BRIDGE_START_Z))
	EvPhase:FireClient(player, "bridge")
end)

-- ============================================================
-- 8) الجسر — لمس الألواح
-- ============================================================
local function onPlankTouched(part: BasePart, hit: BasePart)
	local player = playerFrom(hit)
	if not player then return end

	local s = states[player]
	if not s or s.phase ~= "bridge" then return end

	local index = part:GetAttribute("GateIndex")
	local isReal = part:GetAttribute("IsReal")
	if typeof(index) ~= "number" or typeof(isReal) ~= "boolean" then return end

	local now = os.clock()
	if now - s.lastTouch < 0.7 then return end
	s.lastTouch = now

	if isReal then
		if index <= s.gate then return end
		s.gate = index
		if not s.failed[index] then
			s.score += 1
		end
		EvGate:FireClient(player, true, index, GATE_TOTAL, "", s.score)
		if index == GATE_TOTAL then
			EvFinish:FireClient(player, s.score, GATE_TOTAL)
		end
	else
		s.failed[index] = true
		EvGate:FireClient(player, false, index, GATE_TOTAL, B.tips[index] or "", s.score)
		teleport(player, gateStartPos(index))
	end
end

for _, plank in ipairs(planks) do
	plank.Touched:Connect(function(hit: BasePart)
		onPlankTouched(plank, hit)
	end)
end

safety.Touched:Connect(function(hit: BasePart)
	local player = playerFrom(hit)
	if not player then return end
	local s = states[player]
	if not s then return end

	if s.phase == "bridge" then
		teleport(player, gateStartPos(s.gate + 1))
	else
		teleport(player, Vector3.new(0, 5, -30))
	end
end)

print(("[أثر] العالم جاهز — %d غرف · %d أدلة · %d بوابات")
	:format(#Config.Rooms, CLUE_TOTAL, GATE_TOTAL))
