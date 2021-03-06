/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

import { from, Scene, Thread } from 'sphere-runtime';

import { drawTextEx } from '$/main.mjs';
import { Stance } from './battle-unit.mjs';
import { ItemUsable } from './usables.mjs';

import { Elements, SkillCategories } from '$/game-data';

export
function MoveMenu(unit, battle, stance)
{
	this.lockedCursorColor = CreateColor(0, 36, 72, 255);
	this.moveRankColor = CreateColor(255, 255, 255, 255);
	this.normalCursorColor = CreateColor(0, 72, 144, 255);
	this.textColor = CreateColor(255, 255, 255, 255);
	this.usageTextColor = CreateColor(255, 192, 0, 255);

	this.battle = battle;
	this.drawers = null;
	this.expansion = 0.0;
	this.fadeness = 0.0;
	this.font = GetSystemFont();
	this.isExpanded = false;
	this.menuStance = stance;
	this.menuThread = null;
	this.moveCursor = 0;
	this.moveCursorColor = CreateColor(0, 0, 0, 0);
	this.moveMenu = null;
	this.selection = null;
	this.stance = null;
	this.topCursor = 0;
	this.topCursorColor = CreateColor(0, 0, 0, 0);
	this.unit = unit;
	var drawerTable = {};
	for (const skill of this.unit.skills) {
		var category = skill.skillInfo.category;
		if (!(category in drawerTable)) {
			drawerTable[category] = {
				name: SkillCategories[category],
				contents: [],
				cursor: 0
			};
		}
		drawerTable[category].contents.push(skill);
	}
	this.drawers = [];
	for (let category in drawerTable) {
		this.drawers.push(drawerTable[category]);
	}
	if (stance == Stance.Attack) {
		this.drawers = this.drawers.concat([
			{ name: "Item", contents: this.unit.items, cursor: 0 } ]);
	}

	this.chooseMove = new Scene()
		.fork()
			.tween(this.moveCursorColor, 7, 'easeInOutSine', this.lockedCursorColor)
		.end()
		.fork()
			.tween(this, 15, 'easeInBack', { expansion: 0.0 })
		.end()
		.tween(this, 15, 'easeInBack', { fadeness: 0.0 });

	this.hideMoveList = new Scene()
		.fork()
			.tween(this.moveCursorColor, 15, 'linear', CreateColor(0, 0, 0, 0))
		.end()
		.fork()
			.tween(this.topCursorColor, 15, 'easeInOutSine', this.normalCursorColor)
		.end()
		.tween(this, 15, 'easeInBack', { expansion: 0.0 });

	this.showMenu = new Scene()
		.fork()
			.tween(this.topCursorColor, 15, 'easeOutQuad', CreateColor(192, 192, 192, 255))
			.tween(this.topCursorColor, 15, 'easeOutQuad', this.normalCursorColor)
		.end()
		.tween(this, 30, 'easeOutBounce', { fadeness: 1.0 });

	this.showMoveList = new Scene()
		.fork()
			.tween(this.topCursorColor, 15, 'easeInOutSine', this.lockedCursorColor)
		.end()
		.fork()
			.tween(this.moveCursorColor, 15, 'linear', this.normalCursorColor)
		.end()
		.tween(this, 15, 'easeOutExpo', { expansion: 1.0 });

	this.drawCursor = function(x, y, width, height, cursorColor, isLockedIn, isEnabled = true)
	{
		var color;
		var color2;
		color = isEnabled ? cursorColor : CreateColor(96, 96, 96, cursorColor.alpha);
		color2 = BlendColors(color, CreateColor(0, 0, 0, color.alpha));
		if (isLockedIn) {
			var mainColor = color;
			color = color2;
			color2 = mainColor;
		}
		var halfHeight = Math.round(height / 2);
		GradientRectangle(x, y, width , halfHeight, color2, color2, color, color);
		GradientRectangle(x, y + halfHeight, width, height - halfHeight, color, color, color2, color2);
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, cursorColor.alpha / 2));
	};

	this.drawItemBox = function(x, y, width, height, alpha, isSelected, isLockedIn, cursorColor, isEnabled = true)
	{
		Rectangle(x, y, width, height, CreateColor(0, 0, 0, alpha));
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 24));
		if (isSelected) {
			this.drawCursor(x, y, width, height, cursorColor, isLockedIn, isEnabled);
		}
	};

	this.drawMoveItem = function(x, y, item, isSelected, isLockedIn)
	{
		var alpha = 255 * this.fadeness * this.expansion;
		var isEnabled = item.isEnabled;
		var textColor = isSelected ? this.textColor : CreateColor(128, 128, 128, alpha);
		var usageTextColor = isSelected ? this.usageTextColor : BlendColors(this.usageTextColor, CreateColor(0, 0, 0, this.usageTextColor.alpha));
		textColor = isEnabled ? textColor : CreateColor(0, 0, 0, 32 * alpha / 255);
		usageTextColor = isEnabled ? usageTextColor : CreateColor(0, 0, 0, 32 * alpha / 255);
		this.drawItemBox(x, y, 160, 18, alpha * 128 / 255, isSelected, isLockedIn, this.moveCursorColor, isEnabled);
		var rankBoxColor = isEnabled ? BlendColors(item.idColor, CreateColor(0, 0, 0, item.idColor.alpha))
			: BlendColorsWeighted(item.idColor, CreateColor(0, 0, 0, item.idColor.alpha), 25, 75);
		var rankColor = isEnabled ? item.idColor : BlendColorsWeighted(item.idColor, CreateColor(0, 0, 0, item.idColor.alpha), 33, 66);
		Rectangle(x + 5, y + 2, 14, 14, rankBoxColor);
		OutlinedRectangle(x + 5, y + 2, 14, 14, CreateColor(0, 0, 0, rankBoxColor.alpha / 2));
		drawTextEx(this.font, x + 12, y + 3, isFinite(item.rank) ? item.rank : "?", rankColor, 1, 'center');
		drawTextEx(this.font, x + 24, y + 3, item.name, textColor, 1 * isEnabled);
		if (item.mpCost > 0) {
			this.drawText(this.font, x + 141, y + 1, isEnabled, textColor, item.mpCost, 'right');
			this.drawText(this.font, x + 142, y + 5, isEnabled, usageTextColor, "MP");
		} else if (item.usable instanceof ItemUsable) {
			this.drawText(this.font, x + 148, y + 3, isEnabled, textColor, item.usable.usesLeft, 'right');
			this.drawText(this.font, x + 149, y + 3, isEnabled, usageTextColor, "x");
		}
	};

	this.drawText = function(font, x, y, shadowDistance, color, text, alignment = 'left')
	{
		const Align =
		{
			left:   (font, x, text) => x,
			center: (font, x, text) => x - font.getStringWidth(text) / 2,
			right:  (font, x, text) => x - font.getStringWidth(text),
		};

		if (!(alignment in Align))
			throw new Error(`invalid text alignment '${alignment}'.`);
		x = Align[alignment](font, x, text);
		font.setColorMask(CreateColor(0, 0, 0, color.alpha));
		font.drawText(x + shadowDistance, y + shadowDistance, text);
		font.setColorMask(color);
		font.drawText(x, y, text);
	};

	this.drawTopItem = function(x, y, width, item, isSelected)
	{
		var isEnabled = item.contents.length > 0;
		this.drawItemBox(x, y, width, 18, 144 * this.fadeness, isSelected, this.isExpanded, this.topCursorColor, isEnabled);
		var textColor = isSelected ? CreateColor(255, 255, 255, 255 * this.fadeness) : CreateColor(128, 128, 128, 255 * this.fadeness);
		textColor = isEnabled ? textColor : CreateColor(0, 0, 0, 32 * this.fadeness);
		this.drawText(this.font, x + width / 2, y + 3, isEnabled, textColor, item.name.substr(0, 3), 'center');
	};

	this.updateTurnPreview = function()
	{
		var nextMoveOrRank;
		if (this.stance != Stance.Guard) {
			if (this.isExpanded) {
				nextMoveOrRank = this.moveMenu[this.moveCursor].usable;
			} else {
				var drawer = this.drawers[this.topCursor];
				nextMoveOrRank = drawer.contents.length > 0 ? drawer.contents[drawer.cursor] : Game.defaultItemRank;
			}
		} else {
			nextMoveOrRank = Game.stanceChangeRank;
		}
		let nextActions = isNaN(nextMoveOrRank) ? nextMoveOrRank.peekActions() : [ nextMoveOrRank ];
		if (this.stance == Stance.Charge)
			nextActions = [ 1 ].concat(nextActions);
		let prediction = this.battle.predictTurns(this.unit, nextActions);
		this.battle.ui.hud.turnPreview.set(prediction);
	};
}

