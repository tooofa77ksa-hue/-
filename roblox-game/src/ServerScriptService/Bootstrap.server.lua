-- Script: ServerScriptService/Bootstrap
-- Creates everything the game needs at runtime: RemoteEvents, leaderstats,
-- the mineable Ore part + ClickDetector, and per-player save/load hooks.
-- Nothing here needs to be pre-built manually in Studio's Explorer.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local PlayerData = require(script.Parent:WaitForChild("PlayerData"))

-- === RemoteEvents folder ===
local remotes = Instance.new("Folder")
remotes.Name = "Remotes"
remotes.Parent = ReplicatedStorage

local function newRemote(name: string)
	local re = Instance.new("RemoteEvent")
	re.Name = name
	re.Parent = remotes
	return re
end

newRemote("BuyUpgrade")
newRemote("BuyRebirth")
newRemote("BuyGamepass")
newRemote("DataUpdated") -- server -> client, pushes latest Coins/Power/Rebirths

-- === Ore part + ClickDetector ===
local ore = Instance.new("Part")
ore.Name = "Ore"
ore.Anchored = true
ore.Size = Vector3.new(8, 8, 8)
ore.Position = Vector3.new(0, 4, 0)
ore.Material = Enum.Material.Rock
ore.Color = Color3.fromRGB(120, 100, 90)
ore.Shape = Enum.PartType.Ball
ore.Parent = Workspace

local baseplate = Instance.new("Part")
baseplate.Name = "Baseplate"
baseplate.Anchored = true
baseplate.Size = Vector3.new(200, 1, 200)
baseplate.Position = Vector3.new(0, -0.5, 0)
baseplate.Material = Enum.Material.Grass
baseplate.Color = Color3.fromRGB(90, 140, 90)
baseplate.Parent = Workspace

local clickDetector = Instance.new("ClickDetector")
clickDetector.MaxActivationDistance = 32
clickDetector.Parent = ore

-- === Per-player setup ===
local function setupLeaderstats(player: Player, data)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	leaderstats.Parent = player

	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Value = data.Coins
	coins.Parent = leaderstats

	local rebirths = Instance.new("IntValue")
	rebirths.Name = "Rebirths"
	rebirths.Value = data.Rebirths
	rebirths.Parent = leaderstats

	local stats = Instance.new("Folder")
	stats.Name = "Stats"
	stats.Parent = player

	local power = Instance.new("IntValue")
	power.Name = "Power"
	power.Value = data.Power
	power.Parent = stats
end

local function onPlayerAdded(player: Player)
	local data = PlayerData.load(player)
	setupLeaderstats(player, data)
end

local function onPlayerRemoving(player: Player)
	PlayerData.save(player.UserId)
	PlayerData.release(player.UserId)
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)

for _, player in ipairs(Players:GetPlayers()) do
	onPlayerAdded(player)
end

game:BindToClose(function()
	for _, player in ipairs(Players:GetPlayers()) do
		PlayerData.save(player.UserId)
	end
end)
