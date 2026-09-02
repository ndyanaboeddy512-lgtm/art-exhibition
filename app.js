/**
 * EDDY PRO — Editorial Luxury Fine Art Gallery
 * Core Application Engine & Data Bridge
 */

// Default Fallback Seed Catalog (Guarantees zero-failure standalone execution)
const DEFAULT_ARTWORKS = [
  {
    id: "art-01",
    title: "Nocturne en Terre d'Ombre",
    artist: "Éléonore Vance",
    year: 2025,
    medium: "Oil and raw earth pigment on Belgian linen",
    dimensions: "190 × 140 cm / 74.8 × 55.1 in",
    price: 24500,
    status: "Available",
    framing: "Bespoke floating raw oak tray frame with 2cm shadow gap",
    frameOptions: ["Floating Charcoal Oak", "Brushed Gilded Brass", "Natural Scandinavian Maple", "Unframed Gallery Linen"],
    provenance: "Direct from the artist's studio, Paris. Exhibited at Biennale d'Art Contemporain 2025. Accompanied by artist-signed Certificate of Authenticity.",
    curatorialStatement: "A masterwork of subtle atmospheric tension. Vance layers raw Moroccan earth pigments with slow-drying linseed, creating a velvety chiaroscuro surface that breathes under shifting natural daylight.",
    featured: true,
    image: "images/art-01.jpg",
    highResZoom: "images/art-01.jpg"
  },
  {
    id: "art-02",
    title: "Monolith & Ochre Resonance",
    artist: "Mateo Rossi",
    year: 2024,
    medium: "Aged bronze patinated with iron chloride and volcanic ash",
    dimensions: "78 × 42 × 35 cm / 30.7 × 16.5 × 13.8 in",
    price: 19800,
    status: "Available",
    framing: "Presented upon a custom honed Nero Marquina marble plinth",
    frameOptions: ["Nero Marquina Plinth", "Brushed Steel Pedestal", "Minimalist Raw Concrete Base"],
    provenance: "Cast in the historic artistic foundry of Pietrasanta, Italy. Private collection preview, Zürich, 2024.",
    curatorialStatement: "Rossi's monumental geometry explores weight, stillness, and balance. The deep tactile patination evokes geological millennia within a crisp modernist silhouette.",
    featured: true,
    image: "images/art-02.jpg",
    highResZoom: "images/art-02.jpg"
  },
  {
    id: "art-03",
    title: "Fragment of White Silence",
    artist: "Soren Lindqvist",
    year: 2025,
    medium: "Heavy textured lime plaster, marble dust, and gypsum on marine ply",
    dimensions: "160 × 130 cm / 63.0 × 51.2 in",
    price: 16500,
    status: "Available",
    framing: "Recessed white lacquered shadowbox with museum UV70 anti-reflective glazing",
    frameOptions: ["Recessed White Shadowbox", "Floating Charcoal Oak", "Brushed Gilded Brass", "Unframed Raw Edge"],
    provenance: "Stockholm Studio Archive. Exhibited at Nordiska Konsthallen, 2025.",
    curatorialStatement: "Lindqvist manipulates lime plaster through controlled drying fractures, revealing meditative relief canyons that cast kinetic micro-shadows as ambient light transitions.",
    featured: false,
    image: "images/art-03.jpg",
    highResZoom: "images/art-03.jpg"
  },
  {
    id: "art-04",
    title: "Composition in Sienna and Bone",
    artist: "Clara Beauchamp",
    year: 2024,
    medium: "Mineral pigments and cold wax on hand-stretched raw linen",
    dimensions: "175 × 150 cm / 68.9 × 59.1 in",
    price: 22000,
    status: "Reserved",
    framing: "Hand-gilded aged bronze-leaf cap moulding",
    frameOptions: ["Aged Bronze Leaf", "Floating Charcoal Oak", "Natural Scandinavian Maple"],
    provenance: "Acquired through Eddy Pro private salon, New York. Currently held under acquisition reservation.",
    curatorialStatement: "A dialogue between organic translucency and rigid compositional architecture. Beauchamp's beeswax layering lends an inner luminosity akin to ancient encaustic murals.",
    featured: false,
    image: "images/art-04.jpg",
    highResZoom: "images/art-04.jpg"
  },
  {
    id: "art-05",
    title: "The Architecture of Oblivion",
    artist: "Kaito Moriyama",
    year: 2023,
    medium: "Sumi ink, crushed lapis lazuli, and bone glue on hand-milled kozo paper",
    dimensions: "210 × 120 cm / 82.7 × 47.2 in",
    price: 31000,
    status: "Sold",
    framing: "Custom frameless acrylic capsule mount with museum preservation seal",
    frameOptions: ["Museum Acrylic Capsule", "Floating Charcoal Oak"],
    provenance: "Private Collection, Geneva. Previously showcased at Tokyo Metropolitan Arts Pavilion.",
    curatorialStatement: "Moriyama invokes the traditional void (ma) in a scale that overwhelms the viewer's periphery. The deep crystalline blue shimmers subtly against intense matte black ink.",
    featured: false,
    image: "images/art-05.jpg",
    highResZoom: "images/art-05.jpg"
  },
  {
    id: "art-06",
    title: "L'Heure Dorée (Golden Horizon)",
    artist: "Éléonore Vance",
    year: 2025,
    medium: "Oil, 23.75-karat gold leaf, and copal varnish on panel",
    dimensions: "140 × 140 cm / 55.1 × 55.1 in",
    price: 27500,
    status: "Available",
    framing: "Brushed champagne gold floating frame with matching inner reveal",
    frameOptions: ["Brushed Gilded Brass", "Floating Charcoal Oak", "Natural Scandinavian Maple"],
    provenance: "Direct studio accession, Paris. Certified original 1-of-1 archive.",
    curatorialStatement: "Explores the alchemy between physical gold leaf and delicate translucent oil glazes. The painting dynamically catches ambient room illumination, transforming throughout the day.",
    featured: false,
    image: "images/art-06.jpg",
    highResZoom: "images/art-06.jpg"
  },
  {
    id: "art-07",
    title: "Form & Void III (Brutalist Study)",
    artist: "Mateo Rossi",
    year: 2025,
    medium: "Solid hand-chiseled Carrara marble and oxidized corten steel",
    dimensions: "95 × 50 × 30 cm / 37.4 × 19.7 × 11.8 in",
    price: 26000,
    status: "Available",
    framing: "Architectural freestanding installation with counterweight brass base",
    frameOptions: ["Architectural Pedestal", "Nero Marquina Plinth"],
    provenance: "Eddy Pro Contemporary Pavilion collection. Solo exhibition 2025.",
    curatorialStatement: "A breathtaking confrontation of Carrara marble's velvety smoothness juxtaposed against rugged, rust-patinated corten steel. A meditation on architectural permanence.",
    featured: false,
    image: "images/art-07.jpg",
    highResZoom: "images/art-07.jpg"
  },
  {
    "id": "art-08",
    "title": "Tension in Neutralis",
    "artist": "Soren Lindqvist",
    "year": 2025,
    "medium": "Raw jute, oil pigment, chalk, and natural gum on cedar stretcher",
    "dimensions": "200 × 160 cm / 78.7 × 63.0 in",
    "price": 21500,
    "status": "Available",
    "framing": "Minimalist blackened steel profile frame",
    "frameOptions": ["Floating Charcoal Oak", "Brushed Gilded Brass", "Natural Scandinavian Maple", "Raw Canvas Edge"],
    "provenance": "Stockholm Art Fair 2025, Eddy Pro Curated Pavilion.",
    "curatorialStatement": "Rich textural interplay where exposed rough jute fibers puncture through creamy gestural chalk strata, invoking raw Scandinavian landscapes.",
    "featured": false,
    "image": "images/art-08.jpg",
    "highResZoom": "images/art-08.jpg"
  }
];

