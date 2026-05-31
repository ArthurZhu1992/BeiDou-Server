# BeiDou.exe Static Analysis

Date: 2026-03-16

Target:
- `D:\application\MapleStory-Client-V83\BeiDou.exe`

Method:
- Static PE inspection with `pefile`
- Instruction-level disassembly with `capstone`
- Validation anchored on known hook addresses from `C:\Users\86462\CLionProjects\BeiDou-ijl15\ezorsia`

Assumption:
- `BeiDou.exe` is the renamed client main binary and uses the normal `0x00400000` image base.

## PE Basics

- ImageBase: `0x00400000`
- EntryPoint VA: `0x00A63FF3`
- Main code section: `.text` at `0x00401000`

Key imports include:
- `ijl15.dll`
- `nmcogame.dll`
- `ws2_32.dll`
- `wininet.dll`

Conclusion:
- The client patch layer is not purely source-visible in `ijl15.dll`; `BeiDou.exe` must be treated as an independent analysis target.
- At the same time, `ijl15.dll` is still an external imported module, not statically merged into the main EXE.

## Verified Core Network Functions

The hook addresses used by the plugin source are valid and point to real central packet functions inside `BeiDou.exe`.

### `0x0049637B` Central SendPacket

- Cross-references found in `.text`: `486`
- This is not a one-off helper; it is a central outgoing packet sender.

Snippet:

```asm
0x0049637B: mov eax, 0xa8126c
0x00496380: call 0xa60b98
0x00496385: push ecx
0x00496386: push esi
0x00496387: push edi
0x00496388: mov edi, ecx
...
0x004963C6: call 0x6ecb27
```

### `0x004965F1` Central ProcessPacket Dispatcher

- Cross-references found in `.text`: `1` direct wrapper entry
- This function reads packet opcode and dispatches by opcode range / special cases.

Snippet:

```asm
0x004965F1: mov eax, 0xa812b0
0x004965F6: call 0xa60b98
...
0x00496618: mov ecx, esi
0x0049661A: call 0x42470c
0x0049661F: movzx eax, ax
0x00496624: sub ecx, 0x10
...
0x0049663A: cmp eax, 0x1d
0x0049663D: jl 0x496653
0x0049663F: cmp eax, 0x7c
0x00496642: jg 0x496653
0x00496644: mov ecx, dword ptr [0xbe7918]
0x0049664A: push esi
0x0049664B: push eax
0x0049664C: call 0xa07a08
```

Interpretation:
- The plugin hook points chosen in `SelectCharMacFix.cpp` and `HpMpAlert.cpp` are attached to real shared packet paths.
- This validates the source-based claim that the plugin only hooks generic packet I/O, not a private fake path.

## Verified Outgoing Packet Wrappers

The following wrappers were confirmed by direct disassembly around calls into `0x0049637B`.

### `MOVE_PLAYER (0x29)`

Two confirmed wrappers were found.

Simple wrapper:

```asm
0x00518126: push 0x7b
0x00518128: lea ecx, [ebp - 0x1c]
0x0051812B: call 0x6ec9ce
0x00518130: push 0x29
0x00518132: lea ecx, [ebp - 0x1c]
0x00518135: mov dword ptr [ebp - 4], edi
0x00518138: call 0x406549
0x0051813D: mov ecx, dword ptr [0xbe7914]
0x00518143: lea eax, [ebp - 0x1c]
0x00518146: push eax
0x00518147: call 0x49637b
```

Richer movement wrapper:

```asm
0x009CBB2A: push 0x29
0x009CBB2C: lea ecx, [ebp - 0x28]
0x009CBB2F: call 0x6ec9ce
...
0x009CBB45: push dword ptr [ebp - 0x10]
0x009CBB48: lea ecx, [ebp - 0x28]
0x009CBB4B: call 0x406549
0x009CBB50: call 0x437a0c
0x009CBB55: push dword ptr [eax + 0x7b0]
0x009CBB5B: lea ecx, [ebp - 0x28]
0x009CBB5E: call 0x4065a6
...
0x009CBB81: call 0x49637b
```

