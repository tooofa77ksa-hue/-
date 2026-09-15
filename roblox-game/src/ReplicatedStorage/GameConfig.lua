-- ModuleScript: ReplicatedStorage/GameConfig
-- Shared pricing/formula functions used by both server (enforcement) and
-- client (display only, never trusted for actual purchases).

local GameConfig = {}

-- === Game Pass / Developer Product IDs ===
-- Placeholders. Replace with the real IDs after creating these on the
-- Roblox Creator Dashboard (see README.md for exact steps).
GameConfig.GAMEPASS_2X_COINS = 0000000
GameConfig.GAMEPASS_AUTO_MINER = 0000000
GameConfig.PRODUCT_COIN_PACK = 0000000
GameConfig.COIN_PACK_AMOUNT = 500

-- Starting values for a brand-new player
GameConfig.STARTING_COINS = 0
GameConfig.STARTING_POWER = 1
GameConfig.STARTING_REBIRTHS = 0

-- Upgrade cost curve: cost(power) = floor(50 * 1.15 ^ power)
function GameConfig.getUpgradeCost(currentPower: number): number
	return math.floor(50 * (1.15 ^ currentPower))
end

-- Rebirth requirement curve: requirement(rebirths) = floor(1000 * (rebirths+1) ^ 1.5)
function GameConfig.getRebirthRequirement(currentRebirths: number): number
	return math.floor(1000 * ((currentRebirths + 1) ^ 1.5))
end

-- Coins earned per click/tick = Power * multiplier
-- multiplier = (1 + rebirths * 0.5) * (2 if owns 2x Gamepass else 1)
function GameConfig.getMultiplier(rebirths: number, ownsDoubleCoins: boolean): number
	local rebirthMult = 1 + (rebirths * 0.5)
	local gamepassMult = ownsDoubleCoins and 2 or 1
	return rebirthMult * gamepassMult
end

function GameConfig.getEarnings(power: number, rebirths: number, ownsDoubleCoins: boolean): number
	return math.floor(power * GameConfig.getMultiplier(rebirths, ownsDoubleCoins))
end

-- Auto-miner tick interval (seconds) for players owning that Gamepass
GameConfig.AUTO_MINE_INTERVAL = 3

return GameConfig