const DEFAULT_INQUIRIES = [
  {
    id: "inq-101",
    artworkId: "art-04",
    artworkTitle: "Composition in Sienna and Bone",
    artworkArtist: "Clara Beauchamp",
    artworkPrice: 22000,
    artworkImage: "images/art-04.jpg",
    collectorName: "Lord Alistair Sterling",
    collectorEmail: "a.sterling@mayfairholdings.co.uk",
    collectorPhone: "+44 20 7946 0912",
    framePreference: "Hand-gilded aged bronze-leaf cap moulding",
    notes: "Inquiring on behalf of a private Mayfair residence. Requesting courier condition report and provenance documentation.",
    status: "Contacted",
    date: "2026-08-28T14:20:00Z",
    curatorNotes: "Spoke with client advisor. Sent physical certificate of authenticity scan & high-res UV condition report."
  },
  {
    id: "inq-102",
    artworkId: "art-01",
    artworkTitle: "Nocturne en Terre d'Ombre",
    artworkArtist: "Éléonore Vance",
    artworkPrice: 24500,
    artworkImage: "images/art-01.jpg",
    collectorName: "Margaux Delacroix",
    collectorEmail: "margaux.delacroix@artcapital.fr",
    collectorPhone: "+33 6 55 58 41 90",
    framePreference: "Floating Charcoal Oak",
    notes: "We are designing a penthouse on Île Saint-Louis. Would like to reserve this piece subject to viewing in Paris.",
    status: "Pending",
    date: "2026-09-01T09:45:00Z",
    curatorNotes: "Initial inquiry logged. Follow-up scheduled with senior curator."
  }
];

