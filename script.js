
I want you to act as a senior Three.js + Frontend engineer and  building a cinematic, realistic 3D Flipbook Photo Album using HTML + CSS + JavaScript + Three.js.improving this project.
CORE PRODUCT IDEA
Create a premium wedding-album style 3D flipbook that feels like a real physical photo book.
The experience must feel: • Cinematic
• Emotional
• Smooth & realistic
• Mobile friendly
• Lightweight but high quality
Target: Luxury wedding / family album feel
APPLICATION MODES
👨‍👩‍👧 Viewer Mode (Public)
Default mode when site opens.
Users can: • See the 3D book on a table
• Click anywhere → flip page forward
• Swipe left/right on mobile → flip pages
• Pinch zoom camera
• Enter fullscreen
• Background music auto-plays after first interaction
Viewer mode must be clean:
No admin UI visible
No upload controls
Admin Mode
Activated using query parameter:

?admin
Admin can manage the album inside the browser:
Admin features: • Upload multiple images
• Create / replace album
• Add new page
• Delete page
• Select which page to edit
• Reorder pages
• Save album to localStorage
• Everything works without backend
Max supported pages: 22 images
PAGE STRUCTURE LOGIC
Images are stored as a single array:

album = [img1, img2, img3, ...]
Pages are generated like a real book:
Book Part
Behavior
Front Cover
Hard cover (thick)
Back Cover
Hard cover (thick)
Inner Pages
Thin flexible pages
Page pairing logic:

Page 1:  Front Cover  → Image 1
Page 2+: Inner pages  → Image pairs
Last Page: Back Cover → Last image
BOOK DESIGN REQUIREMENTS
FRONT COVER (Hard Cover)
Must feel like a real wedding album cover:
Visual style: • Thick hard material
• Slight roughness / leather feel
• Strong shadows
• Slight reflection
• More rigid page curl (almost none)
• Title text emboss feel (future enhancement)
Physics: • Higher thickness than pages
• Higher stiffness (minimal bending)
• Heavier page flip animation
BACK COVER
Similar to front cover but simpler.
• Same thickness
• Same stiffness
• Slight shadow
• Acts as book end stopper
INNER PAGES
Must feel like real printed photo paper.
Visual: • Thin paper
• Slight translucency feel
• Soft reflections
• High quality photo textures
Physics: • Flexible bending
• Smooth page curl deformation
• Slight delay during flipping
• Natural easing motion
REALISM REQUIREMENTS (VERY IMPORTANT)
This flipbook must feel like a physical object.
Book Physics to Implement / Improve
1. Page Curl Physics
• Non-linear bending
• Progressive curl from spine → edge
• Use sine curve deformation
• Add subtle page thickness illusion
2. Book Spine
• Pages rotate from a fixed spine pivot
• Slight page stacking thickness
• Spine width visible when pages flip
3. Page Stack Depth
• Each page offset slightly on Z axis
• Avoid backside overlapping bug
4. Page Flip Animation
• Smooth easing (not linear)
• Slight delay between pages
• Momentum feel
5. Shadows & Lighting
• Soft table shadow
• Directional light from top corner
• Ambient fill light
MOBILE EXPERIENCE
Must work smoothly on phones.
Required gestures: • Tap → next page
• Swipe left → next page
• Swipe right → previous page
• Pinch → zoom camera
Target: Stable 60fps
PERFORMANCE REQUIREMENTS
Even with high-quality images, app must stay lightweight.
Required optimizations: • Auto resize uploaded images
• Auto convert images → WebP
• Limit renderer pixel ratio
• Texture compression
• Avoid memory leaks
• Lazy load textures if needed
IMAGE SPECIFICATIONS
Images uploaded by admin should be auto processed:
Convert → WebP (quality ~0.8)
Resize → Max 2048px (or 4096px high-end)
Goal: Balance between: • High visual quality
• Fast loading
• Mobile compatibility
The final result should feel like:
“Opening a luxury wedding album on a table in real life.”
Emotional, smooth, premium.
When I ask for code: • Always provide FULL working code
• Tell exactly what to replace
• Assume static website (no backend)
• Continue project step-by-step
