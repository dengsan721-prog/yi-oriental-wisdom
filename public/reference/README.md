# Traditional reference asset provenance

Generated specifically for the “艺｜东方人生智慧” self-comparison atlas on 2026-07-17 with the built-in OpenAI image generation tool. These are synthetic educational reference composites, not photographs of product users and not intended to represent a named real person.

## `face-reference.webp`

- Dimensions: 1619 × 971 px.
- Prompt goal: five distinct adult Chinese facial shapes, straight-on, neutral expression, consistent studio lighting and framing, deep blue-gray background, no text or labels.
- Manual QA: five distinct faces; full foreheads, chins and facial contours visible; consistent eye line; no duplicate face or implausible anatomy observed.
- Product use: standard face-shape comparison base only.

## `face-feature-reference.webp`

- Dimensions: 1717 × 916 px.
- Prompt goal: five separate adult Chinese frontal examples for straight brows, arched brows, open eyes, a defined nose and balanced lips, with a consistent neutral studio treatment and no text.
- Manual QA: five distinct people and five clean panels; eyes, eyebrows, nose and lips remain visible at original resolution; no duplicate face or obvious anatomy issue observed.
- Product use: the interface highlights the selected feature on its corresponding panel, so a feature choice no longer reuses the face-shape state.

## `mole-reference.webp`

- Dimensions: 1448 × 1086 px.
- Prompt goal: the same neutral adult Chinese person in left three-quarter, front and right three-quarter views, hair away from the face, no visible moles or labels.
- Manual QA: one consistent person across all three views; forehead, temples, cheeks and jaw are visible; no baked-in labels or obvious identity drift observed.
- Product use: standard face-position base with HTML/CSS hotspot overlays only.

## `palm-reference.webp`

- Dimensions: 1448 × 1086 px.
- Prompt goal: left and right open palms of one adult Chinese person, wrists and fingertips visible, natural creases, even studio lighting, no text or arrows.
- Manual QA: exactly five fingers on each hand; left/right orientation is plausible; fingertips and wrists are not cropped; no fused fingers, extra digits or impossible joints observed.
- Product use: standard hand-shape and line comparison base with separate HTML/CSS overlays only.

## `palm-shape-reference.webp`

- Dimensions: 1778 × 885 px.
- Prompt goal: five equal panels showing visibly different long/slender, long/compact, broad/square, angular/jointed and soft/elongated hand structures, all at the same angle and scale without text.
- Manual QA: exactly five fingers on every hand; all wrists and fingertips are visible; the five hands have distinct proportions and no fused fingers or impossible joints were observed.
- Product use: one panel is highlighted for each of the five traditional hand-shape labels; palm-line choices continue to use the separate two-palm line reference.

## Usage boundary

These assets are product-owned generated materials for standard visual reference. The feature does not request, upload, read, store or recognize a user photo. It performs no biometric matching, identity recognition, attractiveness scoring, ethnicity inference, health inference, lifespan judgment or personality conviction.

Delivery format: the generated PNG originals were visually inspected, then converted locally to WebP at quality 84 without cropping or content edits for faster mobile delivery. All five final WebP files were inspected again at original dimensions. Hotspots and selection frames are HTML/CSS overlays bound to each image's fixed aspect-ratio coordinate plane; they are not baked into the files.

## 2026-07-20 gendered face and mole atlases

The following ten synthetic assets were generated specifically for the gender-matched self-comparison flow with the built-in OpenAI image generation tool on 2026-07-20. The selected PNG sources and the final WebP files were each inspected at original resolution. Pillow then performed only deterministic panel mirroring, whole-image mirroring, resize and WebP quality-84 conversion. No labels, hotspots or diagnostic marks are baked into these files.

### `face-shapes-male.webp`

- Asset: `face-shapes-male.webp`.
- Gender: male.
- View/category order: frontal; oval, round, square, long, heart-shaped from left to right.
- Dimensions: 1500 × 600 px; WebP quality 84.
- Mirrored display plane: yes; each of the five panels was mirrored individually, then reassembled without changing category order.
- Generation tool and date: built-in OpenAI image generation tool, 2026-07-20.
- Exact final prompt:

```text
Use case: scientific-educational
Asset type: premium website facial-shape self-comparison contact sheet
Primary request: five different adult Chinese male facial-shape examples ordered left to right: oval, round, square, long, heart-shaped
Scene/backdrop: one continuous plain charcoal-black studio background
Subject: five distinct adult Chinese men, neutral expressions, straight-on head-and-upper-shoulder portraits, full forehead, both ears where possible, chin and complete jaw visible, hair away from facial contour
Style/medium: photorealistic educational studio photography, realistic pores and natural variation, no beauty retouching
Composition/framing: single horizontal row of exactly five equal-width portraits; identical eye line, head size, crop, camera distance and lighting; all faces contained inside a central 5:2-safe horizontal band with sufficient top and bottom margin for deterministic crop
Lighting/mood: soft even neutral studio light, restrained and premium
Constraints: clearly distinguish the five contour categories without caricature; no text, labels, symbols, panels, borders, jewelry, conspicuous makeup, logos or watermark; no duplicate face; plausible anatomy
Avoid: collage gaps, glamour styling, dramatic expression, cropped forehead/chin, identity-recognition or health-inference framing
```

- Anatomy and orientation QA: five distinct identities; contour categories remain legible in the required order; eye line and crop are consistent; full forehead, chin and jaw are visible; no text, watermark, duplicate face or obvious anatomy issue observed in the source or final WebP.
- Product use: standard visual self-comparison only; no user image collection, identity recognition, biometric matching, health inference, ethnicity inference, lifespan inference or moral/personality conviction.

### `face-shapes-female.webp`

- Asset: `face-shapes-female.webp`.
- Gender: female.
- View/category order: frontal; oval, round, square, long, heart-shaped from left to right.
- Dimensions: 1500 × 600 px; WebP quality 84.
- Mirrored display plane: yes; each panel was mirrored individually and category order was preserved.
- Generation tool and date: built-in OpenAI image generation tool, 2026-07-20.
- Exact final prompt:

```text
Use case: scientific-educational
Asset type: premium website facial-shape self-comparison contact sheet
Primary request: five different adult Chinese female facial-shape examples ordered left to right: oval, round, square, long, heart-shaped
Scene/backdrop: one continuous plain charcoal-black studio background
Subject: five distinct adult Chinese women, neutral expressions, straight-on head-and-upper-shoulder portraits, full forehead, both ears where possible, chin and complete jaw visible, hair away from facial contour
Style/medium: photorealistic educational studio photography, realistic pores and natural variation, no beauty retouching
Composition/framing: single horizontal row of exactly five equal-width portraits; identical eye line, head size, crop, camera distance and lighting; all faces contained inside a central 5:2-safe horizontal band with sufficient top and bottom margin for deterministic crop
Lighting/mood: soft even neutral studio light, restrained and premium
Constraints: clearly distinguish the five contour categories without caricature; no text, labels, symbols, panels, borders, jewelry, conspicuous makeup, logos or watermark; no duplicate face; plausible anatomy
Avoid: collage gaps, glamour styling, dramatic expression, cropped forehead/chin, identity-recognition or health-inference framing
```

- Anatomy and orientation QA: five distinct identities; round, square, long and heart-shaped contours remain naturally distinguishable without caricature; framing is consistent; no text, watermark, duplicate face or obvious anatomy issue observed.
- Product use: standard visual self-comparison only; no user image collection, identity recognition, biometric matching, health inference, ethnicity inference, lifespan inference or moral/personality conviction.

### `face-features-male.webp`

- Asset: `face-features-male.webp`.
- Gender: male.
- View/category order: frontal; straight brow, arched brow, naturally open eye, clearly defined nose, balanced upper/lower lips from left to right.
- Dimensions: 1500 × 600 px; WebP quality 84.
- Mirrored display plane: yes; each panel was mirrored individually and the five-feature order was preserved.
- Generation tool and date: built-in OpenAI image generation tool, 2026-07-20.
- Exact final prompt:

```text
Use case: scientific-educational
Asset type: premium website facial-feature self-comparison contact sheet
Primary request: five distinct adult Chinese male frontal examples ordered left to right, each naturally emphasizing one assigned feature: straight brow, arched brow, naturally open eye, clearly defined nose, balanced upper-and-lower lips
Scene/backdrop: one continuous plain charcoal-black studio background
Subject: five distinct adult Chinese men, neutral expressions, straight-on head-and-upper-shoulder portraits; every whole face remains visible; full forehead, chin and jaw visible; hair away from eyebrows and facial contour
Style/medium: photorealistic educational studio photography, realistic pores and natural variation, no beauty retouching
Composition/framing: exactly one horizontal row of five equal-width portraits; identical eye line, head size, crop, camera distance and lighting; all faces contained inside a central 5:2-safe horizontal band with sufficient top and bottom margin for deterministic crop
Lighting/mood: soft even neutral studio light, restrained and premium
Constraints: left-to-right assigned feature order must be visually clear yet natural; five different identities; no text, labels, symbols, panels, borders, jewelry, conspicuous makeup, logos or watermark; plausible anatomy
Avoid: close-up isolated facial parts, collage gaps, glamour styling, dramatic expression, cropped forehead/chin, duplicate face, identity-recognition or health-inference framing
```

- Anatomy and orientation QA: five distinct identities and all complete faces remain visible; the five focus regions align with the required panel order; no text, watermark, duplicate face or obvious anatomy issue observed.
- Product use: standard visual self-comparison only; no user image collection, identity recognition, biometric matching, health inference, ethnicity inference, lifespan inference or moral/personality conviction.

### `face-features-female.webp`

- Asset: `face-features-female.webp`.
- Gender: female.
- View/category order: frontal; straight brow, arched brow, naturally open eye, clearly defined nose, balanced upper/lower lips from left to right.
- Dimensions: 1500 × 600 px; WebP quality 84.
- Mirrored display plane: yes; each panel was mirrored individually and the five-feature order was preserved.
- Generation tool and date: built-in OpenAI image generation tool, 2026-07-20.
- Exact final prompt:

```text
Use case: scientific-educational
Asset type: premium website facial-feature self-comparison contact sheet
Primary request: five unmistakably different adult Chinese female frontal examples ordered left to right, each naturally emphasizing one assigned feature: very straight horizontal brow, clearly arched brow, naturally open larger eye, strongly defined straight nose, balanced full upper-and-lower lips
Scene/backdrop: one continuous plain charcoal-black studio background
Subject: exactly five different women with clearly different face shapes, ages and natural facial structures; neutral expressions; straight-on head-and-upper-shoulder portraits; every whole face remains visible; full forehead, chin and jaw visible; hair away from eyebrows and facial contour
Style/medium: photorealistic educational studio photography, realistic pores and natural variation, no beauty retouching
Composition/framing: exactly one horizontal row of five equal-width portraits; identical eye line, head size, crop, camera distance and lighting; all faces contained inside a central 5:2-safe horizontal band with sufficient top and bottom margin for deterministic crop
Lighting/mood: soft even neutral studio light, restrained and premium
Constraints: left-to-right assigned feature order must be immediately distinguishable yet anatomically natural; all five identities must be visibly unrelated and non-repeating; no text, labels, symbols, panels, borders, jewelry, conspicuous makeup, logos or watermark; plausible anatomy
Avoid: same-person variations, duplicate-like faces, close-up isolated parts, collage gaps, glamour styling, dramatic expression, cropped forehead/chin, identity-recognition or health-inference framing
```

- Anatomy and orientation QA: an earlier duplicate-like generation was rejected. The accepted sheet has five visibly unrelated identities of varied ages, clear assigned feature order, complete faces and plausible anatomy; no text or watermark observed.
- Product use: standard visual self-comparison only; no user image collection, identity recognition, biometric matching, health inference, ethnicity inference, lifespan inference or moral/personality conviction.

### `mole-male-front.webp`