Interpretation:
- Movement is definitely sent as an independent packet family.
- This matters for `DISTANCE_HACK`: the server cannot assume the attack handler always sees a fully synchronized, same-tick movement state.

### `RANGED_ATTACK (0x2D)`

Confirmed wrapper:

```asm
0x009501AE: push 0x7b
0x009501B0: lea ecx, [ebp - 0x3c]
0x009501B3: call 0x6ec9ce
0x009501B8: push 0x2d
0x009501BA: lea ecx, [ebp - 0x3c]
0x009501BD: mov byte ptr [ebp - 4], 3
0x009501C1: call 0x406549
0x009501C6: mov eax, dword ptr [ebp - 0x2c]
0x009501C9: push dword ptr [eax + 0x88]
0x009501CF: lea ecx, [ebp - 0x3c]
0x009501D2: call 0x4065a6
0x009501D7: mov ecx, dword ptr [0xbe7914]
0x009501DD: lea eax, [ebp - 0x3c]
0x009501E0: push eax
0x009501E1: call 0x49637b
```

### `MAGIC_ATTACK (0x2E)`

Confirmed wrapper A:

```asm
0x005194C6: push 0x7b
0x005194C8: lea ecx, [ebp - 0x1c]
0x005194CB: call 0x6ec9ce
0x005194D4: push 0x2e
0x005194D6: lea ecx, [ebp - 0x1c]
0x005194D9: call 0x406549
0x005194DE: mov ecx, dword ptr [0xbe7914]
0x005194E4: lea eax, [ebp - 0x1c]
0x005194E7: push eax
0x005194E8: call 0x49637b
```

Confirmed wrapper B:

```asm
0x00473453: push 0x2e
0x00473455: lea ecx, [ebp - 0x1c]
0x00473458: mov byte ptr [ebp - 4], 2
0x0047345C: call 0x406549
0x00473461: push dword ptr [ebp + 8]
0x00473464: lea ecx, [ebp - 0x1c]
0x00473467: call 0x4065a6
...
0x004734A0: mov ecx, dword ptr [0xbe7914]
0x004734A6: lea eax, [ebp - 0x1c]
0x004734A9: push eax
0x004734AA: call 0x49637b
```

Interpretation:
- `MAGIC_ATTACK` is sent through normal central packet machinery.
- In the inspected wrappers, there is no local mob bbox or skill bbox comparison before the send.
- No client-side validation equivalent to the server's `DISTANCE_HACK` check was found in these paths.

### `SPECIAL_MOVE (0x5B)`

Several wrappers were found, for example:

```asm
0x00969D76: push 0x5b
0x00969D78: lea ecx, [ebp - 0x20]
0x00969D7B: call 0x6ec9ce
...
0x00969DD1: mov ecx, dword ptr [0xbe7914]
0x00969DD7: lea eax, [ebp - 0x20]
0x00969DDA: push eax
0x00969DDB: call 0x49637b
```

Interpretation:
- Movement-adjacent action packets are also independent sends.
- This further supports the timing-risk model: move / special-move / attack are not a single atomic client packet.

## Close-Range / Shared Action Opcode Mapper

I did not find a simple `push 0x2c -> call 0x406549 -> call 0x49637B` wrapper matching the shape above.

However, I did confirm a shared opcode mapper:

```asm
0x00451CB5: push 0x2d
0x00451CB7: pop eax
0x00451CB8: pop esi
0x00451CB9: ret
0x00451CBA: push 0x2c
0x00451CBC: jmp 0x451cb7
0x00451CBE: push 0x2b
0x00451CC0: jmp 0x451cb7
0x00451CC2: push 0x2a
0x00451CC4: jmp 0x451cb7
0x00451CC6: push 0x29
0x00451CC8: jmp 0x451cb7
0x00451CCA: push 0x1d
0x00451CCC: jmp 0x451cb7
0x00451CCE: push 0x28
0x00451CD0: jmp 0x451cb7
```

And an upstream shared action-state selector:

```asm
0x00451E4C: push dword ptr [esp + 0xc]
0x00451E52: mov esi, ecx
0x00451E54: mov eax, dword ptr [esi + 0x4e8]
0x00451E5A: push eax
0x00451E5B: call 0x451ec8
...
0x00451E70: call 0x451b6a
```

