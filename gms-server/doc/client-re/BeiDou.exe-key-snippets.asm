; BeiDou.exe key snippets
; Date: 2026-03-16
; ImageBase: 0x00400000

; ----------------------------------------------------------------------
; Central SendPacket
; VA: 0x0049637B
; ----------------------------------------------------------------------
0x0049637B: mov eax, 0xa8126c
0x00496380: call 0xa60b98
0x00496385: push ecx
0x00496386: push esi
0x00496387: push edi
0x00496388: mov edi, ecx
0x0049638A: lea esi, [edi + 0x7c]
0x0049638D: mov ecx, esi
0x00496392: call 0x403166
0x00496397: mov eax, dword ptr [edi + 8]
0x004963A8: cmp dword ptr [edi + 0x14], ecx
0x004963C6: call 0x6ecb27

; ----------------------------------------------------------------------
; Central ProcessPacket dispatcher
; VA: 0x004965F1
; ----------------------------------------------------------------------
0x004965F1: mov eax, 0xa812b0
0x004965F6: call 0xa60b98
0x00496618: mov ecx, esi
0x0049661A: call 0x42470c
0x0049661F: movzx eax, ax
0x00496624: sub ecx, 0x10
0x00496627: je 0x49669c
0x0049663A: cmp eax, 0x1d
0x0049663D: jl 0x496653
0x0049663F: cmp eax, 0x7c
0x00496642: jg 0x496653
0x00496644: mov ecx, dword ptr [0xbe7918]
0x0049664A: push esi
0x0049664B: push eax
0x0049664C: call 0xa07a08

; ----------------------------------------------------------------------
; MOVE_PLAYER wrapper
; VA: 0x00518126 -> 0x00518147
; ----------------------------------------------------------------------
0x00518126: push 0x7b
0x00518128: lea ecx, [ebp - 0x1c]
0x0051812B: call 0x6ec9ce
0x00518130: push 0x29
0x00518132: lea ecx, [ebp - 0x1c]
0x00518138: call 0x406549
0x0051813D: mov ecx, dword ptr [0xbe7914]
0x00518143: lea eax, [ebp - 0x1c]
0x00518146: push eax
0x00518147: call 0x49637b

; ----------------------------------------------------------------------
; MOVE_PLAYER richer wrapper
; VA: 0x009CBB2A -> 0x009CBB81
; ----------------------------------------------------------------------
0x009CBB2A: push 0x29
0x009CBB2C: lea ecx, [ebp - 0x28]
0x009CBB2F: call 0x6ec9ce
0x009CBB45: push dword ptr [ebp - 0x10]
0x009CBB48: lea ecx, [ebp - 0x28]
0x009CBB4B: call 0x406549
0x009CBB50: call 0x437a0c
0x009CBB55: push dword ptr [eax + 0x7b0]
0x009CBB5B: lea ecx, [ebp - 0x28]
0x009CBB5E: call 0x4065a6
0x009CBB77: mov ecx, dword ptr [0xbe7914]
0x009CBB7D: lea eax, [ebp - 0x28]
0x009CBB80: push eax
0x009CBB81: call 0x49637b

; ----------------------------------------------------------------------
; RANGED_ATTACK wrapper
; VA: 0x009501AE -> 0x009501E1
; ----------------------------------------------------------------------
0x009501AE: push 0x7b
0x009501B0: lea ecx, [ebp - 0x3c]
0x009501B3: call 0x6ec9ce
0x009501B8: push 0x2d
0x009501BA: lea ecx, [ebp - 0x3c]
0x009501C1: call 0x406549
0x009501C6: mov eax, dword ptr [ebp - 0x2c]
0x009501C9: push dword ptr [eax + 0x88]
0x009501CF: lea ecx, [ebp - 0x3c]
0x009501D2: call 0x4065a6
0x009501D7: mov ecx, dword ptr [0xbe7914]
0x009501DD: lea eax, [ebp - 0x3c]
0x009501E0: push eax
0x009501E1: call 0x49637b

; ----------------------------------------------------------------------
; MAGIC_ATTACK wrapper A
; VA: 0x005194AF -> 0x005194E8
; ----------------------------------------------------------------------
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

; ----------------------------------------------------------------------
; MAGIC_ATTACK wrapper B
; VA: 0x0047342F -> 0x004734AA
; ----------------------------------------------------------------------
0x00473453: push 0x2e
0x00473455: lea ecx, [ebp - 0x1c]
0x0047345C: call 0x406549
0x00473461: push dword ptr [ebp + 8]
0x00473464: lea ecx, [ebp - 0x1c]
0x00473467: call 0x4065a6
0x00473481: call 0x46f3cf
0x0047349B: call 0x46f3cf
0x004734A0: mov ecx, dword ptr [0xbe7914]
0x004734A6: lea eax, [ebp - 0x1c]
0x004734A9: push eax
0x004734AA: call 0x49637b

; ----------------------------------------------------------------------
; Shared action opcode mapper
; VA: 0x00451CB5
; ----------------------------------------------------------------------
0x00451CB5: push 0x2d
0x00451CBA: push 0x2c
0x00451CBE: push 0x2b
0x00451CC2: push 0x2a
0x00451CC6: push 0x29
0x00451CCA: push 0x1d
0x00451CCE: push 0x28

; ----------------------------------------------------------------------
; Shared action selector
; VA: 0x00451E4C
; ----------------------------------------------------------------------
0x00451E4C: push dword ptr [esp + 0xc]
0x00451E54: mov eax, dword ptr [esi + 0x4e8]
0x00451E5B: call 0x451ec8
0x00451E70: call 0x451b6a

; ----------------------------------------------------------------------
; Shared action sender path
; VA: 0x00453AD1
; ----------------------------------------------------------------------
0x00453B08: mov ecx, edi
0x00453B0A: call 0x451e4c
0x00453B0F: mov ebx, eax
0x00453B6D: lea eax, [eax + ebx*4 + 0x520]

; ----------------------------------------------------------------------
; SPECIAL_MOVE wrapper
; VA: 0x00969D76 -> 0x00969DDB
; ----------------------------------------------------------------------
0x00969D76: push 0x5b
0x00969D78: lea ecx, [ebp - 0x20]
0x00969D7B: call 0x6ec9ce
0x00969D87: call 0x987257
0x00969D8D: lea ecx, [ebp - 0x20]
0x00969D90: call 0x4065a6
0x00969D95: push dword ptr [ebx]
0x00969D97: lea ecx, [ebp - 0x20]
0x00969D9A: call 0x4065a6
0x00969D9F: push dword ptr [ebp + 0xc]
0x00969DA2: lea ecx, [ebp - 0x20]
0x00969DA5: call 0x406549
0x00969DD1: mov ecx, dword ptr [0xbe7914]
0x00969DD7: lea eax, [ebp - 0x20]
0x00969DDA: push eax
0x00969DDB: call 0x49637b
