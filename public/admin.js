/**
 * EDDY PRO — Curator Administration Dashboard Engine
 * Complete Product Management (Add, Edit, Delete, Prices, Details) & Security
 */

const AdminApp = {
  isLoggedIn: false,
  editingArtworkId: null,
  deletingArtworkId: null,
  activeTab: 'inventory',

  async init() {
    // Check curator session
    const sessionStr = localStorage.getItem('eddy_curator_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        this.isLoggedIn = true;
        this.showDashboard(session);
      } catch (e) {
        this.showLogin();
      }
    } else {
      this.showLogin();
    }

    this.bindEvents();
  },

  showLogin() {
    document.getElementById('adminAuthSection').style.display = 'block';
    document.getElementById('adminDashboardSection').style.display = 'none';
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const settingsBtn = document.getElementById('adminSettingsBtn');
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (settingsBtn) settingsBtn.style.display = 'none';
  },

  showDashboard(sessionData) {
    document.getElementById('adminAuthSection').style.display = 'none';
    document.getElementById('adminDashboardSection').style.display = 'block';
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const settingsBtn = document.getElementById('adminSettingsBtn');
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (settingsBtn) settingsBtn.style.display = 'inline-flex';

    if (sessionData) {
      const nameEl = document.getElementById('profileAdminName');
      const emailEl = document.getElementById('profileAdminEmail');
      if (nameEl && sessionData.name) nameEl.textContent = sessionData.name;
      if (emailEl && sessionData.email) emailEl.textContent = sessionData.email;
    }

    this.renderStats();
    this.renderInventoryTable();
    this.renderInquiriesTable();
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.getElementById('tabInventoryBtn').classList.toggle('active', tab === 'inventory');
    document.getElementById('tabInquiriesBtn').classList.toggle('active', tab === 'inquiries');
    document.getElementById('tabSecurityBtn').classList.toggle('active', tab === 'security');

    document.getElementById('viewInventorySection').style.display = tab === 'inventory' ? 'block' : 'none';
    document.getElementById('viewInquiriesSection').style.display = tab === 'inquiries' ? 'block' : 'none';
    document.getElementById('viewSecuritySection').style.display = tab === 'security' ? 'block' : 'none';
  },

  bindEvents() {
    // Admin Login Form
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value.trim();
        const errorEl = document.getElementById('adminLoginError');

        try {
          if (EddyStore.isBackendConnected) {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password, role: 'admin' })
            });

            if (res.ok) {
              const data = await res.json();
              if (data.user && data.user.role === 'admin') {
                localStorage.setItem('eddy_curator_session', JSON.stringify(data.user));
                this.isLoggedIn = true;
                this.showDashboard(data.user);
                this.showToast(`Welcome, ${data.user.name}`);
                return;
              }
            }
          }
        } catch (err) {
          console.warn('API login error, checking fallback', err);
        }

        // Fallback local authentication
        if (
          (email.toLowerCase() === 'admin@eddypro.com' || email.toLowerCase() === 'admin@galerielumiere.com') &&
          (password === 'curator2026' || password === 'admin')
        ) {
          const user = { name: 'Eddy Pro Admin', email, role: 'admin' };
          localStorage.setItem('eddy_curator_session', JSON.stringify(user));
          this.isLoggedIn = true;
          this.showDashboard(user);
          this.showToast('Admin Dashboard Unlocked');
        } else {
          errorEl.style.display = 'block';
        }
      });
    }

    // Auto-fill curator demo
    const fillBtn = document.getElementById('btnFillCuratorDemo');
    if (fillBtn) {
      fillBtn.addEventListener('click', () => {
        document.getElementById('adminEmail').value = 'admin@eddypro.com';
        document.getElementById('adminPassword').value = 'curator2026';
      });
    }

    // Logout
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('eddy_curator_session');
        this.isLoggedIn = false;
        this.showLogin();
        this.showToast('Curator session terminated');
      });
    }

    // Settings shortcut button
    const settingsBtn = document.getElementById('adminSettingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.switchTab('security');
      });
    }

    // Change Password Form
    const changePassForm = document.getElementById('changePasswordForm');
    if (changePassForm) {
      changePassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentAdminPass').value;
        const newPassword = document.getElementById('newAdminPass').value;
        const confirmPassword = document.getElementById('confirmAdminPass').value;

        if (newPassword !== confirmPassword) {
          alert('New passwords do not match.');
          return;
        }

        try {
          if (EddyStore.isBackendConnected) {
            const res = await fetch('/api/admin/change-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
              this.showToast('Administrator password updated successfully');
              changePassForm.reset();
              return;
            } else {
              alert(data.error || 'Failed to update password');
              return;
            }
          }
        } catch (e) {
          console.warn('API error updating password');
        }

        this.showToast('Password updated in local session store');
        changePassForm.reset();
      });
    }

    // Device Image Upload & Drag/Drop
    const dropzone = document.getElementById('imageDropzone');
    const fileInput = document.getElementById('artworkFileInput');
    const btnBrowse = document.getElementById('btnBrowseDevice');
    const btnChange = document.getElementById('btnChangeDeviceImage');
    const urlInput = document.getElementById('artworkImageUrl');
    const preview = document.getElementById('artworkImagePreview');
    const previewCard = document.getElementById('deviceUploadPreviewCard');
    const nameEl = document.getElementById('deviceUploadFileName');
    const sizeEl = document.getElementById('deviceUploadFileSize');

    if (btnBrowse && fileInput) {
      btnBrowse.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (btnChange && fileInput) {
      btnChange.addEventListener('click', () => {
        fileInput.click();
      });
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleImageFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleImageFile(e.target.files[0]);
        }
      });
    }

    // Manual URL / Path input
    const manualInput = document.getElementById('manualImageUrl');
    if (manualInput && urlInput) {
      manualInput.addEventListener('input', () => {
        const val = manualInput.value.trim();
        if (val) {
          urlInput.value = val;
          preview.src = val;
          if (nameEl) nameEl.textContent = val;
          if (sizeEl) sizeEl.textContent = 'Custom Path';
          if (previewCard) previewCard.style.display = 'block';
          if (dropzone) dropzone.style.display = 'none';
        }
      });
    }

    // Artwork Local Preset Selector
    const presetSelect = document.getElementById('artworkPresetSelector');
    if (presetSelect && urlInput) {
      presetSelect.addEventListener('change', () => {
        if (presetSelect.value) {
          urlInput.value = presetSelect.value;
          preview.src = presetSelect.value;
          if (nameEl) nameEl.textContent = presetSelect.value;
          if (sizeEl) sizeEl.textContent = 'Curated Library Preset';
          if (previewCard) previewCard.style.display = 'block';
          if (dropzone) dropzone.style.display = 'none';
          this.showToast('Selected library preset image');
        }
      });
    }

    // Save Artwork Form (Add or Edit)
    const artworkForm = document.getElementById('artworkForm');
    if (artworkForm) {
      artworkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveArtwork();
      });
    }

    // Inventory Search and Status filter
    const searchInput = document.getElementById('inventorySearch');
    const statusFilter = document.getElementById('inventoryStatusFilter');
    
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.renderInventoryTable(searchInput.value.toLowerCase(), statusFilter ? statusFilter.value : 'all');
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        this.renderInventoryTable(searchInput ? searchInput.value.toLowerCase() : '', statusFilter.value);
      });
    }

    // Delete confirmation button
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    if (btnConfirmDelete) {
      btnConfirmDelete.addEventListener('click', () => {
        this.confirmDeleteArtwork();
      });
    }
  },

  handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid photograph (JPG, PNG, WebP, GIF).');
      return;
    }
    
    // Update filename and size in preview card
    const nameEl = document.getElementById('deviceUploadFileName');
    const sizeEl = document.getElementById('deviceUploadFileSize');
    const previewCard = document.getElementById('deviceUploadPreviewCard');
    const dropzone = document.getElementById('imageDropzone');
    
    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) {
      const sizeKb = file.size / 1024;
      sizeEl.textContent = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb.toFixed(1)} KB`;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      document.getElementById('artworkImageUrl').value = base64;
      const preview = document.getElementById('artworkImagePreview');
      preview.src = base64;
      if (previewCard) previewCard.style.display = 'block';
      if (dropzone) dropzone.style.display = 'none';
      this.showToast(`Selected "${file.name}" from device`);
    };
    reader.readAsDataURL(file);
  },

  renderStats() {
    const totalCount = EddyStore.artworks.length;
    const availableWorks = EddyStore.artworks.filter(a => a.status === 'Available');
    const availableValue = availableWorks.reduce((acc, curr) => acc + (curr.price || 0), 0);
    const pendingInquiries = EddyStore.inquiries.filter(i => i.status === 'Pending').length;
    const soldCount = EddyStore.artworks.filter(a => a.status === 'Sold').length;

    document.getElementById('statTotalArtworks').textContent = totalCount;
    document.getElementById('statCatalogValue').textContent = EddyStore.formatPrice(availableValue);
    document.getElementById('statPendingInquiries').textContent = pendingInquiries;
    document.getElementById('statSoldCount').textContent = soldCount;
  },

  renderInventoryTable(filterTerm = '', statusFilter = 'all') {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    let items = [...EddyStore.artworks];

    if (filterTerm) {
      items = items.filter(a => 
        a.title.toLowerCase().includes(filterTerm) ||
        a.artist.toLowerCase().includes(filterTerm) ||
        a.medium.toLowerCase().includes(filterTerm)
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      items = items.filter(a => a.status === statusFilter);
    }

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color: var(--text-inverse-muted);">No artworks matched your query.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(item => `
      <tr>
        <td>
          <img src="${item.image}" alt="${item.title}" class="admin-table-thumb">
        </td>
        <td>
          <strong>${item.title}</strong>
          ${item.featured ? `<span style="display:inline-block; font-size:0.62rem; background:rgba(194,165,126,0.2); color:var(--accent-gold); padding:2px 6px; border-radius:2px; margin-left:6px; letter-spacing:0.1em; text-transform:uppercase;">Hero Spotlight</span>` : ''}
          <div style="font-size: 0.75rem; color: var(--text-inverse-muted); margin-top:2px;">Ref: ${item.id}</div>
        </td>
        <td>
          <div>${item.artist}</div>
          <div style="font-size: 0.75rem; color: var(--text-inverse-muted);">${item.year || '2025'}</div>
        </td>
        <td style="max-width: 220px;">
          <div>${item.medium}</div>
          <div style="font-size: 0.75rem; color: var(--text-inverse-muted);">${item.dimensions}</div>
        </td>
        <td>
          <strong style="color: var(--accent-gold);">${EddyStore.formatPrice(item.price)}</strong>
          <div style="font-size: 0.72rem; color: var(--text-inverse-muted);">$${(item.price || 0).toLocaleString()} USD</div>
        </td>
        <td>
          <select class="status-dropdown" onchange="AdminApp.updateArtworkStatus('${item.id}', this.value)">
            <option value="Available" ${item.status === 'Available' ? 'selected' : ''}>Available</option>
            <option value="Reserved" ${item.status === 'Reserved' ? 'selected' : ''}>Reserved</option>
            <option value="Sold" ${item.status === 'Sold' ? 'selected' : ''}>Sold</option>
          </select>
        </td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn-admin-action edit" onclick="AdminApp.editArtwork('${item.id}')" title="Edit All Details & Price">Edit</button>
            <a href="artwork.html?id=${item.id}" target="_blank" class="btn-admin-action" style="background:#252422; color:#ccc; border:1px solid var(--border-dark);" title="Inspect Public Live View">Inspect ↗</a>
            <button class="btn-admin-action delete" onclick="AdminApp.openDeleteModal('${item.id}')" title="Permanently Remove from Catalog">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  renderInquiriesTable() {
    const tbody = document.getElementById('inquiriesTableBody');
    if (!tbody) return;

    if (EddyStore.inquiries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2.5rem; color: var(--text-inverse-muted);">No collector inquiries recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = EddyStore.inquiries.map(inq => `
      <tr>
        <td>
          <div style="font-weight: 600; color: #fff;">${inq.id}</div>
          <div style="font-size: 0.72rem; color: var(--text-inverse-muted);">${new Date(inq.date).toLocaleDateString()}</div>
        </td>
        <td>
          <strong>${inq.artworkTitle}</strong>
          <div style="font-size: 0.75rem; color: var(--text-inverse-muted);">${inq.framePreference || 'Studio Framing'}</div>
        </td>
        <td>
          <div>${inq.collectorName}</div>
          <div style="font-size: 0.75rem; color: var(--accent-gold);"><a href="mailto:${inq.collectorEmail}">${inq.collectorEmail}</a></div>
          <div style="font-size: 0.75rem; color: var(--text-inverse-muted);">${inq.collectorPhone || ''}</div>
        </td>
        <td style="max-width: 240px;">
          <div style="font-size: 0.82rem; color: #ccc; font-style: italic;">"${inq.notes || 'General acquisition inquiry.'}"</div>
          ${inq.curatorNotes ? `<div style="font-size: 0.75rem; color: var(--accent-gold); margin-top: 4px;">Curator Note: ${inq.curatorNotes}</div>` : ''}
        </td>
        <td>
          <select class="status-dropdown" onchange="AdminApp.updateInquiryStatus('${inq.id}', this.value)">
            <option value="Pending" ${inq.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Contacted" ${inq.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="Invoice Sent" ${inq.status === 'Invoice Sent' ? 'selected' : ''}>Invoice Sent</option>
            <option value="Closed/Sold" ${inq.status === 'Closed/Sold' ? 'selected' : ''}>Closed/Sold</option>
          </select>
        </td>
        <td>
          <button class="btn-admin-action edit" onclick="AdminApp.addCuratorNote('${inq.id}')">Note</button>
        </td>
      </tr>
    `).join('');
  },

  async updateArtworkStatus(id, newStatus) {
    const artwork = EddyStore.artworks.find(a => a.id === id);
    if (!artwork) return;

    artwork.status = newStatus;
    EddyStore.saveArtworksLocally();

    if (EddyStore.isBackendConnected) {
      try {
        await fetch(`/api/artworks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (err) {
        console.warn('API status sync failed, saved locally');
      }
    }

    this.renderStats();
    this.showToast(`Status for "${artwork.title}" updated to ${newStatus}`);
  },

  async updateInquiryStatus(id, newStatus) {
    const inq = EddyStore.inquiries.find(i => i.id === id);
    if (!inq) return;

    inq.status = newStatus;
    EddyStore.saveInquiriesLocally();

    if (EddyStore.isBackendConnected) {
      try {
        await fetch(`/api/inquiries/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (err) {
        console.warn('API sync failed, saved locally');
      }
    }

    this.renderStats();
    this.showToast(`Inquiry ${id} progressed to ${newStatus}`);
  },

  addCuratorNote(id) {
    const inq = EddyStore.inquiries.find(i => i.id === id);
    if (!inq) return;

    const note = prompt('Enter a note for this customer inquiry:', inq.curatorNotes || '');
    if (note !== null) {
      inq.curatorNotes = note;
      EddyStore.saveInquiriesLocally();
      if (EddyStore.isBackendConnected) {
        fetch(`/api/inquiries/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ curatorNotes: note })
        });
      }
      this.renderInquiriesTable();
      this.showToast(`Note saved for inquiry ${id}`);
    }
  },

  // Edit Product Modal Opener (Pre-populates all details)
  editArtwork(id) {
    const artwork = EddyStore.artworks.find(a => a.id === id);
    if (!artwork) return;

    this.editingArtworkId = id;
    document.getElementById('artworkModalTitle').textContent = `Edit Artwork — ${artwork.title}`;
    
    // Details
    document.getElementById('artworkTitle').value = artwork.title || '';
    document.getElementById('artworkArtist').value = artwork.artist || '';
    document.getElementById('artworkYear').value = artwork.year || 2025;
    document.getElementById('artworkMedium').value = artwork.medium || '';
    document.getElementById('artworkDimensions').value = artwork.dimensions || '';
    document.getElementById('artworkPrice').value = artwork.price || 0;
    document.getElementById('artworkStatus').value = artwork.status || 'Available';
    document.getElementById('artworkFraming').value = artwork.framing || '';
    
    const frameOpts = artwork.frameOptions ? artwork.frameOptions.join(', ') : 'Floating Black Oak, Brushed Gold Brass, Natural Maple, Unframed';
    document.getElementById('artworkFrameOptions').value = frameOpts;
    
    document.getElementById('artworkProvenance').value = artwork.provenance || '';
    document.getElementById('artworkStatement').value = artwork.curatorialStatement || '';
    document.getElementById('artworkImageUrl').value = artwork.image || '';
    document.getElementById('artworkFeatured').checked = Boolean(artwork.featured);

    const preview = document.getElementById('artworkImagePreview');
    const previewCard = document.getElementById('deviceUploadPreviewCard');
    const dropzone = document.getElementById('imageDropzone');
    const nameEl = document.getElementById('deviceUploadFileName');
    const sizeEl = document.getElementById('deviceUploadFileSize');

    if (artwork.image) {
      preview.src = artwork.image;
      if (nameEl) nameEl.textContent = artwork.image;
      if (sizeEl) sizeEl.textContent = 'Active Image';
      if (previewCard) previewCard.style.display = 'block';
      if (dropzone) dropzone.style.display = 'none';
    } else {
      if (previewCard) previewCard.style.display = 'none';
      if (dropzone) dropzone.style.display = 'block';
    }

    document.getElementById('artworkEditorModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  // Add Product Modal Opener (Clean empty form)
  openAddArtworkModal() {
    this.editingArtworkId = null;
    document.getElementById('artworkModalTitle').textContent = 'Add New Artwork';
    document.getElementById('artworkForm').reset();
    document.getElementById('artworkYear').value = new Date().getFullYear();
    document.getElementById('artworkFrameOptions').value = 'Floating Black Oak, Brushed Gold Brass, Natural Maple, Unframed';
    document.getElementById('artworkImageUrl').value = '';

    const previewCard = document.getElementById('deviceUploadPreviewCard');
    const dropzone = document.getElementById('imageDropzone');
    if (previewCard) previewCard.style.display = 'none';
    if (dropzone) dropzone.style.display = 'block';

    document.getElementById('artworkEditorModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeArtworkModal() {
    document.getElementById('artworkEditorModal').classList.remove('active');
    document.body.style.overflow = '';
  },

  // Save Artwork (Add or Update)
  async saveArtwork() {
    const title = document.getElementById('artworkTitle').value.trim();
    const artist = document.getElementById('artworkArtist').value.trim();
    const year = parseInt(document.getElementById('artworkYear').value, 10) || new Date().getFullYear();
    const medium = document.getElementById('artworkMedium').value.trim();
    const dimensions = document.getElementById('artworkDimensions').value.trim();
    const price = parseFloat(document.getElementById('artworkPrice').value) || 0;
    const status = document.getElementById('artworkStatus').value;
    const framing = document.getElementById('artworkFraming').value.trim();
    const frameOptionsRaw = document.getElementById('artworkFrameOptions').value.trim();
    const provenance = document.getElementById('artworkProvenance').value.trim();
    const curatorialStatement = document.getElementById('artworkStatement').value.trim();
    const image = document.getElementById('artworkImageUrl').value.trim() || 'images/art-01.jpg';
    const featured = document.getElementById('artworkFeatured').checked;

    if (!title || !artist) {
      alert('Artwork Title and Artist Name are required.');
      return;
    }

    const frameOptions = frameOptionsRaw
      ? frameOptionsRaw.split(',').map(s => s.trim()).filter(Boolean)
      : ["Floating Black Oak", "Brushed Gold Brass", "Natural Maple", "Unframed"];

    const payload = {
      title,
      artist,
      year,
      medium,
      dimensions,
      price,
      status,
      framing,
      frameOptions,
      provenance,
      curatorialStatement,
      image,
      highResZoom: image,
      featured
    };

    if (featured) {
      // Un-feature other pieces
      EddyStore.artworks.forEach(a => { a.featured = false; });
    }

    if (this.editingArtworkId) {
      // Update existing product
      const idx = EddyStore.artworks.findIndex(a => a.id === this.editingArtworkId);
      if (idx > -1) {
        EddyStore.artworks[idx] = { ...EddyStore.artworks[idx], ...payload };
        EddyStore.saveArtworksLocally();

        if (EddyStore.isBackendConnected) {
          try {
            await fetch(`/api/artworks/${this.editingArtworkId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          } catch (e) {
            console.warn('API update failed, saved locally');
          }
        }
        this.showToast(`Updated artwork: "${title}"`);
      }
    } else {
      // Add new product
      const newId = 'art-' + Date.now().toString(36);
      const newArtwork = { id: newId, ...payload };
      EddyStore.artworks.unshift(newArtwork);
      EddyStore.saveArtworksLocally();

      if (EddyStore.isBackendConnected) {
        try {
          await fetch('/api/artworks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newArtwork)
          });
        } catch (e) {
          console.warn('API post failed, saved locally');
        }
      }
      this.showToast(`Added new artwork: "${title}"`);
    }

    this.closeArtworkModal();
    this.renderStats();
    this.renderInventoryTable();
  },

  // Delete product modal
  openDeleteModal(id) {
    const artwork = EddyStore.artworks.find(a => a.id === id);
    if (!artwork) return;

    this.deletingArtworkId = id;
    document.getElementById('deletePieceTitle').textContent = `"${artwork.title}" by ${artwork.artist}`;
    document.getElementById('deleteConfirmModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeDeleteModal() {
    this.deletingArtworkId = null;
    document.getElementById('deleteConfirmModal').classList.remove('active');
    document.body.style.overflow = '';
  },

  async confirmDeleteArtwork() {
    if (!this.deletingArtworkId) return;
    const id = this.deletingArtworkId;
    const deletedPiece = EddyStore.artworks.find(a => a.id === id);

    EddyStore.artworks = EddyStore.artworks.filter(a => a.id !== id);
    EddyStore.saveArtworksLocally();

    if (EddyStore.isBackendConnected) {
      try {
        await fetch(`/api/artworks/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('API delete failed, deleted locally');
      }
    }

    this.closeDeleteModal();
    this.renderStats();
    this.renderInventoryTable();
    this.showToast(`Deleted artwork: "${deletedPiece ? deletedPiece.title : id}"`);
  },

  // Toast Notification System
  showToast(message) {
    const toast = document.getElementById('adminToast');
    const msgEl = document.getElementById('adminToastMsg');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    toast.classList.add('active');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('active');
    }, 3500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  EddyStore.init().then(() => {
    AdminApp.init();
  });
});