// .getInput() method
// Checks for player input and updates the state of the menu accordingly.
MoveMenu.prototype.getInput = function()
{
	var key = AreKeysLeft() ? GetKey() : null;
	/*if (this.showMenu.running) {
		return;
	}*/
	if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_A)) {
		if (!this.isExpanded && this.drawers[this.topCursor].contents.length > 0) {
			var usables = this.drawers[this.topCursor].contents;
			this.moveMenu = [];
			for (let i = 0; i < usables.length; ++i) {
				var menuItem = {
					name: usables[i].name,
					idColor: CreateColor(192, 192, 192, 255),
					isEnabled: usables[i].isUsable(this.unit, this.stance),
					mpCost: usables[i].mpCost(this.unit),
					rank: usables[i].rank,
					usable: usables[i]
				};
				var actions = menuItem.usable.peekActions();
				for (let i2 = 0; i2 < actions.length; ++i2) {
					for (let i3 = 0; i3 < actions[i2].effects.length; ++i3) {
						if ('element' in actions[i2].effects[i3]) {
							menuItem.idColor = Elements[actions[i2].effects[i3].element].color;
						}
					}
				}
				this.moveMenu.push(menuItem);
			}
			this.moveCursor = this.drawers[this.topCursor].cursor;
			this.isExpanded = true;
			this.hideMoveList.stop();
			this.showMoveList.run();
			this.updateTurnPreview();
		} else if (this.isExpanded && this.moveMenu[this.moveCursor].isEnabled) {
			this.drawers[this.topCursor].cursor = this.moveCursor;
			this.selection = this.moveMenu[this.moveCursor].usable;
			this.showMoveList.stop();
			this.chooseMove.run();
		}
	} else if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_B) && this.isExpanded) {
		this.drawers[this.topCursor].cursor = this.moveCursor;
		this.isExpanded = false;
		this.showMoveList.stop();
		this.hideMoveList.run();
	} else if (key == GetPlayerKey(PLAYER_1, PLAYER_KEY_Y) && this.stance != Stance.Guard) {
		this.stance = this.stance == Stance.Attack ? Stance.Charge
			: Stance.Guard;
		this.updateTurnPreview();
		if (this.stance == Stance.Guard) {
			this.showMoveList.stop();
			this.chooseMove.run();
		}
	} else if (!this.isExpanded && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT)) {
		--this.topCursor;
		if (this.topCursor < 0) {
			this.topCursor = this.drawers.length - 1;
		}
		this.updateTurnPreview();
	} else if (!this.isExpanded && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT)) {
		++this.topCursor;
		if (this.topCursor >= this.drawers.length) {
			this.topCursor = 0;
		}
		this.updateTurnPreview();
	} else if (this.isExpanded && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_UP)) {
		this.moveCursor = this.moveCursor - 1 < 0 ? this.moveMenu.length - 1 : this.moveCursor - 1;
		this.updateTurnPreview();
	} else if (this.isExpanded && key == GetPlayerKey(PLAYER_1, PLAYER_KEY_DOWN)) {
		this.moveCursor = (this.moveCursor + 1) % this.moveMenu.length;
		this.updateTurnPreview();
	}
};

