(() => {
  const cfg = window.NOQTA_SUPABASE,
    db =
      cfg && window.supabase
        ? window.supabase.createClient(cfg.url, cfg.key)
        : null;
  const names = {
      math: "Mathématiques",
      physics: "Physique-Chimie",
      svt: "SVT",
      philosophy: "Philosophie",
      english: "Anglais",
      arabic: "Arabe",
    },
    tones = {
      math: "lilac",
      physics: "blue",
      svt: "mint",
      philosophy: "peach",
      english: "rose",
      arabic: "lime",
    };
  let offers = [],
    active = "all",
    session = null,
    profile = null,
    favorites = new Set(),
    purchases = new Set(),
    walletBalance = 0,
    selectedMethods = new Set(),
    selectedLanguages = new Set(),
    activeChapter = "all",
    sortMode = "relevant";
  const launchOffers = [
    {
      id: "launch-math-1",
      subject_id: "math",
      title: "Les limites sans apprendre par cœur",
      description:
        "Une lecture visuelle des limites et des réflexes de rédaction attendus au Bac.",
      method: "visual",
      language: "Français + الدارجة",
      token_price: 120,
      duration_minutes: 12,
      chapters: { title: "Limites et continuité" },
      teacher_profiles: {
        display_name: "Yasmine · Maths",
        story:
          "Ingénieure de formation, elle transforme chaque propriété en image mentale avant de passer au calcul.",
        success:
          "Une méthode construite autour des erreurs les plus fréquentes en Sciences Maths.",
        experience: "7 ans d’accompagnement Bac",
        signature: "Dessiner → comprendre → rédiger",
      },
      demo: true,
      tone: "lilac",
    },
    {
      id: "launch-physics-1",
      subject_id: "physics",
      title: "Newton comme une histoire de forces",
      description:
        "Du schéma des forces à l’équation différentielle, avec un raisonnement continu et vérifiable.",
      method: "steps",
      language: "Français",
      token_price: 100,
      duration_minutes: 14,
      chapters: { title: "Lois de Newton" },
      teacher_profiles: {
        display_name: "Omar · Physique",
        story:
          "Professeur passionné de mécanique, il part d’une situation réelle avant d’écrire la première équation.",
        success: "Des explications centrées sur la modélisation et les unités.",
        experience: "9 ans en lycée",
        signature: "Observer → modéliser → résoudre",
      },
      demo: true,
      tone: "blue",
    },
    {
      id: "launch-math-2",
      subject_id: "math",
      title: "Les complexes, enfin géométriques",
      description:
        "Affixes, arguments et transformations réunis sur un seul plan pour voir ce que les calculs racontent.",
      method: "bac",
      language: "Français + الدارجة",
      token_price: 150,
      duration_minutes: 11,
      chapters: { title: "Nombres complexes" },
      teacher_profiles: {
        display_name: "Salma · Maths",
        story:
          "Ancienne élève de Sciences Maths, elle enseigne avec les raccourcis qu’elle aurait aimé connaître au Bac.",
        success: "Une vérification graphique après chaque calcul.",
        experience: "6 promotions accompagnées",
        signature: "Calculer → placer → vérifier",
      },
      demo: true,
      tone: "lime",
    },
    {
      id: "launch-physics-2",
      subject_id: "physics",
      title: "Le dipôle RC, seconde par seconde",
      description:
        "Une animation mentale de la charge, puis la méthode exacte pour exploiter une courbe expérimentale.",
      method: "visual",
      language: "Français",
      token_price: 90,
      duration_minutes: 10,
      chapters: { title: "Dipôle RC" },
      teacher_profiles: {
        display_name: "Mehdi · PC",
        story:
          "Il construit ses cours comme des expériences : observation, hypothèse et preuve.",
        success:
          "Spécialiste des schémas électriques lisibles et des contrôles dimensionnels.",
        experience: "8 ans d’enseignement",
        signature: "Expérience → loi → application",
      },
      demo: true,
      tone: "peach",
    },
    {
      id: "launch-math-3",
      subject_id: "math",
      title: "Intégrales : choisir la bonne porte",
      description:
        "Reconnaître la forme, sélectionner la technique puis contrôler le résultat.",
      method: "steps",
      language: "Français",
      token_price: 110,
      duration_minutes: 13,
      chapters: { title: "Primitives et calcul intégral" },
      teacher_profiles: {
        display_name: "Imane · Maths",
        story:
          "Elle décompose les exercices longs en décisions très courtes pour rendre la méthode réutilisable.",
        success:
          "Une approche dédiée aux exercices composés de l’examen national.",
        experience: "5 ans de préparation Bac",
        signature: "Reconnaître → choisir → contrôler",
      },
      demo: true,
      tone: "rose",
    },
    {
      id: "launch-physics-3",
      subject_id: "physics",
      title: "Acide-base : lire avant de calculer",
      description:
        "Les zones importantes d’un dosage expliquées avant les formules et les pièges classiques.",
      method: "bac",
      language: "العربية + Français",
      token_price: 130,
      duration_minutes: 15,
      chapters: { title: "Dosages acido-basiques" },
      teacher_profiles: {
        display_name: "Amine · Chimie",
        story:
          "Chimiste de formation, il relie les courbes aux transformations observables au laboratoire.",
        success: "Une grille de lecture stable pour les dosages et le pH.",
        experience: "10 ans en classes Bac",
        signature: "Lire → relier → conclure",
      },
      demo: true,
      tone: "mint",
    },
  ];
  const grid = document.querySelector("#teacherGrid"),
    search = document.querySelector("#searchInput"),
    range = document.querySelector("#tokenRange"),
    modal = document.querySelector("#marketModal");
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>'"]/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[c],
    );
  function toast(m) {
    const n = document.querySelector("#marketToast");
    n.textContent = m;
    n.classList.add("show");
    setTimeout(() => n.classList.remove("show"), 2800);
  }
  async function init() {
    if (db) {
      const { data } = await db.auth.getSession();
      session = data.session;
      if (session) {
        document.body.classList.add("signed-in");
        const [
          { data: p },
          { data: f = [] },
          { data: w },
          { data: bought = [] },
        ] = await Promise.all([
          db
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle(),
          db
            .from("teacher_offer_favorites")
            .select("offer_id")
            .eq("user_id", session.user.id),
          db
            .from("wallets")
            .select("balance")
            .eq("user_id", session.user.id)
            .maybeSingle(),
          db
            .from("teacher_offer_purchases")
            .select("offer_id")
            .eq("buyer_id", session.user.id),
        ]);
        profile = p;
        favorites = new Set(f.map((x) => x.offer_id));
        walletBalance = w?.balance || 0;
        purchases = new Set(bought.map((x) => x.offer_id));
        mountWalletButton();
        mountPurchasesButton();
        mountNotificationsButton();
        mountFavoritesButton();
        mountLogoutButton();
        if (profile?.role === "admin") {
          const adminButton = document.createElement("button");
          adminButton.className = "admin-entry";
          adminButton.textContent = "Modération";
          adminButton.onclick = openModeration;
          document.querySelector(".market-header nav").prepend(adminButton);
        }
        if (profile?.role === "teacher") {
          await renderTeacherDashboard();
          return;
        }
      }
      const { data: o = [] } = await db
        .from("teacher_offers")
        .select(
          "id,title,description,method,language,token_price,duration_minutes,subject_id,teacher_id,video_path,teacher_profiles(display_name,verification_status,bio,public_story,teaching_signature,achievements,credentials,experience_years,photo_path),teacher_offer_reviews(rating),chapters(title)",
        )
        .eq("status", "published")
        .order("created_at", { ascending: false });
      offers = o;
    }
    bind();
    populateChapterFilter();
    applyUrlFilters();
    render();
    if (location.hash === "#purchases" && session) openPurchases();
  }
  async function renderTeacherDashboard() {
    document.body.classList.add("teacher-mode");
    document.querySelector(".category-rail").hidden = true;
    document.querySelector(".market-search").hidden = true;
    const [
      { data: teacher },
      { data: mine = [] },
      { data: sales = [] },
      { data: requests = [] },
      { data: withdrawals = [] },
      { data: wallet },
    ] = await Promise.all([
      db
        .from("teacher_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      db
        .from("teacher_offers")
        .select(
          "id,title,status,token_price,created_at,chapters(title),subjects(name_fr)",
        )
        .eq("teacher_id", session.user.id)
        .order("created_at", { ascending: false }),
      db
        .from("teacher_offer_purchases")
        .select(
          "id,teacher_tokens,tokens_paid,created_at,teacher_offers(title)",
        )
        .eq("teacher_id", session.user.id)
        .order("created_at", { ascending: false }),
      db
        .from("teacher_requests")
        .select(
          "id,request_type,message,status,teacher_reply,created_at,teacher_offers(title)",
        )
        .eq("teacher_id", session.user.id)
        .order("created_at", { ascending: false }),
      db
        .from("withdrawal_requests")
        .select("id,tokens,amount_mad,status,created_at")
        .eq("teacher_id", session.user.id)
        .order("created_at", { ascending: false }),
      db
        .from("wallets")
        .select("balance")
        .eq("user_id", session.user.id)
        .maybeSingle(),
    ]);
    const published = mine.filter((o) => o.status === "published").length,
      pending = mine.filter((o) => o.status === "pending").length,
      earned = sales.reduce((sum, s) => sum + s.teacher_tokens, 0);
    document.querySelector("main").innerHTML =
      `<section class="teacher-console"><header class="console-welcome"><div><span>ESPACE PROFESSEUR · ${teacher?.verification_status === "verified" ? "PROFIL VÉRIFIÉ" : "VÉRIFICATION EN COURS"}</span><h1>Salam ${esc(teacher?.display_name || profile.full_name)}.<br><em>Voici ton studio.</em></h1><p>Ici tu reçois les demandes des élèves, publies tes explications et suis tes revenus.</p></div><div class="console-actions"><button data-open-studio>+ Nouvelle explication</button>${teacher?.verification_status === "verified" ? `<a href="profile.html?id=${session.user.id}">Voir mon profil public ↗</a>` : ""}</div></header><div class="console-stats"><article><small>DEMANDES À TRAITER</small><b>${requests.filter((r) => r.status === "pending").length}</b><span>questions ou sessions</span></article><article><small>VIDÉOS PUBLIÉES</small><b>${published}</b><span>${pending} en validation</span></article><article><small>VENTES</small><b>${sales.length}</b><span>${earned} jetons gagnés</span></article><article class="lime"><small>SOLDE DISPONIBLE</small><b>${wallet?.balance || 0}</b><span>jetons</span></article></div><div class="console-grid"><section class="console-panel requests-panel"><div class="panel-head"><div><small>BOÎTE DE RÉCEPTION</small><h2>Demandes des élèves.</h2></div><b>${requests.filter((r) => r.status === "pending").length} nouvelles</b></div><div class="request-list">${requests.map((r) => `<article class="request ${r.status}"><div><span>${r.request_type === "session" ? "SESSION" : "QUESTION"} · ${new Date(r.created_at).toLocaleDateString("fr-MA")}</span><h3>${esc(r.teacher_offers?.title || "Demande générale")}</h3><p>${esc(r.message)}</p>${r.teacher_reply ? `<blockquote>${esc(r.teacher_reply)}</blockquote>` : ""}</div><div class="request-actions">${r.status === "pending" ? `<button data-request-action="declined" data-request-id="${r.id}">Refuser</button><button class="accept" data-request-action="accepted" data-request-id="${r.id}">Accepter / répondre</button>` : `<b>${esc(r.status)}</b>`}</div></article>`).join("") || '<div class="console-empty">Aucune demande pour le moment.</div>'}</div></section><aside class="console-panel"><div class="panel-head"><div><small>MES CONTENUS</small><h2>Explications.</h2></div></div><div class="compact-list">${mine.map((o) => `<article><div><b>${esc(o.title)}</b><small>${esc(o.subjects?.name_fr)} · ${esc(o.chapters?.title)}</small></div><span class="offer-status ${o.status}">${esc(o.status)}</span></article>`).join("") || "<p>Aucune explication.</p>"}</div><div class="panel-head second"><div><small>DERNIÈRES VENTES</small><h2>Activité.</h2></div></div><div class="compact-list">${
        sales
          .slice(0, 5)
          .map(
            (s) =>
              `<article><div><b>${esc(s.teacher_offers?.title)}</b><small>${new Date(s.created_at).toLocaleDateString("fr-MA")}</small></div><strong>+${s.teacher_tokens}</strong></article>`,
          )
          .join("") || "<p>Aucune vente.</p>"
      }</div>${withdrawals.length ? `<div class="withdraw-summary"><small>DERNIER RETRAIT</small><b>${withdrawals[0].amount_mad} MAD · ${esc(withdrawals[0].status)}</b></div>` : ""}</aside></div></section>`;
    document.querySelector("[data-open-studio]").onclick = () => openStudio();
    document.querySelectorAll("[data-request-action]").forEach(
      (b) =>
        (b.onclick = async () => {
          let reply = null,
            status = b.dataset.requestAction;
          if (status === "accepted") {
            reply = prompt("Ta réponse ou proposition de créneau :");
            if (!reply) return;
            status = "answered";
          }
          const { error } = await db
            .from("teacher_requests")
            .update({
              status,
              teacher_reply: reply,
              updated_at: new Date().toISOString(),
            })
            .eq("id", b.dataset.requestId);
          if (error) return toast(error.message);
          toast("Demande mise à jour.");
          renderTeacherDashboard();
        }),
    );
  }
  const symbol = (s) =>
    s === "math"
      ? "ƒ→∞"
      : s === "physics"
        ? "ΣF"
        : s === "svt"
          ? "DNA"
          : s === "philosophy"
            ? "؟"
            : s === "arabic"
              ? "ض"
              : "A+";
  function card(x) {
    const t = x.teacher_profiles || {},
      fav = favorites.has(x.id),
      ratings = x.teacher_offer_reviews || [],
      average = ratings.length
        ? (
            ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          ).toFixed(1)
        : null;
    return `<article class="teacher-card ${x.demo ? "launch-card" : ""}"><button class="video-slot ${x.tone || tones[x.subject_id] || "lilac"}" data-offer="${x.id}"><span class="preview-tag">${x.demo ? "APERÇU DU CATALOGUE" : "APERÇU"} · ${x.duration_minutes} MIN</span><div class="visual-symbol">${symbol(x.subject_id)}</div><span class="play"><svg viewBox="0 0 48 48"><path d="m19 14 17 10-17 10z"/></svg></span><small>VOIR SA FAÇON D’EXPLIQUER</small></button><div class="teacher-meta"><button class="teacher-placeholder" data-offer="${x.id}"><span>${esc((t.display_name || "P")[0])}</span><div><b>${esc(t.display_name || "Professeur Noqta")}</b><small>${average ? `★ ${average} · ${ratings.length} avis` : x.demo ? "Profil de lancement" : "✓ Profil vérifié"}</small></div></button><button class="heart ${fav ? "saved" : ""}" ${x.demo ? "disabled" : `data-favorite="${x.id}"`}>${fav ? "♥" : "♡"}</button></div><span class="subject-pill">${esc(names[x.subject_id] || x.subject_id)}</span><h3>${esc(x.title)}</h3><p>${esc(x.chapters?.title)}</p><div class="card-foot"><span>${x.demo ? "Tarif indicatif" : "À partir de"}</span><b>${x.token_price} <small>jetons</small></b></div></article>`;
  }
  function waitingGallery() {
    const frames = [
      [
        "lilac",
        "VISUALISER",
        '<svg viewBox="0 0 120 120"><path d="M18 82c19-40 38-40 57 0s31 20 31-17"/><circle cx="25" cy="68" r="7"/><circle cx="61" cy="60" r="7"/><path d="M78 24h28v28H78zM85 31l14 14M99 31 85 45"/></svg>',
        "Une idée devient un schéma.",
      ],
      [
        "lime",
        "PAS À PAS",
        '<svg viewBox="0 0 120 120"><path d="M18 91h24V68h24V45h36"/><circle cx="30" cy="79" r="5"/><circle cx="54" cy="57" r="5"/><circle cx="83" cy="45" r="5"/><path d="m92 34 11 11-11 11"/></svg>',
        "Chaque étape trouve sa place.",
      ],
      [
        "blue",
        "MÉTHODE BAC",
        '<svg viewBox="0 0 120 120"><path d="M27 21h55l13 13v65H27zM82 21v17h16M40 52h39M40 66h30M40 80h19"/><path d="m72 83 8 8 18-23"/></svg>',
        "Du sujet à la rédaction juste.",
      ],
    ];
    return `<div class="waiting-stage"><div class="waiting-copy"><span>0 EXPLICATION PUBLIÉE</span><h3>Les formes sont là.<br><em>Les voix arrivent.</em></h3><p>Chaque cadre attend une vraie vidéo validée par Noqta. Dès sa publication, la carte du professeur prend automatiquement sa place.</p></div><div class="waiting-frames">${frames.map(([tone, label, svg, copy], i) => `<article class="waiting-card ${tone}"><div class="waiting-index">0${i + 1}</div><div class="waiting-picto">${svg}</div><small>${label}</small><b>${copy}</b><div class="waiting-slot"><i></i><span>EMPLACEMENT VIDÉO</span></div></article>`).join("")}</div></div>`;
  }
  function render() {
    const source = offers.length ? offers : launchOffers,
      q = search.value.trim().toLowerCase(),
      max = +range.value,
      shown = source.filter(
        (x) =>
          (active === "all" ||
            x.subject_id === active ||
            (active === "languages" &&
              ["english", "arabic"].includes(x.subject_id))) &&
          x.token_price <= max &&
          (!selectedMethods.size || selectedMethods.has(x.method)) &&
          (activeChapter === "all" || x.chapters?.title === activeChapter) &&
          (!selectedLanguages.size ||
            [...selectedLanguages].some((lang) =>
              lang === "fr"
                ? /français/i.test(x.language)
                : lang === "darija"
                  ? /الدارجة|darija/i.test(x.language)
                  : /العربية|arabe/i.test(x.language),
            )) &&
          (!q ||
            `${x.title} ${x.chapters?.title} ${names[x.subject_id]}`
              .toLowerCase()
              .includes(q)),
      );
    if (sortMode === "tokens")
      shown.sort((a, b) => a.token_price - b.token_price);
    if (sortMode === "duration")
      shown.sort((a, b) => a.duration_minutes - b.duration_minutes);
    grid.innerHTML =
      shown.map(card).join("") ||
      '<div class="empty-result"><b>Aucun résultat pour ces filtres.</b><p>Essaie une autre matière ou augmente le nombre de jetons.</p></div>';
    document.querySelector("#resultCount").textContent =
      `${shown.length} explication${shown.length > 1 ? "s" : ""}${offers.length ? "" : " · aperçu"}`;
  }
  function populateChapterFilter() {
    const select = document.querySelector("#chapterFilter"),
      source = offers.length ? offers : launchOffers,
      titles = [
        ...new Set(source.map((x) => x.chapters?.title).filter(Boolean)),
      ].sort();
    select.innerHTML =
      '<option value="all">Tous les chapitres</option>' +
      titles
        .map((title) => `<option value="${esc(title)}">${esc(title)}</option>`)
        .join("");
    select.onchange = () => {
      activeChapter = select.value;
      render();
    };
  }
  function applyUrlFilters() {
    const params = new URLSearchParams(location.search),
      subject = params.get("subject"),
      method = params.get("method"),
      offer = params.get("offer");
    if (subject) {
      active = subject;
      document
        .querySelectorAll('[name="subject"]')
        .forEach((r) => (r.checked = r.value === subject));
      document
        .querySelectorAll(".category")
        .forEach((c) =>
          c.classList.toggle("active", c.dataset.subject === subject),
        );
    }
    if (method) {
      selectedMethods.add(method);
      const box = document.querySelector(
        `[name="method"][value="${CSS.escape(method)}"]`,
      );
      if (box) box.checked = true;
    }
    if (offer) setTimeout(() => detail(offer), 0);
  }
  function setSubject(v) {
    active = v;
    document
      .querySelectorAll(".category")
      .forEach((x) =>
        x.classList.toggle(
          "active",
          (x.dataset.subject === "philo" ? "philosophy" : x.dataset.subject) ===
            v,
        ),
      );
    render();
  }
  function openModal(html) {
    modal.innerHTML = `<div class="modal-backdrop" data-close></div><section class="modal-panel"><button class="modal-close" data-close>×</button>${html}</section>`;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    modal.hidden = true;
    modal.innerHTML = "";
    document.body.style.overflow = "";
  }
  function requireAuth(next) {
    if (session) return next();
    openModal(
      `<div class="studio-intro"><span class="kicker">ESPACE PROFESSEUR</span><h2>Connecte-toi pour publier.</h2><p>Utilise le même compte que ton espace Noqta.</p><form id="marketAuth" class="studio-form"><label class="full">Email<input id="marketEmail" type="email" required></label><label class="full">Mot de passe<input id="marketPassword" type="password" minlength="8" required></label><button class="studio-primary full">Se connecter →</button><p id="marketAuthMessage" class="full"></p></form></div>`,
    );
    document.querySelector("#marketAuth").onsubmit = async (e) => {
      e.preventDefault();
      const { data, error } = await db.auth.signInWithPassword({
        email: document.querySelector("#marketEmail").value,
        password: document.querySelector("#marketPassword").value,
      });
      if (error)
        return (document.querySelector("#marketAuthMessage").textContent =
          error.message);
      session = data.session;
      const { data: p } = await db
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      profile = p;
      await refreshWallet();
      mountWalletButton();
      mountPurchasesButton();
      closeModal();
      next();
    };
  }
  async function openStudio() {
    if (!db) return toast("Connexion indisponible.");
    const { data: t } = await db
      .from("teacher_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    t ? offerStudio(t) : profileForm();
  }
  async function openModeration() {
    const [
      { data: pendingOffers = [] },
      { data: pendingTeachers = [] },
      { data: pendingPayments = [] },
      { data: pendingWithdrawals = [] },
      { data: recentPurchases = [] },
    ] = await Promise.all([
      db
        .from("teacher_offers")
        .select(
          "id,title,token_price,teacher_profiles(display_name),subjects(name_fr),chapters(title)",
        )
        .eq("status", "pending")
        .order("created_at"),
      db
        .from("teacher_profiles")
        .select("user_id,display_name,bio,city,experience_years,languages")
        .eq("verification_status", "pending")
        .order("created_at"),
      db
        .from("payment_orders")
        .select("id,user_id,amount_mad,tokens,method,status,created_at")
        .in("status", ["pending", "awaiting_cash", "awaiting_transfer"])
        .order("created_at"),
      db
        .from("withdrawal_requests")
        .select(
          "id,teacher_id,tokens,amount_mad,method,status,created_at,teacher_profiles(display_name)",
        )
        .in("status", ["pending", "approved"])
        .order("created_at"),
      db
        .from("teacher_offer_purchases")
        .select(
          "id,tokens_paid,created_at,teacher_offers(title),purchase_refunds(id)",
        )
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    openModal(
      `<div class="studio-shell moderation"><span class="kicker">NOQTA · MODÉRATION</span><h2>File de validation.</h2><h3>Professeurs (${pendingTeachers.length})</h3><div class="moderation-list">${pendingTeachers.map((t) => `<article><div><b>${esc(t.display_name)}</b><small>${esc(t.city)} · ${t.experience_years} an(s) · ${esc(t.languages.join(", "))}</small><p>${esc(t.bio)}</p></div><div><button data-teacher-action="rejected" data-teacher-id="${t.user_id}">Refuser</button><button class="approve" data-teacher-action="verified" data-teacher-id="${t.user_id}">Vérifier</button></div></article>`).join("") || "<p>Aucun profil en attente.</p>"}</div><h3>Explications (${pendingOffers.length})</h3><div class="moderation-list">${pendingOffers.map((o) => `<article><div><b>${esc(o.title)}</b><small>${esc(o.teacher_profiles?.display_name)} · ${esc(o.subjects?.name_fr)} · ${esc(o.chapters?.title)} · ${o.token_price} jetons</small></div><div><button data-offer-action="rejected" data-offer-id="${o.id}">Refuser</button><button class="approve" data-offer-action="published" data-offer-id="${o.id}">Publier</button></div></article>`).join("") || "<p>Aucune offre en attente.</p>"}</div><h3>Paiements (${pendingPayments.length})</h3><div class="moderation-list">${pendingPayments.map((o) => `<article><div><b>${o.amount_mad} MAD · ${o.tokens} jetons</b><small>${esc(o.method)} · réf. ${o.id}</small></div><div><button class="approve" data-confirm-payment="${o.id}">Confirmer après vérification</button></div></article>`).join("") || "<p>Aucun paiement à vérifier.</p>"}</div><h3>Retraits (${pendingWithdrawals.length})</h3><div class="moderation-list">${pendingWithdrawals.map((w) => `<article><div><b>${esc(w.teacher_profiles?.display_name)} · ${w.amount_mad} MAD</b><small>${w.tokens} jetons · ${esc(w.method)} · ${esc(w.status)}</small></div><div><button data-withdraw="rejected" data-withdraw-id="${w.id}">Refuser</button><button class="approve" data-withdraw="${w.status === "approved" ? "paid" : "approved"}" data-withdraw-id="${w.id}">${w.status === "approved" ? "Marquer payé" : "Approuver"}</button></div></article>`).join("") || "<p>Aucun retrait.</p>"}</div><h3>Achats récents</h3><div class="moderation-list">${recentPurchases.map((p) => `<article><div><b>${esc(p.teacher_offers?.title)}</b><small>${p.tokens_paid} jetons · ${new Date(p.created_at).toLocaleDateString("fr-MA")}</small></div><div><button ${p.purchase_refunds?.length ? "disabled" : `data-refund="${p.id}"`}>${p.purchase_refunds?.length ? "Remboursé" : "Rembourser"}</button></div></article>`).join("") || "<p>Aucun achat.</p>"}</div></div>`,
    );
    document.querySelectorAll("[data-teacher-action]").forEach(
      (b) =>
        (b.onclick = async () => {
          await db
            .from("teacher_profiles")
            .update({
              verification_status: b.dataset.teacherAction,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", b.dataset.teacherId);
          toast("Profil mis à jour.");
          openModeration();
        }),
    );
    document.querySelectorAll("[data-offer-action]").forEach(
      (b) =>
        (b.onclick = async () => {
          const rejectionReason =
            b.dataset.offerAction === "rejected"
              ? window.prompt("Motif précis du refus :")
              : null;
          if (b.dataset.offerAction === "rejected" && !rejectionReason) return;
          await db
            .from("teacher_offers")
            .update({
              status: b.dataset.offerAction,
              rejection_reason: rejectionReason,
              updated_at: new Date().toISOString(),
            })
            .eq("id", b.dataset.offerId);
          toast("Offre mise à jour.");
          openModeration();
        }),
    );
    document.querySelectorAll("[data-confirm-payment]").forEach(
      (b) =>
        (b.onclick = async () => {
          const reference = window.prompt(
            "Référence du reçu bancaire / agence vérifié :",
          );
          if (!reference) return;
          b.disabled = true;
          const { error } = await db.rpc("confirm_payment_order", {
            p_order: b.dataset.confirmPayment,
            p_provider_reference: reference,
          });
          if (error) {
            b.disabled = false;
            return toast(error.message);
          }
          toast("Paiement confirmé et jetons crédités.");
          openModeration();
        }),
    );
    document.querySelectorAll("[data-withdraw]").forEach(
      (b) =>
        (b.onclick = async () => {
          const { error } = await db.rpc("process_teacher_withdrawal", {
            p_request: b.dataset.withdrawId,
            p_status: b.dataset.withdraw,
          });
          if (error) return toast(error.message);
          toast("Retrait mis à jour.");
          openModeration();
        }),
    );
    document.querySelectorAll("[data-refund]").forEach(
      (b) =>
        (b.onclick = async () => {
          const reason = prompt("Motif du remboursement :");
          if (!reason) return;
          const { error } = await db.rpc("refund_teacher_purchase", {
            p_purchase: b.dataset.refund,
            p_reason: reason,
          });
          if (error) return toast(error.message);
          toast("Achat remboursé.");
          openModeration();
        }),
    );
  }
  function profileForm() {
    openModal(
      `<div class="studio-intro"><span class="kicker">ÉTAPE 1 · PROFIL</span><h2>Présente la personne derrière l’explication.</h2><form id="profileForm" class="studio-form"><label class="video-upload full"><span>◎</span><b>Photo professionnelle</b><small>JPG, PNG ou WebP · 5 Mo max.</small><input name="photo" type="file" accept="image/jpeg,image/png,image/webp"></label><label>Nom affiché<input name="display_name" required value="${esc(profile?.full_name || "")}"></label><label>Ville<input name="city" required></label><label>Années d’expérience<input name="experience_years" type="number" min="0" max="60" value="0" required></label><label class="full">Biographie<textarea name="bio" minlength="30" maxlength="500" required></textarea></label><label class="full">Ton histoire<textarea name="public_story" minlength="30" maxlength="800" required placeholder="Pourquoi et comment tu enseignes..."></textarea></label><label>Formation et diplômes<textarea name="credentials" minlength="10" maxlength="400" required></textarea></label><label>Réussites pédagogiques<textarea name="achievements" minlength="10" maxlength="400" required></textarea></label><label class="full">Signature de méthode<input name="teaching_signature" minlength="8" maxlength="120" required placeholder="Observer → comprendre → résoudre"></label><fieldset class="full"><legend>Langues</legend><label><input type="checkbox" name="languages" value="Français" checked> Français</label><label><input type="checkbox" name="languages" value="العربية"> العربية</label><label><input type="checkbox" name="languages" value="الدارجة"> الدارجة</label></fieldset><button class="studio-primary full">Créer mon profil →</button></form></div>`,
    );
    document.querySelector("#profileForm").onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget),
        payload = {
          user_id: session.user.id,
          display_name: f.get("display_name"),
          city: f.get("city"),
          experience_years: +f.get("experience_years"),
          bio: f.get("bio"),
          public_story: f.get("public_story"),
          credentials: f.get("credentials"),
          achievements: f.get("achievements"),
          teaching_signature: f.get("teaching_signature"),
          languages: f.getAll("languages"),
        };
      const { data, error } = await db
        .from("teacher_profiles")
        .upsert(payload)
        .select()
        .single();
      if (error) return toast(error.message);
      const photo = f.get("photo");
      if (photo?.size) {
        if (photo.size > 5242880) return toast("Photo trop lourde.");
        const ext = photo.name.split(".").pop(),
          path = `${session.user.id}/profile.${ext}`;
        const { error: uploadError } = await db.storage
          .from("teacher-photos")
          .upload(path, photo, { upsert: true, contentType: photo.type });
        if (uploadError) return toast(uploadError.message);
        await db
          .from("teacher_profiles")
          .update({ photo_path: path, updated_at: new Date().toISOString() })
          .eq("user_id", session.user.id);
        data.photo_path = path;
      }
      await db
        .from("profiles")
        .update({ role: "teacher" })
        .eq("id", session.user.id);
      offerStudio(data);
    };
  }
  async function offerStudio(t) {
    const [{ data: subjects = [] }, { data: mine = [] }] = await Promise.all([
      db.from("subjects").select("*").order("sort_order"),
      db
        .from("teacher_offers")
        .select("*,chapters(title),subjects(name_fr)")
        .eq("teacher_id", session.user.id)
        .order("created_at", { ascending: false }),
    ]);
    openModal(
      `<div class="studio-shell"><header><div><span class="kicker">STUDIO PROFESSEUR</span><h2>Bonjour ${esc(t.display_name)}.</h2><p>Crée, sauvegarde puis envoie ton explication à Noqta.</p></div><span class="verification ${t.verification_status}">${t.verification_status === "verified" ? "✓ Vérifié" : "◷ Vérification en cours"}</span></header><div class="studio-tabs"><button class="active" data-tab="create">Nouvelle explication</button><button data-tab="offers">Mes offres (${mine.length})</button></div><section data-panel="create"><form id="offerForm" class="studio-form"><label>Matière<select name="subject_id" id="offerSubject" required><option value="">Choisir</option>${subjects.map((s) => `<option value="${s.id}">${esc(s.name_fr)}</option>`).join("")}</select></label><label>Chapitre<select name="chapter_id" id="offerChapter" required disabled><option>Choisir la matière</option></select></label><label class="full">Titre<input name="title" minlength="12" maxlength="100" required placeholder="Comprendre les limites avec trois dessins"></label><label class="full">Ce que l’élève va comprendre<textarea name="description" minlength="30" maxlength="800" required></textarea></label><label>Méthode<select name="method"><option value="visual">Schémas & visualisation</option><option value="steps">Pas à pas</option><option value="bac">Méthode Bac</option><option value="darija">Français + الدارجة</option></select></label><label>Langue<select name="language">${t.languages.map((l) => `<option>${esc(l)}</option>`)}</select></label><label>Durée<input name="duration_minutes" type="number" min="10" max="15" value="10" required><small>10 à 15 minutes</small></label><label>Prix<input name="token_price" type="number" min="50" max="500" step="10" value="100" required><small>10 jetons = 1 MAD</small></label><label class="video-upload full"><span>↑</span><b>Ajouter la vidéo</b><small>MP4, WebM ou MOV · 250 Mo max.</small><input name="video" type="file" accept="video/mp4,video/webm,video/quicktime" required></label><div class="studio-actions full"><button type="submit" value="draft">Brouillon</button><button class="studio-primary" type="submit" value="pending">Envoyer à Noqta →</button></div><p id="offerMessage" class="full"></p></form></section><section data-panel="offers" hidden><div class="my-offers">${mine.map((o) => `<article><span class="offer-status ${o.status}">${o.status}</span><div><b>${esc(o.title)}</b><small>${esc(o.subjects?.name_fr)} · ${esc(o.chapters?.title)}</small></div><strong>${o.token_price} jetons</strong></article>`).join("") || "<p>Aucune offre.</p>"}</div></section></div>`,
    );
    bindStudio();
  }
  function bindStudio() {
    document.querySelectorAll("[data-tab]").forEach(
      (b) =>
        (b.onclick = () => {
          document
            .querySelectorAll("[data-tab]")
            .forEach((x) => x.classList.toggle("active", x === b));
          document
            .querySelectorAll("[data-panel]")
            .forEach((x) => (x.hidden = x.dataset.panel !== b.dataset.tab));
        }),
    );
    const subjectSelect = document.querySelector("#offerSubject");
    const chapterSelect = document.querySelector("#offerChapter");
    subjectSelect.onchange = async () => {
      chapterSelect.disabled = true;
      const { data = [] } = await db
        .from("chapters")
        .select("id,title")
        .eq("subject_id", subjectSelect.value)
        .order("position");
      chapterSelect.innerHTML =
        '<option value="">Choisir</option>' +
        data
          .map((c) => `<option value="${c.id}">${esc(c.title)}</option>`)
          .join("");
      chapterSelect.disabled = false;
    };
    document.querySelector("#offerForm").onsubmit = submitOffer;
  }
  async function submitOffer(e) {
    e.preventDefault();
    const button = e.submitter,
      intent = button.value,
      f = new FormData(e.currentTarget),
      file = f.get("video");
    if (file.size > 262144000)
      return (document.querySelector("#offerMessage").textContent =
        "Vidéo trop lourde.");
    button.disabled = true;
    document.querySelector("#offerMessage").textContent = "Création…";
    const payload = {
      teacher_id: session.user.id,
      subject_id: f.get("subject_id"),
      chapter_id: f.get("chapter_id"),
      title: f.get("title"),
      description: f.get("description"),
      method: f.get("method"),
      language: f.get("language"),
      duration_minutes: +f.get("duration_minutes"),
      token_price: +f.get("token_price"),
      status: "draft",
    };
    const { data: o, error } = await db
      .from("teacher_offers")
      .insert(payload)
      .select()
      .single();
    if (error) {
      button.disabled = false;
      return (document.querySelector("#offerMessage").textContent =
        error.message);
    }
    const path = `${session.user.id}/${o.id}/video.${file.name.split(".").pop()}`;
    document.querySelector("#offerMessage").textContent = "Envoi de la vidéo…";
    const { error: u } = await db.storage
      .from("teacher-videos")
      .upload(path, file, { contentType: file.type });
    if (u)
      return (document.querySelector("#offerMessage").textContent = u.message);
    await db
      .from("teacher_offers")
      .update({
        video_path: path,
        status: intent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", o.id);
    toast(intent === "pending" ? "Envoyée à Noqta." : "Brouillon enregistré.");
    closeModal();
  }
  function detail(id) {
    const x = [...offers, ...launchOffers].find((o) => o.id === id);
    if (!x) return;
    openModal(
      `<div class="offer-detail"><div class="detail-video ${x.tone || tones[x.subject_id] || "lilac"}"><span>${symbol(x.subject_id)}</span><button>${x.demo ? "▶ Cadre de la future vidéo" : "▶ Aperçu vidéo"}</button></div><div class="detail-copy"><span class="subject-pill">${esc(names[x.subject_id])}</span><h2>${esc(x.title)}</h2><p>${esc(x.description)}</p><dl><div><dt>Professeur</dt><dd>${esc(x.teacher_profiles?.display_name)}</dd></div><div><dt>Expérience</dt><dd>${esc(x.teacher_profiles?.experience || `${x.teacher_profiles?.experience_years || 0} ans`)}</dd></div><div><dt>Langue</dt><dd>${esc(x.language)}</dd></div></dl>${x.demo || x.teacher_profiles?.public_story ? `<div class="teacher-story"><span>SON HISTOIRE</span><p>${esc(x.teacher_profiles.story || x.teacher_profiles.public_story || x.teacher_profiles.bio)}</p><span>SES RÉUSSITES</span><p>${esc(x.teacher_profiles.success || x.teacher_profiles.achievements || "Profil vérifié par Noqta.")}</p><span>FORMATION</span><p>${esc(x.teacher_profiles.credentials || "Informations vérifiées lors de la modération.")}</p><blockquote>« ${esc(x.teacher_profiles.signature || x.teacher_profiles.teaching_signature || "Comprendre avant de mémoriser")} »</blockquote></div>` : ""}${x.demo ? "" : `<div class="profile-links"><a class="public-profile-link" href="profile.html?id=${x.teacher_id}">Voir son profil et toutes ses vidéos ↗</a><button data-request-teacher>Poser une question / demander une session</button></div>`}<div class="detail-price"><b>${x.token_price} jetons</b><button class="studio-primary" ${x.demo ? "disabled" : `data-buy="${x.id}"`}>${x.demo ? "Vidéo bientôt disponible" : purchases.has(x.id) ? "Déjà acheté ✓" : "Acheter →"}</button></div><small class="secure-note">${x.demo ? "Aperçu éditorial : aucune fausse vidéo ni faux achat." : "Paiement en jetons · débit atomique · aucun double achat."}</small></div></div>`,
    );
    document
      .querySelector("[data-buy]")
      ?.addEventListener("click", () => purchaseOffer(x));
    document
      .querySelector("[data-request-teacher]")
      ?.addEventListener("click", () => openTeacherRequest(x));
    if (session && !x.demo)
      db.from("teacher_watch_history").upsert({
        user_id: session.user.id,
        offer_id: id,
        watched_seconds: 0,
        last_watched_at: new Date().toISOString(),
      });
  }
  function openTeacherRequest(offer) {
    if (!session) return requireAuth(() => openTeacherRequest(offer));
    openModal(
      `<div class="studio-intro"><span class="kicker">CONTACTER LE PROFESSEUR</span><h2>Une demande claire, une réponse utile.</h2><form id="teacherRequestForm" class="studio-form"><label>Type<select name="type"><option value="question">Poser une question</option><option value="session">Demander une session</option></select></label><label class="full">Ta demande<textarea name="message" minlength="10" maxlength="600" required placeholder="Explique précisément le chapitre et ce qui te bloque..."></textarea></label><button class="studio-primary full">Envoyer au professeur →</button></form></div>`,
    );
    document.querySelector("#teacherRequestForm").onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget),
        { error } = await db.from("teacher_requests").insert({
          student_id: session.user.id,
          teacher_id: offer.teacher_id,
          offer_id: offer.id,
          request_type: f.get("type"),
          message: f.get("message"),
        });
      if (error) return toast(error.message);
      closeModal();
      toast("Demande envoyée au professeur.");
    };
  }
  async function refreshWallet() {
    if (!session) return;
    const [{ data: w }, { data: bought = [] }] = await Promise.all([
      db
        .from("wallets")
        .select("balance")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      db
        .from("teacher_offer_purchases")
        .select("offer_id")
        .eq("buyer_id", session.user.id),
    ]);
    walletBalance = w?.balance || 0;
    purchases = new Set(bought.map((x) => x.offer_id));
    mountWalletButton();
  }
  function mountWalletButton() {
    if (!session) return;
    let button = document.querySelector("#walletButton");
    if (!button) {
      button = document.createElement("button");
      button.id = "walletButton";
      button.className = "wallet-entry";
      document.querySelector(".market-header nav").prepend(button);
    }
    button.innerHTML = `<span>●</span> ${walletBalance.toLocaleString("fr-MA")} jetons`;
    button.onclick = openWallet;
  }
  function mountPurchasesButton() {
    if (!session || document.querySelector("#purchasesButton")) return;
    const button = document.createElement("button");
    button.id = "purchasesButton";
    button.className = "account-tool";
    button.title = "Mes achats";
    button.setAttribute("aria-label", "Mes achats");
    button.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M4 7h16v13H4zM7 7V4h10v3M8 11h8M8 15h5"/></svg>';
    button.onclick = openPurchases;
    document.querySelector(".market-header nav").prepend(button);
  }
  function mountNotificationsButton() {
    if (!session || document.querySelector("#notificationsButton")) return;
    const button = document.createElement("button");
    button.id = "notificationsButton";
    button.className = "account-tool";
    button.title = "Notifications";
    button.setAttribute("aria-label", "Notifications");
    button.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M6 17h12l-2-3V9a4 4 0 0 0-8 0v5zM10 20h4"/></svg>';
    button.onclick = openNotifications;
    document.querySelector(".market-header nav").prepend(button);
  }
  async function openNotifications() {
    const { data = [] } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    openModal(
      `<div class="studio-shell"><span class="kicker">CENTRE NOQTA</span><h2>Notifications.</h2><div class="notification-list">${data.map((n) => `<article class="${n.read_at ? "" : "unread"}"><div><b>${esc(n.title)}</b><p>${esc(n.body)}</p><small>${new Date(n.created_at).toLocaleString("fr-MA")}</small></div>${n.link ? `<a href="${esc(n.link)}">Ouvrir ↗</a>` : ""}</article>`).join("") || "<p>Aucune notification.</p>"}</div></div>`,
    );
    const unread = data.filter((n) => !n.read_at).map((n) => n.id);
    if (unread.length)
      await db
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", unread);
  }
  function mountFavoritesButton() {
    if (!session || document.querySelector("#favoritesButton")) return;
    const button = document.createElement("button");
    button.id = "favoritesButton";
    button.className = "account-tool";
    button.title = "Favoris";
    button.setAttribute("aria-label", "Favoris");
    button.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M12 20 4.5 13A5 5 0 0 1 12 6.5 5 5 0 0 1 19.5 13z"/></svg>';
    button.onclick = openFavorites;
    document.querySelector(".market-header nav").prepend(button);
  }
  function mountLogoutButton() {
    if (!session || document.querySelector("#logoutButton")) return;
    const button = document.createElement("button");
    button.id = "logoutButton";
    button.className = "logout-entry";
    button.title = "Déconnexion";
    button.setAttribute("aria-label", "Déconnexion");
    button.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10"/></svg><span>Déconnexion</span>';
    button.onclick = async () => {
      button.disabled = true;
      button.innerHTML = "<span>…</span>";
      await db.auth.signOut();
      location.href = "/";
    };
    document.querySelector(".market-header nav").append(button);
  }
  async function openFavorites() {
    const { data = [] } = await db
      .from("teacher_offer_favorites")
      .select(
        "offer_id,teacher_offers(id,title,token_price,duration_minutes,chapters(title),teacher_profiles(display_name))",
      )
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    openModal(
      `<div class="studio-shell"><span class="kicker">MES FAVORIS</span><h2>À revoir plus tard.</h2><div class="purchase-library">${data.map((f) => `<article><div><small>${esc(f.teacher_offers?.chapters?.title)}</small><b>${esc(f.teacher_offers?.title)}</b><span>${esc(f.teacher_offers?.teacher_profiles?.display_name)} · ${f.teacher_offers?.duration_minutes} min</span></div><button data-open-favorite="${f.offer_id}">Voir l’explication →</button></article>`).join("") || "<p>Aucun favori pour le moment.</p>"}</div></div>`,
    );
    document
      .querySelectorAll("[data-open-favorite]")
      .forEach((b) => (b.onclick = () => detail(b.dataset.openFavorite)));
  }
  async function openPurchases() {
    const [{ data = [] }, { data: history = [] }] = await Promise.all([
      db
        .from("teacher_offer_purchases")
        .select(
          "id,created_at,tokens_paid,offer_id,teacher_offer_reviews(id,rating),teacher_offers(title,video_path,duration_minutes,teacher_profiles(display_name),chapters(title))",
        )
        .eq("buyer_id", session.user.id)
        .order("created_at", { ascending: false }),
      db
        .from("teacher_watch_history")
        .select("offer_id,watched_seconds")
        .eq("user_id", session.user.id),
    ]);
    const resumeByOffer = Object.fromEntries(
      history.map((h) => [h.offer_id, h.watched_seconds]),
    );
    openModal(
      `<div class="studio-shell"><span class="kicker">MA VIDÉOTHÈQUE</span><h2>Mes explications achetées.</h2><div class="purchase-library">${data.map((p) => `<article><div><small>${esc(p.teacher_offers?.chapters?.title)}</small><b>${esc(p.teacher_offers?.title)}</b><span>${esc(p.teacher_offers?.teacher_profiles?.display_name)} · ${p.teacher_offers?.duration_minutes} min</span></div><div class="purchase-actions"><button data-play-purchase="${p.offer_id}" data-resume="${resumeByOffer[p.offer_id] || 0}" data-video-path="${esc(p.teacher_offers?.video_path || "")}">${resumeByOffer[p.offer_id] ? `Continuer à ${Math.floor(resumeByOffer[p.offer_id] / 60)}:${String(resumeByOffer[p.offer_id] % 60).padStart(2, "0")} ▶` : "Regarder ▶"}</button><button ${p.teacher_offer_reviews?.length ? "disabled" : `data-review-purchase="${p.id}"`}>${p.teacher_offer_reviews?.length ? `Noté ${p.teacher_offer_reviews[0].rating}/5` : "Donner mon avis"}</button></div></article>`).join("") || "<p>Tu n’as encore acheté aucune explication.</p>"}</div></div>`,
    );
    document
      .querySelectorAll("[data-play-purchase]")
      .forEach(
        (b) =>
          (b.onclick = () =>
            playPurchasedVideo(
              b.dataset.playPurchase,
              b.dataset.videoPath,
              +b.dataset.resume,
            )),
      );
    document
      .querySelectorAll("[data-review-purchase]")
      .forEach((b) => (b.onclick = () => openReview(b.dataset.reviewPurchase)));
  }
  function openReview(purchaseId) {
    openModal(
      `<div class="studio-intro"><span class="kicker">AVIS VÉRIFIÉ</span><h2>Comment cette explication t’a aidé ?</h2><form id="reviewForm" class="studio-form"><label>Note<select name="rating"><option value="5">5 — Excellent</option><option value="4">4 — Très utile</option><option value="3">3 — Correct</option><option value="2">2 — À améliorer</option><option value="1">1 — Décevant</option></select></label><label class="full">Ton avis<textarea name="body" minlength="10" maxlength="500" required></textarea></label><button class="studio-primary full">Publier mon avis →</button></form></div>`,
    );
    document.querySelector("#reviewForm").onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget),
        { error } = await db.rpc("submit_teacher_review", {
          p_purchase: purchaseId,
          p_rating: +f.get("rating"),
          p_body: f.get("body"),
        });
      if (error) return toast(error.message);
      closeModal();
      toast("Avis vérifié publié.");
    };
  }
  async function playPurchasedVideo(offerId, path, resumeAt = 0) {
    if (!path) return toast("La vidéo n’est pas encore disponible.");
    const { data, error } = await db.storage
      .from("teacher-videos")
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl)
      return toast(error?.message || "Vidéo indisponible.");
    openModal(
      `<div class="video-reader"><video controls autoplay playsinline src="${esc(data.signedUrl)}"></video><p>Ce lien privé expire automatiquement dans une heure.</p></div>`,
    );
    const video = document.querySelector(".video-reader video");
    video.onloadedmetadata = () => {
      if (resumeAt > 0 && resumeAt < video.duration - 5)
        video.currentTime = resumeAt;
    };
    let lastSaved = -1;
    video.ontimeupdate = () => {
      const seconds = Math.round(video.currentTime);
      if (seconds - lastSaved >= 15) {
        lastSaved = seconds;
        db.from("teacher_watch_history").upsert({
          user_id: session.user.id,
          offer_id: offerId,
          watched_seconds: seconds,
          last_watched_at: new Date().toISOString(),
        });
      }
    };
  }
  async function purchaseOffer(offer) {
    if (!session) return requireAuth(() => purchaseOffer(offer));
    if (purchases.has(offer.id))
      return toast("Cette explication est déjà dans ton espace.");
    const button = document.querySelector("[data-buy]");
    button.disabled = true;
    button.textContent = "Achat sécurisé…";
    const { error } = await db.rpc("purchase_teacher_offer", {
      p_offer: offer.id,
    });
    if (error) {
      button.disabled = false;
      button.textContent = "Acheter →";
      if (/solde/i.test(error.message)) return openWallet();
      return toast(error.message);
    }
    await refreshWallet();
    closeModal();
    toast("Explication achetée. Elle est maintenant dans ton espace.");
  }
  async function openWallet() {
    if (!session) return requireAuth(openWallet);
    const [{ data: orders = [] }, { data: transactions = [] }] =
      await Promise.all([
        db
          .from("payment_orders")
          .select(
            "id,amount_mad,tokens,method,status,provider_reference,created_at,paid_at",
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(8),
        db
          .from("wallet_transactions")
          .select("id,amount,kind,description,created_at")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
    openModal(
      `<div class="wallet-shell"><span class="kicker">PORTEFEUILLE NOQTA</span><div class="wallet-balance"><small>Solde disponible</small><strong>${walletBalance.toLocaleString("fr-MA")}</strong><span>jetons</span></div><div class="token-pack"><div><span class="token-picto">✦</span><div><b>Pack Pro</b><small>2 000 jetons · 10 jetons = 1 MAD</small></div></div><strong>200 MAD</strong></div><h3>Choisir le mode de règlement</h3><div class="payment-methods"><button data-pay="card"><span>▣</span><b>Carte bancaire</b><small>Passerelle sécurisée</small></button><button data-pay="wafacash"><span>W</span><b>Wafacash</b><small>Paiement en agence</small></button><button data-pay="barid"><span>B</span><b>Barid Cash</b><small>Paiement en agence</small></button><button data-pay="transfer"><span>⇄</span><b>Virement</b><small>Validation manuelle</small></button></div><p class="payment-disclaimer">Une commande ne crédite jamais le solde avant confirmation du paiement.</p>${profile?.role === "teacher" ? '<button class="withdraw-entry">Demander un retrait professeur →</button>' : ""}<h3>Historique</h3><div class="wallet-history">${orders.map((o) => `<article><div><b>Recharge ${o.tokens.toLocaleString("fr-MA")} jetons</b><small>${esc(o.method)} · ${new Date(o.created_at).toLocaleDateString("fr-MA")}</small></div><div>${o.status === "paid" ? `<button data-receipt="${o.id}">Reçu</button>` : `<button data-cancel-order="${o.id}">Annuler</button>`}<span class="pay-status ${o.status}">${esc(o.status)}</span></div></article>`).join("") || transactions.map((t) => `<article><div><b>${esc(t.description)}</b><small>${new Date(t.created_at).toLocaleDateString("fr-MA")}</small></div><strong class="${t.amount > 0 ? "positive" : ""}">${t.amount > 0 ? "+" : ""}${t.amount}</strong></article>`).join("") || "<p>Aucun mouvement pour le moment.</p>"}</div></div>`,
    );
    document
      .querySelectorAll("[data-pay]")
      .forEach(
        (button) =>
          (button.onclick = () => createPaymentOrder(button.dataset.pay)),
      );
    document.querySelectorAll("[data-cancel-order]").forEach(
      (b) =>
        (b.onclick = async () => {
          const { error } = await db.rpc("cancel_payment_order", {
            p_order: b.dataset.cancelOrder,
          });
          if (error) return toast(error.message);
          toast("Commande annulée.");
          openWallet();
        }),
    );
    document.querySelectorAll("[data-receipt]").forEach(
      (b) =>
        (b.onclick = () => {
          const o = orders.find((x) => x.id === b.dataset.receipt);
          const win = open("", "_blank");
          win.document.write(
            `<title>Reçu Noqta</title><main style="font:16px Arial;max-width:650px;margin:50px auto"><h1>noqta.</h1><h2>Reçu de paiement</h2><p>Référence : ${esc(o.provider_reference || o.id)}</p><p>Montant : ${o.amount_mad} MAD</p><p>Crédit : ${o.tokens} jetons</p><p>Date : ${new Date(o.paid_at).toLocaleString("fr-MA")}</p><hr><small>Reçu généré depuis une commande confirmée.</small></main>`,
          );
          win.print();
        }),
    );
    document
      .querySelector(".withdraw-entry")
      ?.addEventListener("click", openWithdrawal);
  }
  function openWithdrawal() {
    openModal(
      `<div class="studio-intro"><span class="kicker">RETRAIT PROFESSEUR</span><h2>Transformer tes jetons en MAD.</h2><form id="withdrawForm" class="studio-form"><label>Jetons<input name="tokens" type="number" min="500" step="10" max="${walletBalance}" required></label><label>Méthode<select name="method"><option value="bank_transfer">Virement bancaire</option><option value="cashplus">Cash Plus</option></select></label><label class="full">RIB ou informations de retrait<textarea name="account" required minlength="10"></textarea></label><button class="studio-primary full">Envoyer la demande →</button></form></div>`,
    );
    document.querySelector("#withdrawForm").onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget),
        { error } = await db.rpc("request_teacher_withdrawal", {
          p_tokens: +f.get("tokens"),
          p_method: f.get("method"),
          p_account: f.get("account"),
        });
      if (error) return toast(error.message);
      await refreshWallet();
      closeModal();
      toast("Demande envoyée.");
    };
  }
  async function createPaymentOrder(method) {
    const status =
      method === "transfer"
        ? "awaiting_transfer"
        : ["wafacash", "barid"].includes(method)
          ? "awaiting_cash"
          : "pending";
    const { data, error } = await db
      .from("payment_orders")
      .insert({
        user_id: session.user.id,
        product_type: "token_pack",
        product_code: "pro-2000",
        amount_mad: 200,
        tokens: 2000,
        method,
        status,
      })
      .select("id")
      .single();
    if (error) return toast(error.message);
    openModal(
      `<div class="payment-created"><span class="kicker">COMMANDE CRÉÉE</span><div class="reference-picto">✓</div><h2>Ta référence Noqta</h2><code>${esc(data.id)}</code><p>${method === "card" ? "La commande est prête. Le paiement par carte sera activé dès la connexion du prestataire bancaire." : "Présente cette référence lors du règlement. Les jetons seront crédités après validation réelle du paiement."}</p><button class="studio-primary" data-close>Compris</button></div>`,
    );
  }
  async function favorite(id) {
    if (!session) return requireAuth(() => favorite(id));
    if (favorites.has(id)) {
      await db
        .from("teacher_offer_favorites")
        .delete()
        .eq("user_id", session.user.id)
        .eq("offer_id", id);
      favorites.delete(id);
    } else {
      await db
        .from("teacher_offer_favorites")
        .insert({ user_id: session.user.id, offer_id: id });
      favorites.add(id);
    }
    render();
  }
  function bind() {
    document
      .querySelectorAll(".category")
      .forEach(
        (x) =>
          (x.onclick = () =>
            setSubject(
              x.dataset.subject === "philo" ? "philosophy" : x.dataset.subject,
            )),
      );
    document
      .querySelectorAll('input[name="subject"]')
      .forEach(
        (x) =>
          (x.onchange = () =>
            setSubject(x.value === "philo" ? "philosophy" : x.value)),
      );
    document.querySelector("#marketSearch").onsubmit = (e) => {
      e.preventDefault();
      render();
    };
    search.oninput = render;
    range.oninput = () => {
      document.querySelector("#tokenOutput").textContent =
        `≤ ${range.value} jetons`;
      render();
    };
    document.querySelectorAll('.filters input[name="method"]').forEach(
      (box) =>
        (box.onchange = () => {
          box.checked
            ? selectedMethods.add(box.value)
            : selectedMethods.delete(box.value);
          render();
        }),
    );
    document.querySelectorAll('.filters input[name="language"]').forEach(
      (box) =>
        (box.onchange = () => {
          box.checked
            ? selectedLanguages.add(box.value)
            : selectedLanguages.delete(box.value);
          render();
        }),
    );
    const sorter = document.querySelector(".results-head select");
    sorter.onchange = () => {
      sortMode =
        sorter.selectedIndex === 1
          ? "tokens"
          : sorter.selectedIndex === 2
            ? "duration"
            : "relevant";
      render();
    };
    document.querySelector("#resetFilters").onclick = () => {
      search.value = "";
      range.value = 500;
      selectedMethods.clear();
      selectedLanguages.clear();
      activeChapter = "all";
      document.querySelector("#chapterFilter").value = "all";
      document
        .querySelectorAll('.filters input[type="checkbox"]')
        .forEach((box) => (box.checked = false));
      document.querySelector("#tokenOutput").textContent = "≤ 500 jetons";
      setSubject("all");
    };
    document.querySelector(".teacher-call button").onclick = () =>
      requireAuth(openStudio);
    document.onclick = (e) => {
      if (e.target.closest("[data-close]")) closeModal();
      const o = e.target.closest("[data-offer]");
      if (o) detail(o.dataset.offer);
      const f = e.target.closest("[data-favorite]");
      if (f) {
        e.stopPropagation();
        favorite(f.dataset.favorite);
      }
    };
  }
  init();
})();
