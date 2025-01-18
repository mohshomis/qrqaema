# Menu Translation System Refactoring

## Overview
This document outlines a plan to refactor the menu system to use a translation-based approach instead of separate menus for each language. This change will improve data consistency, simplify the restaurant owner's experience, and make menu management more intuitive.

## Current Issues
1. Separate menus for each language create data redundancy
2. Difficult to maintain consistency across different language versions
3. Restaurant owners must recreate categories and items for each language
4. No direct connection between the same item in different languages
5. Orders may show items in wrong language when communicating with restaurant staff

## Proposed Solution

### 1. Database Schema Changes

#### Menu Model
```python
class Menu(models.Model):
    restaurant = models.OneToOneField(Restaurant)  # One menu per restaurant
    default_language = models.CharField(choices=LANGUAGE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### Category Models
```python
class Category(models.Model):
    menu = models.ForeignKey(Menu)
    image = models.ImageField()
    order = models.IntegerField()
    is_available = models.BooleanField(default=True)

class CategoryTranslation(models.Model):
    category = models.ForeignKey(Category, related_name='translations')
    language = models.CharField(choices=LANGUAGE_CHOICES)
    name = models.CharField()
    description = models.TextField(blank=True)

    class Meta:
        unique_together = ['category', 'language']
```

#### MenuItem Models
```python
class MenuItem(models.Model):
    category = models.ForeignKey(Category)
    price = models.DecimalField()
    image = models.ImageField()
    order = models.IntegerField()
    is_available = models.BooleanField(default=True)

class MenuItemTranslation(models.Model):
    menu_item = models.ForeignKey(MenuItem, related_name='translations')
    language = models.CharField(choices=LANGUAGE_CHOICES)
    name = models.CharField()
    description = models.TextField()

    class Meta:
        unique_together = ['menu_item', 'language']
```

#### Option Models
```python
class MenuItemOption(models.Model):
    menu_item = models.ForeignKey(MenuItem)
    price_modifier = models.DecimalField()

class OptionTranslation(models.Model):
    option = models.ForeignKey(MenuItemOption, related_name='translations')
    language = models.CharField(choices=LANGUAGE_CHOICES)
    name = models.CharField()

    class Meta:
        unique_together = ['option', 'language']
```

### 2. API Changes

#### Menu Endpoints
```
GET /api/restaurants/{restaurant_id}/menu/
- Returns menu structure with all translations
- Query param for specific language

POST /api/restaurants/{restaurant_id}/menu/
- Creates restaurant menu with default language

PATCH /api/restaurants/{restaurant_id}/menu/
- Updates menu settings (default language)
```

#### Category Endpoints
```
GET /api/menu/{menu_id}/categories/
- Returns categories with translations
- Query param for language

POST /api/menu/{menu_id}/categories/
- Creates category with initial translation
- Optional additional translations

POST /api/categories/{category_id}/translations/
- Adds new translation for category

PUT /api/categories/{category_id}/translations/{language}/
- Updates specific translation
```

#### MenuItem Endpoints
```
GET /api/categories/{category_id}/items/
- Returns items with translations
- Query param for language

POST /api/categories/{category_id}/items/
- Creates item with initial translation
- Optional additional translations

POST /api/items/{item_id}/translations/
- Adds new translation for item

PUT /api/items/{item_id}/translations/{language}/
- Updates specific translation
```

### 3. Frontend Changes

#### Restaurant Owner Interface

##### Menu Management Page
```jsx
// Single menu view with language tabs
<MenuManagement>
    <LanguageSelector onChange={previewLanguage} />
    <CategoryList>
        {categories.map(category => (
            <CategoryCard>
                <CategoryInfo language={currentLanguage} />
                <TranslationStatus languages={category.translations} />
                <AddTranslationButton onClick={showTranslationModal} />
            </CategoryCard>
        ))}
    </CategoryList>
</MenuManagement>
```

##### Category/Item Creation
```jsx
// Create with default language, add translations later
<CreateItemForm>
    <LanguageNote>Creating in {defaultLanguage}</LanguageNote>
    <BasicInfo>
        <ImageUpload />
        <PriceInput />  {/* Shared across translations */}
        <OrderInput />  {/* Shared across translations */}
    </BasicInfo>
    <TranslationInfo>
        <NameInput />
        <DescriptionInput />
    </TranslationInfo>
</CreateItemForm>
```

##### Translation Management
```jsx
// Modal for managing translations
<TranslationModal>
    <LanguageTabs>
        {LANGUAGES.map(lang => (
            <TranslationForm language={lang}>
                <NameInput />
                <DescriptionInput />
                <SaveTranslation />
            </TranslationForm>
        ))}
    </LanguageTabs>
</TranslationModal>
```

#### Customer Interface

##### Menu Viewing
- Language selection in header affects all translations
- Items maintain same order/structure
- Prices and images stay consistent
- Fallback to default language if translation missing

##### Order Processing
- Store both translated and default language names
- Show appropriate language based on context:
  * Customer view: Selected language
  * Kitchen view: Default language
  * Order history: Both versions

### 4. Migration Plan

1. Database Migration
```sql
-- Create new translation tables
-- Copy existing data to translation format
-- Update foreign key relationships
-- Remove old language-specific tables
```

2. API Migration
- Create new endpoints
- Maintain backwards compatibility during transition
- Update API documentation
- Add API version headers

3. Frontend Migration
- Create new components
- Update state management
- Add translation UI
- Update order processing

4. Testing Strategy
- Unit tests for translation models
- API integration tests
- Frontend component tests
- End-to-end order flow tests
- Language switching tests
- Fallback behavior tests

### 5. Benefits

1. Data Consistency
- Single source of truth for menu structure
- Consistent pricing and availability
- Shared images across languages
- Synchronized updates

2. User Experience
- Simplified menu management for owners
- Intuitive translation workflow
- Better language switching for customers
- Correct language display in all contexts

3. Technical Advantages
- Reduced data redundancy
- Easier maintenance
- Better scalability for new languages
- Improved performance

### 6. Timeline

Phase 1: Backend (2 weeks)
- Database schema changes
- Model updates
- API endpoint implementation
- Migration scripts

Phase 2: Frontend (2 weeks)
- Component development
- Translation UI
- State management updates
- API integration

Phase 3: Testing & Migration (1 week)
- Testing implementation
- Data migration
- Bug fixes
- Documentation

### 7. Future Considerations

1. Language Features
- RTL support improvements
- Language-specific formatting
- Automatic translation suggestions
- Translation memory/reuse

2. Performance
- Translation caching
- Lazy loading of translations
- Optimized queries

3. Features
- Translation workflow (draft/publish)
- Translation history
- Bulk translation updates
- Export/import translations

4. Integrations
- Professional translation services
- Automatic translation APIs
- Language quality tools
