#!/usr/bin/env python3
"""
Generate PowerPoint slides for Video 3: One Server, Unlimited Scenarios

Run: python3 create-video-3-slides.py
Output: video-03-one-server-unlimited-scenarios.pptx
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# Create presentation with 16:9 aspect ratio
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Color palette
DARK_BG = RGBColor(24, 24, 27)  # zinc-900
WHITE = RGBColor(255, 255, 255)
RED = RGBColor(239, 68, 68)  # red-500
YELLOW = RGBColor(245, 158, 11)  # amber-500
GREEN = RGBColor(34, 197, 94)  # green-500
BLUE = RGBColor(59, 130, 246)  # blue-500
GRAY = RGBColor(161, 161, 170)  # zinc-400
PURPLE = RGBColor(168, 85, 247)  # purple-500
CYAN = RGBColor(6, 182, 212)  # cyan-500


def add_dark_slide(prs):
    """Add a slide with dark background."""
    blank_layout = prs.slide_layouts[6]  # Blank layout
    slide = prs.slides.add_slide(blank_layout)
    # Add dark background shape
    bg = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height
    )
    bg.fill.solid()
    bg.fill.fore_color.rgb = DARK_BG
    bg.line.fill.background()
    return slide


def add_title(slide, text, top=Inches(2.5), font_size=60, color=WHITE):
    """Add centered title text."""
    txBox = slide.shapes.add_textbox(Inches(0.5), top, Inches(12.333), Inches(1.5))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = True
    p.font.color.rgb = color
    p.alignment = PP_ALIGN.CENTER
    return txBox


def add_subtitle(slide, text, top=Inches(4), font_size=32, color=GRAY):
    """Add centered subtitle text."""
    txBox = slide.shapes.add_textbox(Inches(1), top, Inches(11.333), Inches(1))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = color
    p.alignment = PP_ALIGN.CENTER
    return txBox


def add_code_block(slide, code, left, top, width, height):
    """Add a code block with monospace font."""
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(39, 39, 42)  # zinc-800
    shape.line.fill.background()

    txBox = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), width - Inches(0.4), height - Inches(0.4))
    tf = txBox.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.text = code
    p.font.size = Pt(14)
    p.font.name = "Menlo"
    p.font.color.rgb = RGBColor(228, 228, 231)  # zinc-200
    return shape


def add_bullet_point(slide, text, left, top, color=WHITE, icon=""):
    """Add a bullet point with optional icon."""
    txBox = slide.shapes.add_textbox(left, top, Inches(10), Inches(0.6))
    tf = txBox.text_frame
    p = tf.paragraphs[0]
    p.text = f"{icon}  {text}" if icon else text
    p.font.size = Pt(28)
    p.font.color.rgb = color
    return txBox


# ============================================================================
# SLIDE 1: Title Slide
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "One Server", top=Inches(2.5), font_size=72)
add_title(slide, "Unlimited Scenarios", top=Inches(3.8), font_size=72, color=YELLOW)

# ============================================================================
# SLIDE 2: Hook - Pick Up From Video 2
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "Remember the Testing Problem Table?", top=Inches(2.5), font_size=48)
add_subtitle(slide, "Let's fix it.", top=Inches(4), font_size=40, color=YELLOW)

# ============================================================================
# SLIDE 3: Testing Problem Table Summary
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "The Problem", top=Inches(0.5), font_size=40)

add_bullet_point(slide, "Happy path", Inches(1.5), Inches(1.5), GREEN, "Easy")
add_bullet_point(slide, "Different user tiers", Inches(1.5), Inches(2.2), YELLOW, "Annoying")
add_bullet_point(slide, "Offer ended / limited stock", Inches(1.5), Inches(2.9), RED, "Hard")
add_bullet_point(slide, "Offer ends during checkout", Inches(1.5), Inches(3.6), RED, "Impossible")
add_bullet_point(slide, "50 tests in parallel", Inches(1.5), Inches(4.3), RED, "Impossible")

add_subtitle(slide, "We need to control what external APIs return.", top=Inches(5.5), font_size=28, color=WHITE)

# ============================================================================
# SLIDE 4: The Core Insight
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "The Core Insight", top=Inches(1.5), font_size=48)
add_subtitle(slide, "We don't need these services to actually do anything.", top=Inches(3), font_size=32, color=WHITE)
add_subtitle(slide, "We just need them to return the responses we want.", top=Inches(4), font_size=32, color=YELLOW)

# ============================================================================
# SLIDE 5: The Question
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "What if we could control", top=Inches(2.5), font_size=44)
add_title(slide, "what these services return?", top=Inches(3.5), font_size=44)
add_subtitle(slide, "Without touching them at all.", top=Inches(5), font_size=36, color=YELLOW)

# ============================================================================
# SLIDE 6: Scenarist Introduction
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "Scenarist", top=Inches(1.5), font_size=64, color=YELLOW)
add_subtitle(slide, "Intercepts HTTP requests before they reach services.", top=Inches(3), font_size=32, color=WHITE)
add_subtitle(slide, "Returns whatever you specify.", top=Inches(4), font_size=32, color=GREEN)

# ============================================================================
# SLIDE 7: Architecture Overview
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "Framework-Agnostic Architecture", top=Inches(0.4), font_size=40)

# Diagram boxes
box_width = Inches(5)
box_height = Inches(1)
center_left = Inches(4.166)

# Test box
box1 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, center_left, Inches(1.3), box_width, box_height)
box1.fill.solid()
box1.fill.fore_color.rgb = BLUE
box1.line.fill.background()
txBox = slide.shapes.add_textbox(center_left, Inches(1.5), box_width, box_height)
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "Your Test"
p.font.size = Pt(24)
p.font.bold = True
p.font.color.rgb = WHITE
p.alignment = PP_ALIGN.CENTER

# Arrow
add_subtitle(slide, "|", top=Inches(2.15), font_size=24, color=GRAY)

# Core box
box2 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, center_left, Inches(2.6), box_width, box_height)
box2.fill.solid()
box2.fill.fore_color.rgb = YELLOW
box2.line.fill.background()
txBox = slide.shapes.add_textbox(center_left, Inches(2.8), box_width, box_height)
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "Scenarist Core"
p.font.size = Pt(24)
p.font.bold = True
p.font.color.rgb = DARK_BG
p.alignment = PP_ALIGN.CENTER

add_subtitle(slide, "Framework-agnostic", top=Inches(3.5), font_size=18, color=GRAY)

# Arrow
add_subtitle(slide, "|", top=Inches(3.75), font_size=24, color=GRAY)

# Adapter box
box3 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, center_left, Inches(4.2), box_width, box_height)
box3.fill.solid()
box3.fill.fore_color.rgb = GREEN
box3.line.fill.background()
txBox = slide.shapes.add_textbox(center_left, Inches(4.4), box_width, box_height)
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "Framework Adapter"
p.font.size = Pt(24)
p.font.bold = True
p.font.color.rgb = WHITE
p.alignment = PP_ALIGN.CENTER

add_subtitle(slide, "Express / Next.js / Fastify / Hono", top=Inches(5.1), font_size=18, color=GRAY)

# Arrow
add_subtitle(slide, "|", top=Inches(5.35), font_size=24, color=GRAY)

# MSW box
box4 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, center_left, Inches(5.8), box_width, box_height)
box4.fill.solid()
box4.fill.fore_color.rgb = PURPLE
box4.line.fill.background()
txBox = slide.shapes.add_textbox(center_left, Inches(6), box_width, box_height)
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "MSW (Interception)"
p.font.size = Pt(24)
p.font.bold = True
p.font.color.rgb = WHITE
p.alignment = PP_ALIGN.CENTER

# ============================================================================
# SLIDE 8: Key Point - Adapters
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "Using Express today?", top=Inches(2), font_size=44)
add_title(slide, "Migrating to Next.js tomorrow?", top=Inches(3.2), font_size=44)
add_subtitle(slide, "The patterns are the same.", top=Inches(4.8), font_size=40, color=WHITE)
add_title(slide, "Only the adapter changes.", top=Inches(5.8), font_size=36, color=YELLOW)

# ============================================================================
# SLIDE 9: Live Demo - Setup
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "Live Demo", top=Inches(0.5), font_size=48, color=YELLOW)

# Three terminals
term_width = Inches(3.8)
term_height = Inches(2)
term_gap = Inches(0.4)
term_start = Inches(0.8)

# Terminal 1: Next.js
box1 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, term_start, Inches(1.8), term_width, term_height)
box1.fill.solid()
box1.fill.fore_color.rgb = RGBColor(39, 39, 42)
box1.line.fill.background()

txBox = slide.shapes.add_textbox(term_start + Inches(0.2), Inches(2), term_width - Inches(0.4), Inches(1.6))
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "Next.js"
p.font.size = Pt(20)
p.font.bold = True
p.font.color.rgb = WHITE
p = tf.add_paragraph()
p.text = "pnpm dev"
p.font.size = Pt(16)
p.font.name = "Menlo"
p.font.color.rgb = GREEN

# Terminal 2: json-server
box2 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, term_start + term_width + term_gap, Inches(1.8), term_width, term_height)
box2.fill.solid()
box2.fill.fore_color.rgb = RGBColor(39, 39, 42)
box2.line.fill.background()

txBox = slide.shapes.add_textbox(term_start + term_width + term_gap + Inches(0.2), Inches(2), term_width - Inches(0.4), Inches(1.6))
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "Inventory Service"
p.font.size = Pt(20)
p.font.bold = True
p.font.color.rgb = WHITE
p = tf.add_paragraph()
p.text = "npm run inventory"
p.font.size = Pt(16)
p.font.name = "Menlo"
p.font.color.rgb = GREEN
p = tf.add_paragraph()
p.text = "Watch for requests..."
p.font.size = Pt(14)
p.font.color.rgb = GRAY

# Terminal 3: Playwright
box3 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, term_start + 2 * (term_width + term_gap), Inches(1.8), term_width, term_height)
box3.fill.solid()
box3.fill.fore_color.rgb = RGBColor(39, 39, 42)
box3.line.fill.background()

txBox = slide.shapes.add_textbox(term_start + 2 * (term_width + term_gap) + Inches(0.2), Inches(2), term_width - Inches(0.4), Inches(1.6))
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "Playwright"
p.font.size = Pt(20)
p.font.bold = True
p.font.color.rgb = WHITE
p = tf.add_paragraph()
p.text = "npx playwright test"
p.font.size = Pt(16)
p.font.name = "Menlo"
p.font.color.rgb = GREEN

add_subtitle(slide, "PayFlow with Scenarist installed", top=Inches(4.3), font_size=28, color=WHITE)

# ============================================================================
# SLIDE 10: Demo Test 1
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "Test 1: Happy Path", top=Inches(0.5), font_size=40)

code = """test('happy path checkout', async ({ page, switchScenario }) => {
  await switchScenario('default');
  await page.goto('/products');
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout"]');
  await page.click('[data-testid="pay"]');
  await expect(page.getByText('Order confirmed')).toBeVisible();
});"""

add_code_block(slide, code, Inches(1), Inches(1.5), Inches(11.333), Inches(3.2))
add_title(slide, "PASS", top=Inches(5.2), font_size=48, color=GREEN)

# ============================================================================
# SLIDE 11: Demo Test 2
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "Test 2: Payment Declined", top=Inches(0.5), font_size=40)

code = """test('payment declined shows error', async ({ page, switchScenario }) => {
  await switchScenario('paymentDeclined');
  await page.goto('/checkout');
  await page.click('[data-testid="pay"]');
  await expect(page.getByText('Card declined')).toBeVisible();
});"""

add_code_block(slide, code, Inches(1), Inches(1.5), Inches(11.333), Inches(2.8))
add_title(slide, "PASS", top=Inches(4.8), font_size=48, color=GREEN)
add_subtitle(slide, "Didn't change anything in Stripe.", top=Inches(5.8), font_size=28, color=YELLOW)

# ============================================================================
# SLIDE 12: Demo Test 3
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "Test 3: Offer Ended", top=Inches(0.5), font_size=40)

code = """test('offer ended prevents purchase', async ({ page, switchScenario }) => {
  await switchScenario('offerEnded');
  await page.goto('/products');
  await expect(page.getByText('Offer Ended')).toBeVisible();
});"""

add_code_block(slide, code, Inches(1), Inches(1.5), Inches(11.333), Inches(2.4))
add_title(slide, "PASS", top=Inches(4.4), font_size=48, color=GREEN)
add_subtitle(slide, "Didn't edit db.json.", top=Inches(5.4), font_size=28, color=YELLOW)

# ============================================================================
# SLIDE 13: Zero Requests
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "Inventory Service Terminal:", top=Inches(1.5), font_size=40)

# Big zero box
zero_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(3), Inches(2.8), Inches(7.333), Inches(2.5))
zero_box.fill.solid()
zero_box.fill.fore_color.rgb = RGBColor(22, 101, 52)  # green-800
zero_box.line.fill.background()

txBox = slide.shapes.add_textbox(Inches(3.2), Inches(3.2), Inches(6.933), Inches(1.7))
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "0 Requests"
p.font.size = Pt(72)
p.font.bold = True
p.font.color.rgb = GREEN
p.alignment = PP_ALIGN.CENTER

add_subtitle(slide, "Scenarist intercepted everything.", top=Inches(5.8), font_size=32, color=YELLOW)

# ============================================================================
# SLIDE 14: The Result
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "Three scenarios that were", top=Inches(2), font_size=44)
add_title(slide, "'hard' or 'impossible'", top=Inches(3), font_size=52, color=RED)
add_title(slide, "Now they're just... tests.", top=Inches(4.5), font_size=52, color=GREEN)

# ============================================================================
# SLIDE 15: Parallel Testing Question
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "But wait...", top=Inches(2), font_size=44, color=GRAY)
add_title(slide, "What about parallel tests?", top=Inches(3.5), font_size=52)
add_subtitle(slide, "The table said that was impossible too.", top=Inches(5), font_size=28, color=GRAY)

# ============================================================================
# SLIDE 16: Test ID Isolation
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "Test ID Isolation", top=Inches(0.5), font_size=44, color=YELLOW)

add_subtitle(slide, "Every request includes: x-scenarist-test-id", top=Inches(1.5), font_size=28, color=WHITE)

# Test isolation diagram
box_width = Inches(10)
row_height = Inches(0.9)
row_start = Inches(2.3)
left = Inches(1.666)

# Test A
box_a = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, row_start, box_width, row_height)
box_a.fill.solid()
box_a.fill.fore_color.rgb = RGBColor(39, 39, 42)
box_a.line.fill.background()
txBox = slide.shapes.add_textbox(left + Inches(0.3), row_start + Inches(0.2), box_width - Inches(0.6), row_height)
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "Test A (test-id: abc123)  premiumUser  20% discount"
p.font.size = Pt(22)
p.font.color.rgb = GREEN

# Test B
box_b = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, row_start + row_height + Inches(0.2), box_width, row_height)
box_b.fill.solid()
box_b.fill.fore_color.rgb = RGBColor(39, 39, 42)
box_b.line.fill.background()
txBox = slide.shapes.add_textbox(left + Inches(0.3), row_start + row_height + Inches(0.4), box_width - Inches(0.6), row_height)
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "Test B (test-id: def456)  freeUser     Full price"
p.font.size = Pt(22)
p.font.color.rgb = BLUE

# Test C
box_c = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, row_start + 2 * (row_height + Inches(0.2)), box_width, row_height)
box_c.fill.solid()
box_c.fill.fore_color.rgb = RGBColor(39, 39, 42)
box_c.line.fill.background()
txBox = slide.shapes.add_textbox(left + Inches(0.3), row_start + 2 * (row_height + Inches(0.2)) + Inches(0.2), box_width - Inches(0.6), row_height)
tf = txBox.text_frame
p = tf.paragraphs[0]
p.text = "Test C (test-id: ghi789)  offerEnded   'Offer Ended'"
p.font.size = Pt(22)
p.font.color.rgb = YELLOW

add_subtitle(slide, "Same server. Same endpoint.", top=Inches(5.5), font_size=32, color=WHITE)
add_title(slide, "Different responses. Completely isolated.", top=Inches(6.2), font_size=32, color=GREEN)

# ============================================================================
# SLIDE 17: 50 Tests
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "50 tests in parallel?", top=Inches(2.5), font_size=52)
add_title(slide, "Zero conflicts.", top=Inches(4), font_size=60, color=GREEN)

# ============================================================================
# SLIDE 18: The Killer Scenario Tease
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "But what about...", top=Inches(0.8), font_size=40, color=GRAY)
add_title(slide, "'Offer ends during checkout'?", top=Inches(2), font_size=44, color=RED)
add_subtitle(slide, "That was truly impossible.", top=Inches(3.2), font_size=28, color=GRAY)

add_subtitle(slide, "That requires sequences:", top=Inches(4.2), font_size=28, color=WHITE)

code = """sequence: [
  { quantity: 15, reserved: 0 },   // First call: available
  { quantity: 0, reserved: 0 },    // Second call: offer ended
]"""

add_code_block(slide, code, Inches(2), Inches(5), Inches(9.333), Inches(1.8))

# ============================================================================
# SLIDE 19: Next Video
# ============================================================================
slide = add_dark_slide(prs)
add_title(slide, "Next:", top=Inches(2), font_size=36, color=GRAY)
add_title(slide, "Response Sequences", top=Inches(3), font_size=56)
add_subtitle(slide, "Testing state changes over time.", top=Inches(4.5), font_size=32, color=WHITE)

# ============================================================================
# Save the presentation
# ============================================================================
output_path = "video-03-one-server-unlimited-scenarios.pptx"
prs.save(output_path)
print(f"Presentation saved to: {output_path}")
