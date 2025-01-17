# utils/validators.py

from rest_framework import serializers

def validate_image_file(value, max_size=10 * 1024 * 1024, allowed_types=None):
    """
    Validates an uploaded image file.

    Args:
        value (UploadedFile): The uploaded image file.
        max_size (int): Maximum allowed size in bytes. Default is 10MB.
        allowed_types (list, optional): List of allowed MIME types. Defaults to common image types.

    Raises:
        serializers.ValidationError: If the image is too large or of an unsupported type.

    Returns:
        UploadedFile: The validated image file.
    """
    if allowed_types is None:
        allowed_types = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/bmp',
            'image/webp',
            'image/svg+xml',
        ]
    if value.size > max_size:
        raise serializers.ValidationError(f"Image size should not exceed {max_size // (1024 * 1024)}MB.")

    if value.content_type not in allowed_types:
        raise serializers.ValidationError(
            "Unsupported image type. Allowed types: JPEG, PNG, GIF, BMP, WEBP, SVG."
        )

    return value
