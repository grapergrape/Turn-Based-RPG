# Hill Church

- **Status:** Implemented
- **Size:** `44x32`
- **Runtime:** `data/levels/old_pilgrim_hill_church.json`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

The Hill Church is an abandoned Solar Ecclesiate pilgrimage church and hospice.
The public rooms offer modest salvage. A concealed chapter door beneath the
raised apse begins the buried chain.

## Layout contract

- **Connections:** The south public entrance returns to the surface. The hidden
  apse door leads to the Closure Stair after both discovery findings are met.
- **Required anchors:** Nave, raised apse, sacristy, closure desk, bell stair,
  hospice ward, refectory, and kitchen.
- **Discovery:** A doctrine or search finding establishes that the apse is built
  over a closure route. An engineering or security finding identifies the door
  release.
- **Exclude:** Exposed dungeon stairs, active congregation, underground victims
  placed in the public church, Host growth, transformed corpses, or a second
  hidden dungeon entrance.

## Runtime state

The church is abandoned, weathered, free of bodies, and partly looted. Its
public door returns to the surface at (88,17). The closure desk supports a
Doctrine or Search reading, with Father Noah's copied inventory as a separate
knowledge route. Engineering or Security then releases the concealed apse door
at (22,0) and begins the hidden quest.

The public rooms contain modest supplies. No current faction occupies the
church, and no underground victim has been moved into it.

## Generation record

Accepted prompt contract:

```text
Create a roofless 44x32 Hill Church in the established sepia ink planning
style. Use a south public entrance, central nave, raised apse, sacristy, closure
desk, bell stair, hospice ward, refectory, and kitchen. Conceal a buried chapter
door beneath the apse and label the route to Closure Stair. Keep the church
abandoned but free of bodies and Host contamination. Use an exact numbered
border. No active congregation, exposed dungeon stair, monster, color, or
watermark.
```