// Unified Data Store
const EddyStore = {
  isBackendConnected: false,
  artworks: [],
  inquiries: [],
  currency: (localStorage.getItem('eddy_currency') === 'RWF' ? 'RWF' : 'USD'),
  exchangeRates: { USD: 1.0, RWF: 1400 },
  currencySymbols: { USD: '$', RWF: 'FRw ' },
  wishlist: JSON.parse(localStorage.getItem('eddy_wishlist') || '[]'),
  currentCollector: JSON.parse(localStorage.getItem('eddy_collector_session') || 'null'),

  async init() {
    // Attempt connecting to the lightweight Express REST API
    try {
      const res = await fetch('/api/artworks');
      if (res.ok) {
        this.artworks = await res.json();
        this.isBackendConnected = true;
        this.saveArtworksLocally();
        console.log(`✓ Connected to Eddy Pro Express Backend (${this.artworks.length} artworks loaded)`);
      } else {
        throw new Error('API responded with non-200');
      }
    } catch (err) {
      console.warn('Backend server not detected or offline. Utilizing local persistence engine.', err.message);
      this.isBackendConnected = false;
      const cached = localStorage.getItem('eddy_artworks');
      this.artworks = cached ? JSON.parse(cached) : DEFAULT_ARTWORKS;
      this.saveArtworksLocally();
    }

    // Load inquiries
    try {
      if (this.isBackendConnected) {
        const inqRes = await fetch('/api/inquiries');
        if (inqRes.ok) {
          this.inquiries = await inqRes.json();
          this.saveInquiriesLocally();
        }
      } else {
        const cachedInq = localStorage.getItem('eddy_inquiries');
        this.inquiries = cachedInq ? JSON.parse(cachedInq) : DEFAULT_INQUIRIES;
        this.saveInquiriesLocally();
      }
    } catch (err) {
      const cachedInq = localStorage.getItem('eddy_inquiries');
      this.inquiries = cachedInq ? JSON.parse(cachedInq) : DEFAULT_INQUIRIES;
    }

    this.updateWishlistBadge();
    this.initCurrencyButtons();
    this.updateUserNav();

    // Dispatch global event so UI components immediately render the updated catalog
    window.dispatchEvent(new CustomEvent('artworksLoaded', { detail: this.artworks }));
    return this.artworks;
  },

  updateUserNav() {
    const sessionStr = localStorage.getItem('eddy_collector_session');
    let session = null;
    try { session = JSON.parse(sessionStr); } catch (e) {}

    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href.includes('auth.html') || link.id === 'navCollectorLink') {
        if (session && session.name) {
          link.innerHTML = `✦ ${session.name}`;
          link.title = `Signed in as ${session.name} (${session.tier || 'Patron'})`;
        } else {
          link.textContent = 'Collector Portal';
        }
      }
    });

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href.includes('auth.html')) {
        if (session && session.name) {
          link.innerHTML = `✦ ${session.name} (Portal)`;
        } else {
          link.textContent = 'Collector Portal';
        }
      }
    });
  },

  saveArtworksLocally() {
    localStorage.setItem('eddy_artworks', JSON.stringify(this.artworks));
    window.dispatchEvent(new CustomEvent('artworksUpdated', { detail: this.artworks }));
  },

  saveInquiriesLocally() {
    localStorage.setItem('eddy_inquiries', JSON.stringify(this.inquiries));
  },

  async addInquiry(inquiryData) {
    if (this.isBackendConnected) {
      try {
        const res = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inquiryData)
        });
        if (res.ok) {
          const saved = await res.json();
          this.inquiries.unshift(saved);
          this.saveInquiriesLocally();
          return saved;
        }
      } catch (e) {
        console.warn('Failed to post inquiry to API, falling back to local storage', e);
      }
    }

    // Fallback local addition
    const newInquiry = {
      id: 'inq-' + Math.floor(1000 + Math.random() * 9000),
      ...inquiryData,
      status: 'Pending',
      date: new Date().toISOString(),
      curatorNotes: 'Inquiry received. Awaiting senior curator review.'
    };
    this.inquiries.unshift(newInquiry);
    this.saveInquiriesLocally();
    return newInquiry;
  },

  getArtworkById(id) {
    return this.artworks.find(a => a.id === id) || this.artworks[0];
  },

  formatPrice(amountUSD) {
    const rate = this.exchangeRates[this.currency] || 1.0;
    const symbol = this.currencySymbols[this.currency] || '$';
    const converted = Math.round(amountUSD * rate);
    return `${symbol}${converted.toLocaleString()}`;
  },

  setCurrency(curr) {
    if (this.exchangeRates[curr]) {
      this.currency = curr;
      localStorage.setItem('eddy_currency', curr);
      this.initCurrencyButtons();
      // Dispatch re-render event
      window.dispatchEvent(new CustomEvent('currencyChanged', { detail: curr }));
    }
  },

  initCurrencyButtons() {
    document.querySelectorAll('.currency-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.curr === this.currency);
    });
  },

  toggleWishlist(artworkId) {
    const idx = this.wishlist.indexOf(artworkId);
    if (idx > -1) {
      this.wishlist.splice(idx, 1);
    } else {
      this.wishlist.push(artworkId);
    }
    localStorage.setItem('eddy_wishlist', JSON.stringify(this.wishlist));
    this.updateWishlistBadge();
    window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: this.wishlist }));
    return this.isWishlisted(artworkId);
  },

  isWishlisted(artworkId) {
    return this.wishlist.includes(artworkId);
  },

  updateWishlistBadge() {
    const badges = document.querySelectorAll('.wishlist-badge');
    badges.forEach(b => {
      b.textContent = this.wishlist.length;
      b.style.display = this.wishlist.length > 0 ? 'inline-flex' : 'none';
    });
  }
};

