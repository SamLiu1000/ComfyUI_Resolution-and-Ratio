import math

class ResolutionAndRatio:
    @classmethod
    def INPUT_TYPES(cls):
        default_presets = (
            "128x128\n256x256\n512x512\n512x768\n768x768\n1024x1024\n896x1216\n1216x896\n"
            "1088x1920\n1920x1088\n1152x1536\n1536x1152\n1536x2048\n2048x1536\n2048x2048"
        )
        
        return {
            "required": {
                "width": ("INT", {"default": 1152, "min": 64, "max": 4096, "step": 32}),
                "height": ("INT", {"default": 1536, "min": 64, "max": 4096, "step": 32}),
                "W_ratio": ("INT", {"default": 3, "min": 1, "max": 100}),
                "H_ratio": ("INT", {"default": 4, "min": 1, "max": 100}),
                "scale_percent": ("INT", {"default": 100, "min": 10, "max": 200, "step": 5, "display": "slider"}),
                "reset": ("BOOLEAN", {"default": False, "label_on": "RESET", "label_off": "RESET"}),
                "swap": ("BOOLEAN", {"default": False, "label_on": "SWAP", "label_off": "SWAP"}),
                "preset": (["Custom"],), 
                "custom_presets": ("STRING", {"multiline": True, "default": default_presets}),
            },
        }

    RETURN_TYPES = ("INT", "INT")
    RETURN_NAMES = ("width", "height")
    FUNCTION = "get_resolution"
    CATEGORY = "CustomUtils"

    def get_resolution(self, width, height, W_ratio, H_ratio, scale_percent, reset, swap, preset, custom_presets):
        # Handle reset (mainly handled by JS, but included for completeness)
        if reset:
            width = 256
            height = 256
        
        # Handle swap
        if swap:
            width, height = height, width
            W_ratio, H_ratio = H_ratio, W_ratio
        
        # Round to nearest multiple of 32
        width = round(width / 32) * 32
        height = round(height / 32) * 32
        
        # Ensure minimum values
        width = max(64, width)
        height = max(64, height)
        
        # Ensure maximum values
        width = min(4096, width)
        height = min(4096, height)
        
        return (width, height)

    @classmethod
    def VALIDATE_INPUTS(cls, width, height, **kwargs):
        if width < 64 or height < 64:
            return "Width and height must be at least 64"
        if width > 4096 or height > 4096:
            return "Width and height must not exceed 4096"
        return True
