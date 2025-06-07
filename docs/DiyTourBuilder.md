# 🏟️ DIY Tour Builder – Component Documentation

A modular React-based system that allows tourists to build custom tour packages with real-time pricing, accommodation matching, guide assignment, and meal selection.

---

## 📂 Core Structure

```
DIYTourBuilder/
├── TourPageEnhancer.jsx
├── TourMealPicker.jsx
├── SelectableTourImage.jsx
├── AccommodationAutoSelector.js
├── GuideAssignment.js
├── DynamicPricingEngine.js
└── index.js
```

---

## 🔧 Components & Modules

---

### 1. **DIYTourBuilder (Main Container)**

**File:** `index.js`
**Purpose:** Central orchestrator that pulls in submodules to let users customize their tour.

**Responsibilities:**

* Loads available tours and options
* Manages state (selected tours, meals, guides, pricing)
* Connects backend (e.g., Flask API)

---

### 2. **TourPageEnhancer**

**File:** `TourPageEnhancer.jsx`
**Purpose:** Dynamically enhances the `TourPage` with sections like:

* About the Tour
* What to Expect
* Tips for Visitors
* History & Culture

**Props:**

```js
{
  tourData: {
    about: string,
    expectations: string[],
    tips: string[],
    history: string,
    historyImage: string
  }
}
```

---

### 3. **TourMealPicker**

**File:** `TourMealPicker.jsx`
**Purpose:** UI for selecting meals with price calculation.

**Props:**

```js
{
  meals: [
    { name: string, price: number }
  ],
  onSelect: (selectedMeals: array) => void
}
```

---

### 4. **SelectableTourImage**

**File:** `SelectableTourImage.jsx`
**Purpose:** Image-based checkbox that affects pricing dynamically.

**Props:**

```js
{
  image: string,
  title: string,
  price: number,
  checked: boolean,
  onChange: (checked: boolean) => void
}
```

---

### 5. **AccommodationAutoSelector**

**File:** `AccommodationAutoSelector.js`
**Purpose:** Matches accommodation automatically based on selected tour location and availability.

**Inputs:**

```js
{
  selectedTours: [
    { location: string, startDate: Date, endDate: Date }
  ]
}
```

**Returns:**

```js
{
  matchedHotel: {
    name: string,
    pricePerNight: number,
    totalCost: number
  }
}
```

---

### 6. **GuideAssignment**

**File:** `GuideAssignment.js`
**Purpose:** Assigns local guides based on selected tour location and language preference.

**Inputs:**

```js
{
  tours: [ { location: string } ],
  languagePreference: string
}
```

**Returns:**

```js
{
  assignedGuides: [
    { name: string, location: string, rating: number }
  ]
}
```

---

### 7. **DynamicPricingEngine**

**File:** `DynamicPricingEngine.js`
**Purpose:** Calculates total tour cost based on selected tours, meals, accommodations, and guide fees.

**Inputs:**

```js
{
  tours: [ { price: number } ],
  meals: [ { price: number } ],
  accommodation: { totalCost: number },
  guides: [ { fee: number } ]
}
```

**Returns:**

```js
{
  totalPrice: number
}
```

---

## 🔄 Example Flow

1. User selects tour images (`SelectableTourImage`)
2. Price updates automatically (`DynamicPricingEngine`)
3. Meals are chosen (`TourMealPicker`)
4. Matching hotel is suggested (`AccommodationAutoSelector`)
5. Guide is assigned (`GuideAssignment`)
6. Final summary and booking proceed

