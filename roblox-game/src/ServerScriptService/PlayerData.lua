-- ModuleScript: ServerScriptService/PlayerData
-- Handles DataStore load/save and an in-memory per-player cache.
-- Requires "Enable Studio Access to API Services" (Game Settings > Security)
-- to test persistence from within Studio. See README.md.

local DataStoreService = game:GetService("DataStoreService")
local GameConfig = require(game:GetService("ReplicatedStorage"):WaitForChild("GameConfig"))

local store = DataStoreService:GetDataStore("MiningSim_PlayerData_v1")

local PlayerData = {}
local cache = {} -- [userId] = { Coins = n, Power = n, Rebirths = n }

local function defaultData()
	return {
		Coins = GameConfig.STARTING_COINS,
		Power = GameConfig.STARTING_POWER,
		Rebirths = GameConfig.STARTING_REBIRTHS,
	}
end

function PlayerData.load(player: Player)
	local userId = player.UserId
	local ok, result = pcall(function()
		return store:GetAsync("player_" .. userId)
	end)

	if ok and result then
		cache[userId] = result
	else
		cache[userId] = defaultData()
	end

	return cache[userId]
end

function PlayerData.get(userId: number)
	return cache[userId]
end

function PlayerData.save(userId: number)
	local data = cache[userId]
	if not data then
		return
	end
	local ok, err = pcall(function()
		store:SetAsync("player_" .. userId, data)
	end)
	if not ok then
		warn("PlayerData.save failed for", userId, err)
	end
end

function PlayerData.release(userId: number)
	cache[userId] = nil
end

return PlayerData
