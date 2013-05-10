/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2013 Power-Command
***/

RequireScript('lib/kh2Bar.js');
RequireScript('lib/MultiDelegate.js');
RequireScript('lib/persist.js');
RequireScript('lib/Scenario.js');
RequireScript('lib/SpriteImage.js');
RequireScript('Core/Engine.js');
RequireScript('Core/BGM.js');
RequireScript('Core/Console.js');
RequireScript('Core/Threads.js');
RequireScript('Core/Tween.js');
RequireScript('Game.js');

var DBG_DISABLE_BATTLES = false;
var DBG_DISABLE_BGM = false;
var DBG_DISABLE_SCENE_DELAYS = false;
var DBG_DISABLE_TEXTBOXES = false;
var DBG_DISABLE_TITLE_CARD = true;
var DBG_DISABLE_TITLE_SCREEN = true;
var DBG_DISABLE_TRANSITIONS = false;

RequireScript('Battle.js');
RequireScript('Cutscenes.js');
RequireScript('Session.js');
RequireScript('TitleScreen.js');

function delegate(o, methodName)
{
	return function(/*...*/) {
		o[methodName].apply(o, arguments)
	};
}

function game()
{
	Engine.initialize();
	persist.init();
	SetUpdateScript("Threads.updateAll();");
	SetRenderScript("Threads.renderAll();");
	Console = new Console(17);
	
	if (!DBG_DISABLE_TITLE_CARD) {
		BGM.change("SpectaclesTheme");
		Engine.showLogo("TitleCard", 150);
	}
	var session = new TitleScreen("SpectaclesTheme").show();
	var world = persist.getWorldState();
	world.session = session;
	MapEngine("main.rmp", Engine.frameRate);
}
