insert into public.chapters(subject_id,title,summary,position)
select * from (values
('math','Limites et continuité','Limites, continuité, théorème des valeurs intermédiaires et fonctions réciproques.',1),
('math','Dérivation et étude des fonctions','Dérivabilité, variations, convexité et représentation graphique.',2),
('math','Théorème des accroissements finis','Théorème de Rolle, accroissements finis et applications.',3),
('math','Suites numériques','Monotonie, convergence, suites adjacentes et récurrence.',4),
('math','Fonctions logarithmiques','Logarithme népérien, propriétés, limites et étude.',5),
('math','Fonctions exponentielles','Exponentielle, propriétés, limites et étude.',6),
('math','Équations différentielles','Équations du premier et du second ordre.',7),
('math','Nombres complexes — partie 1','Forme algébrique, calculs, équations et géométrie.',8),
('math','Primitives et calcul intégral','Primitives, intégrale, techniques de calcul et applications.',9),
('math','Nombres complexes — partie 2','Forme trigonométrique, exponentielle et transformations.',10),
('math','Arithmétique dans Z','Divisibilité, congruences, nombres premiers et équations.',11),
('math','Structures algébriques','Lois de composition, groupes, anneaux et corps.',12),
('math','Probabilités','Probabilités conditionnelles, variables aléatoires et lois.',13),
('math','Espaces vectoriels','Espaces vectoriels, familles, bases et applications linéaires.',14),
('physics','Ondes mécaniques progressives','Propagation, célérité, retard et ondes périodiques.',1),
('physics','Propagation de la lumière','Ondes lumineuses, diffraction et dispersion.',2),
('physics','Transformations nucléaires','Décroissance radioactive, noyaux, masse et énergie.',3),
('physics','Dipôle RC','Réponse d’un circuit RC et charge du condensateur.',4),
('physics','Dipôle RL','Établissement et rupture du courant.',5),
('physics','Oscillations électriques libres','Circuit RLC série et oscillations amorties.',6),
('physics','Circuit RLC en régime forcé','Oscillations forcées et résonance.',7),
('physics','Modulation d’amplitude','Transmission d’un signal modulé.',8),
('physics','Lois de Newton','Mouvement, référentiels, forces et lois de Newton.',9),
('physics','Mouvements dans les champs uniformes','Chute libre et particule chargée.',10),
('physics','Planètes et satellites','Mouvements plans, gravitation et satellites.',11),
('physics','Oscillateurs mécaniques','Pendule, ressort et oscillations.',12),
('physics','Énergie des oscillateurs','Aspects énergétiques des oscillations.',13),
('physics','Transformations rapides et lentes','Cinétique chimique et facteurs cinétiques.',14),
('physics','Suivi temporel d’une transformation','Vitesse de réaction et méthodes de suivi.',15),
('physics','Transformations non totales','Réactions réversibles et équilibre.',16),
('physics','Réactions acido-basiques et pH','Équilibres acido-basiques et constante d’acidité.',17),
('physics','Dosages acido-basiques','Titrage, équivalence et courbes.',18),
('physics','Piles électrochimiques','Piles et transformation de l’énergie chimique.',19),
('physics','Électrolyse','Transformations forcées et applications.',20),
('physics','Estérification et hydrolyse','Réactions, équilibre et rendement.',21)
) as catalog(subject_id,title,summary,position)
where not exists (select 1 from public.chapters c where c.subject_id=catalog.subject_id and c.title=catalog.title);

insert into public.lessons(chapter_id,title,content,duration_minutes,position)
select c.id,c.title,'Ressources en cours de publication. Aucun contenu fictif.',0,1
from public.chapters c where not exists(select 1 from public.lessons l where l.chapter_id=c.id);
