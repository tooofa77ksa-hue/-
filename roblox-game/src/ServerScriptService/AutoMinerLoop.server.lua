-- Script: ServerScriptService/AutoMinerLoop
-- Every AUTO_MINE_INTERVAL seconds, grants earnings automatically to any
-- online player who owns the "Auto Miner" Game Pass - no clicking needed.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")

local PlayerData = require(script.Parent:WaitForChild("PlayerData"))
local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))

local remotes = ReplicatedStorage:WaitForChild("Remotes")
local dataUpdated = remotes:WaitForChild("DataUpdated")

local function ownsGamepass(player: Player, gamepassId: number): boolean
	local ok, owns = pcall(function()
		return MarketplaceService:UserOwnsGamePassAsync(player.UserId, gamepassId)
	end)
	return ok and owns or false
end

local function pushUpdate(player: Player, data)
	dataUpdated:FireClient(player, data)
	local leaderstats = player:FindFirstChild("leaderstats")
	if leaderstats then
		leaderstats.Coins.Value = data.Coins
	end
end

task.spawn(function()
	while true do
		task.wait(GameConfig.AUTO_MINE_INTERVAL)

		for _, player in ipairs(Players:GetPlayers()) do
			if ownsGamepass(player, GameConfig.GAMEPASS_AUTO_MINER) then
				local data = PlayerData.get(player.UserId)
				if data then
					local ownsDouble = ownsGamepass(player, GameConfig.GAMEPASS_2X_COINS)
					local earnings = GameConfig.getEarnings(data.Power, data.Rebirths, ownsDouble)
					data.Coins += earnings
					pushUpdate(player, data)
				end
			end
		end
	end
end)
