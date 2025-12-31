import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "Comfy.ResolutionAndRatio",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "ResolutionAndRatio") {
            
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                onNodeCreated?.apply(this, arguments);

                const getWidget = (name) => this.widgets.find(w => w.name === name);
                
                const wWidget = getWidget("width");
                const hWidget = getWidget("height");
                const rwWidget = getWidget("W_ratio");
                const rhWidget = getWidget("H_ratio");
                const scalePercentWidget = getWidget("scale_percent");
                const resetWidget = getWidget("reset");
                const swapWidget = getWidget("swap");
                const presetWidget = getWidget("preset");
                const customWidget = getWidget("custom_presets");

                // Store base resolution for scale calculations
                let baseWidth = wWidget.value;
                let baseHeight = hWidget.value;

                // Helper function to round to nearest multiple of 32
                const roundTo32 = (val) => Math.round(val / 32) * 32;

                // Helper function to clamp value between min and max
                const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

                // Update base resolution when width/height changes manually
                const originalWCallback = wWidget.callback;
                wWidget.callback = function() {
                    baseWidth = wWidget.value;
                    // Update scale to match current resolution
                    const currentScale = Math.round((wWidget.value / baseWidth) * 100);
                    if (currentScale >= 10 && currentScale <= 200) {
                        scalePercentWidget.value = currentScale;
                    }
                    if (originalWCallback) originalWCallback.apply(this, arguments);
                };

                const originalHCallback = hWidget.callback;
                hWidget.callback = function() {
                    baseHeight = hWidget.value;
                    // Update scale to match current resolution
                    const currentScale = Math.round((hWidget.value / baseHeight) * 100);
                    if (currentScale >= 10 && currentScale <= 200) {
                        scalePercentWidget.value = currentScale;
                    }
                    if (originalHCallback) originalHCallback.apply(this, arguments);
                };

                // Scale slider updates resolution in real-time
                scalePercentWidget.callback = () => {
                    const newWidth = roundTo32(baseWidth * scalePercentWidget.value / 100);
                    const newHeight = roundTo32(baseHeight * scalePercentWidget.value / 100);
                    
                    wWidget.value = clamp(newWidth, 64, 4096);
                    hWidget.value = clamp(newHeight, 64, 4096);
                };

                // Ratio synchronization with 4096 limit
                rwWidget.callback = () => {
                    const newWidth = roundTo32((hWidget.value / rhWidget.value) * rwWidget.value);
                    const clampedWidth = clamp(newWidth, 64, 4096);
                    
                    // If hitting limit, prevent ratio from increasing further
                    if (newWidth > 4096) {
                        // Calculate max ratio that keeps width at 4096
                        const maxRatio = Math.floor((4096 * rhWidget.value) / hWidget.value);
                        rwWidget.value = maxRatio;
                        wWidget.value = 4096;
                    } else {
                        wWidget.value = clampedWidth;
                    }
                    
                    // Update base and scale
                    baseWidth = wWidget.value;
                    scalePercentWidget.value = 100;
                };

                rhWidget.callback = () => {
                    const newHeight = roundTo32((wWidget.value / rwWidget.value) * rhWidget.value);
                    const clampedHeight = clamp(newHeight, 64, 4096);
                    
                    // If hitting limit, prevent ratio from increasing further
                    if (newHeight > 4096) {
                        // Calculate max ratio that keeps height at 4096
                        const maxRatio = Math.floor((4096 * rwWidget.value) / wWidget.value);
                        rhWidget.value = maxRatio;
                        hWidget.value = 4096;
                    } else {
                        hWidget.value = clampedHeight;
                    }
                    
                    // Update base and scale
                    baseHeight = hWidget.value;
                    scalePercentWidget.value = 100;
                };

                // RESET logic
                resetWidget.callback = () => {
                    wWidget.value = 256;
                    hWidget.value = 256;
                    rwWidget.value = 1;
                    rhWidget.value = 1;
                    scalePercentWidget.value = 100;
                    baseWidth = 256;
                    baseHeight = 256;
                    
                    // Reset button after a short delay
                    setTimeout(() => { resetWidget.value = false; }, 200);
                };

                // SWAP logic
                swapWidget.callback = () => {
                    const tempV = wWidget.value;
                    wWidget.value = hWidget.value;
                    hWidget.value = tempV;

                    const tempR = rwWidget.value;
                    rwWidget.value = rhWidget.value;
                    rhWidget.value = tempR;

                    const tempBase = baseWidth;
                    baseWidth = baseHeight;
                    baseHeight = tempBase;
                    
                    // Reset swap button after a short delay
                    setTimeout(() => { swapWidget.value = false; }, 200);
                };

                // Update preset dropdown from custom presets
                const updatePresets = () => {
                    const lines = customWidget.value.split('\n')
                                    .map(l => l.trim())
                                    .filter(l => l.toLowerCase().includes('x'));
                    presetWidget.options.values = ["Custom", ...lines];
                };
                customWidget.callback = updatePresets;
                setTimeout(updatePresets, 100);

                // Apply selected preset
                presetWidget.callback = (v) => {
                    if (v !== "Custom") {
                        const parts = v.toLowerCase().split('x');
                        if (parts.length === 2) {
                            const w = parseInt(parts[0]);
                            const h = parseInt(parts[1]);
                            if (!isNaN(w) && !isNaN(h)) {
                                wWidget.value = clamp(w, 64, 4096);
                                hWidget.value = clamp(h, 64, 4096);
                                baseWidth = wWidget.value;
                                baseHeight = hWidget.value;
                                scalePercentWidget.value = 100;
                            }
                        }
                    }
                };
            };
        }
    }
});