- Asset: `mole-male-front.webp`.
- Gender: male.
- View/category order: straight-on front view.
- Dimensions: 1440 × 1080 px; WebP quality 84.
- Mirrored display plane: yes; the accepted front source was horizontally mirrored once during preparation.
- Generation tool and date: built-in OpenAI image generation tool, 2026-07-20.
- Exact final prompt:

```text
Use case: scientific-educational
Asset type: premium website mole-position self-comparison portrait
Primary request: one single adult Chinese man shown straight-on as a clean neutral facial-landmark reference
Scene/backdrop: plain uniform charcoal-black studio background
Subject: one adult Chinese man, neutral expression, direct frontal gaze, clean realistic skin with no conspicuous moles or freckle clusters, short hair swept fully away from forehead, temples, cheeks and jaw, no glasses, no facial hair, no jewelry, head and upper shoulders
Style/medium: photorealistic educational studio photography, realistic pores and natural variation, no beauty retouching
Composition/framing: centered symmetrical front view inside a landscape 4:3-safe composition; full forehead, both ears, chin, complete jaw and upper shoulders visible; generous even margin around the head for deterministic crop
Lighting/mood: soft even neutral studio light, restrained and premium, no harsh shadow
Constraints: exactly one person; unobstructed forehead, temples, eye area, cheeks, lips and jaw; anatomically plausible; no text, labels, symbols, hotspot marks, borders, logos or watermark
Avoid: glamour or fashion editorial styling, makeup, dramatic expression, head tilt, cropped landmarks, skin blemish clusters, identity-recognition or health-inference framing
```

- Anatomy and orientation QA: symmetrical frontal reference; all landmark regions, ears, forehead, chin and jaw remain visible after mirror/resize; identity matches both accepted side views; no conspicuous mole, text, watermark or anatomy issue observed.
- Product use: standard visual self-comparison only; no user image collection, identity recognition, biometric matching, health inference, ethnicity inference, lifespan inference or moral/personality conviction.

### `mole-male-left.webp`

- Asset: `mole-male-left.webp`.
- Gender: male.
- View/category order: user's/subject's own left-face view; nose points toward frame right.
- Dimensions: 1440 × 1080 px; WebP quality 84.
- Mirrored display plane: yes; generated and stored directly in final mirror orientation, with no blind post-generation flip.
- Generation tool and date: built-in OpenAI image generation tool, identity-preserving edit, 2026-07-20.
- Exact final prompt:

```text
Use case: identity-preserve
Asset type: premium website mole-position self-comparison portrait
Input images: Image 1 is the exact identity, wardrobe, studio lighting, charcoal background and framing reference
Primary request: change only the head pose to show this same man's own LEFT side in a clear three-quarter-to-near-profile view; his own left temple, left eye region, left cheek and left jaw must be closest to camera and fully unobstructed; in the delivered image his nose must point toward frame RIGHT
Style/medium: preserve the photorealistic educational studio photography and realistic unretouched skin from Image 1
Composition/framing: preserve a landscape 4:3-safe head-and-upper-shoulder composition, complete forehead, visible near ear, nose, chin and jaw, with generous crop margin
Lighting/mood: preserve soft even neutral studio light and charcoal-black background
Constraints: preserve the exact same identity, apparent age, hair, expression, shirt, skin texture, camera distance and lighting; change pose/view only; hair remains away from temple, cheek and jaw; no conspicuous moles; no text, labels, symbols, hotspot marks, borders, logos or watermark
Avoid: showing his right side, nose pointing frame left, mirrored duplicate artifacts, identity drift, glamour retouching, hidden landmarks, implausible anatomy
```

- Anatomy and orientation QA: same identity, age, hair, shirt and lighting as the male front view; nose points frame right; own-left temple, cheek and jaw are unobstructed; no text, watermark or anatomy issue observed.
- Product use: standard visual self-comparison only; no user image collection, identity recognition, biometric matching, health inference, ethnicity inference, lifespan inference or moral/personality conviction.

### `mole-male-right.webp`

- Asset: `mole-male-right.webp`.
- Gender: male.
- View/category order: user's/subject's own right-face view; nose points toward frame left.
- Dimensions: 1440 × 1080 px; WebP quality 84.
- Mirrored display plane: yes; generated and stored directly in final mirror orientation, with no blind post-generation flip.
- Generation tool and date: built-in OpenAI image generation tool, identity-preserving edit, 2026-07-20.
- Exact final prompt:

