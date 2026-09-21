--!strict
-- ============================================================
--  أثر — واجهة اللاعب
--  LocalScript داخل StarterPlayer > StarterPlayerScripts
--  الاسم: AtharClient
--
--  ⚠️ لا تعدّل هذا الملف — النصوص كلها في AtharConfig.
--  الواجهة تعرض فقط. كل القرارات تأتي من الخادم.
-- ============================================================

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage:WaitForChild("AtharConfig"))
local Net = ReplicatedStorage:WaitForChild("AtharNet")

local EvClue    = Net:WaitForChild("ClueFound")    :: RemoteEvent
local EvVerdict = Net:WaitForChild("Verdict")      :: RemoteEvent
local EvGate    = Net:WaitForChild("GateResult")   :: RemoteEvent
local EvFinish  = Net:WaitForChild("BridgeDone")   :: RemoteEvent
local EvPhase   = Net:WaitForChild("Phase")        :: RemoteEvent
local RqAccuse  = Net:WaitForChild("RequestAccuse"):: RemoteEvent
local RqBridge  = Net:WaitForChild("RequestBridge"):: RemoteEvent

local player = Players.LocalPlayer
local gui = Instance.new("ScreenGui")
gui.Name = "AtharUI"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.Parent = player:WaitForChild("PlayerGui")

-- ألوان الواجهة ------------------------------------------------
local INK    = Color3.fromRGB(14, 22, 38)
local PANEL  = Color3.fromRGB(20, 31, 51)
local LINE   = Color3.fromRGB(42, 58, 85)
local TEXT   = Color3.fromRGB(228, 234, 243)
local DIM    = Color3.fromRGB(147, 163, 188)
local AMBER  = Config.Colors.physical
local CYAN   = Config.Colors.digital
local GREEN  = Config.Colors.plankPass
local RED    = Config.Colors.plankFail

-- أدوات بناء الواجهة -------------------------------------------
local function round(inst: GuiObject, r: number)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, r)
	c.Parent = inst
end

local function stroke(inst: GuiObject, color: Color3)
	local s = Instance.new("UIStroke")
	s.Color = color
	s.Thickness = 1
	s.Parent = inst
end

local function newFrame(parent: Instance, size: UDim2, pos: UDim2, color: Color3): Frame
	local f = Instance.new("Frame")
	f.Size = size
	f.Position = pos
	f.BackgroundColor3 = color
	f.BorderSizePixel = 0
	f.Parent = parent
	return f
end

local function newText(parent: Instance, text: string, size: number, color: Color3,
	bold: boolean): TextLabel
	local t = Instance.new("TextLabel")
	t.BackgroundTransparency = 1
	t.Text = text
	t.TextSize = size
	t.TextColor3 = color
	t.Font = bold and Enum.Font.GothamBold or Enum.Font.GothamMedium
	t.TextXAlignment = Enum.TextXAlignment.Right   -- العربية من اليمين
	t.TextYAlignment = Enum.TextYAlignment.Top
	t.TextWrapped = true
	t.Size = UDim2.fromScale(1, 1)
	t.Parent = parent
	return t
end

local function newButton(parent: Instance, text: string, size: UDim2, pos: UDim2,
	bg: Color3, fg: Color3): TextButton
	local b = Instance.new("TextButton")
	b.Size = size
	b.Position = pos
	b.BackgroundColor3 = bg
	b.TextColor3 = fg
	b.Text = text
	b.TextSize = 18
	b.Font = Enum.Font.GothamBold
	b.BorderSizePixel = 0
	b.AutoButtonColor = true
	b.Parent = parent
	round(b, 10)
	return b
end

-- ============================================================
-- الشريط العلوي: العنوان + عدّاد الأدلة
-- ============================================================
local topBar = newFrame(gui, UDim2.new(1, 0, 0, 62), UDim2.fromScale(0, 0), INK)
topBar.BackgroundTransparency = 0.12

local titleHolder = newFrame(topBar, UDim2.new(1, -28, 0, 24), UDim2.new(0, 14, 0, 9), INK)
titleHolder.BackgroundTransparency = 1
newText(titleHolder, Config.Case.title, 19, TEXT, true)

