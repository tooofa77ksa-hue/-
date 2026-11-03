-- Script: ServerScriptService/MiningLogic
-- Handles each click on the Ore via its ClickDetector (fires only on the
-- server, with the clicking Player supplied by Roblox itself), computing
-- and granting earnings entirely server-side so it cannot be cheated.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")
local Workspace = game:GetService("Workspace")

local PlayerData = require(script.Parent:WaitForChild("PlayerData"))
local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))

local remotes = ReplicatedStorage:WaitForChild("Remotes")
local dataUpdated = remotes:WaitForChild("DataUpdated")

-- Small per-player cooldown so double-firing the click can't stack.
local lastMineAt = {}
local MIN_INTERVAL = 0.25

local function ownsDoubleCoins(player: Player): boolean
	local ok, owns = pcall(function()
		return MarketplaceService:UserOwnsGamePassAsync(player.UserId, GameConfig.GAMEPASS_2X_COINS)
	end)
	return ok and owns or false
end

local function pushUpdate(player: Player)
	local data = PlayerData.get(player.UserId)
	if not data then
		return
	end
	dataUpdated:FireClient(player, data)

	local leaderstats = player:FindFirstChild("leaderstats")
	if leaderstats then
		leaderstats.Coins.Value = data.Coins
		leaderstats.Rebirths.Value = data.Rebirths
	end
	local stats = player:FindFirstChild("Stats")
	if stats then
		stats.Power.Value = data.Power
	end
end

local function onOreClicked(player: Player)
	local now = os.clock()
	if lastMineAt[player.UserId] and now - lastMineAt[player.UserId] < MIN_INTERVAL then
		return
	end
	lastMineAt[player.UserId] = now

	local data = PlayerData.get(player.UserId)
	if not data then
		return
	end

	local earnings = GameConfig.getEarnings(data.Power, data.Rebirths, ownsDoubleCoins(player))
	data.Coins += earnings
	pushUpdate(player)
end

local ore = Workspace:WaitForChild("Ore")
local clickDetector = ore:WaitForChild("ClickDetector")
clickDetector.MouseClick:Connect(onOreClicked)

Players.PlayerRemoving:Connect(function(player)
	lastMineAt[player.UserId] = nil
end)