// .open() method
// Opens the menu to allow the player to choose an action.
MoveMenu.prototype.open = async function ()
{
	this.battle.suspend();
	this.battle.ui.hud.highlight(this.unit);
	var chosenTargets = null;
	this.stance = this.lastStance = this.menuStance;
	while (chosenTargets === null) {
		this.expansion = 0.0;
		this.isExpanded = false;
		this.selection = null;
		this.stance = this.lastStance;
		while (AreKeysLeft()) { GetKey(); }
		this.showMenu.run();
		this.updateTurnPreview();
		this.menuThread = Thread.create(this, 10);
		this.menuThread.takeFocus();
		await Thread.join(this.menuThread);
		switch (this.stance) {
			case Stance.Attack:
			case Stance.Charge:
				var name = this.stance == Stance.Charge
					? `CS ${this.selection.name}`
					: this.selection.name;
				var chosenTargets = await new TargetMenu(this.unit, this.battle, this.selection, name).open();
				break;
			case Stance.Counter:
				var targetMenu = new TargetMenu(this.unit, this.battle, null, `GS ${this.selection.name}`);
				targetMenu.lockTargets([ this.unit.counterTarget ]);
				var chosenTargets = await targetMenu.open();
				break;
			case Stance.Guard:
				var targetMenu = new TargetMenu(this.unit, this.battle, null, "Guard");
				targetMenu.lockTargets([ this.unit ]);
				var chosenTargets = await targetMenu.open();
				break;
		}
	}
	this.battle.ui.hud.highlight(null);
	this.battle.resume();
	return {
		usable: this.selection,
		stance: this.stance,
		targets: chosenTargets
	};
};

