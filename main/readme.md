# 🧩 1. HEADER BAR (TOP)

### Purpose:

* Context + controls

### Elements:

* Project title:
  **“City Traffic Command Center”**
* Status badge:

  * 🟢 Normal
  * 🔴 Emergency Active
* Toggle:

  * AI ON / OFF

---

# 🎥 2. LEFT SIDE (70%) — CCTV GRID

### Layout:

* **4 x 4 grid (16 CCTV feeds)**

---

## Each CCTV Card (IMPORTANT)

Each card should show:

```
-------------------------
| CCTV S7              |
| Location: Sector 7   |
|                      |
| [ FAKE VIDEO AREA ]  |
|                      |
| Status: 🟢 NORMAL     |
-------------------------
```

---

## States of CCTV Card

### 🟢 Normal

* Green border
* Label: NORMAL

---

### 🟡 High Traffic

* Yellow border
* Label: HIGH TRAFFIC

---

### 🔴 Emergency (MOST IMPORTANT)

* Red blinking border
* Label: AMBULANCE DETECTED
* Slight zoom effect

---

## 🧠 Behavior

* All 16 shown initially
* When ambulance detected:

  * That CCTV:

    * moves to **top-left**
    * gets highlighted
    * slight scale animation

---

# 📊 3. RIGHT SIDE (30%) — CONTROL + ROUTE PANEL

Split into 3 sections vertically:

```
-------------------------
| 1. Request Info        |
-------------------------
| 2. Route CCTV List     |
-------------------------
| 3. Event Logs          |
-------------------------
```

---

## 🏥 1. REQUEST INFO PANEL

### Shows ONLY when request comes

```
Hospital B → Hospital A
Type: ORGAN TRANSFER
Ambulance: A1
Status: ACTIVE
```

---

## 🗺️ 2. ROUTE CCTV PANEL (VERY IMPORTANT)

👉 This is your main feature

### Shows:

```
ROUTE TRACKING:

[S3] → [S7] → [S9] → [S12]
```

---

### UI Behavior:

* Current CCTV:

  * 🔴 highlighted
* Next CCTV:

  * 🟡
* Passed:

  * faded / green

---

### Example:

```
S3 ✅ → S7 🔴 → S9 🟡 → S12
```

---

## 📜 3. EVENT LOG PANEL

Scrollable list:

```
[12:01] Request initiated
[12:02] Route calculated
[12:03] Ambulance detected at S3
[12:04] Corridor activated
[12:05] Passed S3 → S7 active
```

---

# 🎛️ OPTIONAL CONTROLS (TOP OF RIGHT PANEL)

Buttons:

* Trigger Request
* Simulate Ambulance
* Route Deviation (optional)

---

# 🔄 UI STATE FLOW (VERY IMPORTANT)

---

## 🟢 STATE 1: NORMAL

* All CCTV = green
* Right panel empty

---

## 🔴 STATE 2: REQUEST RECEIVED

* Right panel shows:

  * request info
  * route
* CCTV unchanged yet

---

## 🚑 STATE 3: AMBULANCE DETECTED

* One CCTV turns RED
* Moves to top-left
* Route panel highlights first node

---

## 🚦 STATE 4: MOVEMENT

* CCTV highlight shifts (S3 → S7 → S9)
* Route panel updates
* Logs update

---

## ✅ STATE 5: COMPLETED

* All return to NORMAL
* Show:

  * “Corridor Completed”

---

# 🧩 COMPONENT STRUCTURE (REACT)

---

## Main Layout

```jsx
<App>
  <Header />
  <MainLayout>
    <CCTVGrid />      // 70%
    <SidePanel />     // 30%
  </MainLayout>
</App>
```

---

## CCTV Grid

```jsx
<CCTVGrid>
  {cctvs.map(c => (
    <CCTVCard data={c} />
  ))}
</CCTVGrid>
```

---

## CCTV Card

```jsx
<CCTVCard>
  - id
  - status
  - highlight
</CCTVCard>
```

---

## Side Panel

```jsx
<SidePanel>
  <RequestInfo />
  <RouteTracker />
  <EventLog />
</SidePanel>
```

---

# 🎨 DESIGN RULES (IMPORTANT)

* Dark theme (control room feel)
* Use:

  * Green → normal
  * Yellow → warning
  * Red → emergency
* Smooth transitions (not instant jumps)

---
