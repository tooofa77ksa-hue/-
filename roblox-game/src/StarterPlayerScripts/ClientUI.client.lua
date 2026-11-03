-- LocalScript: StarterPlayerScripts/ClientUI
-- Builds the entire player-facing UI purely in code via Instance.new -
-- no ScreenGui needs to be pre-built in Studio's Explorer. Covers: a coin
-- counter (top), and a Shop panel with Upgrade / Rebirth / Buy Coins /
-- both Game Pass buttons. Mining itself happens by clicking the Ore in the
-- world (ClickDetector), handled entirely server-side.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))

local remotes = ReplicatedStorage:WaitForChild("Remotes")
local buyUpgrade = remotes:WaitForChild("BuyUpgrade")
local buyRebirth = remotes:WaitForChild("BuyRebirth")
local buyGamepass = remotes:WaitForChild("BuyGamepass")
local dataUpdated = remotes:WaitForChild("DataUpdated")

local player = Players.LocalPlayer

local state = {
	Coins = GameConfig.STARTING_COINS,
	Power = GameConfig.STARTING_POWER,
	Rebirths = GameConfig.STARTING_REBIRTHS,
}

-- === Root ScreenGui ===
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "MiningSimUI"
screenGui.ResetOnSpawn = false
screenGui.IgnoreGuiInset = true
screenGui.Parent = player:WaitForChild("PlayerGui")

local function makeFrame(parent: Instance, props: { [string]: any })
	local frame = Instance.new("Frame")
	for key, value in pairs(props) do
		(frame :: any)[key] = value
	end
	frame.Parent = parent
	return frame
end

local function makeCorner(parent: Instance, radius: number?)
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, radius or 12)
	corner.Parent = parent
	return corner
end

local function makeLabel(parent: Instance, props: { [string]: any })
	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBold
	label.TextColor3 = Color3.fromRGB(255, 255, 255)
	label.TextScaled = false
	for key, value in pairs(props) do
		(label :: any)[key] = value
	end
	label.Parent = parent
	return label
end

local function makeButton(parent: Instance, props: { [string]: any })
	local button = Instance.new("TextButton")
	button.Font = Enum.Font.GothamBold
	button.TextColor3 = Color3.fromRGB(255, 255, 255)
	button.AutoButtonColor = true
	for key, value in pairs(props) do
		(button :: any)[key] = value
	end
	button.Parent = parent
	makeCorner(button, 10)
	return button
end

-- === Top coin/power/rebirth counter ===
local topBar = makeFrame(screenGui, {
	Name = "TopBar",
	Size = UDim2.new(0, 340, 0, 96),
	Position = UDim2.new(0, 16, 0, 16),
	BackgroundColor3 = Color3.fromRGB(25, 30, 40),
	BackgroundTransparency = 0.15,
})
makeCorner(topBar, 14)

local coinsLabel = makeLabel(topBar, {
	Name = "CoinsLabel",
	Size = UDim2.new(1, -20, 0, 32),
	Position = UDim2.new(0, 10, 0, 6),
	TextXAlignment = Enum.TextXAlignment.Left,
	TextSize = 24,
	TextColor3 = Color3.fromRGB(255, 221, 87),
	Text = "🪙 0 عملة",
})

local powerLabel = makeLabel(topBar, {
	Name = "PowerLabel",
	Size = UDim2.new(1, -20, 0, 24),
	Position = UDim2.new(0, 10, 0, 38),
	TextXAlignment = Enum.TextXAlignment.Left,
	TextSize = 18,
	Text = "⛏️ قوة التعدين: 1",
})

local rebirthLabel = makeLabel(topBar, {
	Name = "RebirthLabel",
	Size = UDim2.new(1, -20, 0, 24),
	Position = UDim2.new(0, 10, 0, 64),
	TextXAlignment = Enum.TextXAlignment.Left,
	TextSize = 18,
	TextColor3 = Color3.fromRGB(190, 220, 255),
	Text = "✨ عمليات الولادة: 0",
})

-- === Shop toggle button (bottom-right, mobile-friendly, big) ===
local shopToggle = makeButton(screenGui, {
	Name = "ShopToggle",
	Size = UDim2.new(0, 140, 0, 56),
	Position = UDim2.new(1, -156, 1, -72),
	AnchorPoint = Vector2.new(0, 0),
	BackgroundColor3 = Color3.fromRGB(60, 130, 90),
	Text = "🛒 المتجر",
	TextSize = 22,
})