// .render() method
// Renders the menu in its current state.
MoveMenu.prototype.render = function()
{
	var yOrigin = -54 * (1.0 - this.fadeness) + 16;
	var stanceText = this.stance == Stance.Charge ? "CS"
		: this.stance == Stance.Counter ? "GS"
		: this.stance == Stance.Guard ? "GS"
		: "AS";
	Rectangle(0, yOrigin, 136, 16, CreateColor(0, 0, 0, 160 * this.fadeness));
	OutlinedRectangle(0, yOrigin, 136, 16, CreateColor(0, 0, 0, 24 * this.fadeness));
	Rectangle(136, yOrigin, 24, 16, CreateColor(0, 0, 0, 176 * this.fadeness));
	OutlinedRectangle(136, yOrigin, 24, 16, CreateColor(0, 0, 0, 24 * this.fadeness));
	this.drawText(this.font, 68, yOrigin + 2, 1, CreateColor(160, 160, 160, 255 * this.fadeness), this.unit.fullName, 'center');
	this.drawText(this.font, 148, yOrigin + 2, 1, CreateColor(255, 255, 128, 255 * this.fadeness), stanceText, 'center');
	var itemWidth = 160 / this.drawers.length;
	var litTextColor = CreateColor(255, 255, 255, 255);
	var dimTextColor = CreateColor(192, 192, 192, 255);
	Rectangle(0, 16, 160, yOrigin - 16, CreateColor(0, 0, 0, 192 * this.fadeness));
	for (let i = 0; i < this.drawers.length; ++i) {
		var x = Math.floor(i * itemWidth);
		var width = Math.floor((i + 1) * itemWidth) - x;
		this.drawTopItem(x, yOrigin + 16, width, this.drawers[i], i == this.topCursor);
	}
	var itemY;
	if (this.expansion > 0.0) {
		SetClippingRectangle(0, yOrigin + 34, 160, GetScreenHeight() - (yOrigin + 34));
		var height = this.moveMenu.length * 16;
		var y = yOrigin + 34 - height * (1.0 - this.expansion);
		Rectangle(0, 34, 160, y - 34, CreateColor(0, 0, 0, 128 * this.expansion * this.fadeness));
		itemY = y;
		for (let i = 0; i < this.moveMenu.length; ++i) {
			this.drawMoveItem(0, itemY, this.moveMenu[i], i == this.moveCursor, this.chooseMove.running);
			itemY += 18;
		}
		SetClippingRectangle(0, 0, GetScreenWidth(), GetScreenHeight())
	} else {
		itemY = yOrigin + 34;
	}
};

// .update() method
// Updates the entity's state for the next frame.
MoveMenu.prototype.update = function()
{
	return (this.stance != Stance.Guard && this.selection === null)
		|| this.chooseMove.running;
};

