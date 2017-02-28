/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2017 Power-Command
***/

RequireScript("menuStrip.js");

const GameOverAction =
{
	Retry: 1,
	Quit:  2,
};

class GameOverScreen
{
	constructor()
	{
		this.fadeness = 1.0;
		this.image = new Texture('images/gameOverScreen.png');
		this.transition = null;
	}

	show()
	{
		this.action = null;
		this.mode = 'transitionIn';
		if (Sphere.Game.disableAnimations) {
			this.fadeness = 0.0;
		}
		music.play(null);
		this.transition = new scenes.Scene()
			.pushBGM('gameOver')
			.adjustBGM(1.0)
			.tween(this, 300, 'linear', { fadeness: 0.0 })
			.run();
		return threads.create(this);
	}

	update()
	{
		switch (this.mode) {
			case 'idle':
				return true;
			case 'transitionIn':
				if (!this.transition.isRunning()) {
					this.mode = 'idle';
					var menu = new MenuStrip("Game Over", false);
					menu.addItem("Retry Battle", GameOverAction.Retry);
					menu.addItem("Give Up", GameOverAction.Quit);
					this.action = menu.open();
					if (Sphere.Game.disableAnimations) {
						this.fadeness = 1.0;
					}
					this.transition = new scenes.Scene()
						.fork()
							.adjustBGM(0.0, 120)
						.end()
						.tween(this, 120, 'linear', { fadeness: 1.0 })
						.run();
					this.mode = 'transitionOut';
				}
				break;
			case 'transitionOut':
				if (!this.transition.isRunning()) {
					music.pop();
					music.adjust(1.0);
				}
				return this.transition.isRunning();
		}
		return true;
	}

	render()
	{
		prim.blit(screen, 0, 0, this.image);
		prim.fill(screen, Color.Black.fade(this.fadeness));
	}
}