local briefHolder = newFrame(topBar, UDim2.new(1, -28, 0, 22), UDim2.new(0, 14, 0, 33), INK)
briefHolder.BackgroundTransparency = 1
local briefLabel = newText(briefHolder, Config.Case.brief, 14, DIM, false)

-- ============================================================
-- لوحة الأدلة (يمين الشاشة)
-- ============================================================
local evPanel = newFrame(gui, UDim2.new(0, 268, 0, 210), UDim2.new(1, -282, 0, 74), PANEL)
evPanel.BackgroundTransparency = 0.08
round(evPanel, 12)
stroke(evPanel, LINE)

local evHeadBox = newFrame(evPanel, UDim2.new(1, -24, 0, 22), UDim2.new(0, 12, 0, 10), PANEL)
evHeadBox.BackgroundTransparency = 1
local evHead = newText(evHeadBox, Config.UI.evidenceTitle .. "  0/" .. #Config.Clues, 15, AMBER, true)

local evList = newFrame(evPanel, UDim2.new(1, -24, 1, -46), UDim2.new(0, 12, 0, 36), PANEL)
evList.BackgroundTransparency = 1

local evLayout = Instance.new("UIListLayout")
evLayout.Padding = UDim.new(0, 8)
evLayout.SortOrder = Enum.SortOrder.LayoutOrder
evLayout.Parent = evList

local evEmptyBox = newFrame(evList, UDim2.new(1, 0, 0, 60), UDim2.fromScale(0, 0), PANEL)
evEmptyBox.BackgroundTransparency = 1
local evEmpty = newText(evEmptyBox, "اقترب من النقاط المضيئة واضغط «" ..
	Config.UI.promptAction .. "».", 13, DIM, false)
evEmpty.TextYAlignment = Enum.TextYAlignment.Center

-- ============================================================
-- زر الاتهام
-- ============================================================
local accuseBtn = newButton(gui, Config.UI.accuseButton,
	UDim2.new(0, 220, 0, 52), UDim2.new(0.5, -110, 1, -84), AMBER, Color3.fromRGB(26, 18, 4))
accuseBtn.Visible = false

-- ============================================================
-- نافذة منبثقة عامة
-- ============================================================
local overlay = newFrame(gui, UDim2.fromScale(1, 1), UDim2.fromScale(0, 0), Color3.new(0, 0, 0))
overlay.BackgroundTransparency = 0.45
overlay.Visible = false
overlay.ZIndex = 5

local modal = newFrame(overlay, UDim2.new(0, 420, 0, 320), UDim2.new(0.5, -210, 0.5, -160), PANEL)
modal.ZIndex = 6
round(modal, 16)
stroke(modal, LINE)

local modalPad = Instance.new("UIPadding")
modalPad.PaddingTop = UDim.new(0, 20)
modalPad.PaddingBottom = UDim.new(0, 20)
modalPad.PaddingLeft = UDim.new(0, 20)
modalPad.PaddingRight = UDim.new(0, 20)
modalPad.Parent = modal

local modalLayout = Instance.new("UIListLayout")
modalLayout.Padding = UDim.new(0, 12)
modalLayout.SortOrder = Enum.SortOrder.LayoutOrder
modalLayout.Parent = modal

local modalOrder = 0

local function clearModal()
	modalOrder = 0
	for _, child in ipairs(modal:GetChildren()) do
		if child:IsA("GuiObject") then
			child:Destroy()
		end
	end
end

-- ترتيب صريح: بدون LayoutOrder يرتّب UIListLayout بالاسم لا بترتيب الإنشاء
local function nextOrder(): number
	modalOrder += 1
	return modalOrder
end

local function modalText(text: string, size: number, color: Color3, bold: boolean, height: number)
	local box = newFrame(modal, UDim2.new(1, 0, 0, height), UDim2.fromScale(0, 0), PANEL)
	box.BackgroundTransparency = 1
	box.ZIndex = 7
	box.LayoutOrder = nextOrder()
	local t = newText(box, text, size, color, bold)
	t.ZIndex = 7
end

-- ============================================================
-- مرحلة التحقيق
-- ============================================================
local clueCount = 0

EvClue.OnClientEvent:Connect(function(id: string, name: string, text: string, kind: string,
	found: number, total: number)
	clueCount = found
	evHead.Text = Config.UI.evidenceTitle .. "  " .. found .. "/" .. total
	evEmptyBox.Visible = false

	local color = (kind == "digital") and CYAN or AMBER

	local row = newFrame(evList, UDim2.new(1, 0, 0, 54), UDim2.fromScale(0, 0), PANEL)
	row.BackgroundTransparency = 1
	row.LayoutOrder = found

	local nameBox = newFrame(row, UDim2.new(1, 0, 0, 18), UDim2.fromScale(0, 0), PANEL)
	nameBox.BackgroundTransparency = 1
	newText(nameBox, "● " .. name, 14, color, true)

	local descBox = newFrame(row, UDim2.new(1, 0, 0, 34), UDim2.new(0, 0, 0, 19), PANEL)
	descBox.BackgroundTransparency = 1
	newText(descBox, text, 12, DIM, false)

	if found >= total then
		accuseBtn.Visible = true
		accuseBtn.BackgroundColor3 = AMBER
		TweenService:Create(accuseBtn, TweenInfo.new(0.35),
			{ Size = UDim2.new(0, 240, 0, 56) }):Play()
	end
end)

-- شاشة الاتهام
accuseBtn.MouseButton1Click:Connect(function()
	if clueCount < #Config.Clues then return end
	clearModal()
	modal.Size = UDim2.new(0, 420, 0, 330)
	modal.Position = UDim2.new(0.5, -210, 0.5, -165)
	modalText("كيف وصلت كلمة السر إلى غير سارة؟", 20, TEXT, true, 56)
	modalText("اختيار واحد. راجع دفتر الأدلة قبل أن تقرر.", 14, DIM, false, 24)

	for _, sus in ipairs(Config.Case.suspects) do
		local b = newButton(modal, sus.name .. "  —  " .. sus.sub,
			UDim2.new(1, 0, 0, 46), UDim2.fromScale(0, 0), Color3.fromRGB(28, 42, 66), TEXT)
		b.ZIndex = 7
		b.LayoutOrder = nextOrder()
		b.TextSize = 16
		stroke(b, LINE)
		local id = sus.id
		b.MouseButton1Click:Connect(function()
			RqAccuse:FireServer(id)   -- نية فقط — الخادم يقرر
		end)
	end

	overlay.Visible = true
end)

-- نتيجة الاتهام
EvVerdict.OnClientEvent:Connect(function(correct: boolean, title: string, reveal: string, rule: string)
	accuseBtn.Visible = false
	clearModal()
	modal.Size = UDim2.new(0, 440, 0, 340)
	modal.Position = UDim2.new(0.5, -220, 0.5, -170)

	modalText(correct and "✓  القضية أُغلقت" or "✕  القضية ما زالت مفتوحة",
		15, correct and GREEN or RED, true, 22)
	modalText(title, 21, TEXT, true, 30)
	modalText(reveal, 14, DIM, false, 56)
	modalText("القاعدة ٠١", 12, CYAN, true, 18)
	modalText(rule, 14, TEXT, false, 60)

	local b = newButton(modal, "الآن اعبر الجسر الآمن  ←",
		UDim2.new(1, 0, 0, 50), UDim2.fromScale(0, 0), AMBER, Color3.fromRGB(26, 18, 4))
	b.ZIndex = 7
	b.LayoutOrder = nextOrder()
	b.MouseButton1Click:Connect(function()
		RqBridge:FireServer()
	end)

	overlay.Visible = true
end)

-- ============================================================
-- مرحلة الجسر
-- ============================================================
local bridgeHud = newFrame(gui, UDim2.new(0, 268, 0, 96), UDim2.new(1, -282, 0, 74), PANEL)
bridgeHud.BackgroundTransparency = 0.08
bridgeHud.Visible = false
round(bridgeHud, 12)
stroke(bridgeHud, LINE)

local hudHeadBox = newFrame(bridgeHud, UDim2.new(1, -24, 0, 22), UDim2.new(0, 12, 0, 10), PANEL)
hudHeadBox.BackgroundTransparency = 1
newText(hudHeadBox, Config.UI.bridgeTitle, 15, AMBER, true)

local hudBodyBox = newFrame(bridgeHud, UDim2.new(1, -24, 0, 50), UDim2.new(0, 12, 0, 34), PANEL)
hudBodyBox.BackgroundTransparency = 1
local hudBody = newText(hudBodyBox, Config.UI.bridgeHint .. "\nالبوابة ٠/" .. #Config.Bridge.gates,
	13, DIM, false)

-- شريط التلميح عند الخطأ
local toast = newFrame(gui, UDim2.new(0, 460, 0, 64), UDim2.new(0.5, -230, 0, -80),
	Color3.fromRGB(46, 24, 23))
toast.BackgroundTransparency = 0.05
toast.ZIndex = 8
round(toast, 12)
stroke(toast, RED)

local toastBox = newFrame(toast, UDim2.new(1, -28, 1, -16), UDim2.new(0, 14, 0, 8),
	Color3.new(0, 0, 0))
toastBox.BackgroundTransparency = 1
toastBox.ZIndex = 9
local toastText = newText(toastBox, "", 14, Color3.fromRGB(255, 220, 218), false)
toastText.ZIndex = 9

local toastToken = 0

local function showToast(msg: string)
	toastText.Text = msg
	toastToken += 1
	local myToken = toastToken

	TweenService:Create(toast, TweenInfo.new(0.28, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		{ Position = UDim2.new(0.5, -230, 0, 74) }):Play()

	task.delay(3.6, function()
		if myToken ~= toastToken then return end
		TweenService:Create(toast, TweenInfo.new(0.28), { Position = UDim2.new(0.5, -230, 0, -80) }):Play()
	end)
end

EvPhase.OnClientEvent:Connect(function(phase: string)
	local investigating = (phase == "investigate")
	evPanel.Visible = investigating
	briefLabel.Visible = investigating
	bridgeHud.Visible = not investigating
	overlay.Visible = false
	if not investigating then
		hudBody.Text = Config.UI.bridgeHint .. "\nالبوابة ٠/" .. #Config.Bridge.gates
	end
end)

EvGate.OnClientEvent:Connect(function(correct: boolean, index: number, total: number,
	tip: string, score: number)
	if correct then
		hudBody.Text = ("الرابط الحقيقي ✓\nالبوابة %d/%d · صحيحة من أول محاولة: %d")
			:format(index, total, score)
	else
		hudBody.Text = ("رابط مزيّف ✕\nالبوابة %d/%d — أعد المحاولة"):format(index, total)
		if tip ~= "" then
			showToast(tip)
		end
	end
end)

EvFinish.OnClientEvent:Connect(function(score: number, total: number)
	clearModal()
	modal.Size = UDim2.new(0, 420, 0, 250)
	modal.Position = UDim2.new(0.5, -210, 0.5, -125)

	modalText("✓  " .. Config.UI.finishTitle, 15, GREEN, true, 22)
	modalText(("كشفت %d روابط مزيّفة من %d — من أول محاولة."):format(score, total), 20, TEXT, true, 56)
	modalText("هذه هي المهارة نفسها التي تحتاجها خارج اللعبة: "
		.. "اقرأ العنوان قبل أن تكتب كلمة السر.", 14, DIM, false, 52)

	local b = newButton(modal, "تم", UDim2.new(1, 0, 0, 46), UDim2.fromScale(0, 0),
		AMBER, Color3.fromRGB(26, 18, 4))
	b.ZIndex = 7
	b.LayoutOrder = nextOrder()
	b.MouseButton1Click:Connect(function()
		overlay.Visible = false
	end)

	overlay.Visible = true
end)
