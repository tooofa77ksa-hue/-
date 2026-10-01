-- Script: ServerScriptService/ShopLogic
-- Handles Upgrade purchases, Rebirths, the Developer Product coin pack, and
-- Game Pass purchase prompts. All costs/requirements are recomputed
-- server-side from GameConfig - the client only ever displays numbers.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")

local PlayerData = require(script.Parent:WaitForChild("PlayerData"))
local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))

local remotes = ReplicatedStorage:WaitForChild("Remotes")
local buyUpgrade = remotes:WaitForChild("BuyUpgrade")
local buyRebirth = remotes:WaitForChild("BuyRebirth")
local buyGamepass = remotes:WaitForChild("BuyGamepass")
local dataUpdated = remotes:WaitForChild("DataUpdated")

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

-- === Upgrade power ===
local function onBuyUpgrade(player: Player)
	local data = PlayerData.get(player.UserId)
	if not data then
		return
	end
	local cost = GameConfig.getUpgradeCost(data.Power)
	if data.Coins >= cost then
		data.Coins -= cost
		data.Power += 1
		pushUpdate(player)
	end
end
buyUpgrade.OnServerEvent:Connect(onBuyUpgrade)

-- === Rebirth ===
local function onBuyRebirth(player: Player)
	local data = PlayerData.get(player.UserId)
	if not data then
		return
	end
	local requirement = GameConfig.getRebirthRequirement(data.Rebirths)
	if data.Coins >= requirement then
		data.Coins = 0
		data.Power = GameConfig.STARTING_POWER
		data.Rebirths += 1
		pushUpdate(player)
	end
end
buyRebirth.OnServerEvent:Connect(onBuyRebirth)

-- === Game Pass purchase prompts (client asks server to prompt, keeps
-- MarketplaceService calls centralized and easy to extend) ===
local function onBuyGamepass(player: Player, gamepassId: number)
	if typeof(gamepassId) ~= "number" then
		return
	end
	if gamepassId ~= GameConfig.GAMEPASS_2X_COINS and gamepassId ~= GameConfig.GAMEPASS_AUTO_MINER then
		return
	end
	MarketplaceService:PromptGamePassPurchase(player, gamepassId)
end
buyGamepass.OnServerEvent:Connect(onBuyGamepass)

-- === Developer Product: coin pack ===
local function processReceipt(receiptInfo)
	local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
	if not player then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	if receiptInfo.ProductId == GameConfig.PRODUCT_COIN_PACK then
		local data = PlayerData.get(player.UserId)
		if data then
			data.Coins += GameConfig.COIN_PACK_AMOUNT
			pushUpdate(player)
		end
	end

	return Enum.ProductPurchaseDecision.PurchaseGranted
end

MarketplaceService.ProcessReceipt = processReceipt
