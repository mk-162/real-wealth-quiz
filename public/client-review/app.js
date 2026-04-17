const segmentIds = ["S1","S2","S3","S4","S5","S6","S7","S8","S9"];
const segments = [{"id":"S1","name":"Early Accumulator","description":"Low-fit fallback and nurture route. Keeps the form short and avoids specialist planning sections.","counts":{"y":15,"c":2,"n":15}},{"id":"S2","name":"Mass-Affluent Mid-Career","description":"Accumulating household with enough estate value for useful planning, but not the core high-earner route.","counts":{"y":23,"c":4,"n":5}},{"id":"S3","name":"High-Earner Mid-Career","description":"Strong provocation territory around income tax, savings capacity, protection, and planning focus.","counts":{"y":27,"c":2,"n":3}},{"id":"S4","name":"Senior Professional / Partner","description":"Senior-professional route with higher estate value, tax-allowance exposure, and estate planning prompts.","counts":{"y":27,"c":2,"n":3}},{"id":"S5","name":"Business Owner - Growth","description":"Owner still building. Receives the business branch and most planning sections.","counts":{"y":30,"c":2,"n":0}},{"id":"S6","name":"Business Owner - Exit-minded","description":"Business owner with exit intent. Receives succession, extraction, and exit-window triggers.","counts":{"y":28,"c":4,"n":0}},{"id":"S7","name":"Pre-Retiree Affluent","description":"Peak retirement-planning target. Strong route for pensions, estate, retirement confidence, and state pension.","counts":{"y":25,"c":4,"n":3}},{"id":"S8","name":"Retired / Decumulation","description":"Skips accumulation-era and protection questions. Focuses on retirement shape, estate, advice, and priorities.","counts":{"y":23,"c":1,"n":8}},{"id":"S9","name":"HNW / Multi-Gen","description":"High-net-worth route. HNW overrides other signals and opens senior-partner style prompts.","counts":{"y":25,"c":7,"n":0}}];
const rules = [{"rank":1,"id":"S9","label":"HNW / Multi-Gen","predicate":"Q4.5 >= GBP 3m","description":"HNW overrides other signals. Senior-partner routing regardless of age or income."},{"rank":2,"id":"S6","label":"Business Owner - Exit-minded","predicate":"Q2.3 = business owner AND Q2.1 >= 50 AND Q5.3 shows exit intent","description":"Exit-oriented answer upgrades the provisional S5 business-owner route."},{"rank":3,"id":"S5","label":"Business Owner - Growth","predicate":"Q2.3 = business owner AND Q2.1 < 50","description":"Owner still building."},{"rank":4,"id":"S8","label":"Retired / Decumulation","predicate":"Q2.3 = fully retired or partly retired AND Q2.1 >= 60","description":"Skips accumulation-era questions and protection prompts."},{"rank":5,"id":"S7","label":"Pre-Retiree Affluent","predicate":"Q2.1 is 55-65 AND Q2.3 = employed or self-employed","description":"Peak Real Wealth target for retirement planning."},{"rank":6,"id":"S4","label":"Senior Professional / Partner","predicate":"Q3.1 >= GBP 200k AND Q4.5 >= GBP 1m","description":"Senior professional tone and tax allowance triggers."},{"rank":7,"id":"S3","label":"High-Earner Mid-Career","predicate":"Q3.1 is GBP 100k-GBP 200k","description":"Richest territory for the GBP 100k tax-trap provocation."},{"rank":8,"id":"S2","label":"Mass-Affluent Mid-Career","predicate":"Q3.1 is GBP 50k-GBP 100k AND Q4.5 >= GBP 250k","description":"Accumulating, but not yet at the core high-earner provocation point."},{"rank":9,"id":"S1","label":"Early Accumulator","predicate":"Default when no higher rule matches","description":"Short friendly route with nurture-style follow-up."}];
const sections = [{"id":"set_the_tone","label":"Set the tone"},{"id":"life_shape","label":"Life shape"},{"id":"money_today","label":"Money today"},{"id":"assets","label":"Assets"},{"id":"business","label":"Business"},{"id":"people_and_legacy","label":"People and legacy"},{"id":"retirement_horizon","label":"Retirement horizon"},{"id":"protection","label":"Protection"},{"id":"advice_today","label":"Advice today"},{"id":"priorities","label":"Priorities"}];
const questions = [{"id":"Q1.1","section":"set_the_tone","label":"What brought you here today?","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q1.2","section":"set_the_tone","label":"What does real wealth mean to you?","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q2.1","section":"life_shape","label":"Age","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q2.2","section":"life_shape","label":"Who else is part of the plan?","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q2.3","section":"life_shape","label":"Working life right now","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q2.4","section":"life_shape","label":"Ideal normal week / happy place","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q3.1","section":"money_today","label":"Household income before tax","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q3.2","section":"money_today","label":"Monthly essential spending","cells":["N","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q3.3","section":"money_today","label":"Monthly non-essential spending","cells":["N","N","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q3.4","section":"money_today","label":"Saving confidence","cells":["Y","Y","Y","Y","Y","Y","Y","N","Y"]},{"id":"Q3.5","section":"money_today","label":"Money mindset","cells":["N","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q4.1","section":"assets","label":"Main home and mortgage","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q4.2","section":"assets","label":"Other property","cells":["N","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q4.3","section":"assets","label":"Pension pots","cells":["N","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q4.4","section":"assets","label":"Savings and investments","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q4.5","section":"assets","label":"Total estate band","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q5.1","section":"business","label":"Role in the business","cells":["N","N","N","N","Y","Y","N","N","C"]},{"id":"Q5.2","section":"business","label":"How money is taken from the business","cells":["N","N","N","N","Y","Y","N","N","C"]},{"id":"Q5.3","section":"business","label":"Business succession / exit thinking","cells":["N","N","N","N","Y","Y","N","N","C"]},{"id":"Q6.1","section":"people_and_legacy","label":"Dependants today","cells":["N","C","C","C","C","C","C","N","C"]},{"id":"Q6.2","section":"people_and_legacy","label":"Passing-on intent","cells":["N","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q6.3","section":"people_and_legacy","label":"Will and LPA status","cells":["N","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q7.1","section":"retirement_horizon","label":"Target retirement age","cells":["Y","Y","Y","Y","Y","Y","Y","N","Y"]},{"id":"Q7.2","section":"retirement_horizon","label":"How retirement feels","cells":["N","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q7.3","section":"retirement_horizon","label":"State pension awareness","cells":["N","N","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q8.1","section":"protection","label":"Earnings protection confidence","cells":["C","C","Y","Y","Y","C","C","N","C"]},{"id":"Q8.2","section":"protection","label":"Life cover status","cells":["N","C","Y","Y","Y","C","C","N","C"]},{"id":"Q9.1","section":"advice_today","label":"Current adviser","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q9.2","section":"advice_today","label":"What is missing from advice","cells":["C","C","C","C","C","C","C","C","C"]},{"id":"Q10.1","section":"priorities","label":"Trade-off choices","cells":["N","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q10.2","section":"priorities","label":"One thing to sort","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]},{"id":"Q10.3","section":"priorities","label":"Urgency","cells":["Y","Y","Y","Y","Y","Y","Y","Y","Y"]}];
const provocations = [{"id":"prov.advised_looking","name":"You already know the answer.","trigger":"current_adviser == 'yes_looking'","segments":["all"]},{"id":"prov.btl_portfolio","name":"The incorporation question.","trigger":"other_property >= 2 AND NOT held_in_limited_company","segments":["S3","S4","S6","S7","S9"]},{"id":"prov.business_no_plan","name":"Thinking is the planning starting.","trigger":"succession == 'no_plan_thinking'","segments":["S5","S6"]},{"id":"prov.director_single_pot","name":"The quiet tax lever.","trigger":"role == 'sole_director' AND pension_pots <= 1","segments":["S5","S6"]},{"id":"prov.dont_know_priority","name":"Most of our best client relationships started here.","trigger":"one_thing == 'dont_know'","segments":["all"]},{"id":"prov.estate_unsure","name":"Worth adding it up.","trigger":"estate == 'not_sure' AND investable_assets >= 500_000","segments":["S3","S4","S7"]},{"id":"prov.exit_window","name":"Two years, not six months.","trigger":"succession == 'exit_5_years'","segments":["S6"]},{"id":"prov.hnw_pathway","name":"A different conversation.","trigger":"investable_assets >= 1_000_000 AND estate >= 3_000_000","segments":["S9"]},{"id":"prov.iht_2m_cliff","name":"The GBP 2m cliff.","trigger":"estate >= 2_000_000 AND rnrb_taper_awareness_did_not_fire","segments":["S4","S6","S7","S9"]},{"id":"prov.money_stress","name":"A note from us.","trigger":"money_mindset == 'stress'","segments":["all"]},{"id":"prov.no_will_estate","name":"Intestate is a bad default.","trigger":"no_will AND estate >= 500_000","segments":["S2","S3","S4","S7","S9"]},{"id":"prov.protection_gap","name":"The 3-month line.","trigger":"earnings_protection_scale <= 2 AND has_dependants","segments":["S2","S3","S4","S5"]},{"id":"prov.retirement_unease","name":"It is not about when you stop.","trigger":"retirement_feel in ['uneasy', 'hard_to_imagine']","segments":["S3","S4","S5","S6","S7"]},{"id":"prov.sandwich_gen","name":"Both ways at once.","trigger":"household includes dependent_children AND household includes elderly_parent","segments":["all"]},{"id":"prov.urgency_week","name":"We can move quickly.","trigger":"urgency == 'this_week'","segments":["all"]}];

var tiers = [
  { id: 'quick', label: 'Quick', time: '3 min', questionIds: ['Q2.1','Q2.3','Q2.4','Q4.5','Q10.2','Q10.3'], note: '6 questions + contact fields. Captures enough for segment assignment and a single priority.' },
  { id: 'standard', label: 'Standard', time: '7 min', questionIds: ['Q1.1','Q1.2','Q2.1','Q2.2','Q2.3','Q2.4','Q3.1','Q3.2','Q3.4','Q4.3','Q4.4','Q4.5','Q5.2','Q5.3','Q6.2','Q6.3','Q7.1','Q7.2','Q10.1','Q10.2','Q10.3'], note: '19 questions across all ten sections. The default tier and the version most visitors will complete.' },
  { id: 'thorough', label: 'Thorough', time: '12 min', questionIds: questions.map(function(q) { return q.id; }), note: 'All 32 questions including non-essential spending, money mindset, state pension awareness, other property, protection, and dependants.' }
];

var activeSegment = 'all';
var activeTier = 'standard';

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function getTiersForQuestion(qid) {
  var result = [];
  for (var i = 0; i < tiers.length; i++) {
    if (tiers[i].questionIds.indexOf(qid) !== -1) result.push(tiers[i].id);
  }
  return result;
}

function isQuestionInTier(qid, tierId) {
  if (tierId === 'all') return true;
  var tier = tiers.find(function(t) { return t.id === tierId; });
  return tier ? tier.questionIds.indexOf(qid) !== -1 : true;
}

function tierPills(qid) {
  var qTiers = getTiersForQuestion(qid);
  return qTiers.map(function(tid) {
    return '<span class="tier-pill tier-' + tid + '">' + tid.charAt(0).toUpperCase() + tid.slice(1) + '</span>';
  }).join(' ');
}

function renderRules() {
  var root = document.getElementById('ruleList');
  if (!root) return;
  root.innerHTML = rules.map(function(rule) { return '<article class="rule-card"><div class="rank">' + rule.rank + '</div><div><strong>' + rule.id + ': ' + escapeHtml(rule.label) + '</strong></div><div class="predicate"><code>' + escapeHtml(rule.predicate) + '</code><br>' + escapeHtml(rule.description) + '</div></article>'; }).join('');
}

function renderTierToolbar() {
  var root = document.getElementById('tierToolbar');
  if (!root) return;
  root.innerHTML = ['all', 'quick', 'standard', 'thorough'].map(function(id) {
    var label = id === 'all' ? 'All tiers' : id.charAt(0).toUpperCase() + id.slice(1);
    if (id !== 'all') {
      var tier = tiers.find(function(t) { return t.id === id; });
      if (tier) label += ' (' + tier.time + ')';
    }
    return '<button type="button" data-tier="' + id + '" aria-pressed="' + String(activeTier === id) + '">' + label + '</button>';
  }).join('');
  root.querySelectorAll('button').forEach(function(button) {
    button.addEventListener('click', function() {
      activeTier = button.dataset.tier || 'all';
      renderTierToolbar();
      renderToolbar();
      renderRoutePanel();
      renderMatrix();
    });
  });
}

function renderToolbar() {
  var root = document.getElementById('segmentToolbar');
  if (!root) return;
  root.innerHTML = ['all'].concat(segmentIds).map(function(id) { return '<button type="button" data-segment="' + id + '" aria-pressed="' + String(activeSegment === id) + '">' + (id === 'all' ? 'All segments' : id) + '</button>'; }).join('');
  root.querySelectorAll('button').forEach(function(button) {
    button.addEventListener('click', function() {
      activeSegment = button.dataset.segment || 'all';
      renderToolbar();
      renderRoutePanel();
      renderMatrix();
      renderProvocations();
    });
  });
}

function renderRoutePanel() {
  var root = document.getElementById('routePanel');
  if (!root) return;

  var tierObj = activeTier !== 'all' ? tiers.find(function(t) { return t.id === activeTier; }) : null;
  var tierQids = tierObj ? tierObj.questionIds : questions.map(function(q) { return q.id; });

  if (activeSegment === 'all' && activeTier === 'all') {
    root.innerHTML = '<h3>All tiers and segments visible</h3><p>Pick a tier to filter by question depth, or a segment to see the adaptive route.</p>';
    return;
  }

  var html = '';

  if (tierObj) {
    html += '<h3>' + tierObj.label + ' tier — ' + tierObj.questionIds.length + ' questions, ~' + tierObj.time + '</h3>';
    html += '<p>' + escapeHtml(tierObj.note) + '</p>';
  }

  if (activeSegment !== 'all') {
    var segment = segments.find(function(s) { return s.id === activeSegment; });
    var index = segmentIds.indexOf(activeSegment);
    var shown = 0, conditional = 0, skipped = 0, notInTier = 0;

    questions.forEach(function(q) {
      var inTier = tierQids.indexOf(q.id) !== -1;
      if (!inTier) { notInTier++; return; }
      var cell = q.cells[index];
      if (cell === 'Y') shown++;
      else if (cell === 'C') conditional++;
      else skipped++;
    });

    html += '<h3>' + segment.id + ': ' + escapeHtml(segment.name) + '</h3>';
    html += '<p>' + escapeHtml(segment.description) + '</p>';
    html += '<div class="route-counts">';
    html += '<span class="rc"><span class="rc-num rc-y">' + shown + '</span> shown</span>';
    html += '<span class="rc"><span class="rc-num rc-c">' + conditional + '</span> conditional</span>';
    html += '<span class="rc"><span class="rc-num rc-n">' + skipped + '</span> skipped</span>';
    if (notInTier > 0) html += '<span class="rc"><span class="rc-num rc-out">' + notInTier + '</span> not in tier</span>';
    html += '</div>';
  }

  root.innerHTML = html;
}

function renderMatrix() {
  var table = document.getElementById('matrixTable');
  if (!table) return;
  var html = '<thead><tr><th>Question</th><th>Tiers</th>' + segmentIds.map(function(id) { return '<th>' + id + '</th>'; }).join('') + '</tr></thead><tbody>';
  for (var s = 0; s < sections.length; s++) {
    var section = sections[s];
    var rows = questions.filter(function(q) { return q.section === section.id; });
    if (!rows.length) continue;
    html += '<tr class="section-row"><td colspan="11">' + escapeHtml(section.label) + '</td></tr>';
    for (var r = 0; r < rows.length; r++) {
      var q = rows[r];
      var inTier = isQuestionInTier(q.id, activeTier);
      var rowClass = inTier ? '' : ' class="row-not-in-tier"';
      html += '<tr' + rowClass + '><td><span class="qid">' + q.id + '</span>' + escapeHtml(q.label) + '</td>';
      html += '<td>' + tierPills(q.id) + '</td>';
      for (var c = 0; c < q.cells.length; c++) {
        var cell = q.cells[c];
        var dim = activeSegment !== 'all' && activeSegment !== segmentIds[c] ? ' dim' : '';
        html += '<td><span class="matrix-cell ' + cell.toLowerCase() + dim + '">' + cell + '</span></td>';
      }
      html += '</tr>';
    }
  }
  table.innerHTML = html + '</tbody>';
}

function renderProvocations() {
  var root = document.getElementById('provocationList');
  if (!root) return;
  var rows = provocations.filter(function(p) { return activeSegment === 'all' || p.segments.indexOf('all') !== -1 || p.segments.indexOf(activeSegment) !== -1; });
  root.innerHTML = rows.map(function(p) { return '<article class="provocation-card"><h3>' + escapeHtml(p.name) + '</h3><p><code>' + escapeHtml(p.trigger) + '</code></p><p>' + p.segments.map(escapeHtml).join(', ') + '</p></article>'; }).join('');
}

renderRules();
renderTierToolbar();
renderToolbar();
renderRoutePanel();
renderMatrix();
renderProvocations();