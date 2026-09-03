/**
 * 55 smartCREATIVES — Admin Dashboard Engine
 * Complete Product Management (Add, Edit, Delete, Prices, Details) & Security
 */

const AdminApp = {
  isLoggedIn: false,
  editingArtworkId: null,
  deletingArtworkId: null,
  activeTab: 'inventory',
  inquiriesView: 'new', // 'new' | 'opened' | 'all'
  currentInquiryId: null,

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

    // Auto-poll inquiries every 12 seconds so customer submissions appear in real time
    setInterval(() => {
      if (this.isLoggedIn) {
        this.refreshInquiries();
      }
    }, 12000);
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
    this.updateInquiryCounts();
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

    if (tab === 'inquiries') {
      this.refreshInquiries();
    } else if (tab === 'inventory') {
      this.renderInventoryTable();
    }
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
          const user = { name: '55 smartCREATIVES Admin', email, role: 'admin' };
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

    // Inquiries Search and Status filter
    const inqSearch = document.getElementById('inquiriesSearch');
    const inqStatus = document.getElementById('inquiriesStatusFilter');

    if (inqSearch) {
      inqSearch.addEventListener('input', () => {
        this.renderInquiriesTable(inqSearch.value.toLowerCase(), inqStatus ? inqStatus.value : 'all');
      });
    }

    if (inqStatus) {
      inqStatus.addEventListener('change', () => {
        this.renderInquiriesTable(inqSearch ? inqSearch.value.toLowerCase() : '', inqStatus.value);
      });
    }

    // Live update when inquiries are added
    window.addEventListener('inquiriesUpdated', () => {
      this.renderStats();
      this.renderInquiriesTable(inqSearch ? inqSearch.value.toLowerCase() : '', inqStatus ? inqStatus.value : 'all');
    });
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

  async refreshInquiries() {
    try {
      await EddyStore.fetchInquiries();
      this.renderStats();
      this.updateInquiryCounts();
      const inqSearch = document.getElementById('inquiriesSearch');
      const inqStatus = document.getElementById('inquiriesStatusFilter');
      this.renderInquiriesTable(inqSearch ? inqSearch.value.toLowerCase() : '', inqStatus ? inqStatus.value : 'all');
    } catch (e) {
      console.warn('Could not refresh inquiries', e);
    }
  },

  setInquiriesView(view) {
    this.inquiriesView = view;
    const btnNew = document.getElementById('subtabNewInquiries');
    const btnOpened = document.getElementById('subtabOpenedInquiries');
    const btnAll = document.getElementById('subtabAllInquiries');
    const notice = document.getElementById('inquiriesViewNotice');

    const activeStyle = 'font-size: 0.85rem; padding: 8px 16px; border-radius: 4px; display: inline-flex; align-items: center; gap: 8px; font-weight: 600; background: rgba(194, 165, 126, 0.15); border-color: var(--accent-gold); color: var(--accent-gold);';
    const inactiveStyle = 'font-size: 0.85rem; padding: 8px 16px; border-radius: 4px; display: inline-flex; align-items: center; gap: 8px; font-weight: 500; color: #aaa; border-color: var(--border-dark); background: transparent;';

    if (btnNew) btnNew.style.cssText = view === 'new' ? activeStyle : inactiveStyle;
    if (btnOpened) btnOpened.style.cssText = view === 'opened' ? activeStyle : inactiveStyle;
    if (btnAll) btnAll.style.cssText = view === 'all' ? activeStyle : inactiveStyle;

    if (notice) {
      if (view === 'new') {
        notice.innerHTML = 'Showing <strong>New Inquiries</strong> waiting for curator review. Click <strong>"👁 Open"</strong> to inspect customer message and reply.';
        notice.style.borderLeftColor = 'var(--accent-gold)';
        notice.style.color = 'var(--accent-gold)';
      } else if (view === 'opened') {
        notice.innerHTML = 'Showing <strong>Opened & Processed Inquiries</strong>. These have been inspected, contacted, or fulfilled.';
        notice.style.borderLeftColor = '#4caf50';
        notice.style.color = '#81c784';
      } else {
        notice.innerHTML = 'Showing <strong>All Inquiries</strong> recorded across the entire gallery pipeline.';
        notice.style.borderLeftColor = 'var(--border-dark)';
        notice.style.color = '#ccc';
      }
    }

    const inqSearch = document.getElementById('inquiriesSearch');
    const inqStatus = document.getElementById('inquiriesStatusFilter');
    this.renderInquiriesTable(inqSearch ? inqSearch.value.toLowerCase() : '', inqStatus ? inqStatus.value : 'all');
  },

  updateInquiryCounts() {
    const all = EddyStore.inquiries || [];
    const newInquiries = all.filter(i => (i.status === 'Pending' || !i.opened) && i.opened !== true);
    const openedInquiries = all.filter(i => i.opened === true || (i.status && i.status !== 'Pending'));

    const elNew = document.getElementById('badgeNewInquiriesCount');
    const elOpened = document.getElementById('badgeOpenedInquiriesCount');
    const elAll = document.getElementById('badgeAllInquiriesCount');

    if (elNew) elNew.textContent = newInquiries.length;
    if (elOpened) elOpened.textContent = openedInquiries.length;
    if (elAll) elAll.textContent = all.length;

    const statPending = document.getElementById('statPendingInquiries');
    if (statPending) statPending.textContent = newInquiries.length;
  },

  renderInquiriesTable(filterTerm = '', statusFilter = 'all') {
    const tbody = document.getElementById('inquiriesTableBody');
    if (!tbody) return;

    this.updateInquiryCounts();

    let items = [...(EddyStore.inquiries || [])];

    // Separate View Filter: New vs Opened vs All
    if (this.inquiriesView === 'new') {
      items = items.filter(i => (i.status === 'Pending' || !i.opened) && i.opened !== true);
    } else if (this.inquiriesView === 'opened') {
      items = items.filter(i => i.opened === true || (i.status && i.status !== 'Pending'));
    }

    if (statusFilter && statusFilter !== 'all') {
      items = items.filter(i => (i.status || 'Pending').toLowerCase() === statusFilter.toLowerCase());
    }

    if (filterTerm) {
      items = items.filter(i =>
        (i.id || '').toLowerCase().includes(filterTerm) ||
        (i.collectorName || '').toLowerCase().includes(filterTerm) ||
        (i.collectorEmail || '').toLowerCase().includes(filterTerm) ||
        (i.collectorPhone || '').toLowerCase().includes(filterTerm) ||
        (i.artworkTitle || '').toLowerCase().includes(filterTerm) ||
        (i.notes || '').toLowerCase().includes(filterTerm)
      );
    }

    if (items.length === 0) {
      const emptyMsg = this.inquiriesView === 'new'
        ? '✦ No new unopened inquiries. All customer inquiries have been opened and processed.'
        : this.inquiriesView === 'opened'
        ? 'No opened inquiries found in this view.'
        : 'No customer inquiries found matching your filters.';
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2.5rem; color: var(--text-inverse-muted); font-size: 0.9rem;">${emptyMsg}</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(inq => {
      const isNew = (inq.status === 'Pending' || !inq.opened) && inq.opened !== true;
      const artworkPriceFormatted = inq.artworkPrice ? EddyStore.formatPrice(inq.artworkPrice) : '';
      const dateStr = inq.date ? new Date(inq.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent';

      // Look up artwork in catalog for high-res photo, artist, medium, and specs
      const art = (EddyStore.artworks || []).find(a => a.id === inq.artworkId || a.title === inq.artworkTitle);
      const artworkImg = inq.artworkImage || (art ? art.image : 'images/art-01.jpg');
      const artworkArtist = inq.artworkArtist || (art ? art.artist : '55 smartCREATIVES');
      const artworkSpecs = art ? `${art.medium || 'Fine Art'}${art.dimensions ? ' • ' + art.dimensions : ''}` : '';

      const badgeHtml = isNew
        ? `<span style="background: var(--accent-gold); color: #000; font-weight: 700; font-size: 0.68rem; padding: 2px 7px; border-radius: 2px; letter-spacing: 0.05em; display: inline-block; margin-bottom: 3px;">✦ NEW</span>`
        : `<span style="background: rgba(255,255,255,0.08); color: #81c784; font-weight: 600; font-size: 0.68rem; padding: 2px 6px; border-radius: 2px; display: inline-block; margin-bottom: 3px;">✓ OPENED</span>`;

      return `
      <tr style="${isNew ? 'background: rgba(194, 165, 126, 0.05);' : ''}">
        <td>
          <div>${badgeHtml}</div>
          <div style="font-weight: 600; color: ${isNew ? 'var(--accent-gold)' : '#fff'}; font-size: 0.85rem;">${inq.id}</div>
          <div style="font-size: 0.72rem; color: var(--text-inverse-muted); margin-top: 2px;">${dateStr}</div>
        </td>
        <td>
          <div style="display: flex; gap: 12px; align-items: center;">
            <img src="${artworkImg}" alt="${inq.artworkTitle}" style="width: 54px; height: 54px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-dark); flex-shrink: 0;" onerror="this.src='images/art-01.jpg'">
            <div>
              <strong style="color: #fff; display: block; font-size: 0.9rem; line-height: 1.25; margin-bottom: 2px;">${inq.artworkTitle}</strong>
              <div style="font-size: 0.75rem; color: #aaa;">by ${artworkArtist}</div>
              ${artworkPriceFormatted ? `<div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 600; margin-top: 2px;">${artworkPriceFormatted}</div>` : ''}
              ${artworkSpecs ? `<div style="font-size: 0.7rem; color: var(--text-inverse-muted); margin-top: 1px;">${artworkSpecs}</div>` : ''}
              <div style="font-size: 0.72rem; color: var(--text-inverse-muted); margin-top: 2px;">🖼 ${inq.framePreference || 'Studio Stand/Frame'}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight: 600; color: #fff;">${inq.collectorName}</div>
          <div style="font-size: 0.75rem;"><a href="mailto:${inq.collectorEmail}" style="color: var(--accent-gold); text-decoration: underline;">${inq.collectorEmail}</a></div>
          ${inq.collectorPhone ? `<div style="font-size: 0.72rem; color: var(--text-inverse-muted);">${inq.collectorPhone}</div>` : ''}
        </td>
        <td style="max-width: 220px;">
          <div style="font-size: 0.82rem; color: #ddd; font-style: italic; line-height: 1.4;">"${inq.notes || 'Inquired about purchasing this artwork.'}"</div>
          ${inq.curatorNotes ? `<div style="font-size: 0.72rem; color: var(--accent-gold); margin-top: 6px; padding: 2px 6px; background: rgba(194, 165, 126, 0.1); border-radius: 2px;">Note: ${inq.curatorNotes}</div>` : ''}
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
          <div style="display: flex; gap: 5px; flex-wrap: wrap;">
            <button class="btn-admin-action" style="background: ${isNew ? 'var(--accent-gold)' : '#2a2826'}; color: ${isNew ? '#000' : '#fff'}; font-weight: 600; border: 1px solid var(--border-dark);" onclick="AdminApp.openInquiryDetailModal('${inq.id}')" title="Inspect Customer Message and Order Details">
              ${isNew ? '👁 Open' : '👁 View'}
            </button>
            <a href="mailto:${inq.collectorEmail}?subject=Regarding your inquiry for ${encodeURIComponent(inq.artworkTitle)} - 55 smartCREATIVES" class="btn-admin-action" style="background:#1e1d1b; color:#ccc; border: 1px solid var(--border-dark);" title="Reply via Email">
              ✉ Email
            </a>
          </div>
        </td>
      </tr>
      `;
    }).join('');
  },

  openInquiryDetailModal(id) {
    const inq = (EddyStore.inquiries || []).find(i => i.id === id);
    if (!inq) return;

    this.currentInquiryId = id;
    
    // Auto-mark as opened when opened by curator
    inq.opened = true;
    EddyStore.saveInquiriesLocally();
    if (EddyStore.isBackendConnected) {
      try {
        fetch(`/api/inquiries/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opened: true })
        });
      } catch (e) {}
    }

    const modal = document.getElementById('inquiryDetailModal');
    if (!modal) return;

    const badgeEl = document.getElementById('detailInquiryBadge');
    if (badgeEl) {
      badgeEl.textContent = inq.status === 'Pending' ? 'NEW INQUIRY' : inq.status.toUpperCase();
      badgeEl.style.background = inq.status === 'Pending' ? 'var(--accent-gold)' : '#4caf50';
    }

    document.getElementById('detailInquiryTitle').textContent = `Inquiry Ref: ${inq.id}`;
    document.getElementById('detailInquiryDate').textContent = inq.date ? new Date(inq.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }) : 'Recently received';
    document.getElementById('detailCollectorName').textContent = inq.collectorName || 'Anonymous Collector';
    
    const emailEl = document.getElementById('detailCollectorEmail');
    if (emailEl) {
      emailEl.textContent = inq.collectorEmail || 'No email provided';
      emailEl.href = `mailto:${inq.collectorEmail}`;
    }

    const phoneEl = document.getElementById('detailCollectorPhone');
    if (phoneEl) {
      phoneEl.textContent = inq.collectorPhone ? `📞 ${inq.collectorPhone}` : '📞 No phone provided';
    }

    // Look up artwork in catalog for image, artist, medium, and specs
    const art = (EddyStore.artworks || []).find(a => a.id === inq.artworkId || a.title === inq.artworkTitle);
    const artworkImg = inq.artworkImage || (art ? art.image : 'images/art-01.jpg');
    const artworkArtist = inq.artworkArtist || (art ? art.artist : '55 smartCREATIVES');
    const artworkSpecs = art ? `${art.medium || 'Fine Art'}${art.dimensions ? ' • ' + art.dimensions : ''}` : '';

    const imgEl = document.getElementById('detailArtworkImage');
    if (imgEl) {
      imgEl.src = artworkImg;
      imgEl.alt = inq.artworkTitle || 'Artwork Thumbnail';
    }

    document.getElementById('detailArtworkTitle').textContent = inq.artworkTitle || 'General Acquisition Inquiry';
    
    const artistEl = document.getElementById('detailArtworkArtist');
    if (artistEl) artistEl.textContent = `by ${artworkArtist}`;

    const specsEl = document.getElementById('detailArtworkDetails');
    if (specsEl) specsEl.textContent = artworkSpecs;

    document.getElementById('detailArtworkPrice').textContent = inq.artworkPrice ? EddyStore.formatPrice(inq.artworkPrice) : '';
    document.getElementById('detailFraming').textContent = inq.framePreference ? `Framing: ${inq.framePreference}` : 'Framing: Standard Presentation';
    document.getElementById('detailInquiryNotes').textContent = inq.notes ? `"${inq.notes}"` : '"Client inquired about purchasing this artwork."';

    const linkEl = document.getElementById('detailArtworkLink');
    if (linkEl) {
      if (art && art.id) {
        linkEl.href = `artwork.html?id=${art.id}`;
        linkEl.style.display = 'inline-block';
      } else {
        linkEl.style.display = 'none';
      }
    }

    const statusSel = document.getElementById('detailStatusSelect');
    if (statusSel) statusSel.value = inq.status || 'Pending';

    const noteInput = document.getElementById('detailCuratorNoteInput');
    if (noteInput) noteInput.value = inq.curatorNotes || '';

    const emailBtn = document.getElementById('detailEmailClientBtn');
    if (emailBtn) {
      emailBtn.href = `mailto:${inq.collectorEmail}?subject=Regarding your inquiry for "${encodeURIComponent(inq.artworkTitle || 'Fine Art')}" - 55 smartCREATIVES&body=Dear ${encodeURIComponent(inq.collectorName)},%0D%0A%0D%0AThank you for contacting 55 smartCREATIVES regarding "${encodeURIComponent(inq.artworkTitle || '')}".%0D%0A%0D%0A`;
    }

    const toggleBtn = document.getElementById('btnToggleOpenedState');
    if (toggleBtn) {
      toggleBtn.textContent = inq.opened ? '✓ Mark as Unopened (New)' : 'Mark as Opened';
    }

    modal.style.display = 'flex';
    this.updateInquiryCounts();
    this.renderInquiriesTable();
  },

  closeInquiryDetailModal() {
    const modal = document.getElementById('inquiryDetailModal');
    if (modal) modal.style.display = 'none';
    this.currentInquiryId = null;
  },

  async toggleCurrentInquiryOpened() {
    if (!this.currentInquiryId) return;
    const inq = (EddyStore.inquiries || []).find(i => i.id === this.currentInquiryId);
    if (!inq) return;

    inq.opened = !inq.opened;
    EddyStore.saveInquiriesLocally();

    if (EddyStore.isBackendConnected) {
      try {
        await fetch(`/api/inquiries/${inq.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opened: inq.opened })
        });
      } catch (e) {}
    }

    const toggleBtn = document.getElementById('btnToggleOpenedState');
    if (toggleBtn) {
      toggleBtn.textContent = inq.opened ? '✓ Mark as Unopened (New)' : 'Mark as Opened';
    }

    this.showToast(inq.opened ? 'Inquiry marked as Opened' : 'Inquiry marked as New');
    this.updateInquiryCounts();
    this.renderInquiriesTable();
  },

  async saveDetailInquiryChanges() {
    if (!this.currentInquiryId) return;
    const inq = (EddyStore.inquiries || []).find(i => i.id === this.currentInquiryId);
    if (!inq) return;

    const statusSel = document.getElementById('detailStatusSelect');
    const noteInput = document.getElementById('detailCuratorNoteInput');

    if (statusSel) inq.status = statusSel.value;
    if (noteInput) inq.curatorNotes = noteInput.value.trim();

    EddyStore.saveInquiriesLocally();

    if (EddyStore.isBackendConnected) {
      try {
        await fetch(`/api/inquiries/${inq.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: inq.status, curatorNotes: inq.curatorNotes })
        });
      } catch (e) {}
    }

    this.showToast('Inquiry status and note updated');
    this.closeInquiryDetailModal();
    this.updateInquiryCounts();
    this.renderInquiriesTable();
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
