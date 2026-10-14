# Why Deleting a File Doesn't Erase It: script editorial and research handoff

**Bits in Motion · Episode 06 · prepared 2026-10-11**

Files:
- `script_voiceover.txt`: clean narration. The paragraph map in section D is generated from it, so the two are identical in text and order.
- This file.

> **Lock note:** once you record the voiceover and generate the word-by-word transcript, this script is locked. Any content change needs an explicitly revised script and new audio. The editor must not silently rewrite or retime the recorded version.

> **Process note:** one editor wrote this under a 35-minute budget, with no sub-agents and focused searches only. It went through one draft, one adversarial fact-check pass against opened sources, and one targeted revision. Section F holds a single **self-score**, which is the editor's own judgment and **not** an independent review. No audio was listened to; the spoken-language check is text-based.

---

## A. Decision brief

**Recommended title:** Why Deleting a File Doesn't Erase It

The premise is true and needs no correction. On NTFS, deleting a file marks its Master File Table entry and its clusters as free and leaves the data in place (C05–C07). The narration answers the "GONE?" question in P02: "On a hard drive, not yet. On an SSD, probably, but not certainly." P22 lands the title line: "Delete doesn't erase. Delete crosses out the index card."

**Alternative titles (both honest)**
1. Delete Doesn't Erase: Where a Deleted File Really Goes
2. Is a Deleted File Really Gone? Hard Drive vs SSD

**Viewer promise:** Follow one deleted photo's actual bytes on a Windows PC to see why a hard drive keeps them until they're overwritten, why an SSD usually clears them away on its own, and what actually erases a file when you want it gone.

**Selected angle: "the card and the boxes, and who controls the boxes."**
- **One scenario carries the episode.** You delete a photo of your passport and empty the Recycle Bin. The episode follows that photo's bytes: Recycle Bin (P03), card and clusters (P05–P07), recovery (P08–P09), the SSD's TRIM and housekeeping (P11–P14), deliberate erasing (P16–P19), encryption (P20), and back to the passport photo for the advice (P21).
- **One metaphor, announced before it is used (P04):** a wall of numbered **storage boxes** (clusters) and a drawer of **index cards** (Master File Table entries). It matches the "DELETE ≠ ERASE" thumbnail art, which shows a card tray hovering over a grid of blocks. Its limit is stated aloud in P06: small files can live entirely on their card. The SSD section extends it: on an SSD the box numbers are labels, and the drive decides where each label physically points (P17).
- **Second-half shape: cause → consequence → surprise → payoff.**
  - *Cause:* flash can't write over old data (P11), and the drive can't read the cards (P12).
  - *Consequence:* TRIM plus background housekeeping erase deleted data (P13–P14).
  - *Surprise:* the same drive resists deliberate overwriting (P15–P18, "the strange reversal").
  - *Payoff:* ask the drive to erase itself, or encrypt from the start (P19–P20), then the practical advice and the title line (P21–P22).
