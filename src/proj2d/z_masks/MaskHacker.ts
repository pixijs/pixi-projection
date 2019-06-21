namespace pixi_projection {
    PIXI.systems.MaskSystem.prototype.pushSpriteMask =  function(target: any, maskData: PIXI.Sprite): void {
		let alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex];

		if (!alphaMaskFilter) {
			alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex] = [new SpriteMaskFilter2d(maskData)];
		}

		alphaMaskFilter[0].resolution = this.renderer.resolution;
		alphaMaskFilter[0].maskSprite = maskData;

		// TODO - may cause issues!
		target.filterArea = maskData.getBounds(true);

		this.renderer.filterManager.pushFilter(target, alphaMaskFilter);

		this.alphaMaskIndex++;
	}
}