// Sanitization Utility to prevent XSS
function sanitizeHTML(str) {
  if (!str) return '';
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

// Global Acquisition Inquiry Modal Handler
window.openInquiryModal = function(artworkId) {
  const artwork = EddyStore.getArtworkById(artworkId);
  if (!artwork) return;

  const modal = document.getElementById('inquiryModal');
  if (!modal) return;

  // Populate piece details in the modal
  document.getElementById('modalArtworkId').value = artwork.id;
  document.getElementById('modalArtworkTitleInput').value = artwork.title;
  document.getElementById('modalArtworkPriceInput').value = artwork.price;
  document.getElementById('modalArtworkImageInput').value = artwork.image;
  document.getElementById('modalArtworkArtistInput').value = artwork.artist;

  document.getElementById('modalArtworkTitle').textContent = artwork.title;
  document.getElementById('modalArtworkArtist').textContent = artwork.artist + (artwork.year ? `, ${artwork.year}` : '');
  document.getElementById('modalArtworkPrice').textContent = EddyStore.formatPrice(artwork.price);
  document.getElementById('modalArtworkThumb').src = artwork.image;

  // Auto-fill logged-in collector info if present
  let activeSession = EddyStore.currentCollector;
  if (!activeSession) {
    try { activeSession = JSON.parse(localStorage.getItem('eddy_collector_session')); } catch(e) {}
  }
  if (activeSession) {
    const nameInput = document.getElementById('inquiryName');
    const emailInput = document.getElementById('inquiryEmail');
    const phoneInput = document.getElementById('inquiryPhone');
    if (nameInput && !nameInput.value) nameInput.value = activeSession.name || '';
    if (emailInput && !emailInput.value) emailInput.value = activeSession.email || '';
    if (phoneInput && !phoneInput.value && activeSession.phone) phoneInput.value = activeSession.phone;
  }

  // Populate framing choices
  const frameSelect = document.getElementById('inquiryFraming');
  if (frameSelect) {
    frameSelect.innerHTML = '';
    const options = artwork.frameOptions && artwork.frameOptions.length > 0
      ? artwork.frameOptions
      : ["Included Studio Framing", "Floating Charcoal Oak", "Brushed Gilded Brass", "Natural Scandinavian Maple"];
    
    options.forEach(opt => {
      const optionEl = document.createElement('option');
      optionEl.value = opt;
      optionEl.textContent = opt;
      frameSelect.appendChild(optionEl);
    });
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeInquiryModal = function() {
  const modal = document.getElementById('inquiryModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// Global Quick-View Slideover Handler
window.openQuickView = function(artworkId) {
  const artwork = EddyStore.getArtworkById(artworkId);
  if (!artwork) return;

  const drawer = document.getElementById('quickViewDrawer');
  if (!drawer) {
    // If not on index page, navigate to artwork.html
    window.location.href = `artwork.html?id=${encodeURIComponent(artworkId)}`;
    return;
  }

  document.getElementById('qvThumb').src = artwork.image;
  document.getElementById('qvTitle').textContent = artwork.title;
  document.getElementById('qvArtist').textContent = artwork.artist;
  document.getElementById('qvMedium').textContent = artwork.medium;
  document.getElementById('qvDimensions').textContent = artwork.dimensions;
  document.getElementById('qvPrice').textContent = EddyStore.formatPrice(artwork.price);
  document.getElementById('qvStatement').textContent = artwork.curatorialStatement;
  
  const statusEl = document.getElementById('qvStatus');
  statusEl.textContent = artwork.status;
  statusEl.className = `status-badge ${artwork.status.toLowerCase()}`;

  const viewDeepLink = document.getElementById('qvDeepLink');
  if (viewDeepLink) {
    viewDeepLink.href = `artwork.html?id=${encodeURIComponent(artwork.id)}`;
  }

  const qvInquireBtn = document.getElementById('qvInquireBtn');
  if (qvInquireBtn) {
    qvInquireBtn.onclick = () => {
      window.closeQuickView();
      window.openInquiryModal(artwork.id);
    };
  }

  drawer.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeQuickView = function() {
  const drawer = document.getElementById('quickViewDrawer');
  if (drawer) {
    drawer.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// Wire up global listeners when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await EddyStore.init();

  // Currency click delegates
  document.querySelectorAll('.currency-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      EddyStore.setCurrency(btn.dataset.curr);
    });
  });

  // Modal close buttons
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.closeInquiryModal();
      window.closeQuickView();
    });
  });

  // Backdrop clicks
  const modalBackdrop = document.getElementById('inquiryModal');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) window.closeInquiryModal();
    });
  }

  const drawerBackdrop = document.getElementById('quickViewDrawer');
  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', (e) => {
      if (e.target === drawerBackdrop) window.closeQuickView();
    });
  }

  // Inquiry Form Submission
  const inquiryForm = document.getElementById('acquisitionInquiryForm');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = inquiryForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Submitting Acquisition Dossier...';
      submitBtn.disabled = true;

      const inquiryData = {
        artworkId: document.getElementById('modalArtworkId').value,
        artworkTitle: document.getElementById('modalArtworkTitleInput').value,
        artworkArtist: document.getElementById('modalArtworkArtistInput').value,
        artworkPrice: parseFloat(document.getElementById('modalArtworkPriceInput').value),
        artworkImage: document.getElementById('modalArtworkImageInput').value,
        collectorName: sanitizeHTML(document.getElementById('inquiryName').value.trim()),
        collectorEmail: sanitizeHTML(document.getElementById('inquiryEmail').value.trim()),
        collectorPhone: sanitizeHTML(document.getElementById('inquiryPhone').value.trim()),
        framePreference: document.getElementById('inquiryFraming').value,
        notes: sanitizeHTML(document.getElementById('inquiryNotes').value.trim())
      };

      try {
        const saved = await EddyStore.addInquiry(inquiryData);
        
        // Render sleek confirmation within modal
        const modalBody = document.querySelector('#inquiryModal .modal-body');
        modalBody.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: #FAF8F5; border: 1px solid var(--accent-gold); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: var(--accent-gold); font-size: 1.5rem;">✓</div>
            <h3 style="font-size: 2rem; margin-bottom: 0.75rem;">Inquiry Dossier Logged</h3>
            <p style="font-size: 1rem; color: var(--text-secondary); max-width: 480px; margin: 0 auto 1.5rem;">
              Thank you, <strong>${saved.collectorName}</strong>. Our senior curatorial director has received your reservation request for <em>"${saved.artworkTitle}"</em>.
            </p>
            <div style="background: var(--bg-primary); padding: 1rem 1.5rem; border: 1px solid var(--border-subtle); display: inline-block; margin-bottom: 2rem; border-radius: 2px;">
              <span style="font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted);">Reference Code:</span>
              <div style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--text-primary); font-weight: 500;">${saved.id}</div>
            </div>
            <div>
              <a href="auth.html" class="btn-primary" style="margin-right: 1rem;">Track in Collector Portal</a>
              <button onclick="window.closeInquiryModal(); window.location.reload();" class="btn-secondary">Return to Gallery</button>
            </div>
          </div>
        `;
      } catch (err) {
        alert('Could not submit inquiry. Please try again.');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Accordion triggers
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      item.classList.toggle('open');
    });
  });

  // Mobile Navigation Drawer Listeners
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavClose = document.getElementById('mobileNavClose');

  if (mobileMenuBtn && mobileNavDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNavDrawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (mobileNavClose && mobileNavDrawer) {
    mobileNavClose.addEventListener('click', () => {
      mobileNavDrawer.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // Close mobile drawer when clicking any nav link
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (mobileNavDrawer) {
        mobileNavDrawer.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Reactive collector session updates across tabs and views
  window.addEventListener('storage', (e) => {
    if (e.key === 'eddy_collector_session') {
      EddyStore.updateUserNav();
    }
  });
  window.addEventListener('userSessionChanged', () => {
    EddyStore.updateUserNav();
  });
});

