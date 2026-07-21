# Trial Galleries

- **Status:** Implemented
- **Size:** `64x48`
- **Runtime:** `data/levels/old_pilgrim_trial_galleries.json`
- **Reference image:** [planning-map.png](./planning-map.png)
- **Generation:** Built-in `$imagegen`

The Trial Galleries were used to test candidates before they entered the
chapter. Their machinery still controls the final profession door.

## Layout contract

- **Connections:** The south stair returns to the Novitiate Quarters. The north
  profession door leads to the Sealed Chapter after the required trial states
  are complete.
- **Quiet Threshold:** Read or bypass the listening sentries without triggering
  every mechanism in the hall.
- **Trial of Service:** Set the old wash-room valves to the intended service
  pattern using hand controls. The completed mechanism releases no water.
- **Burden Gallery:** Rebalance the counterweighted reliquary frame to clear its
  passage.
- **Trial of Mercy:** Use the examination passage and its records to identify
  the intended order of aid.
- **Final Profession:** Verify the completed trial states and release the
  chapter door.
- **Exclude:** A single combat arena, supernatural judgment, living officiants,
  fantasy magic, Host growth, or a puzzle solution that depends on random luck.

Each gallery should support a relevant skill route and a physical fallback.
Failures may consume supplies or close secondary loot, but a readable recovery
path must remain.

## Runtime state

The galleries are dormant but mechanically intact enough to test the party.
Quiet Threshold accepts Stealth or Doctrine. Service accepts Engineering or the
water tally. Burden accepts Engineering or Melee. Mercy accepts Medicine or
Doctrine. Every trial also has a physical fallback that completes its main
state while closing related secondary loot.

All four completion states are required at Final Profession. The mechanism then
loads the Sealed Chapter. There is no combat, supernatural judgment, or random
solution in this level.

## Generation record

Accepted prompt contract:

```text
Create a roofless 64x48 Trial Galleries complex in the established sepia ink
planning style. Build a central Candidate Hall with four distinct wings: Quiet
Threshold with listening sentries, Trial of Service with an old pilgrim wash
room, Burden Gallery with a counterweighted reliquary frame, and Trial of Mercy
with an examination passage. Put Final Profession and the Sealed Chapter door
to the north. Use an exact numbered border. No combat arena, magic, living
priest, monster, Host growth, color, or watermark.
```
