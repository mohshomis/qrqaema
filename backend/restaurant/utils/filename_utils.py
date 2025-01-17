# restaurant_app/utils/filename_utils.py

import uuid
import os

def generate_short_filename(instance, filename, prefix=''):
    """
    Generates a short, unique filename using UUID.

    Args:
        instance: The model instance.
        filename: The original filename.
        prefix: Optional prefix for the filename.

    Returns:
        A string representing the new file path.
    """
    ext = filename.split('.')[-1]
    # Generate a unique UUID and take the first 8 characters for brevity
    unique_id = uuid.uuid4().hex[:8]
    # Construct the new filename
    new_filename = f"{prefix}{unique_id}.{ext}"
    return new_filename
