from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto('http://localhost:3000', timeout=15000)
    page.wait_for_load_state('domcontentloaded')
    page.wait_for_timeout(4000)
    
    # Check computed styles of body
    body_bg = page.evaluate('getComputedStyle(document.body).backgroundColor')
    body_font = page.evaluate('getComputedStyle(document.body).fontFamily')
    print(f"Body bg: {body_bg}")
    print(f"Body font: {body_font}")
    
    # Check if fire-text gradient is applied
    fire_text = page.evaluate('''() => {
        const el = document.querySelector('.fire-text');
        if (!el) return "NO fire-text element";
        return getComputedStyle(el).backgroundImage;
    }''')
    print(f"Fire-text gradient: {fire_text}")
    
    # Check if section backgrounds work
    about_bg = page.evaluate('''() => {
        const el = document.querySelector('#about');
        if (!el) return "NO about section";
        return getComputedStyle(el).backgroundColor;
    }''')
    print(f"About bg: {about_bg}")
    
    # Check if cards have border
    card_border = page.evaluate('''() => {
        const cards = document.querySelectorAll('[class*="rounded-lg"]');
        if (cards.length === 0) return "NO cards found";
        return getComputedStyle(cards[0]).borderColor;
    }''')
    print(f"Card border: {card_border}")
    
    # Check nav
    nav_bg = page.evaluate('''() => {
        const nav = document.querySelector('nav');
        if (!nav) return "NO nav";
        return getComputedStyle(nav).backgroundColor;
    }''')
    print(f"Nav bg: {nav_bg}")
    
    # Check if Tailwind utilities are generating
    has_util = page.evaluate('''() => {
        const sheets = document.styleSheets;
        let tw_rules = 0;
        for (let s of sheets) {
            try {
                for (let r of s.cssRules) {
                    if (r.selectorText && r.selectorText.includes('bg-')) tw_rules++;
                }
            } catch(e) {}
        }
        return tw_rules;
    }''')
    print(f"Tailwind bg-* rules found: {has_util}")
    
    # Get all link/style elements
    links = page.evaluate('''() => {
        return Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(e => e.href || 'inline-style');
    }''')
    print(f"Stylesheets: {links}")
    
    browser.close()
    print("Done!")
