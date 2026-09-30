(() => {
  const cfg = window.NOQTA_SUPABASE,
    db =
      cfg && window.supabase
        ? window.supabase.createClient(cfg.url, cfg.key)
        : null,
    root = document.querySelector("#teacherProfile"),
    id = new URLSearchParams(location.search).get("id"),
    esc = (v) =>
      String(v ?? "").replace(
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
  async function init() {
    if (!db || !id) return fail();
    const [{ data: t }, { data: offers = [] }] = await Promise.all([
      db
        .from("teacher_profiles")
        .select("*")
        .eq("user_id", id)
        .eq("verification_status", "verified")
        .maybeSingle(),
      db
        .from("teacher_offers")
        .select(
          "id,title,description,language,token_price,duration_minutes,chapters(title),teacher_offer_reviews(rating,body,created_at)",
        )
        .eq("teacher_id", id)
        .eq("status", "published")
        .order("created_at", { ascending: false }),
    ]);
    if (!t) return fail();
    let photo = "";
    if (t.photo_path) {
      const { data } = await db.storage
        .from("teacher-photos")
        .createSignedUrl(t.photo_path, 3600);
      photo = data?.signedUrl || "";
    }
    const reviews = offers.flatMap((o) =>
      (o.teacher_offer_reviews || []).map((r) => ({ ...r, title: o.title })),
    );
    root.innerHTML = `<section class="profile-hero"><div class="profile-portrait">${photo ? `<img src="${esc(photo)}" alt="${esc(t.display_name)}">` : `<span>${esc(t.display_name[0])}</span>`}</div><div class="profile-copy"><small>PROFESSEUR VÉRIFIÉ NOQTA</small><h1>${esc(t.display_name)}.<br><em>Sa façon d’expliquer.</em></h1><p>${esc(t.public_story || t.bio)}</p><div class="profile-facts"><span>${t.experience_years} ans d’expérience</span>${(t.languages || []).map((l) => `<span>${esc(l)}</span>`).join("")}<span>${offers.length} vidéo${offers.length > 1 ? "s" : ""}</span></div></div></section><section class="profile-story"><article class="story-card"><small>FORMATION</small><h2>Un parcours vérifié.</h2><p>${esc(t.credentials || "Informations vérifiées par Noqta.")}</p></article><article class="story-card"><small>RÉSULTATS</small><h2>Ce qu’il construit.</h2><p>${esc(t.achievements || "Une méthode claire, structurée et adaptée au Bac.")}</p><strong>« ${esc(t.teaching_signature || "Comprendre avant de mémoriser")} »</strong></article></section><h2 class="offers-title">Ses explications.</h2><section class="profile-offers">${offers.map((o) => `<a class="profile-offer" href="./?offer=${o.id}"><small>${esc(o.chapters?.title)} · ${o.duration_minutes} MIN</small><h3>${esc(o.title)}</h3><p>${esc(o.description)}</p><footer><span>${esc(o.language)}</span><b>${o.token_price} jetons</b></footer></a>`).join("") || "<p>Aucune vidéo publiée pour le moment.</p>"}</section><section class="reviews"><h2 class="offers-title">Avis vérifiés.</h2>${reviews.map((r) => `<article class="review"><b>${"★".repeat(r.rating)} · Achat vérifié</b><p>${esc(r.body)}</p><small>${new Date(r.created_at).toLocaleDateString("fr-MA")}</small></article>`).join("") || "<p>Aucun avis pour le moment.</p>"}</section>`;
    document.title = `${t.display_name} · Noqta`;
  }
  function fail() {
    root.innerHTML =
      '<div class="loading"><h1>Profil indisponible.</h1><a href="/professor/">Retour au catalogue</a></div>';
  }
  init();
})();
