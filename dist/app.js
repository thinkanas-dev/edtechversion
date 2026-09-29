(() => {
  const cfg = window.NOQTA_SUPABASE;
  if (!cfg || !window.supabase) return;
  const db = window.supabase.createClient(cfg.url, cfg.key);
  const authShell = document.querySelector("#authShell");
  const onboarding = document.querySelector("#onboarding");
  const app = document.querySelector(".app-shell");
  const authForm = document.querySelector("#authForm");
  const authMessage = document.querySelector("#authMessage");
  let mode = "signin",
    session = null,
    step = 1;
  const state = {
    role: "student",
    track: "",
    subjects: [],
    city: "",
    school: "",
  };
  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  function setSurface(name) {
    document.body.classList.toggle("landing-active", name === "landing");
    document.querySelector("#landing").hidden = name !== "landing";
    authShell.hidden = name !== "auth";
    onboarding.hidden = name !== "onboarding";
    app.style.display = name === "app" ? "grid" : "none";
    scrollTo(0, 0);
  }
  function openAuth() {
    setSurface("auth");
    authForm.querySelector("input:not([hidden])")?.focus();
  }
  document
    .querySelectorAll("[data-auth-open],[data-enter]")
    .forEach((el) => el.addEventListener("click", openAuth));
  document
    .querySelector("[data-auth-close]")
    .addEventListener("click", () => setSurface("landing"));
  document.querySelectorAll("[data-auth-mode]").forEach((btn) =>
    btn.addEventListener("click", () => {
      mode = btn.dataset.authMode;
      document
        .querySelectorAll("[data-auth-mode]")
        .forEach((x) => x.classList.toggle("active", x === btn));
      document
        .querySelectorAll(".signup-only")
        .forEach((x) => (x.hidden = mode !== "signup"));
      document.querySelector("#authPassword").autocomplete =
        mode === "signup" ? "new-password" : "current-password";
      authForm.querySelector(".auth-submit").innerHTML =
        mode === "signup"
          ? "Créer mon compte <span>→</span>"
          : "Se connecter <span>→</span>";
      authMessage.textContent = "";
    }),
  );
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    authMessage.textContent = "Connexion…";
    const email = document.querySelector("#authEmail").value.trim(),
      password = document.querySelector("#authPassword").value;
    let result;
    if (mode === "signup")
      result = await db.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: document.querySelector("#authName").value.trim(),
            role: "student",
          },
          emailRedirectTo: location.origin,
        },
      });
    else result = await db.auth.signInWithPassword({ email, password });
    if (result.error) {
      authMessage.textContent = result.error.message;
      return;
    }
    if (!result.data.session) {
      authMessage.textContent =
        "Compte créé. Vérifie ton email puis reviens te connecter.";
      return;
    }
    session = result.data.session;
    await routeSession();
  });
  document
    .querySelector("[data-forgot]")
    .addEventListener("click", async () => {
      const email = document.querySelector("#authEmail").value.trim();
      if (!email) {
        authMessage.textContent = "Entre d’abord ton adresse email.";
        return;
      }
      const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin,
      });
      authMessage.textContent = error
        ? error.message
        : "Lien de réinitialisation envoyé.";
    });

  async function routeSession() {
    if (!session) return setSurface("landing");
    const { data: profile } = await db
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    if (profile?.onboarding_complete) {
      await hydrateApp(profile);
      setSurface("app");
    } else {
      prepareOnboarding(profile);
      setSurface("onboarding");
    }
  }

  function prepareOnboarding(profile) {
    step = 1;
    state.role = profile?.role || "student";
    state.track = profile?.track || "";
    state.subjects = [];
    renderTracks();
    renderSubjects();
    renderStep();
  }
  function renderTracks() {
    const tracks = [
      ["sm", "Sciences Maths", "Maths · Physique"],
      ["pc", "Sciences Physiques", "Physique · Maths · SVT"],
      ["svt", "SVT", "SVT · Physique · Maths"],
    ];
    document.querySelector("#trackGrid").innerHTML = tracks
      .map(
        ([id, title, sub]) =>
          `<button type="button" class="setup-choice" data-track="${id}"><span class="level-mark">${id.toUpperCase()}</span><b>${title}</b><small>${sub}</small></button>`,
      )
      .join("");
    document.querySelectorAll("[data-track]").forEach((b) =>
      b.addEventListener("click", () => {
        state.track = b.dataset.track;
        document
          .querySelectorAll("[data-track]")
          .forEach((x) => x.classList.toggle("selected", x === b));
        syncNext();
      }),
    );
  }
  async function renderSubjects() {
    const { data = [] } = await db
      .from("subjects")
      .select("*")
      .order("sort_order");
    document.querySelector("#subjectGrid").innerHTML = data
      .map(
        (s) =>
          `<button type="button" class="setup-choice" data-subject-id="${s.id}"><span class="subject-dot" style="background:${s.color}"></span><b>${s.name_fr}</b><small>${s.name_ar}</small></button>`,
      )
      .join("");
    document.querySelectorAll("[data-subject-id]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.dataset.subjectId,
          has = state.subjects.includes(id);
        if (has) state.subjects = state.subjects.filter((x) => x !== id);
        else if (state.subjects.length < 2) state.subjects.push(id);
        else return showToast("Essentiel comprend deux matières au choix.");
        b.classList.toggle("selected", !has);
        syncNext();
      }),
    );
  }
  document.querySelectorAll("[data-role]").forEach((b) =>
    b.addEventListener("click", () => {
      state.role = b.dataset.role;
      document
        .querySelectorAll("[data-role]")
        .forEach((x) => x.classList.toggle("selected", x === b));
      syncNext();
    }),
  );
  document.querySelector("[data-level]")?.addEventListener("click", (event) => {
    event.currentTarget.classList.add("selected");
    syncNext();
  });
  document.querySelector("#setupBack").addEventListener("click", () => {
    if (step > 1) {
      step--;
      renderStep();
    } else setSurface("landing");
  });
  document.querySelector("#setupNext").addEventListener("click", async () => {
    if (step < 5) {
      step++;
      renderStep();
    } else await finishOnboarding();
  });
  function validStep() {
    return step === 1
      ? !!state.role
      : step === 2
        ? true
        : step === 3
          ? !!state.track
          : step === 4
            ? state.subjects.length === 2
            : true;
  }
  function syncNext() {
    const b = document.querySelector("#setupNext");
    b.disabled = !validStep();
    b.innerHTML =
      step === 5
        ? "Créer mon espace Essentiel <span>→</span>"
        : "Continuer <span>→</span>";
  }
  function renderStep() {
    document
      .querySelectorAll(".setup-panel")
      .forEach((p) =>
        p.classList.toggle("active", Number(p.dataset.step) === step),
      );
    document.querySelector("#stepCount").textContent = `${step}/5`;
    document.querySelector("#setupProgress").style.width = `${step * 20}%`;
    syncNext();
  }
  async function finishOnboarding() {
    const next = document.querySelector("#setupNext");
    next.disabled = true;
    next.textContent = "Création…";
    const payload = {
      id: session.user.id,
      full_name: session.user.user_metadata.full_name || "",
      role: state.role,
      track: state.track,
      city: document.querySelector("#schoolCity").value.trim(),
      school: document.querySelector("#schoolName").value.trim(),
      onboarding_complete: true,
      plan: "essential",
      updated_at: new Date().toISOString(),
    };
    const { error } = await db.from("profiles").upsert(payload);
    if (error) return showToast(error.message);
    await db.from("user_subjects").delete().eq("user_id", session.user.id);
    const { error: subjectError } = await db.from("user_subjects").insert(
      state.subjects.map((subject_id) => ({
        user_id: session.user.id,
        subject_id,
      })),
    );
    if (subjectError) return showToast(subjectError.message);
    await hydrateApp(payload);
    setSurface("app");
  }
  async function hydrateApp(profile) {
    const { data: chosen = [] } = await db
      .from("user_subjects")
      .select("subject_id,subjects(name_fr)")
      .eq("user_id", session.user.id);
    const first = (profile.full_name || session.user.email).split(" ")[0];
    const initials = (profile.full_name || session.user.email)
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0])
      .join("")
      .toUpperCase();
    let avatarSrc = "";
    if (profile.avatar_url) {
      const { data: signed } = await db.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_url, 3600);
      avatarSrc = signed?.signedUrl || "";
    }
    const avatarMarkup = avatarSrc
      ? `<img src="${avatarSrc}" alt="Photo de profil">`
      : initials;
    const topActions = document.querySelector(".top-actions");
    if (topActions)
      topActions.innerHTML = `<button class="top-action search-action" type="button" data-route="learn"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/></svg><span>Rechercher un cours</span></button><button class="top-profile" type="button" data-route="settings" aria-label="Ouvrir mes paramètres"><span>${avatarMarkup}</span><div><small>MON COMPTE</small><b>${first}</b></div><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg></button>`;
    document
      .querySelectorAll(".profile-mini>div>b")
      .forEach((x) => (x.textContent = profile.full_name || first));
    const sideAvatar = document.querySelector(".profile-orbit");
    if (sideAvatar) sideAvatar.innerHTML = avatarMarkup;
    document
      .querySelectorAll(".profile-mini>div>small,.crumb>b")
      .forEach(
        (x) =>
          (x.textContent = `${profile.track?.toUpperCase() || "2e Bac"} · Essentiel`),
      );
    const greeting = document.querySelector(".greeting .eyebrow");
    if (greeting) greeting.textContent = `BONSOIR ${first.toUpperCase()}`;
    const tabs = document.querySelector(".subject-tabs");
    if (tabs && chosen.length)
      tabs.innerHTML = chosen
        .map(
          (x, i) =>
            `<button class="${i ? "" : "active"}">${x.subjects?.name_fr || x.subject_id}</button>`,
        )
        .join("");
    const ids = chosen.map((x) => x.subject_id);
    document
      .querySelectorAll(".nav-session,.nav-level,.nav-goal")
      .forEach((x) => (x.hidden = true));
    const navHome = document.querySelector(".nav-overview");
    if (navHome)
      navHome.innerHTML = `<span class="nav-number">01</span><span class="nav-icon"><svg viewBox="0 0 32 32"><path d="M5 9.5 16 4l11 5.5v16L16 29 5 25.5zM16 4v25M5 9.5l11 5.2 11-5.2M10 18l6 2.8 6-2.8"/></svg></span><span class="nav-copy"><b>Mon bureau</b><small>La vue essentielle</small></span><span class="nav-arrow">↗</span>`;
    const navLearn = document.querySelector(".nav-learn");
    if (navLearn)
      navLearn.innerHTML = `<span class="nav-number">02</span><span class="nav-icon"><svg viewBox="0 0 32 32"><path d="M4 8c5-3 9-2 12 1v18c-3-3-7-4-12-1zM28 8c-5-3-9-2-12 1v18c3-3 7-4 12-1zM16 9v18M8 13h5M20 13h4M8 18h5M20 18h4"/></svg></span><span class="nav-copy"><b>Bibliothèque</b><small>Les cours officiels</small></span><span class="nav-arrow">↗</span>`;
    const navExams = document.querySelector(".nav-annales");
    if (navExams)
      navExams.innerHTML = `<span class="nav-number">03</span><span class="nav-icon"><svg viewBox="0 0 32 32"><path d="M7 4h15l4 4v20H7zM22 4v5h5M11 14h11M11 19h8M11 24h5"/><circle cx="24" cy="23" r="4"/></svg></span><span class="nav-copy"><b>Annales</b><small>Sujets vérifiés</small></span><span class="nav-arrow">↗</span>`;
    const navIntro = document.querySelector(".nav-intro");
    if (navIntro)
      navIntro.innerHTML =
        "<span>NOQTA · ESSENTIEL</span><b>Mon espace Bac</b>";
    document
      .querySelectorAll(
        '[data-page="today"],[data-page="progress"],[data-page="score"]',
      )
      .forEach((x) => x.remove());
    const home = document.querySelector('[data-page="home"]');
    if (home)
      home.innerHTML = `<section class="desk-hero"><div class="desk-copy"><span class="eyebrow">SALAM ${first.toUpperCase()} · TON BUREAU</span><h1>Kolchi mratab.<br><em>Daba, nta bda.</em></h1><p>Deux matières, leurs chapitres et toutes les ressources disponibles — rien qui te disperse.</p><button class="primary" data-route="learn">Ouvrir la bibliothèque <span>→</span></button></div><div class="desk-object" aria-hidden="true"><div class="orbit orbit-a"></div><div class="orbit orbit-b"></div><svg viewBox="0 0 180 180"><path d="M29 48c27-15 48-9 61 8v93c-15-16-36-20-61-8zM151 48c-27-15-48-9-61 8v93c15-16 36-20 61-8zM90 56v93M47 74h27M47 90h27M107 74h27M107 90h27"/></svg><b>2</b><span>matières choisies</span></div></section><section class="desk-shelves"><div class="shelf-heading"><div><span class="eyebrow">TES DEUX RAYONS</span><h2>Où veux-tu commencer ?</h2></div><button class="shelf-source" data-route="settings">Gérer mes matières ↗</button></div><div class="subject-doors">${chosen.map((x, i) => `<button data-route="learn" class="subject-door door-${i + 1}"><span>0${i + 1}</span><div><small>MATIÈRE</small><b>${x.subjects?.name_fr || x.subject_id}</b><em>Voir tous les chapitres</em></div><svg viewBox="0 0 60 60"><path d="M10 15c8-5 15-3 20 2v32c-5-5-12-7-20-3zM50 15c-8-5-15-3-20 2v32c5-5 12-7 20-3zM30 17v32"/></svg></button>`).join("")}</div></section><section class="reference-strip"><div class="reference-mark">✓</div><div><span>RÉFÉRENTIEL</span><b>Intitulés alignés sur le programme marocain.</b></div><a href="https://nawafid.ma/docs/bac2/cadreref/CDR%20EXAM%20NAT%20BAC%20MATH%20SM%20A%26B%20Op%20FR%202022.pdf" target="_blank" rel="noopener">Voir la source ↗</a></section>`;
    const learn = document.querySelector('[data-page="learn"]');
    if (learn)
      learn.querySelector(".page-head").innerHTML =
        `<div><span class="eyebrow">PROGRAMME · 2e BAC MAROC</span><h1>Tous les chapitres,<br><em>rangés par matière.</em></h1><p>Sélectionne une matière puis ouvre les ressources disponibles pour chaque cours.</p></div><a class="outline source-link" href="https://nawafid.ma/docs/bac2/cadreref/CDR%20EXAM%20NAT%20BAC%20MATH%20SM%20A%26B%20Op%20FR%202022.pdf" target="_blank" rel="noopener">Cadre de référence ↗</a>`;
    const annales = document.querySelector('[data-page="annales"]');
    if (annales)
      annales.innerHTML = `<div class="page-head"><div><span class="eyebrow">ANNALES & EXAMENS BLANCS</span><h1>Les vrais sujets.<br><em>Quand ils sont vérifiés.</em></h1><p>Aucun faux examen n’est affiché. Les sujets et corrigés seront publiés ici après vérification de leur source.</p></div></div><div class="empty-library"><span>ARCHIVE EN CONSTRUCTION</span><h2>Aucune annale vérifiée publiée pour le moment.</h2><p>Les boutons Sujet PDF et Corrigé apparaîtront uniquement avec un fichier réel et sa provenance.</p></div>`;
    if (ids.length) {
      const [{ data: chapters = [] }, { data: exams = [] }] = await Promise.all(
        [
          db
            .from("chapters")
            .select(
              "id,title,summary,subject_id,source_name,course_url,exercise_url,annales_url,lessons(id,title,content,duration_minutes)",
            )
            .in("subject_id", ids)
            .order("position"),
          db
            .from("exams")
            .select("*")
            .in("subject_id", ids)
            .order("exam_year", { ascending: false }),
        ],
      );
      const grid = document.querySelector(".chapter-grid");
      const subjectName = Object.fromEntries(
        chosen.map((x) => [x.subject_id, x.subjects?.name_fr || x.subject_id]),
      );
      const paint = (active) => {
        if (grid)
          grid.innerHTML =
            chapters
              .filter((c) => !active || c.subject_id === active)
              .map(
                (c, index) =>
                  `<article class="chapter library-book"><div class="book-spine"><span>${String(index + 1).padStart(2, "0")}</span><small>${subjectName[c.subject_id] || ""}</small></div><div class="book-body"><h3>${c.title}</h3><p>${c.summary || "Chapitre du programme national."}</p><small class="chapter-source">Source pédagogique · ${c.source_name || "Noqta"}</small><div class="resource-actions"><button class="resource-action" data-open-chapter="${c.id}">Ouvrir le cours</button><button class="resource-action" ${c.exercise_url ? `data-resource-url="${c.exercise_url}"` : "disabled"}>Exercices</button><button class="resource-action" disabled title="En préparation">Examen blanc</button><button class="resource-action" ${c.annales_url ? `data-resource-url="${c.annales_url}"` : 'data-route="annales"'}>Annales</button></div></div></article>`,
              )
              .join("") ||
            '<div class="empty-library"><h2>Aucun cours publié pour cette matière.</h2></div>';
      };
      function bindLibrary() {
        document.querySelectorAll("[data-open-chapter]").forEach((button) =>
          button.addEventListener("click", () =>
            openChapter(
              chapters.find((c) => c.id === button.dataset.openChapter),
              subjectName,
            ),
          ),
        );
        document
          .querySelectorAll("[data-resource-url]")
          .forEach((button) =>
            button.addEventListener("click", () =>
              window.open(
                button.dataset.resourceUrl,
                "_blank",
                "noopener,noreferrer",
              ),
            ),
          );
        document
          .querySelectorAll(".resource-actions [data-route]")
          .forEach((button) =>
            button.addEventListener("click", () =>
              document.querySelector(".nav-annales")?.click(),
            ),
          );
      }
      async function openChapter(chapter, labels) {
        if (!chapter) return;
        const lesson = chapter.lessons?.[0];
        const [{ data: progress }, { data: bookmark }] = await Promise.all([
          lesson
            ? db
                .from("lesson_progress")
                .select("progress,completed")
                .eq("user_id", session.user.id)
                .eq("lesson_id", lesson.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          db
            .from("chapter_bookmarks")
            .select("chapter_id")
            .eq("user_id", session.user.id)
            .eq("chapter_id", chapter.id)
            .maybeSingle(),
        ]);
        let reader = document.querySelector("#courseReader");
        if (!reader) {
          reader = document.createElement("div");
          reader.id = "courseReader";
          document.body.append(reader);
        }
        const paragraphs = (lesson?.content || chapter.summary)
          .split("\n")
          .filter(Boolean);
        reader.innerHTML = `<div class="reader-backdrop" data-close-reader></div><article class="reader-panel"><header><button data-close-reader>← Bibliothèque</button><span>${escapeHtml(labels[chapter.subject_id])} · ${escapeHtml(chapter.source_name || "Noqta")}</span><button data-bookmark class="bookmark ${bookmark ? "saved" : ""}">${bookmark ? "★ Enregistré" : "☆ Enregistrer"}</button></header><div class="reader-progress"><i style="width:${progress?.progress || 0}%"></i></div><main><span class="eyebrow">CHAPITRE</span><h1>${escapeHtml(chapter.title)}</h1><p class="reader-lead">${escapeHtml(chapter.summary)}</p>${paragraphs.map((p, i) => `<section><small>${String(i + 1).padStart(2, "0")}</small><p>${escapeHtml(p)}</p></section>`).join("")}<div class="reader-links">${chapter.course_url ? `<a href="${chapter.course_url}" target="_blank" rel="noopener">Ressource complète vérifiée ↗</a>` : ""}${chapter.exercise_url ? `<a href="${chapter.exercise_url}" target="_blank" rel="noopener">Exercices de la source ↗</a>` : ""}</div><button class="primary reader-complete">${progress?.completed ? "Chapitre terminé ✓" : "Marquer comme terminé"}</button></main></article>`;
        reader.classList.add("open");
        document.body.style.overflow = "hidden";
        reader.querySelectorAll("[data-close-reader]").forEach(
          (b) =>
            (b.onclick = () => {
              reader.classList.remove("open");
              document.body.style.overflow = "";
            }),
        );
        reader.querySelector("[data-bookmark]").onclick = async (e) => {
          if (e.currentTarget.classList.contains("saved")) {
            await db
              .from("chapter_bookmarks")
              .delete()
              .eq("user_id", session.user.id)
              .eq("chapter_id", chapter.id);
            e.currentTarget.classList.remove("saved");
            e.currentTarget.textContent = "☆ Enregistrer";
          } else {
            await db
              .from("chapter_bookmarks")
              .insert({ user_id: session.user.id, chapter_id: chapter.id });
            e.currentTarget.classList.add("saved");
            e.currentTarget.textContent = "★ Enregistré";
          }
        };
        reader.querySelector(".reader-complete").onclick = async (e) => {
          if (!lesson) return showToast("Leçon en préparation.");
          await db
            .from("lesson_progress")
            .upsert({
              user_id: session.user.id,
              lesson_id: lesson.id,
              progress: 100,
              completed: true,
              updated_at: new Date().toISOString(),
            });
          e.currentTarget.textContent = "Chapitre terminé ✓";
          reader.querySelector(".reader-progress i").style.width = "100%";
          showToast("Progression enregistrée.");
        };
      }
      paint(ids[0]);
      bindLibrary();
      tabs?.querySelectorAll("button").forEach((button, index) =>
        button.addEventListener("click", () => {
          tabs
            .querySelectorAll("button")
            .forEach((x) => x.classList.toggle("active", x === button));
          paint(ids[index]);
          bindLibrary();
        }),
      );
      const list = document.querySelector(".exam-list");
      if (list)
        list.innerHTML =
          exams
            .map(
              (e) =>
                `<article><div class="exam-year">${e.exam_year}</div><div><span class="chip">SESSION ${e.session.toUpperCase()}</span><h3>${e.title}</h3><p>${Math.round(e.duration_minutes / 60)} h · Sujet et correction</p></div><div class="exam-actions"><button data-exam="${e.id}">Commencer</button><button class="dark" ${e.correction_url ? `onclick="open('${e.correction_url}','_blank')"` : "disabled"}>Correction →</button></div></article>`,
            )
            .join("") || "<p>Aucune annale publiée pour ces matières.</p>";
      document.querySelectorAll("[data-exam]").forEach((button) =>
        button.addEventListener("click", async () => {
          await db
            .from("exam_attempts")
            .insert({ user_id: session.user.id, exam_id: button.dataset.exam });
          showToast("Tentative enregistrée. Bon courage !");
        }),
      );
    }
    let settings = document.querySelector('[data-page="settings"]');
    if (!settings) {
      settings = document.createElement("section");
      settings.className = "page";
      settings.dataset.page = "settings";
      settings.id = "settings";
      document.querySelector("#main").append(settings);
    }
    settings.innerHTML = `<div class="page-head"><div><span class="eyebrow">MON COMPTE</span><h1>Paramètres.</h1><p>Ton identité, ta filière et les deux matières de ton offre Essentiel.</p></div></div><div class="settings-grid"><section class="settings-card identity-card"><label class="avatar-editor"><span class="settings-avatar">${avatarMarkup}</span><input id="avatarInput" type="file" accept="image/jpeg,image/png,image/webp"><b>Changer ma photo</b><small>JPG, PNG ou WebP · 5 Mo max.</small></label><small>PROFIL</small><h2>${profile.full_name || first}</h2><p>${session.user.email}</p></section><section class="settings-card"><small>PARCOURS</small><h2>${profile.track?.toUpperCase() || "2e Bac"}</h2><p>2e année Baccalauréat · Noqta Essentiel</p></section><section class="settings-card subjects-setting"><small>MES MATIÈRES</small><h2>${chosen.map((x) => x.subjects?.name_fr).join(" + ")}</h2><p>Deux matières incluses dans ton offre actuelle.</p></section><section class="settings-card danger-setting"><small>SESSION</small><h2>Besoin de souffler ?</h2><button class="logout-btn" type="button">Se déconnecter →</button></section></div>`;
    settings
      .querySelector(".logout-btn")
      .addEventListener("click", async () => {
        await db.auth.signOut();
        session = null;
        setSurface("landing");
      });
    settings
      .querySelector("#avatarInput")
      .addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 5242880)
          return showToast("Image trop lourde : 5 Mo maximum.");
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
          return showToast("Format accepté : JPG, PNG ou WebP.");
        showToast("Envoi de la photo…");
        const extension = file.type.split("/")[1].replace("jpeg", "jpg");
        const path = `${session.user.id}/avatar.${extension}`;
        const { error } = await db.storage
          .from("avatars")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (error) return showToast(error.message);
        const { error: updateError } = await db
          .from("profiles")
          .update({ avatar_url: path, updated_at: new Date().toISOString() })
          .eq("id", session.user.id);
        if (updateError) return showToast(updateError.message);
        profile.avatar_url = path;
        showToast("Photo de profil mise à jour.");
        await hydrateApp(profile);
      });
  }

  function navigate(route) {
    document
      .querySelectorAll("[data-page]")
      .forEach((p) => p.classList.toggle("active", p.dataset.page === route));
    document
      .querySelectorAll(".nav-item,.mobile-nav button")
      .forEach((x) => x.classList.toggle("active", x.dataset.route === route));
    scrollTo(0, 0);
  }
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-route]");
    if (trigger) {
      event.preventDefault();
      navigate(trigger.dataset.route);
    }
  });
  document
    .querySelectorAll("[data-toast]")
    .forEach((btn) =>
      btn.addEventListener("click", () => showToast(btn.dataset.toast)),
    );
  document.querySelectorAll(".score-inputs input").forEach((input) =>
    input.addEventListener("input", () => {
      input.nextElementSibling.value = input.value;
      const vals = [...document.querySelectorAll(".score-inputs input")].map(
        (x) => +x.value,
      );
      document.querySelector("#average").textContent = (
        vals.reduce((a, b) => a + b, 0) / vals.length
      )
        .toFixed(2)
        .replace(".", ",");
    }),
  );
  document
    .querySelector(".profile-mini")
    ?.addEventListener("click", () => navigate("settings"));
  function showToast(message) {
    const t = document.querySelector(".toast");
    t.textContent = message;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2600);
  }
  db.auth.onAuthStateChange((_event, current) => {
    session = current;
    setTimeout(routeSession, 0);
  });
  db.auth.getSession().then(({ data }) => {
    session = data.session;
    if (session) routeSession();
  });
})();