-- === Shop panel ===
local shopPanel = makeFrame(screenGui, {
	Name = "ShopPanel",
	Size = UDim2.new(0, 420, 0, 420),
	Position = UDim2.new(1, -436, 1, -500),
	BackgroundColor3 = Color3.fromRGB(25, 30, 40),
	BackgroundTransparency = 0.1,
	Visible = false,
})
makeCorner(shopPanel, 16)

local shopTitle = makeLabel(shopPanel, {
	Size = UDim2.new(1, -20, 0, 36),
	Position = UDim2.new(0, 10, 0, 8),
	TextSize = 26,
	Text = "المتجر",
	TextXAlignment = Enum.TextXAlignment.Center,
})

local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 10)
layout.SortOrder = Enum.SortOrder.LayoutOrder

local buttonsHolder = makeFrame(shopPanel, {
	Name = "Buttons",
	Size = UDim2.new(1, -20, 1, -56),
	Position = UDim2.new(0, 10, 0, 48),
	BackgroundTransparency = 1,
})
layout.Parent = buttonsHolder

local function shopButton(order: number, text: string, color: Color3)
	local btn = makeButton(buttonsHolder, {
		Name = "Btn" .. order,
		Size = UDim2.new(1, 0, 0, 56),
		LayoutOrder = order,
		BackgroundColor3 = color,
		Text = text,
		TextSize = 20,
	})
	return btn
end

local upgradeBtn = shopButton(1, "", Color3.fromRGB(60, 100, 180))
local rebirthBtn = shopButton(2, "", Color3.fromRGB(150, 90, 190))
local coinPackBtn = shopButton(3, "شراء 500 عملة (منتج مدفوع)", Color3.fromRGB(210, 160, 40))
local doubleCoinsBtn = shopButton(4, "🎟️ ضِعف العملات (Game Pass)", Color3.fromRGB(200, 90, 90))
local autoMinerBtn = shopButton(5, "🎟️ التعدين التلقائي (Game Pass)", Color3.fromRGB(90, 160, 200))

local function refreshShopLabels()
	upgradeBtn.Text = string.format("⬆️ ترقية القوة  -  %d عملة", GameConfig.getUpgradeCost(state.Power))
	rebirthBtn.Text = string.format("🔁 ولادة جديدة  -  يتطلب %d عملة", GameConfig.getRebirthRequirement(state.Rebirths))
end

-- === UI updates from server ===
local function applyState(newState)
	state = newState
	coinsLabel.Text = string.format("🪙 %d عملة", state.Coins)
	powerLabel.Text = string.format("⛏️ قوة التعدين: %d", state.Power)
	rebirthLabel.Text = string.format("✨ عمليات الولادة: %d", state.Rebirths)
	refreshShopLabels()
end

dataUpdated.OnClientEvent:Connect(applyState)

-- Ask the server for the current values as soon as the leaderstats/Stats
-- folders exist (they're created by Bootstrap on PlayerAdded).
local function readInitialState()
	local leaderstats = player:WaitForChild("leaderstats", 10)
	local stats = player:WaitForChild("Stats", 10)
	if leaderstats and stats then
		applyState({
			Coins = leaderstats.Coins.Value,
			Power = stats.Power.Value,
			Rebirths = leaderstats.Rebirths.Value,
		})
		leaderstats.Coins:GetPropertyChangedSignal("Value"):Connect(function()
			applyState({ Coins = leaderstats.Coins.Value, Power = stats.Power.Value, Rebirths = leaderstats.Rebirths.Value })
		end)
	end
end
readInitialState()

-- === Wiring ===
shopToggle.MouseButton1Click:Connect(function()
	shopPanel.Visible = not shopPanel.Visible
end)

upgradeBtn.MouseButton1Click:Connect(function()
	buyUpgrade:FireServer()
end)

rebirthBtn.MouseButton1Click:Connect(function()
	buyRebirth:FireServer()
end)

coinPackBtn.MouseButton1Click:Connect(function()
	MarketplaceService:PromptProductPurchase(player, GameConfig.PRODUCT_COIN_PACK)
end)

doubleCoinsBtn.MouseButton1Click:Connect(function()
	buyGamepass:FireServer(GameConfig.GAMEPASS_2X_COINS)
end)

autoMinerBtn.MouseButton1Click:Connect(function()
	buyGamepass:FireServer(GameConfig.GAMEPASS_AUTO_MINER)
end)

refreshShopLabels()
