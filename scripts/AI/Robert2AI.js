/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (C) 2012 Power-Command
***/

function Robert2AI(battle, unit, context)
{
	this.battle = battle;
	this.unit = unit;
	this.context = context;
	this.battle.itemUsed.addHook(this, this.onItemUsed);
	this.battle.skillUsed.addHook(this, this.onSkillUsed);
	this.battle.unitReady.addHook(this, this.onUnitReady);
	this.isNecromancyReady = false;
	this.isScottZombie = false;
	this.necromancyChance = 0.0;
}

Robert2AI.prototype.strategize = function()
{				
	if ('maggie' in this.context.enemies && this.context.turnsTaken == 0) {
		var me = this.unit;
		new Scenario()
			.talk("Robert", true, 2.0, "Wait, hold on... what in Hades' name is SHE doing here?")
			.talk("maggie", true, 2.0, "The same thing I'm always doing, having stuff for dinner. Like you!")
			.call(function() { me.takeDamage(me.maxHP - 1); })
			.playSound('Munch.wav')
			.talk("Robert", true, 2.0, "HA! You missed! ...hold on, where'd my leg go? ...and my arm, and my other leg...")
			.talk("maggie", true, 2.0, "Tastes like chicken!")
			.talk("Robert", true, 2.0, "...")
			.run(true);
		this.context.useItem('alcohol');
	}
	if (this.context.turnsTaken == 0) {
		this.phase = 0;
		this.context.useSkill('omni');
		this.isNecromancyReady = true;
		this.necromancyTurns = 0;
	} else if (this.isNecromancyReady && this.necromancyTurns <= 0) {
		this.context.useSkill('necromancy');
		this.isScottZombie = true;
		this.isNecromancyReady = false;
	} else {
		var phaseToEnter =
			this.unit.getHealth() > 75 ? 1 :
			this.unit.getHealth() > 40 ? 2 :
			this.unit.getHealth() > 10 ? 3 :
			4;
		var lastPhase = this.phase;
		this.phase = lastPhase > phaseToEnter ? lastPhase : phaseToEnter
		switch (this.phase) {
			case 1:
				if (this.phase > lastPhase) {
					this.isComboStarted = false;
				}
				var forecast = this.context.turnForecast('chargeSlash');
				if (forecast[0].unit === this.unit) {
					this.context.useSkill('chargeSlash');
				} else {
					forecast = this.context.turnForecast('quickstrike');
					if (forecast[0].unit === this.unit) {
						this.context.useSkill('quickstrike');
						this.isComboStarted = true;
					} else {
						if (this.isComboStarted) {
							this.context.useSkill('swordSlash');
							this.isComboStarted = false;
						} else {
							var moves = [ 'flare', 'chill', 'lightning', 'quake' ];
							this.context.useSkill(moves[Math.min(Math.floor(Math.random() * 4), 3)]);
						}
					}
				}
				break;
			case 2:
				if (this.phase > lastPhase) {
					if (this.unit.hasStatus('frostbite')) {
						this.context.useSkill('flare', 'robert2');
					} else if (this.unit.hasStatus('ignite')) {
						this.context.useSkill('chill', 'robert2');
					} else {
						this.context.useSkill('upheaval');
					}
					this.isComboStarted = false;
				} else {
					var forecast = this.context.turnForecast('quickstrike');
					if ((0.5 > Math.random() || this.isComboStarted) && forecast[0].unit === this.unit) {
						this.context.useSkill('quickstrike');
						this.isComboStarted = true;
					} else {
						if (this.isComboStarted) {
							this.context.useSkill('swordSlash');
							this.isComboStarted = false;
						} else {
							var moves = [ 'flare', 'chill', 'lightning', 'upheaval' ];
							var moveToUse = moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)];
							if (moveToUse == 'upheaval') {
								if (this.unit.hasStatus('frostbite')) {
									this.context.useSkill('flare', 'robert2');
								} else if (this.unit.hasStatus('ignite')) {
									this.context.useSkill('chill', 'robert2');
								} else {
									this.context.useSkill(moveToUse);
								}
							} else {
								this.context.useSkill(moveToUse);
							}
						}
					}
				}
				break;
			case 3:
				if (this.phase > lastPhase) {
					if (this.unit.mpPool.availableMP < 0.5 * this.unit.mpPool.capacity) {
						this.context.useItem('redBull');
					}
					this.context.useSkill('protectiveAura');
					this.context.useSkill('crackdown');
					this.doChargeSlashNext = false;
					this.isComboStarted = false;
				} else {
					var chanceOfCombo = 0.25 + this.unit.hasStatus('crackdown') * 0.25;
					if (Math.random() < chanceOfCombo || this.isComboStarted) {
						var forecast = this.context.turnForecast('chargeSlash');
						if ((forecast[0] === this.unit && !this.isComboStarted) || this.doChargeSlashNext) {
							this.isComboStarted = false;
							if (forecast[0] === this.unit) {
								this.context.useSkill('chargeSlash');
							} else {
								var moves = [ 'hellfire', 'windchill' ];
								this.context.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
							}
						} else {
							this.isComboStarted = true;
							forecast = this.context.turnForecast('quickstrike');
							if (forecast[0] === this.unit) {
								this.context.useSkill('quickstrike');
							} else {
								if (this.unit.hasStatus('crackdown')) {
									this.context.useSkill('omni');
									this.isComboStarted = false;
								} else {
									this.context.useSkill('quickstrike');
									this.doChargeSlashNext = true;
								}
							}
						}
					} else {
						var moves = [ 'flare', 'chill', 'lightning', 'upheaval' ];
						this.context.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
					}
				}
				break;
			case 4:
				if (this.phase > lastPhase) {
					if (!this.unit.hasStatus('zombie')) {
						this.context.useItem('alcohol');
					} else {
						this.context.useSkill('desperationSlash');
					}
					this.context.useSkill('electrocute');
				} else {
					var forecast = this.context.turnForecast('omni');
					if (forecast[0] === this.unit || forecast[1] === this.unit) {
						this.context.useSkill('omni');
					} else {
						if (0.5 > Math.random()) {
							this.context.useSkill('chargeSlash');
						} else {
							var moves = [ 'hellfire', 'windchill', 'electrocute', 'upheaval' ];
							this.context.useSkill(moves[Math.min(Math.floor(Math.random() * moves.length), moves.length - 1)]);
						}
					}
				}
				break;
		}
	}
};

Robert2AI.prototype.onItemUsed = function(userID, itemID, targetIDs)
{
	if (userID == 'scott' && Link(targetIDs).contains('scott')) {
		var curativeIDs = [ 'tonic', 'powerTonic' ];
		if (itemID == 'vaccine' && this.isNecromancyReady) {
			this.necromancyTurns = 3;
		} else if (itemID == 'holyWater' && this.isScottZombie) {
			if (this.phase == 1) {
				this.context.useSkill('necromancy');
			} else {
				this.isScottZombie = false;
			}
		} else if (Link(curativeIDs).contains(itemID) && !this.isNecromancyReady && !this.isScottZombie) {
			this.necromancyChance += 0.25;
			if (this.necromancyChance > Math.random()) {
				this.context.useSkill('necromancy');
				this.isScottZombie = true;
				this.necromancyChance = 0.0;
			}
		}
	}
};

Robert2AI.prototype.onSkillUsed = function(userID, skillID, targetIDs)
{
};

Robert2AI.prototype.onUnitReady = function(unitID)
{
	if (unitID == 'scott') {
		if (this.isNecromancyReady) {
			--this.necromancyTurns;
		} else {
			this.necromancyChance = Math.max(this.necromancyChance - 0.05, 0.0);
		}
	}
};
