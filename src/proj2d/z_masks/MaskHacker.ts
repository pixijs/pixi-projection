namespace pixi_projection {
    PIXI.systems.MaskSystem.prototype.pushSpriteMask =  function(maskData: PIXI.MaskData): void {
        const { maskObject } = maskData;
        const target = (maskData as any)._target;

		let alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex];

		if (!alphaMaskFilter) {
			alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex] = [new SpriteMaskFilter2d(maskObject as PIXI.Sprite)];
		}

		alphaMaskFilter[0].resolution = this.renderer.resolution;
		alphaMaskFilter[0].maskSprite = maskData;

        const stashFilterArea = target.filterArea;
        target.filterArea = maskObject.getBounds(true);
        this.renderer.filter.push(target, alphaMaskFilter);
        target.filterArea = stashFilterArea;

		this.renderer.filter.push(target, alphaMaskFilter);

		this.alphaMaskIndex++;
	}
}