- **Technical-term budget: 5 named terms, each defined where it first appears, in separate sentences.** They are file system (with NTFS as its name), clusters, Master File Table, TRIM and BitLocker; device encryption is introduced as "a version of it". The editor deliberately did **not** name garbage collection (it's called "housekeeping"), wear levelling ("so that no part of the flash wears out first"), over-provisioning ("spare space that Windows can't see"), the flash translation layer ("labels"), the controller ("the chip that runs the drive"), cryptographic erase ("destroying the key") or RAID ("certain multi-drive arrays"). NIST is glossed as "the US standards agency".

Angles considered:
- **"Recovery tools exposed / your deleted files can be stolen" (fear angle).** Rejected: it invents stakes, and on many SSDs it's often false.
- **"HDD vs SSD spec comparison."** Rejected as the spine: it becomes a list. Kept as the split-compare visual device.
- **Follow one photo through references and blocks (selected).** It's concrete, it answers both thumbnails, and it produces a genuine reversal: the SSD erases what you want back and resists erasing what you want gone.

**Technical scope**
- **In:** Windows PCs; NTFS (Microsoft: "the default file system for modern Windows-based operating system"); the Recycle Bin and Shift+Delete; the MFT entry and cluster map on delete; Windows File Recovery's modes; TRIM (Windows "delete notifications"); SSD erase-before-write and background cleanup; the 2011 King & Vidas measurements; NIST SP 800-88 Rev. 2 (September 2025) on overwriting, flash and sanitize commands; Crucial Storage Executive as one example tool; BitLocker and device encryption; `cipher /w`; Reset this PC with Clean data.
- **Hedged aloud:** "usually" for Delete moving to the bin (P03); "the card usually stays" (P07); "depends on the drive", "a snapshot, not a rule" (P14); "can land somewhere fresh" (P17); "if it was on when your photo was saved" and "once your PC has started" (P20); Microsoft's own caveat on Clean data (P21).
- **Out (deliberately):** other copies of the photo, such as OneDrive or cloud sync, File History or backups, restore points or shadow copies, thumbnail caches and app caches. P21 points to these only as "your backups"; see the limitations in F. Also out: macOS, Linux, phones, FAT32/exFAT USB sticks (no Recycle Bin on many removable drives, and TRIM behaviour differs), SMR hard drives, hybrid drives, NVMe-versus-SATA command names, and the specific "read zeros after TRIM" behaviour (not verified, not claimed).
- **Hypothetical framing:** the passport photo is an illustrative scenario. No test was run, and none is claimed.

**Thumbnail recommendation: "DELETE ≠ ERASE"** (`Thumbnails and Banners\Delete Doesn’t Erase_ References and Storage Blocks.png`).
- The image is the episode's mental model: a tray of index cards above a grid of storage blocks, with one card lifted and a cyan beam to the blocks it points to, and a hard drive beside them. P04–P07 narrate exactly that picture, and P22 lands the line.
- Caution: the art shows the blocks lighting up, not being emptied. That fits the hard-drive half (the data stays). V5 and V10 carry the SSD half.

**A/B alternative: "GONE?"** (`Thumbnails and Banners\Gone_ Inside a deleted file.png`): a fading file icon linked by a cyan trace to a hard-drive platter with a callout of glowing blocks. It is honest for the hard-drive half and is answered in P02. It shows only a hard drive, so it under-sells the SSD reversal; that's acceptable because the question mark leaves room for P02's "On an SSD, probably".
- Other files seen by name only, not opened: `Gone_ Inside a hard drive.png`, `Broken cyan link over a hard drive.png`, `Deleted file, uncertain data.png`, and in `New folder\`: `Delete ≠ erase_ file layers.png`, `Where deleted files really go.png`, `Vanished file, lingering data.png`, `Deleted Data, Reused Space.png`. Check them before use.

**Length:** 1,604 words after the independent fact-check edits (wc count; was 1,590; target 1,550–1,650).
- **Estimated duration** (word count ÷ a planning pace, not measured audio): 9:05 at 175 wpm, 10:15 at 155 wpm, 10:58 at 145 wpm.
- If you need to cut: drop P15's second sentence or P19's NIST sentence; no later line depends on either.

---

## B. Final voiceover script

The clean copy is saved as `script_voiceover.txt`. Numbers are written for speech ("two thousand eleven", "sixteen"). UI and command names are spoken as they appear: "Shift plus Delete", "Windows File Recovery", "Sanitize Drive", "Storage Executive", "cipher command, with the slash W option", "Reset this PC", "Clean data".

```text
You delete a photo of your passport. You empty the Recycle Bin, and as far as Windows is concerned, it's gone. But on a hard drive, every byte of that photo is still sitting exactly where it was. Windows only crossed out the note that said where to find it. On an SSD, the photo may really disappear soon after. But not because Windows erased it. The drive cleans up later, on its own schedule.

So is it gone? On a hard drive, not yet. On an SSD, probably, but not certainly. Let's follow that one photo's bytes, first on a hard drive, then on an SSD, on a Windows PC. Along the way, you'll see why recovery tools work, why they sometimes fail, and what actually erases a file when you want it gone for good.

Start with the first click. On your PC's own drive, pressing Delete usually doesn't remove anything. Windows moves the photo into the Recycle Bin, a holding folder, with every byte intact. That's why you can restore it. The real question starts when you empty the bin, or skip it with Shift plus Delete.

To see what happens then, we need a picture of how Windows keeps track of files. Imagine a huge wall of numbered storage boxes, all the same size. Next to it sits a drawer of index cards. The boxes hold the data. The cards say which boxes belong to which file.

That whole arrangement is a file system: the set of rules a computer uses to organize a drive. On a modern Windows PC, the default is one called NTFS. The storage boxes are real. NTFS divides the drive into equal-sized blocks, which Windows calls clusters. Your photo is far too big for one box, so its bytes are spread across many clusters.

The index cards are real too. NTFS keeps a special file called the Master File Table, with at least one entry for every file on the drive. Your photo's entry holds its name, its size, its dates, and directions to the clusters where its bytes live. To open the photo, Windows reads the card, then goes to those boxes. The picture has one limit: a very small file can fit entirely on its card, with no boxes at all. Your photo isn't that small.

Now empty the Recycle Bin. Here's what NTFS actually does. It marks your photo's card as free, so a future file can reuse it. Then, in a separate map that tracks which boxes are taken, it marks the photo's clusters as available. And that's it. Nothing opens the boxes. The photo's bytes stay exactly where they were, and the card usually stays in the drawer too, just flagged as unused. Updating a couple of records is quick. Rewriting every box the photo used would take far longer, and on a hard drive, that space can simply be written over later.

That's exactly why recovery tools work. Microsoft's own Windows File Recovery page puts it plainly: the space used by a deleted file is marked as free, but the file data can still exist and be recovered. A tool can read the cards flagged as unused, follow their directions, and copy the bytes back out. If a card has already been reused, some tools scan the boxes themselves, looking for the distinctive header that marks the start of a photo or document.

It's also why they fail. Free means free. The next time Windows needs space, for a download, an update, even a temporary file, it can write straight over those boxes. Microsoft warns that any use of your computer can create files that overwrite that space at any time. So recovery is a race, and every write to that drive is a chance to lose it.

So on a hard drive, deleted means unlisted, not erased. You might expect an SSD to behave the same way. Same Windows, same file system, same index cards. But underneath, the storage wall works very differently.

An SSD stores data in flash memory, and flash has a rule a hard drive doesn't. It can't simply write over old data. A spot has to be erased before anything new can go there. If the drive did that erasing only at the moment you saved something, writes would slow down. So the drive does its housekeeping in the background, clearing out space before it's needed.

But there's a catch. The SSD doesn't read the index cards. As far as the drive knows, the boxes your photo used are still full of data someone wants. So Windows sends it a short note, called TRIM, listing the clusters that were just freed by a delete. On NTFS, Windows turns this on by default, for drives that support it.

So think about what the drive does with that note. It now knows those boxes are disposable, and it prefers to clear space ahead of time. When it finds a convenient moment, its housekeeping erases them. And once that happens, your photo isn't just unlisted. It's gone, and there's nothing left for a recovery tool to find.

How fast, and how completely? That depends on the drive. In a study published in two thousand eleven, researchers at Carnegie Mellon tested sixteen SSDs. With TRIM off, nearly all deleted data could be recovered. With TRIM on, at most about a quarter of the blocks survived, depending on who made the chip that runs the drive. Drives have changed since then, so treat that as a snapshot, not a rule. And TRIM doesn't always get through. Some setups, like certain multi-drive arrays, never pass it on.

So the SSD sounds like the better shredder. Here's the twist. Try to erase something on purpose, and the SSD gets in your way.

On a hard drive, deliberate erasing is simple. Write new data over every free box, and the old bytes are replaced in place. NIST, the US standards agency, says in its media sanitization guidelines that overwriting typically hinders recovery, even with state-of-the-art laboratory techniques.

So what happens if you try the hard-drive method on an SSD, and write over the photo's boxes yourself? On an SSD, the box numbers Windows sees are really just labels. Behind the wall, the drive decides which physical spot each label points to, and it keeps moving data around so that no part of the flash wears out first. It also keeps spare space that Windows can't see or address at all. So when you write over a file, your new data can land somewhere fresh, while old copies sit in places you can't reach. NIST makes exactly this point: on flash storage with spare cells and that kind of wear spreading, a user can't reach every place old data was stored by simply writing over it.

That's the strange reversal. The SSD tends to destroy the files you'd like back, and resists you when you try to destroy them yourself. Both come from the same fact: on an SSD, the drive, not Windows, decides where your bytes physically live.

So the reliable way to wipe an SSD is to ask the drive itself. Drive makers ship tools that send a built-in erase command. Crucial's Storage Executive, for example, has a Sanitize Drive function. NIST's guidelines say dedicated sanitize commands like this can reach all of a drive's storage areas more effectively than overwriting, though you are trusting the manufacturer to have built them correctly.

There's an even better move, and it works before you delete anything: encryption. BitLocker, built into many editions of Windows, encrypts the whole drive with a key. If it was on when your photo was saved, then every block, including leftovers and old copies the SSD shuffled away, is scrambled. Someone who pulls the drive out and reads it without the key gets noise. That's also why NIST counts destroying the key, under the right conditions, as a fast way to sanitize a drive. Microsoft describes BitLocker as protection for lost, stolen, or decommissioned devices. Many newer Windows PCs turn on a version of it, called device encryption, automatically, so it's worth checking in Settings whether yours is on. One limit: once your PC has started, Windows reads the drive normally, so encryption won't stop a recovery tool running on your own PC.

So, back to the passport photo. If you deleted something by accident, check the Recycle Bin and your backups first. If it's not there, stop using that drive as much as you can, and recover onto a different drive, because every new write can land on the old boxes. On an SSD with TRIM, be prepared for it to be gone. If you want it gone for good on a hard drive, overwrite the free space. Windows' built-in cipher command, with the slash W option, does exactly that. Before you sell or give away a PC, Microsoft recommends Reset this PC with Clean data turned on, though it notes this isn't built to government erasure standards. To wipe a whole SSD before it leaves your hands, use the drive maker's sanitize tool. And keep encryption on from day one, with its recovery key saved somewhere safe.

Delete doesn't erase. Delete crosses out the index card. What happens to the boxes depends on who controls them. On a hard drive, nothing happens until something new is written there. On an SSD, the drive decides, on its own schedule. If you need the data truly gone, don't leave it to either. Use a command that reaches every box, or make sure the boxes were unreadable from the start.
```

---

## C. Hook comparison

Each hook is scored 0–5 on clarity (Cl), curiosity (Cu), truthful promise (Tr), spoken naturalness (Sp) and visual opportunity (Vi). These are editorial judgments, not audience measurements and not an independent judge.

| # | Approach | Opening | Cl | Cu | Tr | Sp | Vi | Total | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| H-A | Visual contradiction (hard drive vs SSD) | "You delete a photo of your passport. You empty the Recycle Bin ... on a hard drive, every byte of that photo is still sitting exactly where it was ... On an SSD, the photo may really disappear soon after. But not because Windows erased it." | 5 | 5 | 5 | 4 | 5 | **24** | **Selected** (P01). No numbers; the answer to "GONE?" follows in P02. |
| H-B | Small demonstration | "Delete a file, empty the bin, then run Microsoft's own recovery tool on the same drive, and there it is. Do the same on many SSDs, and there's nothing to find." | 5 | 4 | 3 | 5 | 4 | 21 | Implies a test we didn't run, and "nothing to find" overstates the SSD case. |
| H-C | Specific question | "When you empty the Recycle Bin, what actually happens to the photo's bytes? Not much. Windows changes two small records and leaves the photo where it was." | 4 | 4 | 5 | 5 | 3 | 21 | Clear, but covers only the hard-drive half. Its idea survives as P07. |
| H-D | Surprising consequence | "Your SSD is better at destroying files you want back than files you want gone." | 4 | 5 | 4 | 5 | 3 | 21 | A strong line, but abstract as an opening. It became the P18 reversal. |
| H-E | Familiar frustration / fear | "Sold an old laptop? Your deleted files might have gone with it." | 4 | 5 | 2 | 5 | 3 | 19 | **Disqualified:** fear framing, and often untrue for TRIM-enabled SSDs or encrypted drives. |

Full alternative openings:
- **H-B:** "Delete a file, empty the bin, then point Microsoft's own recovery tool at the same hard drive, and there it is, intact. Try the same thing on many SSDs, and there's nothing left to find. Same Windows, same delete key. The difference is who controls the storage underneath."
- **H-C:** "When you empty the Recycle Bin, what actually happens to the photo's bytes? Almost nothing. Windows changes two small records, one saying the file exists and one saying its space is taken, and leaves the photo exactly where it was."
- **H-D:** "Your SSD is better at destroying the files you want back than the files you want gone. To see why, follow one deleted photo, first on a hard drive and then on an SSD, all the way down to the storage blocks."
- **H-E:** "Sold an old laptop? Your deleted files might have gone with it. Deleting doesn't erase anything; it just hides the file from Windows."

**Why H-A won:** it's the only hook with a picturable contrast (same delete, two different fates) that also previews the twist without a number. Its last line ("The drive cleans up later, on its own schedule") sets up the P12–P13 mechanism. Spoken naturalness is 4 because "as far as Windows is concerned" and the two short "But..." sentences need a confident read.

---

## D. Editorial handoff

### Paragraph-numbered narration (identical to the voiceover, in the same order)

Start times are **estimates** from word count at 150 words per minute, not measured audio. Claim IDs refer to the ledger in section E, and visual IDs to the beats below.

#### P01 - Gone, or not?
> You delete a photo of your passport. You empty the Recycle Bin, and as far as Windows is concerned, it's gone. But on a hard drive, every byte of that photo is still sitting exactly where it was. Windows only crossed out the note that said where to find it. On an SSD, the photo may really disappear soon after. But not because Windows erased it. The drive cleans up later, on its own schedule.

*Estimated start 0:00 (at 150 wpm) · 75 words · Claims: C00, C06, C12, C25 · Visual: V1*

#### P02 - The short answer and the route
> So is it gone? On a hard drive, not yet. On an SSD, probably, but not certainly. Let's follow that one photo's bytes, first on a hard drive, then on an SSD, on a Windows PC. Along the way, you'll see why recovery tools work, why they sometimes fail, and what actually erases a file when you want it gone for good.

*Estimated start 0:30 (at 150 wpm) · 62 words · Claims: C25 · Visual: V1*

#### P03 - The Recycle Bin is a move
> Start with the first click. On your PC's own drive, pressing Delete usually doesn't remove anything. Windows moves the photo into the Recycle Bin, a holding folder, with every byte intact. That's why you can restore it. The real question starts when you empty the bin, or skip it with Shift plus Delete.

*Estimated start 0:55 (at 150 wpm) · 53 words · Claims: C01 · Visual: V2*

#### P04 - Boxes and index cards
> To see what happens then, we need a picture of how Windows keeps track of files. Imagine a huge wall of numbered storage boxes, all the same size. Next to it sits a drawer of index cards. The boxes hold the data. The cards say which boxes belong to which file.

*Estimated start 1:16 (at 150 wpm) · 51 words · Claims: C02 · Visual: V3*

#### P05 - File system, NTFS, clusters
> That whole arrangement is a file system: the set of rules a computer uses to organize a drive. On a modern Windows PC, the default is one called NTFS. The storage boxes are real. NTFS divides the drive into equal-sized blocks, which Windows calls clusters. Your photo is far too big for one box, so its bytes are spread across many clusters.

*Estimated start 1:36 (at 150 wpm) · 62 words · Claims: C03 · Visual: V3*

#### P06 - The Master File Table
> The index cards are real too. NTFS keeps a special file called the Master File Table, with at least one entry for every file on the drive. Your photo's entry holds its name, its size, its dates, and directions to the clusters where its bytes live. To open the photo, Windows reads the card, then goes to those boxes. The picture has one limit: a very small file can fit entirely on its card, with no boxes at all. Your photo isn't that small.

*Estimated start 2:01 (at 150 wpm) · 84 words · Claims: C04 · Visual: V4*

#### P07 - What emptying the bin actually does
> Now empty the Recycle Bin. Here's what NTFS actually does. It marks your photo's card as free, so a future file can reuse it. Then, in a separate map that tracks which boxes are taken, it marks the photo's clusters as available. And that's it. Nothing opens the boxes. The photo's bytes stay exactly where they were, and the card usually stays in the drawer too, just flagged as unused. Updating a couple of records is quick. Rewriting every box the photo used would take far longer, and on a hard drive, that space can simply be written over later.

*Estimated start 2:35 (at 150 wpm) · 100 words · Claims: C05, C06, C07 · Visual: V4*

#### P08 - Why recovery tools work
> That's exactly why recovery tools work. Microsoft's own Windows File Recovery page puts it plainly: the space used by a deleted file is marked as free, but the file data can still exist and be recovered. A tool can read the cards flagged as unused, follow their directions, and copy the bytes back out. If a card has already been reused, some tools scan the boxes themselves, looking for the distinctive header that marks the start of a photo or document.

*Estimated start 3:15 (at 150 wpm) · 81 words · Claims: C08 · Visual: V5*

#### P09 - Why they fail
> It's also why they fail. Free means free. The next time Windows needs space, for a download, an update, even a temporary file, it can write straight over those boxes. Microsoft warns that any use of your computer can create files that overwrite that space at any time. So recovery is a race, and every write to that drive is a chance to lose it.

*Estimated start 3:47 (at 150 wpm) · 65 words · Claims: C09 · Visual: V5*

#### P10 - Turn to the SSD
> So on a hard drive, deleted means unlisted, not erased. You might expect an SSD to behave the same way. Same Windows, same file system, same index cards. But underneath, the storage wall works very differently.

*Estimated start 4:13 (at 150 wpm) · 36 words · Claims: C25 · Visual: V6*

#### P11 - Flash can't write over old data
> An SSD stores data in flash memory, and flash has a rule a hard drive doesn't. It can't simply write over old data. A spot has to be erased before anything new can go there. If the drive did that erasing only at the moment you saved something, writes would slow down. So the drive does its housekeeping in the background, clearing out space before it's needed.

*Estimated start 4:28 (at 150 wpm) · 67 words · Claims: C10 · Visual: V6*

#### P12 - TRIM
> But there's a catch. The SSD doesn't read the index cards. As far as the drive knows, the boxes your photo used are still full of data someone wants. So Windows sends it a short note, called TRIM, listing the clusters that were just freed by a delete. On NTFS, Windows turns this on by default, for drives that support it.

*Estimated start 4:54 (at 150 wpm) · 61 words · Claims: C11 · Visual: V7*

#### P13 - The drive clears the boxes
> So think about what the drive does with that note. It now knows those boxes are disposable, and it prefers to clear space ahead of time. When it finds a convenient moment, its housekeeping erases them. And once that happens, your photo isn't just unlisted. It's gone, and there's nothing left for a recovery tool to find.

*Estimated start 5:19 (at 150 wpm) · 57 words · Claims: C12 · Visual: V7*

#### P14 - How fast, how complete
> How fast, and how completely? That depends on the drive. In a study published in two thousand eleven, researchers at Carnegie Mellon tested sixteen SSDs. With TRIM off, nearly all deleted data could be recovered. With TRIM on, at most about a quarter of the blocks survived, depending on who made the chip that runs the drive. Drives have changed since then, so treat that as a snapshot, not a rule. And TRIM doesn't always get through. Some setups, like certain multi-drive arrays, never pass it on.

*Estimated start 5:42 (at 150 wpm) · 87 words · Claims: C13, C14 · Visual: V8*

#### P15 - The twist
> So the SSD sounds like the better shredder. Here's the twist. Try to erase something on purpose, and the SSD gets in your way.

*Estimated start 6:16 (at 150 wpm) · 24 words · Claims: C17 · Visual: V9*

#### P16 - Hard drive: overwriting works
> On a hard drive, deliberate erasing is simple. Write new data over every free box, and the old bytes are replaced in place. NIST, the US standards agency, says in its media sanitization guidelines that overwriting typically hinders recovery, even with state-of-the-art laboratory techniques.

*Estimated start 6:26 (at 150 wpm) · 44 words · Claims: C15 · Visual: V9*

#### P17 - SSD: overwriting misses
> So what happens if you try the hard-drive method on an SSD, and write over the photo's boxes yourself? On an SSD, the box numbers Windows sees are really just labels. Behind the wall, the drive decides which physical spot each label points to, and it keeps moving data around so that no part of the flash wears out first. It also keeps spare space that Windows can't see or address at all. So when you write over a file, your new data can land somewhere fresh, while old copies sit in places you can't reach. NIST makes exactly this point: on flash storage with spare cells and that kind of wear spreading, a user can't reach every place old data was stored by simply writing over it.

*Estimated start 6:44 (at 150 wpm) · 128 words · Claims: C16 · Visual: V9*

#### P18 - The strange reversal
> That's the strange reversal. The SSD tends to destroy the files you'd like back, and resists you when you try to destroy them yourself. Both come from the same fact: on an SSD, the drive, not Windows, decides where your bytes physically live.

*Estimated start 7:35 (at 150 wpm) · 43 words · Claims: C17 · Visual: V9*

#### P19 - Ask the drive itself
> So the reliable way to wipe an SSD is to ask the drive itself. Drive makers ship tools that send a built-in erase command. Crucial's Storage Executive, for example, has a Sanitize Drive function. NIST's guidelines say dedicated sanitize commands like this can reach all of a drive's storage areas more effectively than overwriting, though you are trusting the manufacturer to have built them correctly.

*Estimated start 7:52 (at 150 wpm) · 65 words · Claims: C18, C19 · Visual: V10*

#### P20 - Encryption
> There's an even better move, and it works before you delete anything: encryption. BitLocker, built into many editions of Windows, encrypts the whole drive with a key. If it was on when your photo was saved, then every block, including leftovers and old copies the SSD shuffled away, is scrambled. Someone who pulls the drive out and reads it without the key gets noise. That's also why NIST counts destroying the key, under the right conditions, as a fast way to sanitize a drive. Microsoft describes BitLocker as protection for lost, stolen, or decommissioned devices. Many newer Windows PCs turn on a version of it, called device encryption, automatically, so it's worth checking in Settings whether yours is on. One limit: once your PC has started, Windows reads the drive normally, so encryption won't stop a recovery tool running on your own PC.

*Estimated start 8:18 (at 150 wpm) · 143 words · Claims: C20, C21, C22, C23 · Visual: V10*

#### P21 - Back to the passport photo
> So, back to the passport photo. If you deleted something by accident, check the Recycle Bin and your backups first. If it's not there, stop using that drive as much as you can, and recover onto a different drive, because every new write can land on the old boxes. On an SSD with TRIM, be prepared for it to be gone. If you want it gone for good on a hard drive, overwrite the free space. Windows' built-in cipher command, with the slash W option, does exactly that. Before you sell or give away a PC, Microsoft recommends Reset this PC with Clean data turned on, though it notes this isn't built to government erasure standards. To wipe a whole SSD before it leaves your hands, use the drive maker's sanitize tool. And keep encryption on from day one, with its recovery key saved somewhere safe.

*Estimated start 9:15 (at 150 wpm) · 132 words · Claims: C09, C24 · Visual: V11*

#### P22 - Delete doesn't erase
> Delete doesn't erase. Delete crosses out the index card. What happens to the boxes depends on who controls them. On a hard drive, nothing happens until something new is written there. On an SSD, the drive decides, on its own schedule. If you need the data truly gone, don't leave it to either. Use a command that reaches every box, or make sure the boxes were unreadable from the start.

*Estimated start 10:08 (at 150 wpm) · 70 words · Claims: C25 · Visual: V11*


### Question / payoff map

| Question raised | Why it matters | Where answered | Evidence or demonstration |
|---|---|---|---|
| Q1. Is the photo gone? ("GONE?") (P01) | The click promise | Short answer in P02; hard drive in P07–P09; SSD in P13–P14; closed in P22 | C05–C09, C11–C14 |
| Q2. What does Delete actually do? (P03) | The first misconception | P03 (a move), P07 (a reference change) | C01, C05–C07 |
| Q3. If the bytes stay, why can recovery fail? (P02, "why they sometimes fail") | Sets realistic expectations | P09 | C09 (Microsoft's overwrite warning) |
| Q4. Why would an SSD behave differently with the same Windows? (P10) | The pivot of the episode | P11–P13 | C10–C12 |
| Q5. "So think about what the drive does with that note." (P13, a prediction beat) | Lets the viewer predict | P13 | C12 |
| Q6. How fast and how completely? (P14) | Prevents an overclaim | P14 | C13–C14 (King & Vidas 2011; Kingston on arrays) |
| Q7. "So what happens if you try the hard-drive method on an SSD?" (P17, a prediction beat) | The surprise | P17–P18 | C16–C17 (NIST) |
| Q8. What actually erases a file? (P02) | The practical payoff | P19–P21 | C18–C24 |

Every deliberate question closes, and no sequel is promised.

### Key visual beats (Signal Atlas style)

Global look: **one persistent dark map**, the "storage wall". A grid of numbered boxes (clusters) fills the floor plane, and a drawer of index cards (MFT entries) hovers above it, echoing the "DELETE ≠ ERASE" thumbnail. The photo's bytes are **cyan "Bit" markers** inside their boxes. A **cinematic 2.5D camera** pushes between the drawer and the boxes rather than cutting away. **Split-compare panels** (left: hard drive, right: SSD) slide in from P10 on. **Real 3D hardware hero shots** open each half: a hard drive's platter and head (P05) and an M.2 SSD's flash packages (P11).

| ID | Paragraph + narration anchor | What the viewer sees | What visibly changes | What it explains | Limitation |
|---|---|---|---|---|---|
| V1 | P01 "every byte of that photo is still sitting exactly where it was" | A passport-photo thumbnail dissolves into cyan Bits that sink into a grid of boxes; the Recycle Bin empties. | Split-compare: on the hard-drive side, the Bits stay lit while a card above gets a strike-through. On the SSD side, the Bits stay lit, then a sweep wipes them a beat later. | The hook's contrast, and the "on its own schedule" timing. | Use a generic ID-photo placeholder, not a real passport. The SSD sweep's timing is illustrative. |
| V2 | P03 "Windows moves the photo into the Recycle Bin" | A File Explorer-style window (recreated). | The file icon slides into a Recycle Bin folder with its Bits still attached; "Shift + Delete" appears as a shortcut that bypasses the bin. | The bin is a move, not a deletion. | Recreated UI. Don't show the hidden $Recycle.Bin internals. |
| V3 | P04 "a huge wall of numbered storage boxes ... a drawer of index cards" | The persistent map assembles: the box wall, then the card drawer above it. | Labels appear only when P05–P06 name them: "file system: NTFS", "clusters", "Master File Table". | Builds the one metaphor before it's used. | The boxes are logical clusters, not physical platter positions; keep the grid abstract. |
| V4 | P06 "directions to the clusters" → P07 "marks your photo's card as free" | Camera pushes into the photo's card, which shows name, size, dates and a list of box numbers; cyan threads run from the card to its boxes. | On "marks ... as free" the card's flag flips to "unused" (it stays in the drawer). A thin "map of taken boxes" bar beside the wall flips the photo's boxes to "available". The Bits stay lit. | Delete changes references, not data. | Real MFT entries store cluster runs, not a list of numbers. Show P06's limit with one tiny file living entirely on its card. |
| V5 | P08 "follow their directions" → P09 "write straight over those boxes" | A recovery-tool scanner beam reads the unused card and copies the Bits out; then a second scanner sweeps the boxes for a "file header" glyph. | P09: new grey Bits (download, update, temp file) drop into some of the photo's boxes, and those boxes stop glowing cyan. | Why recovery works, and why it's a race. | Don't depict a specific third-party product. |
| V6 | P11 "It can't simply write over old data" | Hero shot: an M.2 SSD; camera dives into a flash package and back out to the SSD side of the split-compare. | A box with old Bits refuses a new Bit until it is cleared; a background "housekeeping" sweep clears boxes during idle time. | Erase before write, and why cleanup runs ahead of time. | Real flash erases in large blocks and writes in smaller pages; this is simplified to boxes. |
| V7 | P12 "Windows sends it a short note, called TRIM" | The card drawer (Windows' side) and the SSD's wall, separated by a visible boundary. | A small note glyph labelled "TRIM: these clusters freed" passes across the boundary; the photo's boxes get a "disposable" tag. P13: the housekeeping sweep erases those boxes and the Bits go dark. | The drive can't read the cards; TRIM tells it. | "Default on NTFS for drives that support it" belongs in a small caption. No exact timing. |
| V8 | P14 "at most about a quarter of the blocks survived" | Split panel: "TRIM off" (almost all Bits recoverable) vs "TRIM on" (a sparse scatter of Bits). | The scatter varies across a row of sixteen small drive icons. | The 2011 result and its variation by drive. | Label "King & Vidas, 2011, 16 SSDs". Don't imply current drives behave the same way. |
| V9 | P17 "the box numbers Windows sees are really just labels" | The SSD wall splits into a front layer of numbered labels and a hidden back layer of physical spots, plus a shaded "spare space" region Windows can't see. | An "overwrite" stream aimed at the photo's labels lands in fresh back-layer spots; the old Bits remain lit in spots nobody points to. | Why overwriting misses old copies on an SSD (NIST). | Mapping and spare space are drawn schematically, not to scale. |
| V10 | P19 "send a built-in erase command" → P20 "encrypts the whole drive" | Left: a "sanitize" pulse from the drive itself reaches every box, including the spare region. Right: every Bit on the wall turns into scrambled glyphs, and a key icon hovers. | On "destroying the key", the key dissolves and the glyphs stay unreadable. On "once your PC has started", the key slots in and Windows reads normally. | Sanitize reaches everything; encryption makes leftovers unreadable; the limit while running. | Sanitize relies on the manufacturer (say so on screen). Encryption protects only data written while it was on. |
| V11 | P22 "Delete crosses out the index card" | Camera pulls all the way out: the drawer and the wall, with the struck-through photo card. | Split-compare one last time: the hard-drive boxes still glowing, the SSD boxes cleared, and the "DELETE ≠ ERASE" title card. | The payoff and the thumbnail promise. | — |

### Pronunciation notes
- "NTFS": N-T-F-S. "NIST": "nist", one syllable. "TRIM": as the word "trim".
- "cipher command, with the slash W option": read as written.
- "BitLocker": "bit-locker".

---

## E. Evidence

### Claim ledger (matches the final narration)

Status key: **S** directly supported · **C** calculation or rounding · **I** inference (qualified) · **A** analogy or simplification · **H** hypothetical.

| ID | Para | Exact claim (as spoken) | Source and section | Date/version | Scope or limitation | Status |
|---|---|---|---|---|---|---|
| C00 | P01, P21 | The passport photo scenario | — | — | Illustrative; no test performed | H |
| C01 | P03 | "On your PC's own drive, pressing Delete usually doesn't remove anything. Windows moves the photo into the Recycle Bin ... with every byte intact." Shift plus Delete skips the bin | S1 (Delete: "Delete the selected item and move it to the Recycle Bin"; Shift+Delete: "Delete the selected item without moving it to the Recycle Bin first") | Accessed 2026-10-11 | "Usually": removable drives and some cases bypass the bin (not claimed in detail). "Every byte intact" is an inference from "move" | S/I |
| C02 | P04 | Boxes and index cards | S3, S4 | — | Analogy; its limit is stated in P06 (C04); P17 extends it for SSDs | A |
| C03 | P05 | A file system is the set of rules a computer uses to organize a drive; on a modern Windows PC the default is NTFS; NTFS divides the drive into equal-sized blocks that Windows calls clusters; the photo spans many clusters | S2 ("NTFS is the default file system for modern Windows-based operating system"; cluster-size table); S3 ("Cluster is an allocation unit ... When file grows beyond the cluster boundary, another cluster is allocated") | S2 ms.date 2025-06-17; S3 2008-04-10 (archived) | "Far too big for one box": a photo is far larger than the 4 KB default cluster (S2), which is general knowledge. No size is spoken | S/I |
| C04 | P06 | The MFT has at least one entry for every file; the entry holds name, size, dates and directions to its clusters; a very small file can fit entirely on its card | S4 ("at least one entry in the MFT for every file"; "size, time and date stamps, permissions, and data content, is stored either in MFT entries, or in space outside the MFT that is described by MFT entries"); S5 (the name is stored in the MFT entry); S3 ("if file is small enough, it can be stored in MFT record itself") | S4 ms.date 2024-09-05 | "Directions" simplifies the run lists | S |
| C05 | P07 | Emptying the bin: NTFS marks the card as free so it can be reused, and marks the clusters available in a separate map | S4 ("When files are deleted ... their MFT entries are marked as free and may be reused"); S5 (MFT entry flag set to "unused"; "The bitmap for the clusters is also updated"); S6 ("the MFT Record is marked as not in use and the bitmap representing the disk usage is updated") | S5 2010-09-18; S6 Ubuntu jammy | Applies the same way to Shift+Delete (a permanent delete) | S |
| C06 | P07 | "Nothing opens the boxes. The photo's bytes stay exactly where they were, and the card usually stays in the drawer too" | S7 ("the space used by a deleted file is marked as free space ... the file data can still exist and be recovered"); S8 ("When a file is deleted ... the file still exists on the storage device, be it a HDD or SSD"); S6 (the record "may be reused") | S8 2011 | "Usually": the record can be reused (S6). On an SSD, TRIM changes what follows (C11–C12) | S |
| C07 | P07 | "Updating a couple of records is quick. Rewriting every box ... would take far longer, and on a hard drive, that space can simply be written over later" | S8 ("the OS assumes the address ... can be written over again when needed ... the HDD will write over the garbage data with no issue") | — | The "why" is the editor's inference; no source states Microsoft's design reason | I |
| C08 | P08 | Recovery tools read the unused cards and follow their directions; some scan the boxes for the header that marks the start of a file | S7 (Windows File Recovery modes: "NTFS mode ... using the master file table"; "Segment mode ... using file record segments"; "Signature mode ... using file headers"); quoted line: "the space used by a deleted file is marked as free ... can still exist and be recovered" | Page applies to Windows 11 and 10 | Microsoft's tool used as the example; other tools are not named | S |
| C09 | P09, P21 | Free space can be overwritten by any use; "any use of your computer can create files that overwrite that space at any time"; stop using the drive; recover onto a different drive | S7 ("any use of your computer can create files, which may over-write this free space at any time"; "minimize or avoid using your computer"; "The source and destination drive or partition path should not be the same") | — | "Check the Recycle Bin and your backups first" is common-sense advice (S7 points to the Recycle Bin first) | S |
| C10 | P11 | Flash can't simply write over old data; a spot must be erased first; erasing only at save time would slow writes, so the drive cleans up in the background | S8 ("The SSD will need to erase the contents of the memory cell before writing to it"; drives that recycle poorly "slow down over time"; cleaning happens "when the drive finds a convenient time") | Kingston MKF-422, 2011 | Simplified: real flash erases large blocks and writes smaller pages (not spoken). Garbage collection is not named | S/I |
| C11 | P12 | The SSD doesn't read the cards and treats the boxes as still in use; Windows sends TRIM, a note listing clusters freed by a delete; on NTFS it's on by default for drives that support it | S8 ("TRIM command enables the OS and the SSD to now communicate where the garbage data is"); S9 ("notifies the underlying storage device of clusters that have been freed due to a file delete operation"; "For systems using NTFS, trim is enabled by default unless an administrator disables it"; drives that don't support it "don't get trim notifications") | S9 ms.date 2017-10-16, updated 2026-02-16 | "Doesn't read the cards" is an inference from S8's need for TRIM | S/I |
| C12 | P13 | The drive, at a convenient moment, erases the TRIMmed boxes; then the photo is gone and there's nothing left for a recovery tool to find | S8 ("the address where the file resided can be cleaned when the drive finds a convenient time"); S10 (TRIM "can sanitize disks"; with TRIM on, little was recoverable) | — | Timing varies by drive (P14). "Nothing left" applies after the erase, for normal recovery tools | S/I |
| C13 | P14 | A study published in 2011; Carnegie Mellon researchers tested 16 SSDs; with TRIM off nearly all deleted data was recoverable; with TRIM on, "at most about a quarter of the blocks survived, depending on who made the chip that runs the drive" | S10 abstract ("empirical evidence of 16 different disks"; "without TRIM, nearly all data is recoverable, but with TRIM enabled only up to 27% of blocks were recoverable dependent on the controller manufacturer"); affiliations: CERT/SEI and ECE/CyLab, Carnegie Mellon University | Digital Investigation 8 (2011) S111–S117; DFRWS 2011 | Rounding: 27% spoken as "about a quarter". "Chip that runs the drive" = controller. Hedged as "a snapshot, not a rule" | S/C |
| C14 | P14 | "TRIM doesn't always get through. Some setups, like certain multi-drive arrays, never pass it on." | S8 ("If SSDs are configured in a RAID array, connected to a HBA controller or sitting in a NAS/SAN configuration ... the TRIM command will not reach the SSDs"); S9 (TRIM can be disabled; unsupported devices get no notifications) | S8 2011 | "Certain": some modern RAID setups do pass TRIM (not verified here), hence the hedge | S/I |
| C15 | P16 | Overwriting a hard drive replaces old bytes in place; NIST, the US standards agency, says overwriting typically hinders recovery even with state-of-the-art laboratory techniques | S11 §3.1.1 ("Overwriting typically hinders the recovery of data even if state-of-the-art laboratory techniques are applied to attempt to retrieve the data") | NIST SP 800-88r2, September 2025 | "In place" for a hard drive is the standard model. NIST's sentence covers overwriting generally; flash exceptions follow (C16) | S |
| C16 | P17 | On an SSD the numbers Windows sees are labels; the drive decides the physical spot and moves data so no part wears out first; it keeps spare space Windows can't see or address; new data can land somewhere fresh while old copies stay out of reach; NIST: on flash with spare cells and wear spreading, a user can't reach every place old data was stored by simply writing over it | S11 §2.3 (more physical storage than user-addressable capacity, "e.g., overprovisioning"); §3.1.1 ("flash memory-based storage devices that contain spare cells and perform wear levelling make it infeasible for a user to sanitize all previous data using this approach because the device cannot support directly addressing all areas"; for "SSDs with overprovisioning" multi-pass overwriting gives "very little confidentiality protection"); §3.1.2 ("the abstraction inherent in typical read and write commands") | Sept 2025 | "Labels" is the analogy for logical-to-physical mapping. "Can land somewhere fresh" is hedged | S/A |
| C17 | P18 | The reversal: the SSD tends to destroy what you'd like back and resists deliberate destruction, because the drive decides where bytes physically live | Synthesis of C12–C13 and C16 | — | "Tends to" (C13 variation) | I |
| C18 | P19 | Drive makers ship tools that send a built-in erase command; Crucial's Storage Executive has a Sanitize Drive function | S12 ("Our Storage Executive tool offers a Sanitize Drive function and a PSID Revert function, both of which will erase an SSD's contents") | Crucial, 2025-11-18 | One example, not an endorsement. Other makers' tool names are not claimed | S |
| C19 | P19 | NIST: dedicated sanitize commands can reach all storage areas more effectively than overwriting, but you're trusting the manufacturer | S11 §3.1.1 ("dedicated sanitize commands that address all storage areas more effectively. The use of such commands results in a trade-off because they require trust and assurance from the ISM vendor"); §3.1.2 (purge via "dedicated, standardized device sanitize commands") | Sept 2025 | — | S |
| C20 | P20 | BitLocker, in many editions of Windows, encrypts the whole drive with a key; if it was on when the photo was saved, every block including leftovers and shuffled copies is scrambled; without the key, a pulled drive reads as noise | S13 ("encryption for entire volumes"; protects against "transferring the device's hard drive to a different device"; "rendering data inaccessible when BitLocker-protected devices are decommissioned or recycled"; edition table: Pro, Enterprise, Education) | S13 ms.date 2026-08-24 | "Whole drive" = the volume. "Shuffled copies are scrambled" is an inference: encryption happens before data reaches the drive. "If it was on when saved" covers data written before encryption | S/I |
| C21 | P20 | NIST counts destroying the key, under the right conditions, as a fast way to sanitize | S11 §3.2 (CE "is based on the sanitization of keys used to encrypt data"; "sanitization can be performed with high assurance much faster than with other sanitization techniques"; subject to conditions) | Sept 2025 | "Under the right conditions" carries NIST's preconditions | S |
| C22 | P20 | Microsoft describes BitLocker as protection for lost, stolen or decommissioned devices; many newer PCs turn on device encryption automatically; check Settings | S13 ("lost, stolen, or inappropriately decommissioned devices"; device encryption "is enabled automatically"; it's "available on all Windows versions"; 24H2 removed prerequisites so "more devices are eligible"; there's a device encryption setting in the Settings app) | — | "Many" is an inference from automatic enablement plus broadened eligibility. S13 also says devices with only local accounts remain unprotected until a key protector exists; that isn't spoken, and "check ... whether yours is on" covers it | S/I |
| C23 | P20 | "Once your PC has started, Windows reads the drive normally, so encryption won't stop a recovery tool running on your own PC" | S13 (BitLocker addresses offline attacks such as moving the drive; the TPM unlocks during startup) | — | An inference about scope: encryption at rest doesn't hide data from the running OS | I |
| C24 | P21 | The `cipher` command with /W overwrites free space; Microsoft recommends Reset this PC with Clean data before selling or giving away a PC, and notes it doesn't meet government erasure standards; to wipe a whole SSD before it leaves your hands, use the maker's sanitize tool | S14 ("/w ... Removes data from available unused disk space on the entire volume"); S15 ("Clean data: when enabled, it removes files and cleans the drive. If you're planning to donate, recycle, or sell your PC, use this option ... makes it harder for other people to recover files"; "does not meet government and industry data erasure standards"); S11/S12 for the SSD tool. **Revised 2026-10-11 (independent check):** spoken as "To wipe a whole SSD before it leaves your hands, use the drive maker's sanitize tool", because sanitize erases the entire drive, not one file | S14 ms.date 2017-10-16; S15 accessed 2026-10-11 | cipher /w is placed under the hard-drive advice on purpose (C16). Microsoft doesn't say how Clean data works on SSDs; the narration repeats only Microsoft's recommendation and caveat | S |
| C25 | P01, P02, P22 | P01 (revised 2026-10-11): the SSD photo may disappear soon after, "but not because Windows erased it"; the drive cleans up on its own schedule (C11–C13). The answer: on a hard drive, not yet; on an SSD, probably but not certainly; delete crosses out the card; on a hard drive nothing happens until a new write; on an SSD the drive decides | Synthesis of C05–C09 and C11–C14 | — | — | I |
| C26 | P21 | "keep encryption on from day one, with its recovery key saved somewhere safe" (added 2026-10-11) | S13 (BitLocker recovery: a recovery key is needed when BitLocker can't unlock the drive normally) | — | Safety advice: without the key, a locked drive's data is unrecoverable by design. Not separately quoted from S13 in this pass | I |

### Sources (all accessed 2026-10-11)
- **S1** Microsoft Support, "Keyboard shortcuts in Windows". https://support.microsoft.com/en-us/windows/keyboard-shortcuts-in-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec
- **S2** Microsoft Learn, "NTFS overview" (ms.date 2025-06-17). https://learn.microsoft.com/en-us/windows-server/storage/file-server/ntfs-overview
- **S3** Microsoft Learn (archived TechNet blog), "Some NTFS recommendations" (2008-04-10). https://learn.microsoft.com/en-us/archive/blogs/apawar/some-ntfs-recommendations
- **S4** Microsoft Learn, "Master File Table (Local File Systems)" (ms.date 2024-09-05). https://learn.microsoft.com/en-us/windows/win32/fileio/master-file-table
- **S5** The Sleuth Kit Wiki, "NTFS File Recovery" (last modified 2010-09-18). https://wiki.sleuthkit.org/NTFS-File-Recovery/
- **S6** Ubuntu Manpages, ntfsundelete(8) (jammy). https://manpages.ubuntu.com/manpages/jammy/man8/ntfsundelete.8.html
- **S7** Microsoft Support, "Windows File Recovery" (applies to Windows 11 and 10). https://support.microsoft.com/en-us/windows/recover-lost-files-on-windows-10-61f5b28a-f5b8-3cc2-0f8e-a63cb4e1d4c4
- **S8** Kingston Technology, "Effects of Garbage Collection and TRIM on SSD Performance" (Best Practice Series, MKF-422, 2011). https://media.kingston.com/pdfs/business/Garbage_Collection_and_TRIM_on_SSD_Performance_MKF_422.pdf
- **S9** Microsoft Learn, "fsutil behavior" (ms.date 2017-10-16; updated 2026-02-16). https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/fsutil-behavior
- **S10** C. King and T. Vidas, "Empirical analysis of solid state disk data retention when used with contemporary operating systems", *Digital Investigation* 8 (2011) S111–S117, DFRWS 2011 USA. The PDF was downloaded and its abstract read. https://dfrws.org/sites/default/files/session-files/2011_USA_paper-empirical_analysis_of_solid_state_disk_data_retention_when_used_with_contemporary_operating_systems.pdf
- **S11** NIST SP 800-88 Rev. 2, *Guidelines for Media Sanitization* (R. Chandramouli, E. A. Hibbard), September 2025; it supersedes Rev. 1 (2014). §2.3, §3.1.1, §3.1.2 and §3.2 were read from the PDF text. https://doi.org/10.6028/NIST.SP.800-88r2 (PDF: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r2.pdf)
- **S12** Crucial (Micron), "How to Erase an SSD", Crucial Support Team, 2025-11-18. https://www.crucial.com/support/articles-faq-ssd/methods-for-erasing-an-ssd
- **S13** Microsoft Learn, "BitLocker Overview" (ms.date 2026-08-24). https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/
- **S14** Microsoft Learn, "cipher" (ms.date 2017-10-16). https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/cipher
- **S15** Microsoft Support, "Reset your PC". https://support.microsoft.com/en-us/topic/0ef73740-b927-549b-b7c9-e6f2b48d275e

### Corrections to the brief
- None material. The brief's mechanism (MFT entry marked free, clusters marked available, data stays until overwritten) matches S4–S6. "Garbage collection" is described but not named, to keep the term budget. NIST SP 800-88 is cited as **Rev. 2 (September 2025)**, the current version. Rev. 2 moved most technology-specific detail out to IEEE 2883, but it still states the flash/wear-levelling overwrite problem (§3.1.1) used in P17.

### Fact-check log (draft → final)

One adversarial pass by the same editor against opened sources; not independent.

| # | Para | Challenge | Verdict | Change |
|---|---|---|---|---|
| FC1 | P01, P22 | "Windows only threw away the note" contradicts P07 (the card stays, flagged unused) | Metaphor inconsistency | "threw away" → "crossed out" (P01), "throws away" → "crosses out" (P22) |
| FC2 | P03 | "Pressing Delete doesn't remove anything" is absolute; some deletes bypass the bin | Overclaim | → "On your PC's own drive, pressing Delete usually doesn't remove anything" |
| FC3 | P14 | "RAID arrays" is an undefined term; the 2011 Kingston claim may not hold for every modern array | Jargon plus a dated claim | → "certain multi-drive arrays, never pass it on" |
| FC4 | P19 | "NIST treats sanitize commands as stronger than overwriting" goes beyond the text | Paraphrase too strong | → "can reach all of a drive's storage areas more effectively than overwriting", matching §3.1.1 |
| FC5 | P20 | "BitLocker, built into Windows": the BitLocker overview lists Pro, Enterprise and Education editions; Home relies on device encryption | Scope | → "built into many editions of Windows"; device encryption introduced separately |
| FC6 | P20 | "While you're signed in, the drive is unlocked": with TPM-only protection the volume unlocks at startup, before sign-in | Mechanism imprecise | → "once your PC has started, Windows reads the drive normally" |
| FC7 | P20 | Encryption scrambles leftovers only if it was on when the data was written (turning it on later may leave old free space unencrypted) | Missing condition | Kept "If it was on when your photo was saved" as a spoken condition |
| FC8 | P14 | 27% → "about a quarter" | Rounding acceptable with "at most about" | No change; noted in C13 |
| FC9 | P16 | NIST says overwriting "hinders" recovery, not "prevents" it | Keep NIST's verb | The narration uses "hinders" |
| FC10 | P13 | Does TRIM erase immediately? S8 says "when the drive finds a convenient time"; S10 says TRIM "can sanitize disks in seconds" | Timing varies | The narration gives no time and says "When it finds a convenient moment"; P14 adds "depends on the drive" |
| FC11 | P21 | cipher /w on an SSD would contradict P17 | Placement | cipher /w appears only under "on a hard drive" |
| FC12 | P21 | Does Clean data work on SSDs? Microsoft doesn't say | Unverifiable | Narration repeats only Microsoft's recommendation and its "not government standards" caveat |
| FC13 | P07 | "Nothing opens the boxes": NTFS may update other metadata (log, directory index), but not the file's data clusters | Holds for the data | No change |
| FC14 | P05 | Is NTFS "the default on a modern Windows PC"? S2: "the default file system for modern Windows-based operating system" | Supported | No change |
| FC15 | All | Other copies of the photo (OneDrive, backups, thumbnail caches, restore points) could survive any of this | Scope gap | Out of scope; "check ... your backups" in P21; listed under limitations |

Final read-through: each narration sentence was re-read against C00–C25 after the edits above. All 22 paragraphs map to ledger rows, and no spoken number lacks a row (two thousand eleven, sixteen, "a quarter": C13).

---

## F. Quality report

### Self-score (editor's own, labelled; NOT an independent judgment)

| Criterion | Weight | Score | Points | Specific evidence / strongest remaining limitation |
|---|---:|---:|---:|---|
| Factual accuracy, sourcing, scope | 25 | 9 | 22.5 | Mechanism lines quote Microsoft (S4, S7, S9), Sleuth Kit (S5) and NIST Rev. 2 (S11). Limitation: the SSD retention figures come from a 2011 study (S10, hedged aloud), and the RAID/TRIM support claim (S8) is from 2011. |
| Opening hook | 15 | 8.5 | 12.75 | P01 has no numbers and a picturable contrast, and P02 answers "GONE?" right away. Limitation: P01–P02 together run about 137 words before the first mechanism; P02's route sentence is a mild "here's what we'll cover". |
| Beginner comprehension and causal explanation | 15 | 8.5 | 12.75 | One metaphor (boxes and cards), defined before use, with its limit stated (P06); 5 named terms. Limitation: P17 packs labels, wear spreading and spare space into one paragraph, the densest stretch. |
| Narrative progression | 10 | 8.5 | 8.5 | Cause (P11–P12) → consequence (P13–P14) → surprise (P15–P18) → payoff (P19–P22), with two prediction beats (P13, P17). Limitation: P19–P20 are both "what works" paragraphs back to back. |
| Title/thumbnail promise and payoff | 10 | 9 | 9 | "Delete doesn't erase. Delete crosses out the index card." lands the title, and P02 and P22 close "GONE?". Limitation: the "GONE?" art shows only a hard drive. |
| Original insight and memorable value | 10 | 8.5 | 8.5 | "The SSD tends to destroy the files you'd like back, and resists you when you try to destroy them yourself", grounded in NIST. Limitation: "deleted isn't erased" is familiar; the reversal carries the novelty. |
| No-fluff writing and natural delivery | 10 | 8 | 8 | Mostly short, spoken sentences, and all numbers are in one paragraph (P14). Limitation: P21 still reads as a sequence of tips; P20 is long (one of the two longest paragraphs). |
| Visual storytelling | 5 | 9 | 4.5 | One persistent map that mirrors the thumbnail; split-compare HDD vs SSD; card-flag and box-glow changes carry the mechanism. Limitation: V9 (labels vs physical spots) needs careful design to avoid clutter. |
| **TOTAL** | **100** | | **86.5** | |

**Gates (master prompt §11):**
- Total ≥ 90: **not met** (86.5, self-assessed).
- Factual accuracy ≥ 9: met (9).
- No other criterion below 8: met (lowest is 8, no-fluff writing).
- Hard failures: none identified by the editor. Not independently checked.

### Three most important weaknesses found, and changes made
1. **Metaphor inconsistency** ("threw away the note" vs "card stays, flagged unused"). Fixed in P01 and P22 (FC1).
2. **BitLocker overclaims** (edition scope, unlock timing, data written before encryption). Fixed with three spoken qualifiers (FC5–FC7).
3. **Jargon creep** (RAID, controller, garbage collection, wear levelling, over-provisioning). Each was replaced by plain words, holding the episode to 5 named terms.

### Remaining limitations
- Self-score only; no independent review yet.
- S10 is from 2011 and S8 is a 2011 vendor paper; current SSD behaviour may differ (hedged aloud in P14).
- Other copies of the photo (cloud sync, backups, caches, restore points) are out of scope beyond "check your backups".
- P20 (120+ words) and P21 are the likeliest targets if a judge marks down the second half as list-like.
- Length 1,590 words, inside the 1,550–1,650 target.

### Status

**EDITORIAL REVISION ADVISED** (independent judge, 2026-10-11). The facts hold after three small fixes, but the independent score is 84.5/100, below the 90 target, and spoken delivery scores 7, below the 8 floor.

_Superseded provisional status from the editor: PENDING INDEPENDENT REVIEW (self-score 86.5)._

---

## Independent fact-check (2026-10-11)

This check was done by a separate reviewer who did not write the script. It used focused web checks and no sub-agents. Each source below was re-opened and its passage read, except where noted.

**Re-verified against the source text**
- **S7, Windows File Recovery.** The page says "the space used by a deleted file is marked as free space"; "the file data can still exist and be recovered"; and "any use of your computer can create files, which may over-write this free space at any time". It also says "The source and destination drives must be different" and "It's possible that the free space was overwritten, especially on a solid-state drive (SSD)". That last line independently supports P21's "On an SSD with TRIM, be prepared for it to be gone". This confirms P08, P09 and P21.
- **S11, NIST SP 800-88r2.** All four sentences were checked against the PDF text:
  - §3.1.1, "Overwriting typically hinders the recovery of data even if state-of-the-art laboratory techniques are applied", supports P16.
  - §3.1.1, "flash memory-based storage devices that contain spare cells and perform wear levelling make it infeasible for a user to sanitize all previous data using this approach", supports P17.
  - §3.1.1, "dedicated sanitize commands that address all storage areas more effectively ... require trust and assurance from the ISM vendor", supports P19.
  - §3.2, CE "can be performed with high assurance much faster than with other sanitization techniques ... subject to the constraints", supports P20.
- **S10, King & Vidas 2011.** The authors are Christopher King (CERT, Carnegie Mellon) and Timothy Vidas (CMU ECE/CyLab). The abstract reports 16 disks; nearly all data was recoverable without TRIM, and "only up to 27%" with TRIM, depending on the controller manufacturer. Confirmed via the DFRWS listing; the PDF itself returned 403 on this pass. "At most about a quarter" rounds 27% slightly down, and "about" carries it. Acceptable.
- **S15, Reset your PC.** The page says "If you're planning to donate, recycle, or sell your PC, use this option" and "does not meet government and industry data erasure standards". Confirms P21.
- **Not re-opened:** S12 (Crucial) rejected the request on this pass, so C18 rests on the editor's access dated 2025-11-18. The claim, a "Sanitize Drive" function in Storage Executive, is low-risk.

**Mechanism challenges and verdicts**
- **Recycle Bin as a move (P03).** It holds, hedged with "usually" and "your PC's own drive". Files too large for the bin, or a disabled bin, are the exceptions the hedge covers.
- **Emptying the bin or Shift+Delete (P07).** The MFT record is flagged unused and the $Bitmap is updated. NTFS also removes the name from the parent folder's index and logs the change. "And that's it. Nothing opens the boxes" is about the data clusters, so it holds.
- **HDD persistence (P01, P07, P16).** This holds for conventional drives. Edge cases are not spoken and are already listed as out of scope: reallocated sectors, and indirection on drive-managed SMR drives. NIST's "typically" covers them.
- **TRIM and erasure certainty (P12–P14).** The certainty is handled honestly: "probably, but not certainly", "depends on the drive", "a snapshot, not a rule", "doesn't always get through". One nuance is not spoken: many SSDs return zeros for TRIMmed addresses immediately, before any physical erase. That makes the normal-tool outcome the same or faster, so it doesn't contradict the narration.
- **Overwriting on SSDs (P17).** Matches NIST §3.1.1.
- **Sanitize tools (P19, P21).** See IF2.
- **Encryption (P20).** It is conditioned correctly: "if it was on when your photo was saved", "under the right conditions", and "once your PC has started". See IF3.
- **Overstatements.** Each was checked: "every byte", "exactly", "never pass it on" (scoped by "certain"), "always" (negated), and both uses of "usually". Every spoken number (2011, sixteen, a quarter) has a ledger row. No unsourced numbers remain.

**Fixes made in `script_voiceover.txt`** (mirrored in sections B and D, which still match the voiceover exactly)

| # | Para | Before | After | Why |
|---|---|---|---|---|
| IF1 | P01 | "But not because you deleted it." | "But not because Windows erased it." | Inaccurate as worded. The delete is what triggers TRIM (P12), so the SSD's cleanup *is* a result of deleting. The point is that Windows doesn't erase the data; the drive does. |
| IF2 | P21 | "For an SSD, use the drive maker's sanitize tool." | "To wipe a whole SSD before it leaves your hands, use the drive maker's sanitize tool." | Potentially harmful ambiguity. Coming right after "gone for good", a viewer could run a whole-drive sanitize to remove one file and lose everything. Sanitize erases the entire drive (P19, "wipe an SSD"). |
| IF3 | P21 | "And keep encryption on from day one." | "...from day one, with its recovery key saved somewhere safe." | Harm prevention. Encryption advice without the recovery-key caveat can lead to permanent data loss if BitLocker asks for the key (C26). |

The ledger now changes C24 and C25 and adds C26. Length is 1,604 words, still inside the target.

**Remaining factual doubt:** none material. Two minor items stand: S12 was not re-opened on this pass, and copies of the photo outside the drive (cloud, backups, caches) stay out of scope, as the editor flagged.

## Independent judge (2026-10-11)

This is a blind score of the FINAL narration (after IF1–IF3) and the section A title and thumbnail brief. It was written before reading the editor's self-score.

| Criterion | Weight | Score | Points | One-line reason |
|---|---:|---:|---:|---|
| Factual accuracy, sourcing, scope | 25 | 9 | 22.5 | Key quotes re-verified (NIST r2, Microsoft, King & Vidas), and the qualifiers are spoken. Held below 10 by the 2011-era SSD evidence and the two wording errors this check had to fix. |
| Opening hook | 15 | 8 | 12 | The passport photo and the HDD/SSD contrast are concrete, with the answer given at once. P02's "Along the way, you'll see..." is a table-of-contents sentence. |
| Beginner comprehension and causal explanation | 15 | 9 | 13.5 | The boxes-and-cards model is defined before use and its limit is stated. TRIM's "why" (the drive can't read the cards) is well motivated. P17 is dense but clear. |
| Narrative progression | 10 | 8 | 8 | HDD → SSD → reversal → fix has real momentum. P05–P06 is a definitional stretch, and P19–P21 become successive "what to do" paragraphs. |
| Title/thumbnail promise and payoff | 10 | 9 | 9 | "Why Deleting a File Doesn't Erase It" and "DELETE ≠ ERASE" are delivered literally in P07 and P22. The SSD half complicates the title honestly instead of contradicting it. |
| Original insight and memorable value | 10 | 8 | 8 | "The strange reversal" (the SSD destroys what you want back and resists what you want gone) is the memorable idea. The rest is well-trodden explainer ground. |
| No-fluff writing and natural delivery | 10 | 7 | 7 | About 11 sentences open with "So", a noticeable spoken tic. P20 (143 words, five ideas) and P21 (a tip list) are heavy to read aloud, and P22 partly recaps. |
| Visual storytelling | 5 | 9 | 4.5 | One persistent map with a split-compare, and state changes that carry the mechanism. The limitations are named per beat. |
| **TOTAL** | **100** | | **84.5** | |

**Gates (master prompt §11)**
- Hard failures: **none**. No unsupported key claim, no wrong mechanism, the title is delivered, the analogy limits are stated, the scope is spoken and the central question is answered. The two inaccuracies found (IF1, IF2) are fixed.
- Factual accuracy ≥ 9: **pass** (9).
- No other criterion below 8: **fail**, because no-fluff and delivery scores 7.
- Total ≥ 90: **fail** (84.5).

**Top 3 changes that would raise the score most**
1. **Delivery pass (+2–3).** Cut most of the "So..." openers. Split P20 into two beats: encryption scrambles everything at rest, then its limit and the Settings check. Turn P21 from a tip list into the passport photo's two outcomes, "you want it back" and "you want it gone".
2. **Hook (+1.5).** Replace P02's roadmap sentence with the next concrete question, for example why the same delete behaves differently on two drives. Let the hard-drive-versus-SSD contrast pull the viewer straight into P03.
3. **Progression and originality (+1–2).** Add a predict-then-see beat before P08 ("if delete only flips a flag, what would a recovery tool need?"). Replace P22's partial recap with one new consequence: the same photo on two drives, one recoverable and one not, decided by who controls the boxes.

**Status: EDITORIAL REVISION ADVISED.** There is no factual blocker after IF1–IF3, but the total is 84.5 (target 90) and spoken delivery scores 7, below the 8 floor.