```text
Use case: identity-preserve
Asset type: premium website mole-position self-comparison portrait
Input images: Image 1 is the exact identity, wardrobe, studio lighting, charcoal background and framing reference
Primary request: change only the head pose to show this same man's own RIGHT side in a clear three-quarter-to-near-profile view; his own right temple, right eye region, right cheek and right jaw must be closest to camera and fully unobstructed; in the delivered image his nose must point toward frame LEFT
Style/medium: preserve the photorealistic educational studio photography and realistic unretouched skin from Image 1
Composition/framing: preserve a landscape 4:3-safe head-and-upper-shoulder composition, complete forehead, visible near ear, nose, chin and jaw, with generous crop margin
Lighting/mood: preserve soft even neutral studio light and charcoal-black background
Constraints: preserve the exact same identity, apparent age, hair, expression, shirt, skin texture, camera distance and lighting; change pose/view only; hair remains away from temple, cheek and jaw; no conspicuous moles; no text, labels, symbols, hotspot marks, borders, logos or watermark
Avoid: showing his left side, nose pointing frame right, mirrored duplicate artifacts, identity drift, glamour retouching, hidden landmarks, implausible anatomy
```

- Anatomy and orientation QA: same identity and studio treatment as the male front/left views; nose points frame left; own-right temple, cheek and jaw are unobstructed; no text, watermark or anatomy issue observed.
- Product use: standard visual self-comparison only; no user image collection, identity recognition, biometric matching, health inference, ethnicity inference, lifespan inference or moral/personality conviction.

### `mole-female-front.webp`

- Asset: `mole-female-front.webp`.
- Gender: female.
- View/category order: straight-on front view.
- Dimensions: 1440 × 1080 px; WebP quality 84.
- Mirrored display plane: yes; the accepted front source was horizontally mirrored once during preparation.
- Generation tool and date: built-in OpenAI image generation tool, 2026-07-20.
- Exact final prompt:

```text
Use case: scientific-educational
Asset type: premium website mole-position self-comparison portrait
Primary request: one single adult Chinese woman shown straight-on as a clean neutral facial-landmark reference
Scene/backdrop: plain uniform charcoal-black studio background
Subject: one adult Chinese woman, neutral expression, direct frontal gaze, clean realistic skin with no conspicuous moles or freckle clusters, natural hair pulled fully away from forehead, temples, cheeks and jaw, no glasses, no jewelry, no conspicuous makeup, head and upper shoulders
Style/medium: photorealistic educational studio photography, realistic pores and natural variation, no beauty retouching
Composition/framing: centered symmetrical front view inside a landscape 4:3-safe composition; full forehead, both ears, chin, complete jaw and upper shoulders visible; generous even margin around the head for deterministic crop
Lighting/mood: soft even neutral studio light, restrained and premium, no harsh shadow
Constraints: exactly one person; unobstructed forehead, temples, eye area, cheeks, lips and jaw; anatomically plausible; no text, labels, symbols, hotspot marks, borders, logos or watermark
Avoid: glamour or fashion editorial styling, makeup emphasis, dramatic expression, head tilt, cropped landmarks, skin blemish clusters, identity-recognition or health-inference framing
```

- Anatomy and orientation QA: symmetrical frontal reference; all landmark regions remain visible after mirror/resize; identity matches both accepted side views; no conspicuous mole, text, watermark or anatomy issue observed.
- Product use: standard visual self-comparison only; no user image collection, identity recognition, biometric matching, health inference, ethnicity inference, lifespan inference or moral/personality conviction.

### `mole-female-left.webp`

- Asset: `mole-female-left.webp`.
- Gender: female.
- View/category order: user's/subject's own left-face view; nose points toward frame right.
- Dimensions: 1440 × 1080 px; WebP quality 84.
- Mirrored display plane: yes; generated and stored directly in final mirror orientation, with no blind post-generation flip.
- Generation tool and date: built-in OpenAI image generation tool, identity-preserving edit, 2026-07-20.
- Exact final prompt:

