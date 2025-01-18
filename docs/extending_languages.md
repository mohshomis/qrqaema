# Adding New Languages to the Restaurant Order System

This guide explains how to add support for new languages to the restaurant order system.

## Overview

The system supports multiple languages through two main components:
1. UI Translations (i18next)
2. Menu Content Translations (Database)

Currently supported languages:
- English (en)
- Arabic (ar)
- Turkish (tr)
- Dutch (nl)

## Adding a New Language

### 1. Add UI Translations

1. Create a new translation file in `frontend/src/locales/[language_code]/translation.json`
2. Add translations for all UI elements following the existing structure
3. Update `i18n.js` to include RTL support if needed:
```javascript
const rtlLanguages = ['ar']; // Add new RTL languages here
```

### 2. Update Menu Model

1. Add the new language to the `LANGUAGE_CHOICES` in `backend/restaurant/models.py`:
```python
LANGUAGE_CHOICES = [
    ('en', 'English'),
    ('ar', 'Arabic'),
    ('tr', 'Turkish'),
    ('nl', 'Dutch'),
    ('new_code', 'New Language')  # Add new language here
]
```

2. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Update Frontend Components

1. Add the language to the Header component in `frontend/src/components/Header.js`:
```javascript
{menu.language === 'new_code' && '🏳️ New Language'}
```

2. Add flag emoji and language name display in the language selector.

## Testing New Language Support

1. Create a new menu with the new language in the restaurant admin
2. Verify UI translations are working
3. Test RTL support if applicable
4. Verify QR code generation and menu switching
5. Test ordering flow in the new language

## Best Practices

1. Always provide complete translations for all UI elements
2. Test RTL layout if adding an RTL language
3. Update all relevant documentation
4. Consider cultural preferences in formatting (dates, numbers, currency)

## Troubleshooting

Common issues when adding new languages:

1. Missing translations
   - Solution: Check translation files for completeness

2. RTL layout issues
   - Solution: Test with RTL languages and fix layout problems

3. Character encoding problems
   - Solution: Ensure proper UTF-8 encoding in all files

## Future Considerations

When adding new languages, consider:
1. Cultural preferences
2. Special character support
3. Text length variations
4. Date/time formats
5. Number formats
6. Currency display
