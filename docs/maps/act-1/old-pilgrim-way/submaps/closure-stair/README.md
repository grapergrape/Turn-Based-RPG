# Closure Stair

- **Status:** Implemented
- **Size:** `32x48`
- **Runtime:** `data/levels/old_pilgrim_closure_stair.json`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

The Closure Stair is the pressure-rated descent that sealed automatically when
external contamination alarms reached the church. It shows the first failed
attempts to survive or escape the quarantine.

## Layout contract

- **Connections:** The upper stair returns to the Hill Church. The inner
  pressure door leads to the Novitiate Quarters.
- **Required anchors:** Outer pressure door, pilgrim wash rooms, equipment
  lockers, bell shaft, emergency tank, failed breach, inner pressure door, and
  a long central descent.
- **Evidence:** The emergency tank is empty. Tools and damaged masonry mark a
  failed breach attempt. Bodies lie near the doors, tank, lockers, and stair.
- **Exclude:** A working water source, open pressure doors on first entry,
  recent corpses, Host matter, transformed dead, or a staged boss encounter.

## Runtime state

Both pressure doors completed their closure cycle. The map contains the empty
emergency tank, failed breach, stripped lockers, bell cable, and eight
searchable ordinary skeletons. No enemy or Host growth is present.

The upper stair returns to the church. The inner pressure door can be opened
with the service key found on this stair, or through Engineering or Security,
then loads the Novitiate Quarters.

## Generation record

Accepted prompt contract:

```text
Create a vertical roofless 32x48 Closure Stair in the established sepia ink
planning style. Place the route from Hill Church at the top and Novitiate
Quarters at the bottom. Include outer and inner pressure doors, wash rooms,
equipment lockers, a bell shaft, an empty emergency tank, a failed breach, and
long-dead robed human bodies. Keep every body ordinary and untransformed. Use an
exact numbered border. No living enemy, Host growth, gore, color, or watermark.
```