export
function TargetMenu(unit, battle, usable = null, moveName = null)
{
	this.battle = battle;
	this.doChangeInfo = null;
	this.isChoiceMade = false;
	this.infoBoxFadeness = 1.0;
	this.infoFadeness = 1.0;
	this.isTargetScanOn = from(battle.alliesOf(unit))
		.where(unit => unit.isAlive())
		.any(unit => unit.allowTargetScan);
	this.isTargetLocked = false;
	this.isGroupCast = false;
	this.name = moveName !== null ? moveName
		: usable !== null ? usable.name
		: unit.name;
	this.statusNames = null;
	this.cursorFont = GetSystemFont();
	this.infoFont = GetSystemFont();
	this.targets = [];
	this.unit = unit;
	this.unitToShowInfo = null;
	this.usable = usable;
	this.allowDeadUnits = usable !== null ? usable.allowDeadTarget : false;

	this.drawCursor = function(unit)
	{
		var width = this.cursorFont.getStringWidth(this.name) + 10;
		var x = unit.actor.x < GetScreenWidth() / 2 ? unit.actor.x + 37 : unit.actor.x - 5 - width;
		var y = unit.actor.y + 6;
		Rectangle(x, y, width, 20, CreateColor(0, 0, 0, 128));
		OutlinedRectangle(x, y, width, 20, CreateColor(0, 0, 0, 64));
		drawTextEx(this.cursorFont, x + width / 2, y + 4, this.name, CreateColor(255, 255, 255, 255), 1, 'center');
	};

	this.drawInfoBox = function(x, y, width, height, alpha)
	{
		Rectangle(x, y, width, height, CreateColor(0, 0, 0, alpha * (1.0 - this.infoBoxFadeness)));
		OutlinedRectangle(x, y, width, height, CreateColor(0, 0, 0, 32 * (1.0 - this.infoBoxFadeness)));
	};

	this.moveCursor = function(direction)
	{
		if (this.isGroupCast || this.targets == null)
			return;
		var position = this.targets[0].actor.position;
		var candidates = this.battle.alliesOf(this.targets[0]);
		var unitToSelect = null;
		while (unitToSelect === null) {
			position += direction;
			position = position > 2 ? 0 :
				position < 0 ? 2 :
				position;
			for (let i = 0; i < candidates.length; ++i) {
				if (position == candidates[i].actor.position
					&& (candidates[i].isAlive() || this.allowDeadUnits))
				{
					unitToSelect = candidates[i];
					break;
				}
			}
		}
		if (unitToSelect !== this.targets[0]) {
			this.targets = [ unitToSelect ];
			this.updateInfo();
		}
	};

	this.updateInfo = function()
	{
		var unit = this.targets.length == 1 ? this.targets[0] : null;
		if (this.doChangeInfo != null) {
			this.doChangeInfo.stop();
		}
		this.doChangeInfo = new Scene()
			.fork()
				.tween(this, 15, 'easeInBack', { infoBoxFadeness: 1.0 })
			.end()
			.tween(this, 15, 'easeInOutSine', { infoFadeness: 1.0 })
			.resync()
			.call(() => {
				this.unitToShowInfo = unit;
				if (this.unitToShowInfo !== null) {
					this.statusNames = !this.unitToShowInfo.isAlive() ? [ "Knocked Out" ] : [];
					for (let i = 0; i < this.unitToShowInfo.statuses.length; ++i) {
						this.statusNames.push(this.unitToShowInfo.statuses[i].name);
					}
				}
			})
			.fork()
				.tween(this, 15, 'easeOutBack', { infoBoxFadeness: 0.0 })
			.end()
			.tween(this, 15, 'easeInOutSine', { infoFadeness: 0.0 });
		this.doChangeInfo.run();
	};
}

// .getInput() method
// Checks for player input and updates the state of the menu accordingly.
TargetMenu.prototype.getInput = function()
{
	switch (AreKeysLeft() ? GetKey() : null) {
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_A):
			new Scene()
				.fork()
					.tween(this, 15, 'easeInBack', { infoBoxFadeness: 1.0 })
				.end()
				.tween(this, 15, 'easeInOutSine', { infoFadeness: 1.0 })
				.resync()
				.call(function() { this.isChoiceMade = true; }.bind(this))
				.run();
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_B):
			this.targets = null;
			new Scene()
				.fork()
					.tween(this, 15, 'easeInBack', { infoBoxFadeness: 1.0 })
				.end()
				.tween(this, 15, 'easeInOutSine', { infoFadeness: 1.0 })
				.resync()
				.call(function() { this.isChoiceMade = true; }.bind(this))
				.run();
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_UP):
			if (!this.isTargetLocked) {
				this.moveCursor(-1);
			}
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_DOWN):
			if (!this.isTargetLocked) {
				this.moveCursor(1);
			}
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_LEFT):
			if (!this.isTargetLocked && this.targets != null) {
				if (!this.isGroupCast) {
					this.targets = [ this.battle.enemiesOf(this.unit)[0] ];
				} else {
					this.targets = this.battle.enemiesOf(this.unit);
				}
				this.updateInfo();
			}
			break;
		case GetPlayerKey(PLAYER_1, PLAYER_KEY_RIGHT):
			if (!this.isTargetLocked && this.targets != null) {
				if (!this.isGroupCast) {
					this.targets = [ this.unit ];
				} else {
					this.targets = this.battle.alliesOf(this.unit);
				}
				this.updateInfo();
			}
			break;
	}
};

