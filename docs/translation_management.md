# Translation Management Guide

This guide explains how to manage translations in the Restaurant Order System.

## Supported Languages

The system currently supports:
- English (en) - Base language
- Arabic (ar) - RTL support
- Turkish (tr)
- Dutch (nl)

## Translation Structure

### File Organization
```
frontend/src/locales/
├── en/
│   └── translation.json
├── ar/
│   └── translation.json
├── tr/
│   └── translation.json
└── nl/
    └── translation.json
```

### Translation Key Structure

Keys are organized hierarchically by feature/section:
```json
{
  "seo": {
    "title": "",
    "description": ""
  },
  "auth": {
    "login": {},
    "register": {}
  },
  "restaurant": {
    "menu": {},
    "orders": {}
  }
}
```

## Translation Workflow

### 1. Adding New Translations

#### Step 1: Add to English File First
Always add new keys to `en/translation.json` first:
```json
{
  "feature": {
    "newKey": "English text"
  }
}
```

#### Step 2: Run Translation Sync
```bash
npm run translate-sync
```
This will:
1. Copy new keys to other language files
2. Mark missing translations
3. Generate translation report

#### Step 3: Update Other Languages
Update the new keys in each language file:
```json
// ar/translation.json
{
  "feature": {
    "newKey": "النص العربي"
  }
}
```

### 2. Using Translations in Code

#### React Components
```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('feature.newKey')}</h1>
      {/* With variables */}
      <p>{t('welcome.message', { name: userName })}</p>
    </div>
  );
}
```

#### Dynamic Keys
```javascript
// Using nested keys
const section = 'menu';
const key = 'title';
t(`${section}.${key}`);

// With fallbacks
t('missing.key', 'Fallback text');
```

## RTL Support

### 1. RTL Detection
```javascript
// Automatically handled by i18next
const isRTL = document.dir === 'rtl';
```

### 2. RTL Styling
```css
/* Use logical properties */
.container {
  margin-inline-start: 1rem;
  padding-inline-end: 1rem;
}

/* RTL-specific styles */
[dir='rtl'] .icon {
  transform: scaleX(-1);
}
```

### 3. RTL Components
```javascript
import { useTranslation } from 'react-i18next';

function RTLAwareComponent() {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  
  return (
    <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Component content */}
    </div>
  );
}
```

## Translation Management Tools

### 1. Missing Translation Check
```bash
npm run check-translations
```
Outputs:
```
Missing translations:
ar:
  - feature.newKey
tr:
  - feature.newKey
nl:
  - feature.newKey
```

### 2. Translation Statistics
```bash
npm run translation-stats
```
Outputs:
```
Translation coverage:
en: 100% (base)
ar: 95% (380/400 keys)
tr: 98% (392/400 keys)
nl: 97% (388/400 keys)
```

### 3. Automated Validation
```bash
npm run validate-translations
```
Checks for:
- Missing interpolation variables
- Invalid HTML tags
- Inconsistent pluralization
- RTL character issues

## Best Practices

### 1. Key Naming
- Use camelCase for keys
- Use descriptive, hierarchical names
- Group related translations
```json
{
  "menu": {
    "items": {
      "add": "Add Item",
      "edit": "Edit Item",
      "delete": "Delete Item"
    }
  }
}
```

### 2. String Formatting
- Use interpolation for variables: `{{variable}}`
- Use pluralization when needed
- Keep HTML out of translations
```json
{
  "welcome": "Hello, {{name}}!",
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

### 3. Context and Notes
Add comments for translators:
```json
{
  "order": {
    "status": {
      "_comment": "Status shown in order list",
      "pending": "Pending",
      "processing": "Processing"
    }
  }
}
```

## Common Issues and Solutions

### 1. Missing Translations
Problem: Translation key not found
```javascript
// Console error: Translation not found: feature.newKey
```
Solution: Check key exists in all language files

### 2. RTL Layout Issues
Problem: Layout breaks in RTL languages
Solution: Use logical properties and RTL-aware components

### 3. Pluralization
Problem: Incorrect plural forms
Solution: Use proper plural forms for each language
```json
{
  "item": "{{count}} item",
  "item_plural": "{{count}} items",
  "item_0": "No items",
  "item_2": "A couple of items"
}
```

## Translation Review Process

### 1. Adding New Language
1. Create new language file
2. Copy base structure from English
3. Update language selector
4. Test RTL if needed
5. Update documentation

### 2. Review Checklist
- [ ] All keys present
- [ ] No missing translations
- [ ] Proper pluralization
- [ ] RTL support (if needed)
- [ ] Consistent formatting
- [ ] No HTML in translations
- [ ] Proper variable interpolation

### 3. Quality Assurance
- Test in context
- Check all supported screen sizes
- Verify RTL layout
- Test with different content lengths
- Validate special characters

## Maintenance

### 1. Regular Tasks
- Weekly translation sync
- Monthly coverage report
- Quarterly full review
- Update documentation

### 2. Cleanup
- Remove unused keys
- Consolidate similar translations
- Update outdated content
- Fix formatting issues

### 3. Monitoring
- Track missing translations
- Monitor translation usage
- Check error logs
- Review user feedback

## Resources

### Documentation
- [i18next Documentation](https://www.i18next.com/)
- [React-i18next Guide](https://react.i18next.com/)
- [RTL Styling Guide](https://rtlstyling.com/)

### Tools
- Translation management system
- RTL testing tools
- Automated validation scripts
- Coverage reporting tools
