const log = [];
function assert(n, c, x){ log.push((c ? "PASS  " : "FAIL  ") + n + (x ? "   :: " + x : "")); }
try {
  const rows = [...document.querySelectorAll(".tab-btn")].map(b => ({
    tab: b.dataset.tab, label: b.querySelector(".tab-label").textContent.trim()
  }));
  const expected = [
    ["vocab","Dictionary"], ["articles","Article Trainer"], ["verbs","German Verbs"],
    ["pronouns","Pronoun Practice"], ["prep","Preposition Practice"], ["translation","Translation Practice"]
  ];
  assert("6 tabs present", rows.length === 6, JSON.stringify(rows));
  expected.forEach(([tab,label], i) => {
    assert(`slot ${i+1} is ${tab} / "${label}"`, rows[i] && rows[i].tab === tab && rows[i].label === label,
           rows[i] ? rows[i].tab + "/" + rows[i].label : "missing");
  });
  assert("German Verbs still the default active tab", document.querySelector('[data-tab="verbs"]').classList.contains("active"));
  assert("only one tab marked active initially in markup", document.querySelectorAll(".tab-btn.active").length === 1);

  // click through every tab, confirm iframe creation + correct titles + cache-busted URL
  expected.forEach(([tab,label]) => {
    document.querySelector(`[data-tab="${tab}"]`).click();
    const fr = [...document.querySelectorAll("iframe")].find(f => f.getAttribute("src").indexOf(`apps/${tab}.html`) === 0);
    assert(`clicking ${tab} creates its iframe`, !!fr, tab);
    assert(`${tab} iframe carries bumped version`, fr && fr.getAttribute("src") === `apps/${tab}.html?v=20260914`, fr && fr.getAttribute("src"));
    assert(`${tab} tab marked active after click`, document.querySelector(`[data-tab="${tab}"]`).classList.contains("active"));
  });
} catch (e) { log.push("FAIL  threw: " + (e && e.stack ? e.stack : e)); }
document.getElementById("TESTOUT").textContent =
  "\n===TESTRESULTS===\n" + log.join("\n") +
  "\nTOTAL " + log.length + " / FAILURES " + log.filter(l => l.indexOf("FAIL") === 0).length + "\n===END===\n";