And a larger shared action sender path:

```asm
0x00453B08: mov ecx, edi
0x00453B0A: call 0x451e4c
0x00453B0F: mov ebx, eax
...
0x00453B6D: lea eax, [eax + ebx*4 + 0x520]
```

Interpretation:
- `CLOSE_RANGE_ATTACK (0x2C)` appears to be handled through a shared action sender family instead of the simpler direct wrapper shape found for `0x2D` and `0x2E`.
- This does not change the high-level conclusion: attack opcodes are centrally selected and serialized, then sent through the same `0x0049637B` sender.

## Hardcoded Skill IDs Found in `.text`

The following skill IDs were found in code:

- `2001005` (`Magic Claw`)
- `2101004`
- `2201004`
- `2201005`

Representative snippets:

```asm
0x007658EA: cmp eax, 0x1e886c
0x007658EF: cmp eax, 0x1e886d
...
0x00967CAC: mov eax, 0x20361e
0x00967CB1: cmp esi, eax
...
0x00955D24: cmp eax, 0x20361a
...
0x009826E8: cmp eax, 0x20361a
```

Important note:
- These hits prove the EXE does contain skill-specific logic tables.
- But in the inspected regions, these tables were not tied to socket send / receive logic and did not show mob-distance or bbox validation.
- Based on current static evidence, these are more likely local skill classification / effect / action dispatch tables than anti-cheat distance logic.

## What This Validates

### Validated

- `BeiDou.exe` really contains the central packet paths used by the plugin hook addresses.
- `MOVE_PLAYER`, `RANGED_ATTACK`, `MAGIC_ATTACK`, and `SPECIAL_MOVE` are sent as separate packet families.
- `MAGIC_ATTACK (0x2E)` is sent through ordinary client packet builders; no inspected wrapper performed local mob-distance validation.
- `ijl15.dll` is imported externally; the plugin is not hidden as a statically merged code blob.

### Not Found

- No inspected attack-send path showed a client-side `mob bbox`, `skill bbox`, or `distance to mob` check comparable to the server-side `DISTANCE_HACK`.
- No evidence was found in the inspected EXE packet-send paths that `Magic Claw (2001005)` has a dedicated hardcoded local distance override.

### Still Not Fully Proven

- This pass is static RE, not full dynamic tracing.
- I did not reconstruct every caller of the shared action sender path.
- I did not prove that no other code path in the client mutates attack payloads before send; only that the inspected central wrappers do not show a distance-check implementation.

## Practical Conclusion For This Bug

The EXE analysis strengthens the server-side root-cause conclusion:

- Client movement and attack are separate packets.
- Client attack wrappers inspected here do not show local mob-distance / bbox validation.
- Therefore, the server's current `DISTANCE_HACK` design remains the most credible root cause:
  - skill bbox missing for `Magic Claw`
  - small mobs falling back to center-point distance
  - attack timing potentially racing against movement synchronization

In short:
- The EXE analysis did not overturn the earlier server-side diagnosis.
- It reduced the likelihood that `BeiDou.exe` itself is doing some hidden `Magic Claw`-specific distance rewrite.

## Reuse Notes

When continuing this analysis later, start from these addresses:

- Sender: `0x0049637B`
- Receiver dispatcher: `0x004965F1`
- Shared action opcode mapper: `0x00451CB5`
- Shared action selector: `0x00451E4C`
- Shared action sender path: `0x00453AD1`
- Move packet wrappers: `0x005180A0`, `0x009CBB2A`
- Ranged attack wrapper: `0x009501AE`
- Magic attack wrappers: `0x005194AF`, `0x0047342F`
- Special move wrappers: `0x00969D76`, `0x0096A5C4`, `0x0096A77B`, `0x0096B34A`, `0x0096C62A`

Recommended next step if deeper certainty is needed:
- Add runtime packet tracing around `0x0049637B` in map phase and capture real `0x29 / 0x2D / 0x2E / 0x5B` packet bodies during movement + attack sequences.
