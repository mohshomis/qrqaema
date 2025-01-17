# utils/image_compression.py

from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)

def compress_image(image, target_size_kb=40, max_width=1920, max_height=1080, format='JPEG'):
    print("compressing")
    """
    Compresses the uploaded image to be under the target_size_kb without losing significant quality.
    
    :param image: The original image file.
    :param target_size_kb: The desired maximum size of the image in kilobytes.
    :param max_width: The maximum width of the image.
    :param max_height: The maximum height of the image.
    :param format: Desired output format ('JPEG' or 'WEBP').
    :return: A ContentFile object of the compressed image.
    """
    try:
        img = Image.open(image)
        img_format = format.upper()

        # Convert to RGB if necessary
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        
        # Resize the image if it's larger than the max dimensions
        img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        
        # Initialize parameters for compression
        quality = 85
        buffer = BytesIO()
        
        # Save initial image with optimization
        img.save(buffer, format=img_format, quality=quality, optimize=True, progressive=True)
        size_kb = buffer.tell() / 1024
        
        logger.debug(f"Initial save: size={size_kb:.2f}KB, quality={quality}")
        
        # Adjust quality to get closer to target_size_kb
        while size_kb > target_size_kb and quality > 20:
            buffer.seek(0)
            buffer.truncate()
            quality -= 5
            img.save(buffer, format=img_format, quality=quality, optimize=True, progressive=True)
            size_kb = buffer.tell() / 1024
            logger.debug(f"Adjusted save: size={size_kb:.2f}KB, quality={quality}")
        
        # If WebP is chosen and target size not met, try reducing quality further
        if img_format == 'WEBP' and size_kb > target_size_kb and quality <= 20:
            quality = 20
            buffer.seek(0)
            buffer.truncate()
            img.save(buffer, format=img_format, quality=quality, optimize=True, method=6)
            size_kb = buffer.tell() / 1024
            logger.debug(f"Final WebP save: size={size_kb:.2f}KB, quality={quality}")
        
        buffer.seek(0)
        compressed_image = ContentFile(buffer.read(), name=image.name)
        
        logger.debug(f"Final compressed image size: {size_kb:.2f}KB")
        
        return compressed_image
    except Exception as e:
        logger.error(f"Error compressing image {image.name}: {e}")
        raise