TargetMenu.prototype.lockTargets = function(targetUnits)
{
	this.targets = targetUnits;
	this.isTargetLocked = true;
};


// .open() method
// Opens the targeting menu and waits for the player to select a target.
// Returns:
//     A list of all units chosen by the player.
TargetMenu.prototype.open = async function ()
{
	this.isChoiceMade = false;
	if (!this.isTargetLocked) {
		this.targets = this.usable !== null
			? this.usable.defaultTargets(this.unit)
			: [ this.battle.enemiesOf(this.unit)[0] ];
	}
	this.isGroupCast = this.usable !== null ? this.usable.isGroupCast : false;
	this.updateInfo();
	while (AreKeysLeft()) {
		GetKey();
	}
	let thread = Thread.create(this, 10);
	thread.takeFocus();
	await Thread.join(thread);
	return this.targets;
};

// .render() method
// Renders the menu in its current state.
TargetMenu.prototype.render = function()
{
	if (this.targets !== null) {
		for (let i = 0; i < this.targets.length; ++i) {
			this.drawCursor(this.targets[i]);
		}
	}
	if (this.unitToShowInfo != null) {
		SetClippingRectangle(0, 16, 160, GetScreenHeight() - 16);
		var textAlpha = 255 * (1.0 - this.infoBoxFadeness) * (1.0 - this.infoFadeness);
		if (this.isTargetScanOn || this.unitToShowInfo.isPartyMember()) {
			var nameBoxHeight = 20 + 12 * this.statusNames.length;
			var y = 16 - (nameBoxHeight + 20) * this.infoBoxFadeness;
			Rectangle(0, 16, 160, y - 16, CreateColor(0, 0, 0, 128 * (1.0 - this.infoBoxFadeness)));
			this.drawInfoBox(0, y, 160, nameBoxHeight, 160);
			drawTextEx(this.infoFont, 80, y + 4, this.unitToShowInfo.fullName, CreateColor(192, 192, 192, textAlpha), 1, 'center');
			var statusColor = this.statusNames.length == 0 ?
				CreateColor(96, 192, 96, textAlpha) :
				CreateColor(192, 192, 96, textAlpha);
			for (let i = 0; i < this.statusNames.length; ++i) {
				drawTextEx(this.infoFont, 80, y + 16 + 12 * i, this.statusNames[i], CreateColor(192, 192, 96, textAlpha), 1, 'center');
			}
			this.drawInfoBox(0, y + nameBoxHeight, 80, 20, 128);
			drawTextEx(this.infoFont, 40, y + nameBoxHeight + 4, "HP: " + this.unitToShowInfo.hp, CreateColor(192, 192, 144, textAlpha), 1, 'center');
			this.drawInfoBox(80, y + nameBoxHeight, 80, 20, 128);
			drawTextEx(this.infoFont, 120, y + nameBoxHeight + 4, "MP: " + this.unitToShowInfo.mpPool.availableMP, CreateColor(192, 192, 144, textAlpha), 1, 'center');
		} else {
			var y = 16 - 20 * this.infoBoxFadeness;
			Rectangle(0, 16, 160, y - 16, CreateColor(0, 0, 0, 128 * (1.0 - this.infoBoxFadeness)));
			this.drawInfoBox(0, y, 160, 20, 160);
			drawTextEx(this.infoFont, 80, y + 4, this.unitToShowInfo.fullName, CreateColor(192, 192, 192, textAlpha), 1, 'center');
		}
		SetClippingRectangle(0, 0, GetScreenWidth(), GetScreenHeight());
	}
}

// .update() method
// Updates the menu for the next frame.
TargetMenu.prototype.update = function()
{
	return !this.isChoiceMade;
}