```text
Use case: identity-preserve
Asset type: premium educational face-position self-comparison atlas
Input image: exact female identity and studio reference; edit target
Primary request: create the same exact adult Chinese woman in a three-quarter view showing her own LEFT temple, LEFT cheek, and LEFT jaw closest to the camera and fully unobstructed
Scene/backdrop: preserve the same plain charcoal-black studio background
Subject invariants: preserve her identity, facial proportions, age, realistic skin texture, pulled-back black hair, neutral expression, bare shoulders crop, clothing visibility, and all facial details; change only head pose and camera-facing view
Style/medium: photorealistic neutral educational studio portrait, no beauty retouching or glamour styling
Composition/framing: 4:3 landscape-safe centered head and upper shoulders; full forehead, left temple, left ear region, left cheek, chin and jaw visible; in the FINAL STORED IMAGE her nose points toward FRAME RIGHT, confirming this is the subject's own left-face view
Lighting/mood: identical soft even neutral studio lighting
Constraints: same person, plausible anatomy, clean skin with no conspicuous mole or freckle cluster; no text, labels, symbols, arrows, overlays, jewelry, glasses, logos, watermark, borders or extra people; do not crop forehead or chin
Avoid: changing identity, hairstyle, age, makeup, background, camera style, skin tone or wardrobe; no front view; no subject-right view; no mirror ambiguity
```

- Anatomy and orientation QA: same identity, proportions, hair, skin and studio treatment as the female front view; nose points frame right; own-left temple, ear region, cheek and jaw are unobstructed; no text, watermark or anatomy issue observed.
- Product use: standard visual self-comparison only; no user image collection, identity recognition, biometric matching, health inference, ethnicity inference, lifespan inference or moral/personality conviction.

### `mole-female-right.webp`

- Asset: `mole-female-right.webp`.
- Gender: female.
- View/category order: user's/subject's own right-face view; nose points toward frame left and the visible ear is on frame right.
- Dimensions: 1440 × 1080 px; WebP quality 84.
- Mirrored display plane: yes; generated and stored directly in final mirror orientation, with no blind post-generation flip.
- Generation tool and date: built-in OpenAI image generation tool, identity-preserving edit correction, 2026-07-20.
- Exact final prompt:

```text
Use case: identity-preserve
Asset type: educational face-position atlas, opposite-side pose correction
Input image: exact female identity; preserve this same person
Primary request: rotate her head to reveal the OPPOSITE side from a left-profile image: show her own RIGHT temple, RIGHT cheek, RIGHT ear region and RIGHT jaw to camera
Mandatory direction check: her NOSE MUST POINT TOWARD THE LEFT BORDER OF THE IMAGE; the tip of the nose must sit left of the face center; her visible ear must be on the RIGHT HALF of the image. If the nose points right, the result is wrong.
Scene/backdrop: same plain charcoal-black studio background
Subject invariants: same exact adult Chinese woman, same age, facial proportions, realistic skin texture, pulled-back black hair, neutral expression, bare-shoulder crop and lighting; change only yaw/head pose
Style/medium: photorealistic neutral educational studio portrait, no glamour or beauty retouching
Composition/framing: 4:3 landscape-safe head and upper shoulders, full forehead/chin, right temple/cheek/jaw unobstructed
Constraints: plausible anatomy; no conspicuous mole; no text, labels, symbols, arrows, overlays, jewelry, glasses, logos, watermark, borders or extra people
Avoid: nose pointing right; subject's own left-face view; front view; identity drift; hairstyle, age, makeup, background, skin tone or crop change
```

- Anatomy and orientation QA: the first own-right attempt was rejected because its nose pointed frame right and duplicated the own-left orientation. The accepted correction matches the female front/left identity, points its nose frame left, places the visible ear on frame right and keeps the own-right temple, cheek and jaw unobstructed; no text, watermark or anatomy issue observed.
- Product use: standard visual self-comparison only; no user image collection, identity recognition, biometric matching, health inference, ethnicity inference, lifespan inference or moral/personality conviction.
